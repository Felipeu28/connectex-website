import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-calendar'
import { randomBytes } from 'crypto'

export async function GET() {
  try {
    const state = randomBytes(16).toString('hex')
    const url = getAuthUrl(state)
    const response = NextResponse.redirect(url)
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
  }
}
