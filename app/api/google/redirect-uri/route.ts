/**
 * Diagnostic: returns the exact redirect URI this deployment will hand to
 * Google during OAuth. Add this URI verbatim to your Google Cloud Console
 * OAuth client under "Authorized redirect URIs" to fix
 * `redirect_uri_mismatch` errors.
 *
 *   GET /api/google/redirect-uri
 *   → { "redirectUri": "https://your.host/api/google/callback", "source": "request" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRedirectUri } from '@/lib/google-tokens'

export async function GET(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin
  const requestUri = getRedirectUri(requestOrigin)
  const envUri = getRedirectUri()
  return NextResponse.json({
    requestUri,
    envUri,
    note:
      requestUri === envUri
        ? 'Add this URI to Google Cloud Console → Credentials → OAuth client → Authorized redirect URIs.'
        : 'Add BOTH URIs to Google Cloud Console — the request-derived one is what your browser will use, the env-derived one is what server-to-server flows would use.',
    source: {
      requestOrigin,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? null,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    },
  })
}
