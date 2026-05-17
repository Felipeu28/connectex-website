// Converts a Connectex AI chat transcript into a real ticket. Called from
// the chat panel when the user clicks "Open a ticket with this conversation."
// The transcript is included in the ticket description so Mark sees the full
// context without the user having to retype.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notifyClientTicketCreated } from '@/lib/ticket-notifications'
import { runTriage } from '@/lib/ticket-triage'
import { checkRateLimit, clientKeyFromRequest } from '@/lib/rate-limit'

interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function formatTranscript(messages: ChatMessage[]): { subject: string; body: string } {
  const firstUserMsg = messages.find((m) => m.role === 'user')?.content ?? 'Help request'
  const subject = firstUserMsg.split('\n')[0].slice(0, 90)
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Me' : 'AI Assistant'}: ${m.content.trim()}`)
    .join('\n\n')
  const body = `[Escalated from AI chat — the AI couldn't resolve this]\n\nTranscript:\n\n${transcript}`
  return { subject, body }
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`escalate:${clientKeyFromRequest(req)}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many escalations — please use the standard ticket form below.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  try {
    const { name, email, company, messages } = (await req.json()) as {
      name?: string
      email?: string
      company?: string
      messages?: ChatMessage[]
    }

    if (!name || !email || !messages || messages.length === 0) {
      return NextResponse.json({ error: 'name, email, and messages are required' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (messages.length > 50) {
      return NextResponse.json({ error: 'Conversation too long to escalate — please open a fresh ticket' }, { status: 400 })
    }

    const { subject, body } = formatTranscript(messages)
    const supabase = getSupabaseAdmin()

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        name,
        email,
        company: company || null,
        subject,
        description: body,
        priority: 'medium',
      })
      .select('id, token')
      .single()

    if (error || !ticket) {
      console.error('Escalation insert error:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    notifyClientTicketCreated({
      clientName: name,
      clientEmail: email,
      subject,
      token: ticket.token,
    }).catch(() => {})

    // Fire-and-forget triage. Most escalated chats will route straight to Mark
    // (the user already failed to get help from the AI), but triage might
    // still resolve it if it has access to KB docs the chat didn't surface.
    runTriage(ticket.id).catch((err) => console.error('Triage failed:', err))

    return NextResponse.json({ token: ticket.token }, { status: 201 })
  } catch (err) {
    console.error('Escalation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
