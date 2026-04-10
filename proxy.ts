import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

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

  // Protect /crm/* — redirect unauthenticated users to login
  if (!session && request.nextUrl.pathname.startsWith('/crm')) {
    // Allow the login page itself to pass through
    if (request.nextUrl.pathname === '/crm/login') {
      return response
    }
    const loginUrl = new URL('/crm/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Protect /portal/* — redirect unauthenticated users to portal login
  if (!session && request.nextUrl.pathname.startsWith('/portal')) {
    // Allow login and auth callback through
    if (
      request.nextUrl.pathname === '/portal/login' ||
      request.nextUrl.pathname.startsWith('/portal/auth/')
    ) {
      return response
    }
    const loginUrl = new URL('/portal/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/crm/:path*', '/portal/:path*'],
}
