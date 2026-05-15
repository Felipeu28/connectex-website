import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBulk, EmailSendError } from '@/lib/email-send'

function getSupabaseAdmin() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
    { auth: { persistSession: false } }
  )
}

interface DueEnrollment {
  id: string
  current_step: number
  contact_id: string
  sequence_id: string
  contact: { id: string; name: string; email: string; unsubscribe_token: string | null; unsubscribed: boolean | null } | { id: string; name: string; email: string; unsubscribe_token: string | null; unsubscribed: boolean | null }[] | null
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  const { data: dueEnrollments, error } = await supabase
    .from('crm_sequence_enrollments')
    .select(`
      id, current_step, contact_id, sequence_id,
      contact:crm_contacts(id, name, email, unsubscribe_token, unsubscribed)
    `)
    .eq('status', 'active')
    .lte('next_send_at', now)
    .limit(100) // batched Resend send is fast enough to handle more per cycle

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let failed = 0
  let skipped = 0
  const results: { contact: string; step: number; status: string; detail?: string }[] = []

  for (const enrollment of (dueEnrollments ?? []) as DueEnrollment[]) {
    const contactRel = enrollment.contact
    const contact = Array.isArray(contactRel) ? contactRel[0] : contactRel
    if (!contact?.email) {
      await supabase
        .from('crm_sequence_enrollments')
        .update({ status: 'bounced' })
        .eq('id', enrollment.id)
      skipped++
      results.push({ contact: contact?.name ?? '(unknown)', step: enrollment.current_step, status: 'bounced' })
      continue
    }

    if (contact.unsubscribed) {
      await supabase
        .from('crm_sequence_enrollments')
        .update({ status: 'unsubscribed' })
        .eq('id', enrollment.id)
      skipped++
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'unsubscribed' })
      continue
    }

    const { data: step } = await supabase
      .from('crm_sequence_steps')
      .select('id, subject, body')
      .eq('sequence_id', enrollment.sequence_id)
      .eq('step_number', enrollment.current_step)
      .maybeSingle()

    if (!step) {
      await supabase
        .from('crm_sequence_enrollments')
        .update({ status: 'completed', completed_at: now })
        .eq('id', enrollment.id)
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'completed' })
      continue
    }

    const { data: nextStep } = await supabase
      .from('crm_sequence_steps')
      .select('delay_days')
      .eq('sequence_id', enrollment.sequence_id)
      .eq('step_number', enrollment.current_step + 1)
      .maybeSingle()

    // Atomic claim — advance enrollment before sending so concurrent runs
    // can't double-send.
    let updatePatch: Record<string, string | number | null>
    if (nextStep) {
      const nextSendAt = new Date()
      nextSendAt.setDate(nextSendAt.getDate() + (nextStep.delay_days ?? 1))
      updatePatch = {
        current_step: enrollment.current_step + 1,
        next_send_at: nextSendAt.toISOString(),
      }
    } else {
      updatePatch = { status: 'completed', completed_at: now }
    }

    const { data: claimed, error: claimError } = await supabase
      .from('crm_sequence_enrollments')
      .update(updatePatch)
      .eq('id', enrollment.id)
      .eq('current_step', enrollment.current_step)
      .eq('status', 'active')
      .select('id')

    if (claimError || !claimed || claimed.length === 0) {
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'skipped_race' })
      continue
    }

    try {
      const result = await sendBulk(
        {
          subject: step.subject,
          body: step.body,
          recipients: [
            {
              contact_id: contact.id,
              name: contact.name,
              email: contact.email,
              unsubscribe_token: contact.unsubscribe_token,
            },
          ],
          context: {
            kind: 'sequence',
            sequence_id: enrollment.sequence_id,
            step_id: step.id,
            enrollment_id: enrollment.id,
          },
        },
        supabase
      )

      if (result.sent === 1 && result.messageIds.length === 1) {
        await supabase.from('crm_sequence_sends').insert({
          enrollment_id: enrollment.id,
          step_id: step.id,
          contact_id: enrollment.contact_id,
          subject: step.subject,
          resend_message_id: result.messageIds[0].id,
        })
        await supabase.from('crm_activity').insert({
          type: 'email',
          contact_id: enrollment.contact_id,
          description: `Sequence email sent: "${step.subject}"`,
          metadata: {
            sequence_id: enrollment.sequence_id,
            step: enrollment.current_step,
            resend_message_id: result.messageIds[0].id,
          },
        })
        sent++
        results.push({ contact: contact.name, step: enrollment.current_step, status: 'sent' })
      } else {
        failed++
        const detail = result.errors[0]?.reason ?? 'No message id returned'
        results.push({ contact: contact.name, step: enrollment.current_step, status: 'failed', detail })
      }
    } catch (err) {
      const detail = err instanceof EmailSendError ? err.message : (err instanceof Error ? err.message : String(err))
      console.error('Sequence send failed', { enrollmentId: enrollment.id, detail })
      failed++
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'failed', detail })
    }
  }

  return NextResponse.json({ sent, failed, skipped, results })
}
