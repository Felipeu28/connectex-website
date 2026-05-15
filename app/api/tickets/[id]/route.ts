import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * Public ticket conversation endpoint.
 *
 * GET  /api/tickets/[token]  — fetch a ticket + its message thread by token.
 * POST /api/tickets/[token]  — the client posts a reply on their own ticket.
 *
 * SECURITY: the POST handler always inserts the message with
 * `sender_type = 'client'` regardless of what the request body says. Admin
 * replies must go through the addTicketMessage server action which is gated
 * by proxy.ts.
 */

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id: token } = await context.params
    const supabase = createClient()
    const { data: ticket, error } = await supabase.from('tickets').select('*, ticket_messages(*)').eq('token', token).single()
    if (error || !ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    if (ticket.ticket_messages) {
      ticket.ticket_messages.sort((a: { created_at: string }, b: { created_at: string }) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
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
    const { sender_name, message } = data
    if (!sender_name || !message) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    const supabase = createClient()
    const { data: ticket, error: ticketError } = await supabase.from('tickets').select('id, token, status').eq('token', token).single()
    if (ticketError || !ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return NextResponse.json({ error: 'Cannot reply to a closed or resolved ticket' }, { status: 400 })
    }
    const { data: newMessage, error: msgError } = await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_type: 'client',
      sender_name,
      message,
    }).select().single()
    if (msgError) {
      console.error('Message insert error:', msgError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }
    await supabase.from('tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticket.id)
    return NextResponse.json(newMessage, { status: 201 })
  } catch (err) {
    console.error('Message creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
