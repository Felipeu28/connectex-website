import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

async function unsubscribe(token: string): Promise<boolean> {
  if (!token || token.length < 8) return false
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_contacts')
    .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const ok = await unsubscribe(token)
  return NextResponse.json({ ok })
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const ok = await unsubscribe(token)
  return NextResponse.json({ ok })
}
