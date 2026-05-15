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

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  // Find scheduled campaigns whose send time has arrived
  const { data: campaigns, error } = await supabase
    .from('crm_campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let totalSent = 0
  const results: { campaign: string; sent: number; failed: number; error?: string }[] = []

  for (const campaign of campaigns ?? []) {
    await supabase
      .from('crm_campaigns')
      .update({ status: 'sending', updated_at: now })
      .eq('id', campaign.id)

    const filter = (campaign.recipients_filter as Record<string, unknown> | null) ?? null

    let query = supabase
      .from('crm_contacts')
      .select('id, name, email, unsubscribe_token')
      .not('email', 'is', null)
      .or('unsubscribed.is.null,unsubscribed.eq.false')

    if (filter && typeof filter === 'object') {
      if (Array.isArray(filter.ids) && filter.ids.length > 0) {
        query = query.in('id', filter.ids as string[])
      } else if (filter.stage) {
        query = query.eq('stage', filter.stage as string)
      } else if (Array.isArray(filter.tags) && filter.tags.length > 0) {
        query = query.overlaps('tags', filter.tags as string[])
      }
    }

    const { data: contacts } = await query
    const recipients = (contacts ?? [])
      .filter((c) => c.email && c.email.includes('@'))
      .map((c) => ({
        contact_id: c.id,
        name: c.name,
        email: c.email as string,
        unsubscribe_token: c.unsubscribe_token,
      }))

    let sent = 0
    let failed = 0
    let errMessage: string | undefined

    try {
      const result = await sendBulk(
        {
          subject: campaign.subject,
          body: campaign.body,
          recipients,
          context: { kind: 'campaign', campaign_id: campaign.id },
        },
        supabase
      )
      sent = result.sent
      failed = result.failed
    } catch (err) {
      errMessage = err instanceof EmailSendError ? err.message : 'Send failed'
      console.error('Cron campaign send failed:', errMessage)
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
    results.push({ campaign: campaign.name, sent, failed, error: errMessage })
  }

  return NextResponse.json({ processed: campaigns?.length ?? 0, totalSent, results })
}
