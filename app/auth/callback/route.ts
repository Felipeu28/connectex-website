/**
 * Magic-link / OAuth callback for both CRM staff and any other surface that
 * uses the root `/auth/callback` redirect URL. Exchanges the `?code=...`
 * query parameter for a session, sets the session cookie via the SSR client,
 * and forwards the user to the destination they wanted to reach.
 *
 * The portal has its own callback at /portal/auth/callback that backfills
 * legacy ticket records — keep that one for portal flows.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/crm/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/crm/login?error=missing_code`)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/crm/login?error=server_misconfigured`)
  }

  // Build a redirect response we can attach cookies to. The Supabase SSR
  // client writes the session cookies on this response object via setAll.
  const redirect = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          redirect.cookies.set(name, value, options)
        }
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/crm/login?error=${encodeURIComponent(error.message)}`)
  }

  return redirect
}
