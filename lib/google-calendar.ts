import { google, calendar_v3 } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/google/callback`
  )
}

/** Generate the Google OAuth consent URL */
export function getAuthUrl() {
  const client = getOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

/** Exchange an auth code for tokens */
export async function getTokensFromCode(code: string) {
  const client = getOAuth2Client()
  const { tokens } = await client.getToken(code)
  return tokens
}

/** Get an authenticated Calendar client from stored tokens */
function getCalendarClient(tokens: { access_token: string; refresh_token: string }) {
  const client = getOAuth2Client()
  client.setCredentials(tokens)
  return google.calendar({ version: 'v3', auth: client })
}

/** Create a Google Calendar event and return the Google event ID */
export async function createGoogleEvent(
  tokens: { access_token: string; refresh_token: string },
  event: {
    title: string
    description?: string | null
    start_time: string
    end_time: string
    location?: string | null
  }
): Promise<string | null> {
  const calendar = getCalendarClient(tokens)

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
  tokens: { access_token: string; refresh_token: string },
  googleEventId: string,
  event: {
    title: string
    description?: string | null
    start_time: string
    end_time: string
    location?: string | null
  }
): Promise<void> {
  const calendar = getCalendarClient(tokens)

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
  tokens: { access_token: string; refresh_token: string },
  googleEventId: string
): Promise<void> {
  const calendar = getCalendarClient(tokens)

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
  })
}

/** Fetch events from Google Calendar for a date range */
export async function listGoogleEvents(
  tokens: { access_token: string; refresh_token: string },
  timeMin: string,
  timeMax: string
) {
  const calendar = getCalendarClient(tokens)

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
