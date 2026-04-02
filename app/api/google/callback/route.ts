import { NextRequest, NextResponse } from 'next/server'
import { getTokensFromCode } from '@/lib/google-calendar'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/crm/calendar?error=no_code', request.url))
  }

  try {
    const tokens = await getTokensFromCode(code)

    // Store tokens in a secure httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year (refresh token handles expiry)
    })

    return NextResponse.redirect(new URL('/crm/calendar?google=connected', request.url))
  } catch {
    return NextResponse.redirect(new URL('/crm/calendar?error=auth_failed', request.url))
  }
}
