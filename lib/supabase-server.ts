/**
 * Server-side Supabase client with cookie-based session.
 *
 * Use in Server Components, Route Handlers, and Server Actions where you need
 * the request's authenticated user (i.e. session read from cookies).
 *
 * For background admin work that bypasses RLS, use `createAdminClient` from
 * `lib/supabase.ts`. Client Components no longer have a Supabase client —
 * call Server Actions in `app/actions/*.ts` instead.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase'

export async function createSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        // In Server Components, cookies are read-only. The proxy (Next 16
        // middleware) is responsible for refreshing them. Wrap in try/catch
        // so reads from RSC don't throw — Supabase SDK calls setAll
        // defensively.
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options as CookieOptions)
          }
        } catch {
          // Read-only context — ignore.
        }
      },
    },
  })
}

/**
 * Read the current authenticated user, or null if not signed in.
 * Convenience helper for server pages.
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}
