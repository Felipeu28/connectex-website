import { google } from 'googleapis'
import type { OAuth2Client, Credentials } from 'google-auth-library'
import { createAdminClient } from '@/lib/supabase'

/**
 * Google OAuth token storage + auto-refreshing OAuth2 client.
 *
 * Tokens live in the `google_integrations` table (single-row, id='default')
 * so any server context can load them — including Vercel cron, which
 * does not carry user cookies.
 *
 * Whenever the OAuth client refreshes the access token, we persist the new
 * credentials back to the DB via the `tokens` event listener.
 */

const TOKEN_ID = 'default'

interface StoredTokens {
  access_token: string
  refresh_token: string
  scope?: string | null
  token_type?: string | null
  expiry_date?: number | null
  email?: string | null
}

function getAdminSupabase() {
  // Routes through the centralized admin client so we always read the
  // canonical env var names (`NEXT_PUBLIC_SUPABASE_URL` + `SECRET_KEY`).
  // Returns null if env vars aren't set so callers can fall through.
  try {
    return createAdminClient()
  } catch {
    return null
  }
}

/**
 * Derive the redirect URI used for Google OAuth.
 *
 * Priority:
 *   1. Caller-supplied origin (from the incoming request) — used during
 *      `/api/google/connect` and `/api/google/callback` so the URI matches
 *      whatever host the user is actually browsing from.
 *   2. NEXT_PUBLIC_APP_URL (user's preferred env var name)
 *   3. NEXT_PUBLIC_SITE_URL (legacy fallback)
 *   4. http://localhost:3000 (last-ditch dev default)
 *
 * Whichever value resolves first MUST be added verbatim — including
 * `/api/google/callback` — to your OAuth client's "Authorized redirect URIs"
 * in Google Cloud Console.
 */
export function getRedirectUri(origin?: string): string {
  const base = (
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  ).trim().replace(/\/$/, '')
  return `${base}/api/google/callback`
}

function getOAuth2Client(origin?: string): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri(origin)
  )
}

/** Read the stored Google tokens from the DB. */
export async function getStoredTokens(): Promise<StoredTokens | null> {
  const supabase = getAdminSupabase()
  if (!supabase) {
    console.warn('getStoredTokens: Supabase env vars not set — treating as disconnected')
    return null
  }
  const { data, error } = await supabase
    .from('google_integrations')
    .select('access_token, refresh_token, scope, token_type, expiry_date, email')
    .eq('id', TOKEN_ID)
    .maybeSingle()

  if (error) {
    console.error('getStoredTokens: DB error', error)
    return null
  }
  if (!data?.access_token || !data?.refresh_token) return null
  return data as StoredTokens
}

/** Upsert tokens after the OAuth callback or after a refresh. */
export async function saveTokens(
  tokens: Credentials,
  email?: string | null
): Promise<void> {
  // Refresh responses from googleapis sometimes omit refresh_token (Google
  // only sends it on the first consent). Preserve the existing one when
  // missing — otherwise we'd brick the integration on the first refresh.
  const existing = await getStoredTokens()
  const refresh_token = tokens.refresh_token ?? existing?.refresh_token
  const access_token = tokens.access_token ?? existing?.access_token

  if (!access_token || !refresh_token) {
    console.warn('saveTokens: missing access/refresh token, skipping write', {
      hasAccess: !!access_token,
      hasRefresh: !!refresh_token,
    })
    return
  }

  const supabase = getAdminSupabase()
  if (!supabase) {
    throw new Error('Supabase env vars not set — cannot save Google tokens')
  }
  const { error } = await supabase.from('google_integrations').upsert({
    id: TOKEN_ID,
    access_token,
    refresh_token,
    scope: tokens.scope ?? existing?.scope ?? null,
    token_type: tokens.token_type ?? existing?.token_type ?? 'Bearer',
    expiry_date: tokens.expiry_date ?? existing?.expiry_date ?? null,
    email: email ?? existing?.email ?? null,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('saveTokens: DB upsert failed', error)
    throw error
  }
}

/** Disconnect the Google integration. */
export async function clearTokens(): Promise<void> {
  const supabase = getAdminSupabase()
  if (!supabase) return
  await supabase.from('google_integrations').delete().eq('id', TOKEN_ID)
}

/**
 * Build an OAuth2Client from stored tokens with an attached `tokens` listener
 * that persists refreshed credentials back to the DB.
 *
 * Returns null if no integration is configured.
 */
export async function getAuthedClient(): Promise<OAuth2Client | null> {
  const stored = await getStoredTokens()
  if (!stored) return null

  const client = getOAuth2Client()
  client.setCredentials({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
    scope: stored.scope ?? undefined,
    token_type: stored.token_type ?? undefined,
    expiry_date: stored.expiry_date ?? undefined,
  })

  // googleapis emits 'tokens' whenever it auto-refreshes. Persist the new
  // access_token + expiry so future calls don't re-refresh unnecessarily.
  client.on('tokens', (newTokens) => {
    saveTokens(newTokens, stored.email).catch((err) =>
      console.error('Failed to persist refreshed tokens:', err)
    )
  })

  return client
}

/**
 * Bare OAuth2 client for the consent URL / code-exchange flow.
 *
 * Pass the request `origin` so the redirect URI matches the host the user
 * is actually browsing from — that's what eliminates `redirect_uri_mismatch`
 * errors in dev (where the port can vary) and in preview deployments.
 */
export function getOAuthClientForConsent(origin?: string): OAuth2Client {
  return getOAuth2Client(origin)
}
