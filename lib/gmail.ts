/**
 * Gmail API helpers — send HTML email, fetch profile, sync inbox, fetch
 * a single message body. All functions take the connected OAuth2 client
 * (loaded from the database via `getAuthedClient()`).
 *
 * The plain-text-only `sendGmail(to, subject, body)` form is preserved for
 * backwards compatibility (the sequence cron still calls it that way). New
 * call sites should use `sendGmailEmail(params)` for HTML + attachments.
 */

import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { getAuthedClient } from '@/lib/google-tokens'

export interface GmailAttachment {
  filename: string
  mimeType: string
  content: string // base64, no data URL prefix
}

export interface SendGmailParams {
  to: string
  subject: string
  html: string
  text?: string
  fromName?: string
  fromEmail?: string
  threadId?: string
  inReplyTo?: string
  references?: string
  attachments?: GmailAttachment[]
}

export interface SendGmailResult {
  id: string
  threadId: string
}

function escapeHeader(s: string): string {
  return s.replace(/\r?\n/g, ' ').trim()
}

function buildRawEmail(params: SendGmailParams): string {
  const fromHeader =
    params.fromName && params.fromEmail
      ? `${escapeHeader(params.fromName)} <${escapeHeader(params.fromEmail)}>`
      : params.fromEmail
        ? escapeHeader(params.fromEmail)
        : null

  const headers: string[] = [
    `To: ${escapeHeader(params.to)}`,
    `Subject: ${escapeHeader(params.subject)}`,
    'MIME-Version: 1.0',
  ]
  if (fromHeader) headers.unshift(`From: ${fromHeader}`)
  if (params.inReplyTo) headers.push(`In-Reply-To: ${escapeHeader(params.inReplyTo)}`)
  if (params.references) headers.push(`References: ${escapeHeader(params.references)}`)

  const hasAttachments = (params.attachments?.length ?? 0) > 0
  const hasText = !!params.text

  if (!hasAttachments && !hasText) {
    headers.push('Content-Type: text/html; charset=utf-8')
    const raw = [...headers, '', params.html].join('\r\n')
    return Buffer.from(raw).toString('base64url')
  }

  const outerBoundary = `=_cx_outer_${Math.random().toString(36).slice(2)}`
  const altBoundary = `=_cx_alt_${Math.random().toString(36).slice(2)}`

  if (!hasAttachments) {
    // multipart/alternative for HTML + text fallback
    headers.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`)
    const parts = [
      '',
      `--${altBoundary}`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      params.text ?? '',
      `--${altBoundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      params.html,
      `--${altBoundary}--`,
    ]
    return Buffer.from([...headers, ...parts].join('\r\n')).toString('base64url')
  }

  // multipart/mixed (alt[text+html] + attachments)
  headers.push(`Content-Type: multipart/mixed; boundary="${outerBoundary}"`)
  const parts: string[] = [
    '',
    `--${outerBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    `--${altBoundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.text ?? params.html.replace(/<[^>]+>/g, ''),
    `--${altBoundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.html,
    `--${altBoundary}--`,
  ]
  for (const a of params.attachments!) {
    parts.push(`--${outerBoundary}`)
    parts.push(`Content-Type: ${a.mimeType}; name="${escapeHeader(a.filename)}"`)
    parts.push(`Content-Disposition: attachment; filename="${escapeHeader(a.filename)}"`)
    parts.push('Content-Transfer-Encoding: base64', '')
    parts.push(a.content.replace(/(.{76})/g, '$1\r\n'))
  }
  parts.push(`--${outerBoundary}--`)
  return Buffer.from([...headers, ...parts].join('\r\n')).toString('base64url')
}

/**
 * Send an email via Gmail using the connected Google account. Supports
 * HTML body, optional plain-text fallback, attachments, and threading.
 */
export async function sendGmailEmail(
  params: SendGmailParams,
  auth?: OAuth2Client | null
): Promise<SendGmailResult> {
  const client = auth ?? (await getAuthedClient())
  if (!client) throw new Error('Google account not connected')

  const gmail = google.gmail({ version: 'v1', auth: client })
  const requestBody: { raw: string; threadId?: string } = {
    raw: buildRawEmail(params),
  }
  if (params.threadId) requestBody.threadId = params.threadId

  const res = await gmail.users.messages.send({ userId: 'me', requestBody })
  return {
    id: res.data.id ?? '',
    threadId: res.data.threadId ?? '',
  }
}

/**
 * Backwards-compatible plain-text send. Older call sites (sequence cron)
 * use this signature; new code should prefer `sendGmailEmail`.
 */
export async function sendGmail(
  to: string,
  subject: string,
  body: string,
  auth?: OAuth2Client | null
): Promise<string | null> {
  const client = auth ?? (await getAuthedClient())
  if (!client) throw new Error('Google account not connected')
  const gmail = google.gmail({ version: 'v1', auth: client })

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n')

  const encoded = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  })
  return res.data.id ?? null
}

/** Get the connected Gmail address. */
export async function getGmailProfile(
  auth?: OAuth2Client | null
): Promise<string | null> {
  const client = auth ?? (await getAuthedClient())
  if (!client) return null
  const gmail = google.gmail({ version: 'v1', auth: client })
  const res = await gmail.users.getProfile({ userId: 'me' })
  return res.data.emailAddress ?? null
}

// ─── Inbox sync ──────────────────────────────────────────────────

export interface InboxMessageMetadata {
  gmailMessageId: string
  threadId: string
  subject: string
  fromName: string
  fromEmail: string
  toEmails: string[]
  date: string
  snippet: string
}

function parseAddress(raw: string): { name: string; email: string } {
  if (!raw) return { name: '', email: '' }
  const m = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/)
  if (m) return { name: m[1].trim(), email: m[2].trim() }
  return { name: '', email: raw.trim() }
}

/**
 * Fetch INBOX message metadata (no bodies). Used by the inbox-sync action
 * to build thread rows for the UI without paying per-message body cost.
 */
export async function fetchInboxMetadata(
  maxResults = 100,
  auth?: OAuth2Client | null
): Promise<InboxMessageMetadata[]> {
  const client = auth ?? (await getAuthedClient())
  if (!client) throw new Error('Google account not connected')
  const gmail = google.gmail({ version: 'v1', auth: client })

  const list = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['INBOX'],
    maxResults,
  })
  const ids = list.data.messages ?? []

  const out: InboxMessageMetadata[] = []
  for (const { id } of ids) {
    if (!id) continue
    try {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'To', 'Date'],
      })
      const headers = msg.data.payload?.headers ?? []
      const h = (name: string) =>
        headers.find((x) => x.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
      const fromRaw = h('From')
      const { name: fromName, email: fromEmail } = parseAddress(fromRaw)
      const toRaw = h('To')

      out.push({
        gmailMessageId: id,
        threadId: msg.data.threadId ?? '',
        subject: h('Subject') || '(no subject)',
        fromName: fromName || fromEmail,
        fromEmail,
        toEmails: toRaw ? toRaw.split(',').map((s) => parseAddress(s.trim()).email).filter(Boolean) : [],
        date: h('Date'),
        snippet: msg.data.snippet ?? '',
      })
    } catch {
      // skip bad messages
    }
  }
  return out
}

function decodeBase64Url(s: string): string {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function findPart(part: unknown, mime: string): unknown | null {
  if (!part || typeof part !== 'object') return null
  const p = part as { mimeType?: string; body?: { data?: string }; parts?: unknown[] }
  if (p.mimeType === mime && p.body?.data) return p
  for (const child of p.parts ?? []) {
    const found = findPart(child, mime)
    if (found) return found
  }
  return null
}

export interface FullGmailMessage {
  id: string
  threadId: string
  subject: string
  fromName: string
  fromEmail: string
  to: string
  date: string
  html: string
  text: string
  snippet: string
}

/** Fetch a single message in full (HTML + text). Used by the message reader. */
export async function fetchGmailMessage(
  gmailMessageId: string,
  auth?: OAuth2Client | null
): Promise<FullGmailMessage> {
  const client = auth ?? (await getAuthedClient())
  if (!client) throw new Error('Google account not connected')
  const gmail = google.gmail({ version: 'v1', auth: client })
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: gmailMessageId,
    format: 'full',
  })
  const msg = res.data
  const headers = msg.payload?.headers ?? []
  const h = (name: string) =>
    headers.find((x) => x.name?.toLowerCase() === name.toLowerCase())?.value ?? ''

  const fromRaw = h('From')
  const { name: fromName, email: fromEmail } = parseAddress(fromRaw)

  const htmlPart = findPart(msg.payload, 'text/html') as { body?: { data?: string } } | null
  const textPart = findPart(msg.payload, 'text/plain') as { body?: { data?: string } } | null

  let html = ''
  let text = ''
  if (htmlPart?.body?.data) html = decodeBase64Url(htmlPart.body.data)
  if (textPart?.body?.data) text = decodeBase64Url(textPart.body.data)

  if (!html && text) {
    html = `<pre style="font-family:inherit;white-space:pre-wrap;margin:0">${text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</pre>`
  }

  return {
    id: msg.id ?? gmailMessageId,
    threadId: msg.threadId ?? '',
    subject: h('Subject') || '(no subject)',
    fromName: fromName || fromEmail,
    fromEmail,
    to: h('To'),
    date: h('Date'),
    html,
    text,
    snippet: msg.snippet ?? '',
  }
}
