// lib/auth-guard.ts
// Server-side auth check for API route handlers.
// Returns the authenticated user, or a 401 NextResponse if unauthenticated.
//
// Note: most /api/crm/* routes are ALREADY guarded by proxy.ts at the matcher
// level. This helper exists as defense-in-depth and for the small number of
// route handlers outside that matcher that still need a per-request check
// (e.g. /api/webhooks/* endpoints that should never be public).

import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

interface AuthGuardResult {
  user: { id: string; email?: string } | null
  errorResponse: NextResponse | null
}

/**
 * Call at the top of any admin API route handler.
 *
 * Usage:
 *   const { user, errorResponse } = await requireAdmin()
 *   if (errorResponse) return errorResponse
 */
export async function requireAdmin(): Promise<AuthGuardResult> {
  try {
    // IMPORTANT: must use the cookie-aware server client. The anon client
    // has no cookie context and would always return a null session.
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      }
    }

    return { user: { id: user.id, email: user.email }, errorResponse: null }
  } catch {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }
}
