import { google } from 'googleapis'

function getOAuth2Client(tokens: { access_token: string; refresh_token: string }) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim()}/api/google/callback`
  )
  client.setCredentials(tokens)
  return client
}

/** Send an email via Gmail API using Mark's connected account */
export async function sendGmail(
  tokens: { access_token: string; refresh_token: string },
  to: string,
  subject: string,
  body: string
): Promise<string | null> {
  const auth = getOAuth2Client(tokens)
  const gmail = google.gmail({ version: 'v1', auth })

  // Build RFC 2822 message
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n')

  // Base64url encode
  const encoded = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  })

  return res.data.id ?? null
}

/** Get the connected Gmail address */
export async function getGmailProfile(tokens: { access_token: string; refresh_token: string }) {
  const auth = getOAuth2Client(tokens)
  const gmail = google.gmail({ version: 'v1', auth })
  const res = await gmail.users.getProfile({ userId: 'me' })
  return res.data.emailAddress ?? null
}
