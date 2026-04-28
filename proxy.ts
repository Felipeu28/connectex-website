import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

const CRM_LOGIN_PATH = '/crm/login'
const CRM_DASHBOARD_PATH = '/crm/dashboard'
const PORTAL_LOGIN_PATH = '/portal/login'
const PORTAL_DASHBOARD_PATH = '/portal/dashboard'
const PORTAL_CALLBACK_PATH = '/portal/auth/callback'

function buildRedirect(request: NextRequest, destination: string) {
  return NextResponse.redirect(new URL(destination, request.url))
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/crm/')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return response
  }

  if (pathname.startsWith('/crm')) {
    if (pathname === CRM_LOGIN_PATH) {
      if (user) return buildRedirect(request, CRM_DASHBOARD_PATH)
      return response
    }

    if (!user) return buildRedirect(request, CRM_LOGIN_PATH)
    return response
  }

  if (pathname.startsWith('/portal')) {
    if (pathname === PORTAL_LOGIN_PATH || pathname === PORTAL_CALLBACK_PATH) {
      if (user && pathname === PORTAL_LOGIN_PATH) {
        return buildRedirect(request, PORTAL_DASHBOARD_PATH)
      }
      return response
    }

    if (!user) return buildRedirect(request, PORTAL_LOGIN_PATH)
    return response
  }

  return response
}

export const config = {
  matcher: ['/crm/:path*', '/portal/:path*', '/api/crm/:path*'],
}
