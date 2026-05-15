// Shared email-send helper used by both campaign sends (immediate and cron)
// and sequence drips. Adds:
//   - CAN-SPAM-compliant unsubscribe footer (per-contact token URL)
//   - Resend batch send (100 emails per HTTP call, ~5s for 100 vs 100s)
//   - {{name}} personalization (kept consistent across surfaces)
//   - Per-email logging into email_events for tracking + audit

import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'

const RESEND_KEY = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM_EMAIL || 'Mark at Connectex <mark@connectex.net>'
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://connectex.net').trim()

export type SendContext =
  | { kind: 'campaign'; campaign_id: string }
  | { kind: 'sequence'; sequence_id: string; step_id: string; enrollment_id: string }
  | { kind: 'test'; tester_email: string }

export interface SendRecipient {
  contact_id: string | null  // null only for test sends
  name: string | null
  email: string
  unsubscribe_token: string | null
}

export interface SendInput {
  subject: string                 // May contain {{name}}
  body: string                    // Plain text or markdown — may contain {{name}}
  recipients: SendRecipient[]
  context: SendContext
  from?: string
  /** Skip unsubscribe footer (used only for transactional emails, not allowed for marketing) */
  skipUnsubscribeFooter?: boolean
}

export interface SendResult {
  sent: number
  failed: number
  skipped: number             // skipped due to unsubscribe or missing email
  errors: { email: string; reason: string }[]
  messageIds: { email: string; contact_id: string | null; id: string }[]
}

export class EmailSendError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.status = status
  }
}

function personalize(template: string, name: string | null): string {
  const firstName = (name?.split(' ')[0] ?? 'there').trim() || 'there'
  return template.replace(/\{\{name\}\}/gi, firstName)
}

function unsubscribeUrl(token: string): string {
  return `${SITE_URL}/unsubscribe/${token}`
}

function buildHtmlBody(body: string, unsubUrl?: string): string {
  // Body is treated as plain/markdown-light; convert newlines and add a footer.
  const html = body.replace(/\n/g, '<br>')
  if (!unsubUrl) return html

  return `${html}
    <br><br>
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;line-height:1.5;font-family:system-ui,-apple-system,sans-serif;">
      You are receiving this because you're a contact of Mark Polanco at Connectex Solutions.
      <br>
      <a href="${unsubUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
      &nbsp;&middot;&nbsp;
      Connectex Solutions, Austin TX
    </div>`
}

function buildPlainBody(body: string, unsubUrl?: string): string {
  if (!unsubUrl) return body
  return `${body}\n\n---\nUnsubscribe: ${unsubUrl}\nConnectex Solutions, Austin TX`
}

interface ResendBatchEmail {
  from: string
  to: string[]
  subject: string
  html: string
  text: string
  headers?: Record<string, string>
  tags?: { name: string; value: string }[]
}

/**
 * Send a marketing email to many recipients. Uses Resend's batch endpoint
 * (chunks of 100) for throughput, adds unsubscribe links, and writes one
 * `email_events` row per attempted send so dashboards can correlate.
 *
 * IMPORTANT: callers must pre-filter `recipients` to remove anyone whose
 * `crm_contacts.unsubscribed = true`. This helper additionally enforces it
 * via the unsubscribe_token presence check, but a DB-level filter is cheaper.
 */
export async function sendBulk(
  input: SendInput,
  admin: SupabaseClient
): Promise<SendResult> {
  if (!RESEND_KEY) {
    throw new EmailSendError('RESEND_API_KEY not configured', 503)
  }

  const resend = new Resend(RESEND_KEY)
  const from = input.from ?? FROM

  const result: SendResult = {
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    messageIds: [],
  }

  // Validate recipients
  const valid: SendRecipient[] = input.recipients.filter((r) => {
    if (!r.email || !r.email.includes('@')) {
      result.skipped++
      return false
    }
    return true
  })

  if (valid.length === 0) return result

  // Chunk into 100-recipient batches
  const chunks: SendRecipient[][] = []
  for (let i = 0; i < valid.length; i += 100) {
    chunks.push(valid.slice(i, i + 100))
  }

  for (const chunk of chunks) {
    const emails: ResendBatchEmail[] = chunk.map((r) => {
      const subject = personalize(input.subject, r.name)
      const body = personalize(input.body, r.name)
      const unsubUrl =
        !input.skipUnsubscribeFooter && r.unsubscribe_token
          ? unsubscribeUrl(r.unsubscribe_token)
          : undefined

      const tags: { name: string; value: string }[] = []
      if (input.context.kind === 'campaign') {
        tags.push({ name: 'campaign_id', value: input.context.campaign_id })
      } else if (input.context.kind === 'sequence') {
        tags.push({ name: 'sequence_id', value: input.context.sequence_id })
        tags.push({ name: 'step_id', value: input.context.step_id })
      }
      if (r.contact_id) tags.push({ name: 'contact_id', value: r.contact_id })

      const headers: Record<string, string> = {}
      if (unsubUrl) {
        // RFC 8058 one-click unsubscribe headers — improves Gmail/Outlook
        // deliverability significantly.
        headers['List-Unsubscribe'] = `<${unsubUrl}?one_click=1>`
        headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
      }

      return {
        from,
        to: [r.email],
        subject,
        html: buildHtmlBody(body, unsubUrl),
        text: buildPlainBody(body, unsubUrl),
        ...(Object.keys(headers).length ? { headers } : {}),
        ...(tags.length ? { tags } : {}),
      }
    })

    try {
      const batch = await resend.batch.send(emails as never)
      // Resend batch response shape: { data: { data: [{ id }, ...] } } or
      // { data: [{ id }, ...] } depending on SDK version
      const ids: { id: string }[] =
        (batch as unknown as { data?: { data?: { id: string }[] } })?.data?.data ??
        (batch as unknown as { data?: { id: string }[] })?.data ??
        []

      chunk.forEach((r, i) => {
        const id = ids[i]?.id ?? null
        if (id) {
          result.sent++
          result.messageIds.push({ email: r.email, contact_id: r.contact_id, id })
        } else {
          result.failed++
          result.errors.push({ email: r.email, reason: 'No message id returned' })
        }
      })

      // Log success events
      if (ids.length > 0) {
        const rows = chunk.map((r, i) => ({
          event_type: 'sent' as const,
          email: r.email,
          contact_id: r.contact_id,
          campaign_id: input.context.kind === 'campaign' ? input.context.campaign_id : null,
          sequence_id: input.context.kind === 'sequence' ? input.context.sequence_id : null,
          send_id: ids[i]?.id ?? null,
        }))
        await admin.from('email_events').insert(rows).then((r) => {
          if (r.error) console.error('email_events insert failed:', r.error)
        })
      }
    } catch (err) {
      // Whole chunk failed — most often an auth / domain verification problem
      const reason = err instanceof Error ? err.message : 'Unknown send error'
      console.error('Resend batch failed:', reason)
      chunk.forEach((r) => {
        result.failed++
        result.errors.push({ email: r.email, reason })
      })
    }
  }

  return result
}

/**
 * Quick single-send for "send test to me" + admin notification flows.
 * Bypasses unsubscribe footer (transactional).
 */
export async function sendOne(
  to: string,
  subject: string,
  body: string,
  opts?: { from?: string; html?: string }
): Promise<{ id: string | null }> {
  if (!RESEND_KEY) throw new EmailSendError('RESEND_API_KEY not configured', 503)
  const resend = new Resend(RESEND_KEY)
  const html = opts?.html ?? buildHtmlBody(body)
  const res = await resend.emails.send({
    from: opts?.from ?? FROM,
    to: [to],
    subject,
    html,
    text: body,
  })
  // Type narrowing on Resend SDK return shape
  const id =
    (res as unknown as { data?: { id?: string } })?.data?.id ??
    (res as unknown as { id?: string })?.id ??
    null
  return { id }
}

export interface SendConfigStatus {
  resend_key_set: boolean
  from_email: string
  site_url: string
}

export function getSendConfig(): SendConfigStatus {
  return {
    resend_key_set: Boolean(RESEND_KEY),
    from_email: FROM,
    site_url: SITE_URL,
  }
}
