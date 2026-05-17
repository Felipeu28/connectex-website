import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { notifyClientNewReply } from '@/lib/ticket-notifications'
import { runFollowUp } from '@/lib/ticket-triage'
import { checkRateLimit, clientKeyFromRequest } from '@/lib/rate-limit'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id: token } = await context.params
    const supabase = createClient()

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*, ticket_messages(*)')
      .eq('token', token)
      .single()

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Sort messages chronologically
    if (ticket.ticket_messages) {
      ticket.ticket_messages.sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }

    return NextResponse.json(ticket)
  } catch (err) {
    console.error('Ticket fetch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  // Rate limit: 30 replies per IP per hour. Catches runaway loops without
  // blocking a real back-and-forth conversation.
  const rl = checkRateLimit(`reply:${clientKeyFromRequest(req)}`, 30, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many replies — retry in ${rl.retryAfterSeconds}s` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  try {
    const { id: token } = await context.params
    const data = await req.json()
    const { sender_name, message } = data

    // Validate required fields
    if (!sender_name || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Token-based access is *always* a client reply. Admin/AI messages go
    // through their own authenticated routes — we never trust sender_type
    // from a public token caller.
    const sender_type = 'client' as const

    const supabase = createClient()

    // Look up the ticket by token to get the internal id
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, token, status, name, email, subject, human_took_over, ai_handled')
      .eq('token', token)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Prevent messaging on closed/resolved tickets
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return NextResponse.json(
        { error: 'Cannot reply to a closed or resolved ticket' },
        { status: 400 }
      )
    }

    // Insert the message
    const { data: newMessage, error: msgError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_type,
        sender_name,
        message,
      })
      .select()
      .single()

    if (msgError) {
      console.error('Message insert error:', msgError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    await supabase.from('tickets').update({
      updated_at: new Date().toISOString(),
      // Re-open if the client replies on a ticket that the AI already moved
      // to in_progress — the conversation is alive again.
      status: 'in_progress',
    }).eq('id', ticket.id)

    if (ticket.human_took_over) {
      // Notify Mark directly when a client replies on a ticket he's already
      // handling. Use the existing reply-notification template addressed to
      // support@.
      notifyClientNewReply(
        { clientName: 'Mark Polanco', clientEmail: 'support@connectex.net', subject: `Client reply: ${ticket.subject}`, token: ticket.token },
        message,
        ticket.name
      ).catch(() => {})
    } else if (ticket.ai_handled) {
      // Fire-and-forget AI follow-up. The AI either replies (status stays
      // in_progress) or escalates to Mark.
      runFollowUp(ticket.id).catch((err) => console.error('Follow-up failed:', err))
    }

    return NextResponse.json(newMessage, { status: 201 })
  } catch (err) {
    console.error('Message creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
