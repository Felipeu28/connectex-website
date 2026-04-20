// proxy.ts — Next.js 16 convention (renamed from middleware.ts)
// Runs on Node.js runtime before every /crm/* request.
// Enforces Supabase session auth for the entire CRM surface.

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Build a Supabase client that can read/refresh the session cookie.
  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired — required for Server Components.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Skip auth check for the login page itself (prevent redirect loop).
  const isLoginPage = request.nextUrl.pathname === '/crm/login'
  if (isLoginPage) return response

  // All other /crm/* routes require an authenticated session.
  if (!session) {
    const loginUrl = new URL('/crm/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/crm/:path*'],
}
