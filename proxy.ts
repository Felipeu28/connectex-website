// proxy.ts — Next.js 16 convention (renamed from middleware.ts)
// Runs on Node.js runtime before every /crm/*, /portal/*, and /api/crm/* request.
// Enforces Supabase session auth for the entire CRM and portal surface.

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Forward pathname so server layouts can read it for defense-in-depth auth checks
  response.headers.set('x-pathname', request.nextUrl.pathname)

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
          response.headers.set('x-pathname', request.nextUrl.pathname)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired — required for Server Components.
  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // Protect /api/crm/* — return JSON 401 (not redirect) for unauthenticated API calls
  if (pathname.startsWith('/api/crm')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return response
  }

  // Protect /crm/* — redirect unauthenticated users to login
  if (!session && pathname.startsWith('/crm')) {
    if (pathname === '/crm/login') return response
    const loginUrl = new URL('/crm/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect /portal/* — redirect unauthenticated users to portal login
  if (!session && pathname.startsWith('/portal')) {
    if (pathname === '/portal/login' || pathname.startsWith('/portal/auth/')) {
      return response
    }
    return NextResponse.redirect(new URL('/portal/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/crm/:path*', '/portal/:path*', '/api/crm/:path*'],
}
