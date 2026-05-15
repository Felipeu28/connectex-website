import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/ticket-triage'

async function unsubscribe(token: string) {
  if (!token || token.length < 8) return false
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('crm_contacts')
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('unsubscribe_token', token)
    .select('id, email')
    .maybeSingle()

  if (error || !data) return false
  await admin.from('email_events').insert({
    event_type: 'unsubscribed',
    email: data.email,
    contact_id: data.id,
  })
  return true
}

// RFC 8058 one-click POST handler — Gmail / Outlook hit this in the
// background when the user clicks the inbox-native "Unsubscribe" link.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const ok = await unsubscribe(token)
  return NextResponse.json({ ok })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const ok = await unsubscribe(token)
  return NextResponse.json({ ok })
}
