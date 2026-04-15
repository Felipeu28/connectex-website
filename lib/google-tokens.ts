import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'
import type { OAuth2Client, Credentials } from 'google-auth-library'

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
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim()}/api/google/callback`
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

/** Bare OAuth2 client for the consent URL / code-exchange flow. */
export function getOAuthClientForConsent(): OAuth2Client {
  return getOAuth2Client()
}
