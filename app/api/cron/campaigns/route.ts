import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getSupabaseAdmin() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  )
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set', sent: 0 })
  }

  const supabase = getSupabaseAdmin()
  const resend = new Resend(resendApiKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Mark at Connectex <mark@connectex.net>'
  const now = new Date().toISOString()

  // Find all scheduled campaigns whose send time has arrived
  const { data: campaigns, error } = await supabase
    .from('crm_campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let totalSent = 0
  const results: { campaign: string; sent: number; failed: number }[] = []

  for (const campaign of campaigns ?? []) {
    // Mark as sending
    await supabase
      .from('crm_campaigns')
      .update({ status: 'sending', updated_at: now })
      .eq('id', campaign.id)

    // Get recipients from saved filter
    const filter = campaign.recipients_filter as Record<string, unknown> | null

    let query = supabase
      .from('crm_contacts')
      .select('id, name, email')
      .not('email', 'is', null)

    if (filter && typeof filter === 'object') {
      if (filter.ids && Array.isArray(filter.ids) && filter.ids.length > 0) {
        query = query.in('id', filter.ids as string[])
      } else if (filter.stage) {
        query = query.eq('stage', filter.stage as string)
      }
    }

    const { data: contacts } = await query
    const validContacts = (contacts ?? []).filter((c) => c.email?.includes('@'))

    let sent = 0
    let failed = 0

    for (const contact of validContacts) {
      try {
        const personalizedBody = campaign.body.replace(/\{\{name\}\}/gi, contact.name || 'there')
        const personalizedSubject = campaign.subject.replace(/\{\{name\}\}/gi, contact.name || 'there')

        await resend.emails.send({
          from: fromEmail,
          to: contact.email!,
          subject: personalizedSubject,
          html: personalizedBody.replace(/\n/g, '<br>'),
        })
        sent++
      } catch {
        failed++
      }
    }

    await supabase
      .from('crm_campaigns')
      .update({
        status: 'sent',
        sent_at: now,
        sent_count: sent,
        updated_at: now,
      })
      .eq('id', campaign.id)

    totalSent += sent
    results.push({ campaign: campaign.name, sent, failed })
  }

  return NextResponse.json({ processed: campaigns?.length ?? 0, totalSent, results })
}
