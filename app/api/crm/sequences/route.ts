import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { getSupabaseAdmin } from '@/lib/ticket-triage'

interface SequenceStepInput {
  step_number: number
  delay_days: number
  subject: string
  body: string
}

export async function GET() {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  try {
    const admin = getSupabaseAdmin()
    const { data: seqs, error } = await admin
      .from('crm_sequences')
      .select('*')
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const enriched = await Promise.all(
      (seqs ?? []).map(async (seq) => {
        const [stepsRes, enrollRes] = await Promise.all([
          admin.from('crm_sequence_steps').select('*').eq('sequence_id', seq.id).order('step_number'),
          admin.from('crm_sequence_enrollments').select('id', { count: 'exact', head: true }).eq('sequence_id', seq.id).eq('status', 'active'),
        ])
        return { ...seq, steps: stepsRes.data ?? [], enrollment_count: enrollRes.count ?? 0 }
      })
    )

    return NextResponse.json(enriched)
  } catch (err) {
    console.error('Sequences GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { name, description, steps } = body as { name?: string; description?: string; steps?: SequenceStepInput[] }
    if (!name?.trim() || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'name and at least one step required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data: seq, error: seqErr } = await admin
      .from('crm_sequences')
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select('id')
      .single()

    if (seqErr || !seq) {
      console.error('Sequence insert error:', seqErr)
      return NextResponse.json({ error: seqErr?.message ?? 'Insert failed' }, { status: 500 })
    }

    const { error: stepsErr } = await admin
      .from('crm_sequence_steps')
      .insert(steps.map((s) => ({
        sequence_id: seq.id,
        step_number: s.step_number,
        delay_days: s.delay_days,
        subject: s.subject,
        body: s.body,
      })))

    if (stepsErr) {
      console.error('Sequence steps insert error:', stepsErr)
      return NextResponse.json({ error: stepsErr.message }, { status: 500 })
    }

    return NextResponse.json({ id: seq.id }, { status: 201 })
  } catch (err) {
    console.error('Sequences POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
