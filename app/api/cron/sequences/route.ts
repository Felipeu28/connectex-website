import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendGmail } from '@/lib/gmail'
import { getAuthedClient } from '@/lib/google-tokens'

interface DueEnrollment {
  id: string
  current_step: number
  contact_id: string
  sequence_id: string
  contact:
    | { name: string; email: string; unsubscribe_token: string | null; unsubscribed: boolean | null }
    | { name: string; email: string; unsubscribe_token: string | null; unsubscribed: boolean | null }[]
    | null
}

function unsubscribeUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://connectex.net').replace(/\/$/, '')
  return `${base}/unsubscribe/${token}`
}

function appendUnsubscribeFooter(body: string, url: string): string {
  return `${body}\n\n---\nIf you no longer want to receive these emails, you can unsubscribe here:\n${url}\n\nConnectex Solutions, Austin TX`
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const auth = await getAuthedClient()
  if (!auth) return NextResponse.json({ error: 'Gmail not connected', sent: 0 })
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { data: dueEnrollments, error } = await supabase
    .from('crm_sequence_enrollments')
    .select(`id, current_step, contact_id, sequence_id, contact:crm_contacts(name, email, unsubscribe_token, unsubscribed)`)
    .eq('status', 'active')
    .lte('next_send_at', now)
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  let sent = 0, failed = 0, skipped = 0
  const results: { contact: string; step: number; status: string; detail?: string }[] = []
  for (const enrollment of (dueEnrollments ?? []) as DueEnrollment[]) {
    const contactRel = enrollment.contact
    const contact = Array.isArray(contactRel) ? contactRel[0] : contactRel
    if (!contact?.email) {
      await supabase.from('crm_sequence_enrollments').update({ status: 'bounced' }).eq('id', enrollment.id)
      skipped++
      results.push({ contact: contact?.name ?? '(unknown)', step: enrollment.current_step, status: 'bounced' })
      continue
    }
    if (contact.unsubscribed) {
      await supabase.from('crm_sequence_enrollments').update({ status: 'completed', completed_at: now }).eq('id', enrollment.id)
      skipped++
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'unsubscribed' })
      continue
    }
    const { data: step } = await supabase.from('crm_sequence_steps').select('id, subject, body').eq('sequence_id', enrollment.sequence_id).eq('step_number', enrollment.current_step).maybeSingle()
    if (!step) {
      await supabase.from('crm_sequence_enrollments').update({ status: 'completed', completed_at: now }).eq('id', enrollment.id)
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'completed' })
      continue
    }
    const { data: nextStep } = await supabase.from('crm_sequence_steps').select('delay_days').eq('sequence_id', enrollment.sequence_id).eq('step_number', enrollment.current_step + 1).maybeSingle()
    let updatePatch: Record<string, string | number | null>
    if (nextStep) {
      const nextSendAt = new Date()
      nextSendAt.setDate(nextSendAt.getDate() + (nextStep.delay_days ?? 1))
      updatePatch = { current_step: enrollment.current_step + 1, next_send_at: nextSendAt.toISOString() }
    } else {
      updatePatch = { status: 'completed', completed_at: now }
    }
    const { data: claimed, error: claimError } = await supabase.from('crm_sequence_enrollments').update(updatePatch).eq('id', enrollment.id).eq('current_step', enrollment.current_step).eq('status', 'active').select('id')
    if (claimError || !claimed || claimed.length === 0) {
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'skipped_race' })
      continue
    }
    const firstName = contact.name?.split(' ')[0] ?? ''
    const subject = step.subject.replace(/\{\{name\}\}/g, firstName)
    let body = step.body.replace(/\{\{name\}\}/g, firstName)
    if (contact.unsubscribe_token) body = appendUnsubscribeFooter(body, unsubscribeUrl(contact.unsubscribe_token))
    try {
      const gmailMessageId = await sendGmail(contact.email, subject, body, auth)
      await supabase.from('crm_sequence_sends').insert({ enrollment_id: enrollment.id, step_id: step.id, contact_id: enrollment.contact_id, subject, gmail_message_id: gmailMessageId })
      await supabase.from('crm_activity').insert({ type: 'email', contact_id: enrollment.contact_id, description: `Sequence email sent: "${subject}"`, metadata: { sequence_id: enrollment.sequence_id, step: enrollment.current_step, gmail_message_id: gmailMessageId } })
      await supabase.from('email_events').insert({ event_type: 'sent', email: contact.email, contact_id: enrollment.contact_id, sequence_id: enrollment.sequence_id, send_id: gmailMessageId })
      sent++
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'sent' })
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      console.error('Sequence send failed', { enrollmentId: enrollment.id, detail })
      await supabase.from('crm_sequence_sends').insert({ enrollment_id: enrollment.id, step_id: step.id, contact_id: enrollment.contact_id, subject, gmail_message_id: null })
      failed++
      results.push({ contact: contact.name, step: enrollment.current_step, status: 'failed', detail })
    }
  }
  return NextResponse.json({ sent, failed, skipped, results })
}
