import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendGmail } from '@/lib/gmail'
import { cookies } from 'next/headers'

// Supabase admin client for cron (bypasses RLS)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get Google tokens from cookie (set when Mark connected Gmail)
  const cookieStore = await cookies()
  const tokensCookie = cookieStore.get('google_tokens')
  if (!tokensCookie) {
    return NextResponse.json({ error: 'Gmail not connected', sent: 0 })
  }

  const tokens = JSON.parse(tokensCookie.value) as { access_token: string; refresh_token: string }
  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  // Find all active enrollments due to send
  const { data: dueEnrollments, error } = await supabase
    .from('crm_sequence_enrollments')
    .select(`
      id, current_step, contact_id, sequence_id,
      contact:crm_contacts(name, email),
      sequence:crm_sequences(id, name)
    `)
    .eq('status', 'active')
    .lte('next_send_at', now)
    .limit(50) // process max 50 per run to stay within limits

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  const results: { contact: string; step: number; status: string }[] = []

  for (const enrollment of dueEnrollments ?? []) {
    const contact = (Array.isArray(enrollment.contact) ? enrollment.contact[0] : enrollment.contact) as { name: string; email: string } | null
    if (!contact?.email) {
      await supabase
        .from('crm_sequence_enrollments')
        .update({ status: 'bounced' })
        .eq('id', enrollment.id)
      continue
    }

    // Get the current step content
    const { data: step } = await supabase
      .from('crm_sequence_steps')
      .select('*')
      .eq('sequence_id', enrollment.sequence_id)
      .eq('step_number', enrollment.current_step)
      .single()

    if (!step) {
      // No more steps — mark complete
      await supabase
        .from('crm_sequence_enrollments')
        .update({ status: 'completed', completed_at: now })
        .eq('id', enrollment.id)
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'completed' })
      continue
    }

    // Personalize subject + body
    const subject = step.subject.replace(/\{\{name\}\}/g, contact.name.split(' ')[0])
    const body = step.body.replace(/\{\{name\}\}/g, contact.name.split(' ')[0])

    try {
      const gmailMessageId = await sendGmail(tokens, contact.email, subject, body)

      // Log the send
      await supabase.from('crm_sequence_sends').insert({
        enrollment_id: enrollment.id,
        step_id: step.id,
        contact_id: enrollment.contact_id,
        subject,
        gmail_message_id: gmailMessageId,
      })

      // Log to activity feed
      await supabase.from('crm_activity').insert({
        type: 'email',
        contact_id: enrollment.contact_id,
        description: `Sequence email sent: "${subject}"`,
        metadata: { sequence_id: enrollment.sequence_id, step: enrollment.current_step, gmail_message_id: gmailMessageId },
      })

      // Check if there's a next step
      const { data: nextStep } = await supabase
        .from('crm_sequence_steps')
        .select('id, delay_days')
        .eq('sequence_id', enrollment.sequence_id)
        .eq('step_number', enrollment.current_step + 1)
        .single()

      if (nextStep) {
        const nextSendAt = new Date()
        nextSendAt.setDate(nextSendAt.getDate() + (nextStep.delay_days ?? 1))
        await supabase
          .from('crm_sequence_enrollments')
          .update({ current_step: enrollment.current_step + 1, next_send_at: nextSendAt.toISOString() })
          .eq('id', enrollment.id)
      } else {
        // Last step done
        await supabase
          .from('crm_sequence_enrollments')
          .update({ status: 'completed', completed_at: now })
          .eq('id', enrollment.id)
      }

      sent++
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'sent' })
    } catch (err) {
      results.push({ contact: contact.name, step: enrollment.current_step, status: `error: ${err}` })
    }
  }

  return NextResponse.json({ sent, results })
}
