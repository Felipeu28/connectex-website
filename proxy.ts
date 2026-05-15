// proxy.ts — Next.js 16 convention (renamed from middleware.ts)
//
// Auth guard for protected surfaces:
//   /crm/*       — staff CRM (advisor login required)
//   /portal/*    — client support portal (client login required)
//   /api/crm/*   — CRM JSON APIs (must come from an authenticated session)
//
// Public surfaces (login pages, magic-link callback, public marketing site,
// public ticket APIs) bypass the guard.

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const CRM_PUBLIC_PREFIXES = ['/crm/login']
const PORTAL_PUBLIC_PREFIXES = ['/portal/login', '/portal/auth/callback']
const ROOT_PUBLIC_PREFIXES = ['/auth/callback']

/** Read either the new "publishable" or legacy "anon" key, whichever is set. */
function readSupabaseKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    undefined
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Magic-link callback and login pages bypass the guard. Otherwise the
  // cookie-set side-effects of Supabase's exchange race with the redirect.
  if (
    ROOT_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    CRM_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PORTAL_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next()
  }

  // Mutable response so Supabase SSR can refresh the session cookie when
  // the access token has expired.
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = readSupabaseKey()
  if (!url || !key) {
    // Without Supabase configured we cannot enforce auth — fail closed by
    // bouncing CRM/portal traffic back to the login pages.
    if (pathname.startsWith('/crm')) {
      return NextResponse.redirect(new URL('/crm/login', request.url))
    }
    if (pathname.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/portal/login', request.url))
    }
    return response
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // IMPORTANT: do not put any logic between createServerClient() and
  // getUser() — Supabase SSR docs warn that the session token may
  // otherwise be returned stale.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (pathname.startsWith('/crm') && !user) {
    const loginUrl = new URL('/crm/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/api/crm') && !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (pathname.startsWith('/portal') && !user) {
    return NextResponse.redirect(new URL('/portal/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/crm/:path*',
    '/portal/:path*',
    '/api/crm/:path*',
    '/auth/:path*',
  ],
}
