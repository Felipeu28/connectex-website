import { NextResponse, type NextRequest } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function proxy(_request: NextRequest) {
  // TODO: Re-enable auth guard after testing
  // Bypass auth for development/testing
  return NextResponse.next()
}

export const config = {
  matcher: ['/crm/:path*'],
}
