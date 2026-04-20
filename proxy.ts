// proxy.ts — Next.js 16 convention (renamed from middleware.ts)
// TODO: Re-enable auth guard once Supabase Site URL is configured in dashboard.
// Set Site URL to your production domain at:
//   Supabase Dashboard → Authentication → URL Configuration → Site URL

import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/crm/:path*', '/portal/:path*', '/api/crm/:path*'],
}
