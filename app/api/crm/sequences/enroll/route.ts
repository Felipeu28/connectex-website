import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { getSupabaseAdmin } from '@/lib/ticket-triage'

interface EnrollInput {
  sequence_id: string
  contact_ids: string[]
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  try {
    const { sequence_id, contact_ids } = (await req.json()) as EnrollInput
    if (!sequence_id || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json({ error: 'sequence_id and contact_ids required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Skip already-enrolled contacts and anyone unsubscribed
    const [existingRes, unsubscribedRes] = await Promise.all([
      admin
        .from('crm_sequence_enrollments')
        .select('contact_id')
        .eq('sequence_id', sequence_id)
        .in('contact_id', contact_ids),
      admin
        .from('crm_contacts')
        .select('id')
        .in('id', contact_ids)
        .eq('unsubscribed', true),
    ])

    const existingSet = new Set((existingRes.data ?? []).map((r) => r.contact_id))
    const unsubscribedSet = new Set((unsubscribedRes.data ?? []).map((r) => r.id))
    const toEnroll = contact_ids.filter((id) => !existingSet.has(id) && !unsubscribedSet.has(id))

    if (toEnroll.length === 0) {
      return NextResponse.json({ enrolled: 0, skipped: contact_ids.length })
    }

    // Look up first step's delay so we set next_send_at correctly
    const { data: firstStep } = await admin
      .from('crm_sequence_steps')
      .select('delay_days')
      .eq('sequence_id', sequence_id)
      .eq('step_number', 1)
      .maybeSingle()

    const delayDays = firstStep?.delay_days ?? 0
    const nextSendAt = new Date()
    nextSendAt.setDate(nextSendAt.getDate() + delayDays)

    const { error } = await admin.from('crm_sequence_enrollments').insert(
      toEnroll.map((cid) => ({
        sequence_id,
        contact_id: cid,
        status: 'active',
        current_step: 1,
        next_send_at: nextSendAt.toISOString(),
      }))
    )

    if (error) {
      console.error('Sequence enroll error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ enrolled: toEnroll.length, skipped: contact_ids.length - toEnroll.length })
  } catch (err) {
    console.error('Sequence enroll exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
