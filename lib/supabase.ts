import { createBrowserClient as createBrowserSupabaseClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Creates a new instance per call (no shared singleton — safe for concurrent requests).
 */
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Supabase client for Client Components (browser only).
 * Uses @supabase/ssr for automatic cookie/token management.
 */
export function createBrowserClient() {
  return createBrowserSupabaseClient(supabaseUrl, supabaseAnonKey)
}
