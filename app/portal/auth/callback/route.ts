import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/ticket-triage'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createSupabaseServer()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      // Backfill user_id on any historical tickets for this email (one-time on login)
      const userEmail = data.session.user.email
      if (userEmail) {
        getSupabaseAdmin()
          .from('tickets')
          .update({ user_id: data.session.user.id })
          .eq('email', userEmail)
          .is('user_id', null)
          .then(() => {}) // fire-and-forget, don't block redirect
      }
      return NextResponse.redirect(`${origin}/portal/dashboard`)
    }
  }

  // Auth failed — redirect back to login with error indicator
  return NextResponse.redirect(`${origin}/portal/login?error=auth_failed`)
}
