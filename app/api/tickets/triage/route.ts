import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const SYSTEM_PROMPT = `You are an expert IT support assistant for ConnectEx Solutions, a vendor-neutral technology advisor serving SMBs in Austin, TX.

Your job is to triage IT support tickets. For each ticket, you must:
1. Determine if you can resolve it with clear, actionable troubleshooting steps (no specialized access or on-site visit needed)
2. If yes: write a helpful, friendly response with step-by-step instructions
3. If no: escalate to Mark (the human advisor) with a brief reason

You CAN handle:
- Password resets / account lockouts (provide self-service steps)
- Email setup issues (Outlook, Gmail, mobile)
- VPN connection problems
- Wi-Fi and network connectivity troubleshooting
- Printer setup and driver issues
- Common software errors and crashes
- Slow computer performance tips
- Basic cybersecurity questions (phishing, MFA setup)
- Microsoft 365 / Google Workspace common issues
- Browser issues, extensions, cache clearing

You CANNOT handle (escalate to Mark):
- Hardware failures requiring physical repair
- Server infrastructure issues
- Custom software / proprietary line-of-business applications
- Network infrastructure configuration
- Data recovery from failed drives
- Security incidents / active breaches
- Billing and account changes with vendors
- Anything requiring vendor portal access

Response format — return ONLY valid JSON:
{
  "can_handle": true/false,
  "auto_response": "...",  // the message to send to the client (friendly, professional, under 400 words)
  "priority_override": "low"|"medium"|"high"|"urgent"|null,  // null = keep original
  "routing_reason": "..."  // brief internal note for Mark (1 sentence)
}`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 503 })
  }

  try {
    const { ticket_id } = await req.json()
    if (!ticket_id) {
      return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Fetch ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticket_id)
      .single()

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Skip if already triaged
    if (ticket.ai_handled || ticket.routed_to_mark) {
      return NextResponse.json({ skipped: true })
    }

    const userPrompt = `Ticket subject: ${ticket.subject}
Issue description: ${ticket.description}
Priority: ${ticket.priority}
${ticket.company ? `Company: ${ticket.company}` : ''}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'AI triage failed' }, { status: 502 })
    }

    const aiData = await res.json()
    const text = aiData.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    const triage = JSON.parse(jsonMatch[0]) as {
      can_handle: boolean
      auto_response: string
      priority_override: string | null
      routing_reason: string
    }

    const now = new Date().toISOString()

    // Update ticket with triage results
    const ticketUpdate: Record<string, unknown> = {
      ai_response: triage.auto_response,
      ai_handled: triage.can_handle,
      routed_to_mark: !triage.can_handle,
      updated_at: now,
    }
    if (triage.priority_override) {
      ticketUpdate.priority = triage.priority_override
    }

    await supabase.from('tickets').update(ticketUpdate).eq('id', ticket_id)

    // If AI can handle it, post the response as a ticket message
    if (triage.can_handle) {
      await supabase.from('ticket_messages').insert({
        ticket_id,
        sender_type: 'admin',
        sender_name: 'ConnectEx AI Support',
        message: triage.auto_response,
      })

      // Mark as in_progress since we've responded
      await supabase
        .from('tickets')
        .update({ status: 'in_progress', updated_at: now })
        .eq('id', ticket_id)
        .eq('status', 'open') // only if still open
    }

    // Log to CRM activity if linked to a contact
    if (ticket.contact_id) {
      await supabase.from('crm_activity').insert({
        type: 'ticket',
        contact_id: ticket.contact_id,
        description: triage.can_handle
          ? `AI auto-responded to ticket: "${ticket.subject}"`
          : `Ticket routed to Mark: "${ticket.subject}" — ${triage.routing_reason}`,
        metadata: { ticket_id, ai_handled: triage.can_handle, routing_reason: triage.routing_reason },
      })
    }

    return NextResponse.json({
      can_handle: triage.can_handle,
      priority_override: triage.priority_override,
      routing_reason: triage.routing_reason,
    })
  } catch (err) {
    console.error('Triage error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
