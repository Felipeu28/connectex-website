import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

type ResendEvent =
  | 'email.sent'
  | 'email.delivered'
  | 'email.opened'
  | 'email.clicked'
  | 'email.bounced'
  | 'email.complained'
  | 'email.delivery_delayed'

interface ResendWebhookPayload {
  type: ResendEvent
  created_at: string
  data: {
    email_id?: string
    to?: string[]
    from?: string
    subject?: string
    tags?: { name: string; value: string }[]
    click?: { link?: string; userAgent?: string; ipAddress?: string }
    bounce?: { message?: string }
  }
}

const EVENT_MAP: Record<ResendEvent, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.delivery_delayed': 'failed',
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ResendWebhookPayload
    if (!payload?.type || !payload?.data) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
    const eventType = EVENT_MAP[payload.type]
    if (!eventType) return NextResponse.json({ ok: true, skipped: true })
    const admin = createAdminClient()
    const tags = payload.data.tags ?? []
    const campaign_id = tags.find((t) => t.name === 'campaign_id')?.value ?? null
    const sequence_id = tags.find((t) => t.name === 'sequence_id')?.value ?? null
    const contact_id = tags.find((t) => t.name === 'contact_id')?.value ?? null
    await admin.from('email_events').insert({
      event_type: eventType,
      email: payload.data.to?.[0] ?? 'unknown',
      contact_id,
      campaign_id,
      sequence_id,
      send_id: payload.data.email_id ?? null,
      link_url: payload.data.click?.link ?? null,
      user_agent: payload.data.click?.userAgent ?? null,
      ip_address: payload.data.click?.ipAddress ?? null,
      raw: payload,
    })
    if (campaign_id && (eventType === 'opened' || eventType === 'clicked')) {
      const col = eventType === 'opened' ? 'open_count' : 'click_count'
      const { data: row } = await admin.from('crm_campaigns').select(col).eq('id', campaign_id).maybeSingle()
      if (row) {
        const current = (row as Record<string, number>)[col] ?? 0
        await admin.from('crm_campaigns').update({ [col]: current + 1, updated_at: new Date().toISOString() }).eq('id', campaign_id)
      }
    }
    if (eventType === 'bounced' || eventType === 'complained') {
      const email = payload.data.to?.[0]
      if (email) {
        await admin.from('crm_contacts').update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() }).eq('email', email.toLowerCase().trim())
      }
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Resend webhook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
