import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { name, email, company, subject, description, priority, image_url } = data

    // Validate required fields
    if (!name || !email || !subject || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Priority validation
    const safePriority = PRIORITIES.includes(priority) ? priority : 'medium'

    const supabase = getSupabaseAdmin()

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        name,
        email,
        company: company || null,
        subject,
        description,
        priority: safePriority,
        image_url: image_url || null,
      })
      .select('id, token')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Best-effort: auto-detect linked CRM contact by email and update ticket
    try {
      const { data: contact } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle()

      if (contact?.id) {
        await supabase
          .from('tickets')
          .update({ contact_id: contact.id })
          .eq('id', ticket.id)

        await supabase.from('crm_activity').insert({
          type: 'ticket',
          contact_id: contact.id,
          description: `Support ticket submitted: "${subject}"`,
          metadata: { ticket_id: ticket.id },
        })
      }
    } catch {
      // contact linking is optional — don't fail the ticket creation
    }

    // Fire-and-forget AI triage (don't block the response)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    fetch(`${baseUrl}/api/tickets/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: ticket.id }),
    }).catch((err) => console.error('Triage dispatch failed:', err))

    return NextResponse.json({ token: ticket.token }, { status: 201 })
  } catch (err) {
    console.error('Ticket creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const supabase = createClient()

    let query = supabase
      .from('tickets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data: tickets, error, count } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    return NextResponse.json({ tickets, total: count })
  } catch (err) {
    console.error('Tickets list error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
