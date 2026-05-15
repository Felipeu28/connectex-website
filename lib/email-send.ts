/**
 * Unified email send adapter. Tries Resend first; if Resend isn't configured
 * or returns an error, falls back to Gmail (when the Google integration is
 * connected). Returns a structured result so callers can log which provider
 * actually delivered the message.
 *
 * All transactional + campaign + sequence email goes through this function
 * so we have one place to add retries, queueing, or per-domain routing.
 *
 * CAN-SPAM compliance: callers that send marketing email should pass
 * `unsubscribeUrl`. When provided, sendEmail will:
 *   - Append a visible footer to both the HTML and text bodies.
 *   - Add the RFC 8058 List-Unsubscribe + List-Unsubscribe-Post headers to
 *     the Resend send (Gmail/Outlook surface a one-click button from these).
 */

import { Resend } from 'resend'
import {
  sendGmailEmail,
  type GmailAttachment,
  type SendGmailParams,
} from '@/lib/gmail'

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
  fromName?: string
  fromEmail?: string
  /** Threading context for Gmail replies. Resend ignores these. */
  threadId?: string
  inReplyTo?: string
  references?: string
  attachments?: GmailAttachment[]
  /**
   * If true, skip Resend and use Gmail directly. Useful for replies inside
   * an existing Gmail thread where Resend would create a separate one.
   */
  preferGmail?: boolean
  /**
   * CAN-SPAM unsubscribe URL for this specific recipient. When set:
   *   - HTML and text bodies get a footer with the link.
   *   - Resend send adds List-Unsubscribe headers (RFC 8058 one-click).
   * Omit for transactional emails (ticket confirmations, password resets).
   */
  unsubscribeUrl?: string
}

export type EmailProvider = 'resend' | 'gmail' | 'none'

export interface SendEmailResult {
  ok: boolean
  provider: EmailProvider
  /** Provider message id (Resend or Gmail). */
  messageId?: string
  /** Gmail thread id, when sent via Gmail. */
  threadId?: string
  errors: string[]
}

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'support@connectex.net'
const DEFAULT_FROM_NAME = 'Connectex'

function resendFrom(params: SendEmailParams): string {
  const fromEmail = params.fromEmail || DEFAULT_FROM
  const fromName = params.fromName || DEFAULT_FROM_NAME
  return `${fromName} <${fromEmail}>`
}

function withUnsubscribeFooter(
  html: string,
  text: string | undefined,
  unsubscribeUrl: string | undefined
): { html: string; text: string | undefined } {
  if (!unsubscribeUrl) return { html, text }
  const htmlFooter = `<br><br><div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;line-height:1.5;font-family:system-ui,-apple-system,sans-serif;">You are receiving this because you're a contact of Mark Polanco at Connectex Solutions.<br><a href="${unsubscribeUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a> &middot; Connectex Solutions, Austin TX</div>`
  const textFooter = `\n\n---\nUnsubscribe: ${unsubscribeUrl}\nConnectex Solutions, Austin TX`
  return {
    html: html + htmlFooter,
    text: text != null ? text + textFooter : undefined,
  }
}

async function trySendViaResend(
  params: SendEmailParams,
  rendered: { html: string; text: string | undefined }
): Promise<{
  ok: boolean
  messageId?: string
  error?: string
}> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const headers: Record<string, string> | undefined = params.unsubscribeUrl
    ? {
        'List-Unsubscribe': `<${params.unsubscribeUrl}?one_click=1>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      }
    : undefined

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: resendFrom(params),
      to: params.to,
      subject: params.subject,
      html: rendered.html,
      text: rendered.text,
      ...(headers ? { headers } : {}),
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, 'base64'),
        contentType: a.mimeType,
      })),
    })
    if (error) {
      return { ok: false, error: error.message ?? 'Unknown Resend error' }
    }
    return { ok: true, messageId: data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Resend threw' }
  }
}

async function trySendViaGmail(
  params: SendEmailParams,
  rendered: { html: string; text: string | undefined }
): Promise<{ ok: boolean; messageId?: string; threadId?: string; error?: string }> {
  try {
    const gmailParams: SendGmailParams = {
      to: params.to,
      subject: params.subject,
      html: rendered.html,
      text: rendered.text,
      fromName: params.fromName,
      fromEmail: params.fromEmail,
      threadId: params.threadId,
      inReplyTo: params.inReplyTo,
      references: params.references,
      attachments: params.attachments,
    }
    const result = await sendGmailEmail(gmailParams)
    return { ok: true, messageId: result.id, threadId: result.threadId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Gmail threw' }
  }
}

/**
 * Send an email through the best available provider.
 *
 *   1. If preferGmail is set OR Resend isn't configured → try Gmail first.
 *   2. Otherwise try Resend; if it fails, fall back to Gmail.
 *
 * Returns `ok: false` only when both providers have been exhausted.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const errors: string[] = []
  const rendered = withUnsubscribeFooter(params.html, params.text, params.unsubscribeUrl)

  if (params.preferGmail) {
    const g = await trySendViaGmail(params, rendered)
    if (g.ok) {
      return { ok: true, provider: 'gmail', messageId: g.messageId, threadId: g.threadId, errors }
    }
    errors.push(`gmail: ${g.error}`)
    const r = await trySendViaResend(params, rendered)
    if (r.ok) return { ok: true, provider: 'resend', messageId: r.messageId, errors }
    errors.push(`resend: ${r.error}`)
    return { ok: false, provider: 'none', errors }
  }

  const r = await trySendViaResend(params, rendered)
  if (r.ok) return { ok: true, provider: 'resend', messageId: r.messageId, errors }
  errors.push(`resend: ${r.error}`)

  const g = await trySendViaGmail(params, rendered)
  if (g.ok) {
    return { ok: true, provider: 'gmail', messageId: g.messageId, threadId: g.threadId, errors }
  }
  errors.push(`gmail: ${g.error}`)

  return { ok: false, provider: 'none', errors }
}
