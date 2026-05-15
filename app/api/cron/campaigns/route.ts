import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/email-send'
import { escapeHtml } from '@/lib/escape-html'

function unsubscribeUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://connectex.net').replace(/\/$/, '')
  return `${base}/unsubscribe/${token}`
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { data: campaigns, error } = await supabase
    .from('crm_campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  let totalSent = 0
  const results: { campaign: string; sent: number; failed: number; skipped: number }[] = []
  for (const campaign of campaigns ?? []) {
    await supabase.from('crm_campaigns').update({ status: 'sending', updated_at: now }).eq('id', campaign.id)
    const filter = campaign.recipients_filter as Record<string, unknown> | null
    let query = supabase
      .from('crm_contacts')
      .select('id, name, email, unsubscribe_token, unsubscribed')
      .not('email', 'is', null)
      .or('unsubscribed.is.null,unsubscribed.eq.false')
    if (filter && typeof filter === 'object') {
      if (filter.ids && Array.isArray(filter.ids) && filter.ids.length > 0) {
        query = query.in('id', filter.ids as string[])
      } else if (filter.stage) {
        query = query.eq('stage', filter.stage as string)
      }
    }
    const { data: contacts } = await query
    const validContacts = (contacts ?? []).filter((c) => c.email?.includes('@'))
    let sent = 0, failed = 0, skipped = 0
    for (const contact of validContacts) {
      const firstName = (contact.name ?? '').split(' ')[0] || 'there'
      const rawReplacements: Record<string, string> = {
        name: contact.name || 'there',
        first_name: firstName,
        last_name: (contact.name ?? '').split(' ').slice(1).join(' '),
        email: contact.email ?? '',
      }
      const escapedReplacements: Record<string, string> = {
        name: escapeHtml(rawReplacements.name),
        first_name: escapeHtml(rawReplacements.first_name),
        last_name: escapeHtml(rawReplacements.last_name),
        email: escapeHtml(rawReplacements.email),
      }
      const applyRaw = (s: string) => s.replace(/\{\{?\s*(\w+)\s*\}?\}/gi, (m, k) => rawReplacements[k.toLowerCase()] ?? m)
      const applyEscaped = (s: string) => s.replace(/\{\{?\s*(\w+)\s*\}?\}/gi, (m, k) => escapedReplacements[k.toLowerCase()] ?? m)
      const unsubUrl = contact.unsubscribe_token ? unsubscribeUrl(contact.unsubscribe_token as string) : undefined
      if (!unsubUrl) { skipped++; continue }
      const result = await sendEmail({
        to: contact.email!,
        subject: applyRaw(campaign.subject),
        html: applyEscaped(campaign.body),
        fromName: 'Mark at Connectex',
        fromEmail: 'mark@connectex.net',
        unsubscribeUrl: unsubUrl,
      })
      if (result.ok) {
        sent++
        await supabase.from('email_events').insert({
          event_type: 'sent',
          email: contact.email!,
          contact_id: contact.id,
          campaign_id: campaign.id,
          send_id: result.messageId ?? null,
        })
      } else failed++
    }
    await supabase.from('crm_campaigns').update({ status: 'sent', sent_at: now, sent_count: sent, updated_at: now }).eq('id', campaign.id)
    totalSent += sent
    results.push({ campaign: campaign.name, sent, failed, skipped })
  }
  return NextResponse.json({ processed: campaigns?.length ?? 0, totalSent, results })
}
