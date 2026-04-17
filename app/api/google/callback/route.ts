import { NextRequest, NextResponse } from 'next/server'
import { getTokensFromCode } from '@/lib/google-calendar'
import { saveTokens } from '@/lib/google-tokens'
import { getGmailProfile } from '@/lib/gmail'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const returnedState = request.nextUrl.searchParams.get('state')
  const storedState = request.cookies.get('oauth_state')?.value

  if (!code) {
    return NextResponse.redirect(new URL('/crm/calendar?error=no_code', request.url))
  }

  if (!storedState || !returnedState || storedState !== returnedState) {
    return NextResponse.redirect(new URL('/crm/calendar?error=invalid_state', request.url))
  }

  try {
    const tokens = await getTokensFromCode(code)
    if (!tokens.access_token || !tokens.refresh_token) {
      // Google omits refresh_token if the user has consented before with no
      // `prompt=consent`. Our consent URL forces prompt=consent, so this
      // should be rare, but bail loudly if it happens.
      return NextResponse.redirect(
        new URL('/crm/calendar?error=missing_refresh_token', request.url)
      )
    }

    // Fetch the connected Gmail address up front so it's available to the
    // dashboard without an extra round-trip later.
    let email: string | null = null
    try {
      const oauth = new google.auth.OAuth2()
      oauth.setCredentials(tokens)
      email = await getGmailProfile(oauth)
    } catch {
      // Profile fetch is non-critical — proceed without email.
    }

    await saveTokens(tokens, email)

    const successResponse = NextResponse.redirect(new URL('/crm/calendar?google=connected', request.url))
    successResponse.cookies.delete('oauth_state')
    return successResponse
  } catch (err) {
    console.error('Google OAuth callback failed:', err)
    return NextResponse.redirect(new URL('/crm/calendar?error=auth_failed', request.url))
  }
}
