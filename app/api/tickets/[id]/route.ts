import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

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
  try {
    const { id: token } = await context.params
    const data = await req.json()
    const { sender_type, sender_name, message } = data

    // Validate required fields
    if (!sender_type || !sender_name || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate sender_type
    if (!['client', 'admin'].includes(sender_type)) {
      return NextResponse.json({ error: 'Invalid sender type' }, { status: 400 })
    }

    const supabase = createClient()

    // Look up the ticket by token to get the internal id
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, status')
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

    // Update the ticket's updated_at timestamp
    await supabase
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticket.id)

    return NextResponse.json(newMessage, { status: 201 })
  } catch (err) {
    console.error('Message creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
