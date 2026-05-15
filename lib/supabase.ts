/**
 * Server-only Supabase clients.
 *
 * The application no longer uses a browser-side Supabase client. All reads
 * happen in Server Components / Route Handlers via these helpers (or
 * `createSupabaseServer` from `lib/supabase-server.ts` when the request
 * needs to be authenticated as the signed-in user). All writes happen via
 * Server Actions in `app/actions/*.ts`.
 *
 *   createClient()       – anonymous, RLS-restricted (use for unauthed reads
 *                          like marketing forms or public ticket APIs)
 *   createAdminClient()  – service-role, bypasses RLS (admin / cron / triage)
 *   createSupabaseServer() (in lib/supabase-server.ts) – cookie-aware, the
 *                          default choice inside /crm and /portal
 *
 * Env var policy: we accept either the new Supabase "publishable / secret"
 * names *or* the legacy "anon / service_role" names, so existing Vercel
 * deployments do not need to be updated.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Resolve an env var by trying the canonical name first, then any fallbacks.
 * Returns the trimmed value, or throws if none are set.
 */
function resolveEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
  throw new Error(
    `Missing environment variable: ${names[0]} (also tried ${names.slice(1).join(', ') || 'none'})\n\n` +
      `Set the following in .env:\n` +
      `  - NEXT_PUBLIC_SUPABASE_URL\n` +
      `  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (or NEXT_PUBLIC_SUPABASE_ANON_KEY)\n` +
      `  - SECRET_KEY                            (or SUPABASE_SERVICE_ROLE_KEY)\n\n` +
      `Find these in Supabase Dashboard → Project Settings → API.`
  )
}

export function getSupabaseUrl(): string {
  return resolveEnv('NEXT_PUBLIC_SUPABASE_URL')
}

export function getSupabasePublishableKey(): string {
  return resolveEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function getSupabaseSecretKey(): string {
  return resolveEnv('SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY')
}

/**
 * Anonymous Supabase client. Honors RLS policies. Use for read-only access
 * from server contexts that don't have an authenticated session
 * (marketing pages, public ticket lookups, etc.).
 */
export function createClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Admin Supabase client. Bypasses RLS — only use server-side from trusted
 * code paths (Server Actions, Route Handlers, cron jobs, AI triage).
 */
export function createAdminClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
