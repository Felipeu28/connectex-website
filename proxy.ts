import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

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
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

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
    if (pathname === '/crm/login') {
      return response
    }
    const loginUrl = new URL('/crm/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Protect /portal/* — redirect unauthenticated users to portal login
  if (!session && pathname.startsWith('/portal')) {
    if (
      pathname === '/portal/login' ||
      pathname.startsWith('/portal/auth/')
    ) {
      return response
    }
    const loginUrl = new URL('/portal/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/crm/:path*', '/portal/:path*', '/api/crm/:path*'],
}
