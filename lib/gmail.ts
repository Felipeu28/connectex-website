import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { getAuthedClient } from '@/lib/google-tokens'

/**
 * Send an email via Gmail using the connected Google account.
 *
 * If `auth` is not supplied, tokens are loaded from the DB via
 * `getAuthedClient()` (which also wires up auto-refresh-and-save). This is
 * what cron jobs use, since they have no cookie / no caller-provided auth.
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

/** Get the connected Gmail address (used to display the linked account in the UI). */
export async function getGmailProfile(
  auth?: OAuth2Client | null
): Promise<string | null> {
  const client = auth ?? (await getAuthedClient())
  if (!client) return null
  const gmail = google.gmail({ version: 'v1', auth: client })
  const res = await gmail.users.getProfile({ userId: 'me' })
  return res.data.emailAddress ?? null
}
