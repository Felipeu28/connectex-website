import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { getSupabaseAdmin } from '@/lib/ticket-triage'
import { sendBulk, EmailSendError } from '@/lib/email-send'

export const runtime = 'nodejs'
export const maxDuration = 60

interface Filter {
  ids?: string[]
  stage?: string
  tags?: string[]
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  try {
    const { campaign_id, filter, test_email } = (await req.json()) as {
      campaign_id: string
      filter?: Filter | 'all'
      test_email?: string
    }

    if (!campaign_id) {
      return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Fetch the campaign
    const { data: campaign, error: campaignError } = await admin
      .from('crm_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // ── Test send: skip status changes, send single email, no unsub footer ──
    if (test_email) {
      const result = await sendBulk(
        {
          subject: campaign.subject,
          body: campaign.body,
          recipients: [
            { contact_id: null, name: 'Mark (test)', email: test_email, unsubscribe_token: null },
          ],
          context: { kind: 'test', tester_email: test_email },
          skipUnsubscribeFooter: true,
        },
        admin
      )
      return NextResponse.json({
        success: result.sent > 0,
        sent: result.sent,
        failed: result.failed,
        errors: result.errors.map((e) => `${e.email}: ${e.reason}`),
        test: true,
      })
    }

    if (campaign.status === 'sent') {
      return NextResponse.json({ error: 'Campaign has already been sent' }, { status: 400 })
    }

    // Mark sending
    await admin
      .from('crm_campaigns')
      .update({ status: 'sending', updated_at: new Date().toISOString() })
      .eq('id', campaign_id)

    // Fetch contacts based on filter; skip unsubscribed
    let query = admin
      .from('crm_contacts')
      .select('id, name, email, unsubscribe_token, unsubscribed')
      .not('email', 'is', null)
      .or('unsubscribed.is.null,unsubscribed.eq.false')

    if (filter && filter !== 'all') {
      if (filter.ids && filter.ids.length > 0) query = query.in('id', filter.ids)
      else if (filter.stage) query = query.eq('stage', filter.stage)
      else if (filter.tags && filter.tags.length > 0) query = query.overlaps('tags', filter.tags)
    }

    const { data: contacts, error: contactsError } = await query

    if (contactsError) {
      await admin
        .from('crm_campaigns')
        .update({ status: 'draft', updated_at: new Date().toISOString() })
        .eq('id', campaign_id)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    const recipients = (contacts ?? []).map((c) => ({
      contact_id: c.id,
      name: c.name,
      email: c.email as string,
      unsubscribe_token: c.unsubscribe_token,
    }))

    if (recipients.length === 0) {
      await admin
        .from('crm_campaigns')
        .update({ status: 'draft', updated_at: new Date().toISOString() })
        .eq('id', campaign_id)
      return NextResponse.json(
        { error: 'No contacts with valid emails match the filter (also excludes unsubscribed)' },
        { status: 400 }
      )
    }

    // Send via shared batched helper
    let result
    try {
      result = await sendBulk(
        {
          subject: campaign.subject,
          body: campaign.body,
          recipients,
          context: { kind: 'campaign', campaign_id },
        },
        admin
      )
    } catch (err) {
      await admin
        .from('crm_campaigns')
        .update({ status: 'draft', updated_at: new Date().toISOString() })
        .eq('id', campaign_id)
      if (err instanceof EmailSendError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }
      throw err
    }

    // Persist final status
    await admin
      .from('crm_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: result.sent,
        recipients_filter: filter ?? { type: 'all' },
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaign_id)

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      total: recipients.length,
      errors: result.errors.length > 0 ? result.errors.map((e) => `${e.email}: ${e.reason}`) : undefined,
    })
  } catch (err) {
    console.error('Campaign send error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
