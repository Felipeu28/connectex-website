import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendGmail } from '@/lib/gmail'
import { getAuthedClient } from '@/lib/google-tokens'

// Supabase admin client for cron (bypasses RLS, no cookies needed).
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
  contact: { name: string; email: string } | { name: string; email: string }[] | null
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Tokens now live in the DB (see migration 009). Vercel cron carries no
  // cookies, which is why the previous cookie-backed implementation never
  // sent a single email in production.
  const auth = await getAuthedClient()
  if (!auth) {
    return NextResponse.json({ error: 'Gmail not connected', sent: 0 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  const { data: dueEnrollments, error } = await supabase
    .from('crm_sequence_enrollments')
    .select(`
      id, current_step, contact_id, sequence_id,
      contact:crm_contacts(name, email)
    `)
    .eq('status', 'active')
    .lte('next_send_at', now)
    .limit(50) // stay within Vercel function timeout / Gmail send rate

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

    // Look up the step we're about to send.
    const { data: step } = await supabase
      .from('crm_sequence_steps')
      .select('id, subject, body')
      .eq('sequence_id', enrollment.sequence_id)
      .eq('step_number', enrollment.current_step)
      .maybeSingle()

    if (!step) {
      // Sequence is exhausted for this contact — mark complete and move on.
      await supabase
        .from('crm_sequence_enrollments')
        .update({ status: 'completed', completed_at: now })
        .eq('id', enrollment.id)
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'completed' })
      continue
    }

    // Look up the next step so we know the delay (or whether to complete).
    const { data: nextStep } = await supabase
      .from('crm_sequence_steps')
      .select('delay_days')
      .eq('sequence_id', enrollment.sequence_id)
      .eq('step_number', enrollment.current_step + 1)
      .maybeSingle()

    // ATOMIC CLAIM: advance the enrollment BEFORE sending. The
    // `eq('current_step', enrollment.current_step)` guard means a concurrent
    // cron run that already advanced this row will get rowsAffected=0 and we
    // skip it. This prevents double-sends if the cron overlaps itself or if
    // a manual re-trigger happens.
    let updatePatch: Record<string, string | number | null>
    if (nextStep) {
      const nextSendAt = new Date()
      nextSendAt.setDate(nextSendAt.getDate() + (nextStep.delay_days ?? 1))
      updatePatch = {
        current_step: enrollment.current_step + 1,
        next_send_at: nextSendAt.toISOString(),
      }
    } else {
      updatePatch = {
        status: 'completed',
        completed_at: now,
      }
    }

    const { data: claimed, error: claimError } = await supabase
      .from('crm_sequence_enrollments')
      .update(updatePatch)
      .eq('id', enrollment.id)
      .eq('current_step', enrollment.current_step)
      .eq('status', 'active')
      .select('id')

    if (claimError || !claimed || claimed.length === 0) {
      // Lost the race to another worker — skip.
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'skipped_race' })
      continue
    }

    // Personalize.
    const firstName = contact.name?.split(' ')[0] ?? ''
    const subject = step.subject.replace(/\{\{name\}\}/g, firstName)
    const body = step.body.replace(/\{\{name\}\}/g, firstName)

    try {
      const gmailMessageId = await sendGmail(contact.email, subject, body, auth)

      await supabase.from('crm_sequence_sends').insert({
        enrollment_id: enrollment.id,
        step_id: step.id,
        contact_id: enrollment.contact_id,
        subject,
        gmail_message_id: gmailMessageId,
      })

      await supabase.from('crm_activity').insert({
        type: 'email',
        contact_id: enrollment.contact_id,
        description: `Sequence email sent: "${subject}"`,
        metadata: {
          sequence_id: enrollment.sequence_id,
          step: enrollment.current_step,
          gmail_message_id: gmailMessageId,
        },
      })

      sent++
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'sent' })
    } catch (err) {
      // The enrollment is already advanced (claim happened pre-send), so the
      // same email won't fire again next hour. Log the failure so it's
      // visible. If the project later wants retries, change the claim to
      // re-arm `next_send_at` here.
      const detail = err instanceof Error ? err.message : String(err)
      console.error('Sequence send failed', { enrollmentId: enrollment.id, detail })
      await supabase.from('crm_sequence_sends').insert({
        enrollment_id: enrollment.id,
        step_id: step.id,
        contact_id: enrollment.contact_id,
        subject,
        gmail_message_id: null,
      })
      failed++
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'failed', detail })
    }
  }

  return NextResponse.json({ sent, failed, skipped, results })
}
