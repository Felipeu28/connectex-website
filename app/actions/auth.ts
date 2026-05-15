'use server'

/**
 * Auth server actions for the CRM. Sign in with email + password, sign out.
 *
 * The browser submits a plain HTML form (or invokes the action via React's
 * `useFormState` / `formAction`). The action runs server-side, sets the
 * session cookie via `createSupabaseServer`, then redirects.
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'

export type AuthResult = { ok: false; error: string } | { ok: true }

export async function signInAction(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '/crm/dashboard')

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' }
  }

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signOutAction() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/crm/login')
}

/**
 * Portal magic-link sign-in — clients receive an email with a link that
 * lands at /portal/auth/callback to exchange the code.
 */
export type PortalAuthResult =
  | { ok: false; error: string }
  | { ok: true; emailSent: true }

export async function portalSignInAction(
  _prev: PortalAuthResult | null,
  formData: FormData
): Promise<PortalAuthResult> {
  const email = String(formData.get('email') ?? '').trim()
  const origin = String(formData.get('origin') ?? '').trim()
  if (!email) return { ok: false, error: 'Email is required.' }
  if (!origin) return { ok: false, error: 'Missing redirect origin.' }

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/portal/auth/callback` },
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, emailSent: true }
}

export async function portalSignOutAction() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/portal/login')
}
