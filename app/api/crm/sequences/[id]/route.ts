import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { getSupabaseAdmin } from '@/lib/ticket-triage'

interface SequenceStepInput {
  step_number: number
  delay_days: number
  subject: string
  body: string
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const body = await req.json()
    const admin = getSupabaseAdmin()

    // Two shapes: { name, description, steps } for full edit, or { status } for status change
    if (typeof body.status === 'string' && !body.steps) {
      const { error } = await admin
        .from('crm_sequences')
        .update({ status: body.status, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    const { name, description, steps } = body as { name?: string; description?: string; steps?: SequenceStepInput[] }
    if (!name?.trim() || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'name and at least one step required' }, { status: 400 })
    }

    const { error: seqErr } = await admin
      .from('crm_sequences')
      .update({ name: name.trim(), description: description?.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (seqErr) return NextResponse.json({ error: seqErr.message }, { status: 500 })

    const { error: delErr } = await admin.from('crm_sequence_steps').delete().eq('sequence_id', id)
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

    const { error: insErr } = await admin
      .from('crm_sequence_steps')
      .insert(steps.map((s) => ({
        sequence_id: id,
        step_number: s.step_number,
        delay_days: s.delay_days,
        subject: s.subject,
        body: s.body,
      })))
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Sequence PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const admin = getSupabaseAdmin()
    // Soft-archive (matches existing UX of removing from list without losing send history)
    const { error } = await admin
      .from('crm_sequences')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Sequence DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
