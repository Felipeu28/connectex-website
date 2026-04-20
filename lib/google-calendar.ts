import { google, calendar_v3 } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { getAuthedClient, getOAuthClientForConsent } from '@/lib/google-tokens'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
]

/** Generate the Google OAuth consent URL */
export function getAuthUrl(state?: string) {
  const client = getOAuthClientForConsent()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    ...(state ? { state } : {}),
  })
}

/** Exchange an auth code for tokens */
export async function getTokensFromCode(code: string) {
  const client = getOAuthClientForConsent()
  const { tokens } = await client.getToken(code)
  return tokens
}

async function getCalendar(auth?: OAuth2Client | null) {
  const client = auth ?? (await getAuthedClient())
  if (!client) throw new Error('Google account not connected')
  return google.calendar({ version: 'v3', auth: client })
}

/** Create a Google Calendar event and return the Google event ID */
export async function createGoogleEvent(
  event: {
    title: string
    description?: string | null
    start_time: string
    end_time: string
    location?: string | null
  },
  auth?: OAuth2Client | null
): Promise<string | null> {
  const calendar = await getCalendar(auth)

  const body: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: {
      dateTime: event.start_time,
      timeZone: 'America/Chicago',
    },
    end: {
      dateTime: event.end_time,
      timeZone: 'America/Chicago',
    },
  }

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: body,
  })

  return res.data.id ?? null
}

/** Update a Google Calendar event */
export async function updateGoogleEvent(
  googleEventId: string,
  event: {
    title: string
    description?: string | null
    start_time: string
    end_time: string
    location?: string | null
  },
  auth?: OAuth2Client | null
): Promise<void> {
  const calendar = await getCalendar(auth)

  await calendar.events.update({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: {
      summary: event.title,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      start: {
        dateTime: event.start_time,
        timeZone: 'America/Chicago',
      },
      end: {
        dateTime: event.end_time,
        timeZone: 'America/Chicago',
      },
    },
  })
}

/** Delete a Google Calendar event */
export async function deleteGoogleEvent(
  googleEventId: string,
  auth?: OAuth2Client | null
): Promise<void> {
  const calendar = await getCalendar(auth)

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
  })
}

/** Fetch events from Google Calendar for a date range */
export async function listGoogleEvents(
  timeMin: string,
  timeMax: string,
  auth?: OAuth2Client | null
) {
  const calendar = await getCalendar(auth)

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  })

  return (res.data.items ?? []).map((e) => ({
    google_event_id: e.id ?? '',
    title: e.summary ?? '(No title)',
    description: e.description ?? null,
    start_time: e.start?.dateTime ?? e.start?.date ?? '',
    end_time: e.end?.dateTime ?? e.end?.date ?? '',
    location: e.location ?? null,
  }))
}
