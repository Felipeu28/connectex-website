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

    // Skip already-enrolled contacts
    const { data: existing } = await admin
      .from('crm_sequence_enrollments')
      .select('contact_id')
      .eq('sequence_id', sequence_id)
      .in('contact_id', contact_ids)

    const existingSet = new Set((existing ?? []).map((r) => r.contact_id))
    const toEnroll = contact_ids.filter((id) => !existingSet.has(id))

    if (toEnroll.length === 0) {
      return NextResponse.json({ enrolled: 0, skipped: contact_ids.length })
    }

    const { error } = await admin.from('crm_sequence_enrollments').insert(
      toEnroll.map((cid) => ({
        sequence_id,
        contact_id: cid,
        status: 'active',
        current_step: 0,
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
