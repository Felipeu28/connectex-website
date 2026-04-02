import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { campaign_id, filter } = await req.json()

    if (!campaign_id) {
      return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 })
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Email sending not configured. Set RESEND_API_KEY in environment.' },
        { status: 503 }
      )
    }

    const resend = new Resend(resendApiKey)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Mark at ConnectEx <mark@connectex.net>'
    const supabase = await createSupabaseServer()

    // Fetch the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('crm_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status === 'sent') {
      return NextResponse.json({ error: 'Campaign has already been sent' }, { status: 400 })
    }

    // Mark campaign as sending
    await supabase
      .from('crm_campaigns')
      .update({ status: 'sending', updated_at: new Date().toISOString() })
      .eq('id', campaign_id)

    // Fetch contacts based on filter
    let query = supabase
      .from('crm_contacts')
      .select('id, name, email, company, stage, tags')
      .not('email', 'is', null)

    if (filter && filter !== 'all') {
      if (filter.stage) {
        query = query.eq('stage', filter.stage)
      }
      if (filter.tags && filter.tags.length > 0) {
        query = query.overlaps('tags', filter.tags)
      }
    }

    const { data: contacts, error: contactsError } = await query

    if (contactsError) {
      await supabase
        .from('crm_campaigns')
        .update({ status: 'draft', updated_at: new Date().toISOString() })
        .eq('id', campaign_id)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    // Filter out contacts without valid emails
    const validContacts = (contacts ?? []).filter(
      (c) => c.email && c.email.includes('@')
    )

    if (validContacts.length === 0) {
      await supabase
        .from('crm_campaigns')
        .update({ status: 'draft', updated_at: new Date().toISOString() })
        .eq('id', campaign_id)
      return NextResponse.json({ error: 'No contacts with valid emails match the filter' }, { status: 400 })
    }

    // Send emails
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (const contact of validContacts) {
      try {
        // Replace {{name}} placeholder with contact name
        const personalizedBody = campaign.body.replace(
          /\{\{name\}\}/gi,
          contact.name || 'there'
        )
        const personalizedSubject = campaign.subject.replace(
          /\{\{name\}\}/gi,
          contact.name || 'there'
        )

        await resend.emails.send({
          from: fromEmail,
          to: contact.email!,
          subject: personalizedSubject,
          html: personalizedBody.replace(/\n/g, '<br>'),
        })

        successCount++
      } catch (err) {
        failCount++
        const message = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`${contact.email}: ${message}`)
      }
    }

    // Update campaign status
    await supabase
      .from('crm_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: successCount,
        recipients_filter: filter ?? { type: 'all' },
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaign_id)

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failCount,
      total: validContacts.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('Campaign send error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
