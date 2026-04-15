// lib/auth-guard.ts
// Server-side auth check for API route handlers.
// Returns the authenticated user, or a 401 NextResponse if unauthenticated.

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
    const supabase = await createSupabaseServer()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      }
    }

    return { user: session.user, errorResponse: null }
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
