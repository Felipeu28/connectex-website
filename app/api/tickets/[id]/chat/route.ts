// AI chat endpoint — called by PortalTicketThread on every client message.
// Saves the client message, calls Gemini with full conversation context,
// saves AI response, and routes to Mark if confidence is too low.

import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/ticket-triage'
import { callGeminiJSON, GEMINI_FLASH, type GeminiPart } from '@/lib/gemini'
import { notifyClientNewReply } from '@/lib/ticket-notifications'
import { readFileSync } from 'fs'
import { join } from 'path'

const ROUTE_THRESHOLD = 65  // Confidence below this → route to Mark

type TicketCategory = 'verizon' | 'microsoft365' | 'ucaas' | 'general'

// Keyword detection (mirrors lib/ticket-triage.ts)
const CATEGORY_KEYWORDS: Record<TicketCategory, string[]> = {
  verizon: [
    'verizon', 'jetpack', 'mifi', 'hotspot', 'cellular', 'lte', '5g', '4g',
    'sim', 'data plan', 'mobile', 'phone plan', 'smartphone', 'iphone', 'samsung',
    'galaxy', 'pixel', 'apn', 'signal', 'fios', 'verizon router', 'one talk',
    'polycom', 'yealink', 'desk phone', 'no dial tone', 'not registered', 'vzw',
    'network extender', 'fixed wireless', 'g3100', 'cr1000', 'ont box',
  ],
  microsoft365: [
    'microsoft', 'office 365', 'microsoft 365', 'outlook', 'teams', 'onedrive',
    'sharepoint', 'excel', 'word', 'powerpoint', 'exchange', 'email',
    'mfa', 'multi-factor', 'authenticator', 'azure', 'entra', 'm365', 'o365',
  ],
  ucaas: [
    'voip', 'phone system', 'ringcentral', 'dial tone', 'softphone', 'sip', 'pbx',
    'extension', 'voicemail', 'call forwarding', 'auto attendant', 'hunt group',
    'teams phone', 'calling plan', 'ucaas', 'cloud phone', 'ivr',
    'calls dropping', 'one way audio', 'choppy audio', 'echo on call',
  ],
  general: [],
}

function detectCategory(subject: string, description: string): TicketCategory[] {
  const text = `${subject} ${description}`.toLowerCase()
  const matched: TicketCategory[] = []
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [TicketCategory, string[]][]) {
    if (cat === 'general') continue
    if (keywords.some((kw) => text.includes(kw))) matched.push(cat)
  }
  return matched.length > 0 ? matched : ['general']
}

function loadKnowledge(categories: TicketCategory[]): string {
  const dir = join(process.cwd(), 'lib', 'knowledge')
  const files: Record<TicketCategory, string> = {
    verizon: 'verizon-devices.md',
    microsoft365: 'microsoft365.md',
    ucaas: 'ucaas-voip.md',
    general: '',
  }
  const sections: string[] = []
  for (const cat of categories) {
    const filename = files[cat]
    if (!filename) continue
    try { sections.push(readFileSync(join(dir, filename), 'utf-8')) } catch { /* skip */ }
  }
  return sections.join('\n\n---\n\n')
}

async function loadDynamicKnowledge(
  admin: ReturnType<typeof getSupabaseAdmin>,
  categories: TicketCategory[]
): Promise<string> {
  try {
    const { data } = await admin
      .from('kb_documents')
      .select('title, content')
      .in('category', categories)
      .not('content', 'is', null)
    if (!data || data.length === 0) return ''
    return data
      .map((doc: { title: string; content: string }) => `## ${doc.title}\n${doc.content}`)
      .join('\n\n---\n\n')
  } catch {
    return ''
  }
}

function buildChatSystemPrompt(knowledge: string, isFollowUp: boolean): string {
  const base = `You are an expert IT support assistant for Connectex Solutions, an Austin-based vendor-neutral technology advisor. You work alongside Mark, who has 20+ years of IT and telecom experience.

${isFollowUp ? 'You are CONTINUING an existing support conversation. The full history is provided below. Respond to the latest client message in context.' : 'A client has submitted a new support ticket. Review it and respond helpfully.'}

## Your Role
- Resolve IT issues autonomously when you have the knowledge and confidence
- Route to Mark when issues require account access, billing, contracts, or specialized expertise
- Be direct, use numbered steps, reference exact product names and menu paths

## Confidence Scoring (0-100)
- 90-100: Exact solution in knowledge base → handle it
- 70-89: Good guidance available, steps may vary → handle it, flag uncertainty
- 50-69: Partial coverage → help what you can, flag for Mark
- 0-49: Outside knowledge base or needs portal/account access → route to Mark

## Always Route to Mark (confidence = 0 regardless of knowledge)
- Adding/removing lines, upgrading devices
- Billing disputes, contract changes, account modifications
- MDM policy changes (not enrollment guidance)
- Number porting
- Suspected security incidents or breaches
- Multi-site infrastructure design
- Anything requiring Verizon Business Center, Microsoft Admin Center (admin tasks), or vendor portal access on behalf of client

## Response Rules
- Be warm but efficient — "Here's how to fix it:" not "I would suggest..."
- Use numbered steps with exact UI paths (e.g., Settings → Cellular → Cellular Data Options → APN)
- Max 350 words in your response
- If you cannot resolve: say exactly "I'm going to connect you with Mark who can help with this." then briefly explain why in 1 sentence
- NEVER make up steps or settings you're not certain about

## Response Format (JSON only, no markdown wrapper)
{
  "response": "your full response to the client",
  "confidence": 0-100,
  "can_handle": true/false,
  "category": "verizon|microsoft365|ucaas|general",
  "route_reason": "brief reason if routing to Mark, null if handling"
}${knowledge ? `\n\n## Knowledge Base\n${knowledge}` : ''}`

  return base
}

interface AIResult {
  response: string
  confidence: number
  can_handle: boolean
  category: string
  route_reason: string | null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: token } = await params

  const body = await request.json().catch(() => null)
  if (!body?.message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const { message, sender_name } = body as { message: string; sender_name?: string }
  const admin = getSupabaseAdmin()

  // Load ticket
  const { data: ticket, error: ticketError } = await admin
    .from('tickets')
    .select('*')
    .eq('token', token)
    .single()

  if (ticketError || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  if (['closed', 'resolved'].includes(ticket.status)) {
    return NextResponse.json({ error: 'Ticket is closed' }, { status: 400 })
  }

  // Save client message first
  const clientName = sender_name || ticket.name
  const { data: clientMsg } = await admin
    .from('ticket_messages')
    .insert({
      ticket_id: ticket.id,
      sender_type: 'client',
      sender_name: clientName,
      message: message.trim(),
    })
    .select()
    .single()

  // Update ticket timestamp
  await admin
    .from('tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticket.id)

  // If human has taken over, skip AI entirely
  if (ticket.human_took_over) {
    return NextResponse.json({ ok: true, ai_skipped: true, reason: 'human_took_over' })
  }

  // If already routed to Mark and no new escalation needed, skip AI
  // (AI can still help with follow-ups, but we let it try)

  // Load conversation history
  const { data: history } = await admin
    .from('ticket_messages')
    .select('sender_type, sender_name, message, created_at')
    .eq('ticket_id', ticket.id)
    .order('created_at', { ascending: true })

  // Load client device inventory (pre-load for contextual AI answers)
  const clientDeviceContext = await (async () => {
    try {
      const { data: products } = await admin
        .from('client_products')
        .select('device_type, manufacturer, model, serial_number, notes')
        .eq('client_email', ticket.email.toLowerCase().trim())
      if (!products || products.length === 0) return ''
      const lines = products.map((p: { device_type: string; manufacturer: string | null; model: string; serial_number: string | null; notes: string | null }) =>
        `- ${p.device_type}: ${p.manufacturer ? `${p.manufacturer} ` : ''}${p.model}${p.serial_number ? ` (S/N: ${p.serial_number})` : ''}${p.notes ? ` — ${p.notes}` : ''}`
      )
      return `## Client Devices on File\n${lines.join('\n')}`
    } catch {
      return ''
    }
  })()

  // Detect category and load knowledge
  const categories = detectCategory(ticket.subject, ticket.description)
  const staticKnowledge = loadKnowledge(categories)
  const dynamicKnowledge = await loadDynamicKnowledge(admin, categories)
  const knowledge = [staticKnowledge, dynamicKnowledge, clientDeviceContext].filter(Boolean).join('\n\n---\n\n')

  // Build conversation history string for context
  const historyMessages = (history ?? [])
    .filter((m: { created_at: string }) => {
      // Exclude the message we just inserted (avoid double-sending)
      return clientMsg ? m.created_at !== clientMsg.created_at : true
    })
    .map((m: { sender_type: string; sender_name: string; message: string }) => {
      const role = m.sender_type === 'client' ? 'Client' : m.sender_type === 'ai' ? 'AI Support' : 'Mark'
      return `[${role}]: ${m.message}`
    })
    .join('\n\n')

  const isFollowUp = (history?.length ?? 0) > 1

  // Build Gemini prompt
  const parts: GeminiPart[] = []

  if (historyMessages) {
    parts.push({ text: `## Previous conversation:\n${historyMessages}\n\n---` })
  }

  parts.push({
    text: `## Current message from ${clientName}:\n${message.trim()}\n\n## Ticket context:\nSubject: ${ticket.subject}\nOriginal description: ${ticket.description}`,
  })

  // Call Gemini
  const aiResult = await callGeminiJSON<AIResult>({
    model: GEMINI_FLASH,
    systemInstruction: buildChatSystemPrompt(knowledge, isFollowUp),
    parts,
    maxOutputTokens: 700,
    temperature: 0.35,
  })

  if (!aiResult || !aiResult.response) {
    // Gemini failed — route to Mark silently
    await admin.from('tickets').update({
      routed_to_mark: true,
      updated_at: new Date().toISOString(),
    }).eq('id', ticket.id)
    return NextResponse.json({ ok: true, ai_skipped: true, reason: 'gemini_unavailable' })
  }

  const confidence = aiResult.confidence ?? 0
  const canHandle = aiResult.can_handle && confidence >= ROUTE_THRESHOLD

  // Save AI response
  await admin.from('ticket_messages').insert({
    ticket_id: ticket.id,
    sender_type: 'ai',
    sender_name: 'Connectex AI Support',
    message: aiResult.response,
  })

  // Update ticket fields
  await admin.from('tickets').update({
    ai_confidence: confidence,
    ai_category: aiResult.category ?? categories[0],
    ai_handled: canHandle,
    routed_to_mark: !canHandle,
    status: ticket.status === 'open' ? 'in_progress' : ticket.status,
    updated_at: new Date().toISOString(),
  }).eq('id', ticket.id)

  // Notify client via email when AI responds (non-blocking)
  notifyClientNewReply(
    { clientName: ticket.name, clientEmail: ticket.email, subject: ticket.subject, token: ticket.token },
    aiResult.response.slice(0, 300),
    'Connectex AI Support'
  ).catch(() => {})

  // Route to Mark if AI can't fully handle
  if (!canHandle && !ticket.routed_to_mark) {
    // Notify Mark via email (reusing triage notification pattern)
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://connectex-website.vercel.app').trim()
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: 'Connectex Support <support@connectex.net>',
          to: ['support@connectex.net'],
          subject: `[FOLLOW-UP] Client needs your help: ${ticket.subject}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0F1B2D; color: #E8EAED; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #8B2BE2, #4B6CF7); padding: 24px;">
                <h1 style="margin: 0; font-size: 20px; color: white;">Client Needs Your Help</h1>
                <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">AI confidence was ${confidence}% — below the ${ROUTE_THRESHOLD}% threshold</p>
              </div>
              <div style="padding: 24px;">
                <p style="margin: 0 0 16px;"><strong>Ticket:</strong> ${ticket.subject}</p>
                <p style="margin: 0 0 16px;"><strong>Client:</strong> ${ticket.name} &lt;${ticket.email}&gt;</p>
                <p style="margin: 0 0 16px;"><strong>AI routing reason:</strong> ${aiResult.route_reason ?? 'Low confidence'}</p>
                <p style="margin: 0 0 16px;"><strong>Client's latest message:</strong><br>${message}</p>
                <div style="margin-top: 20px; display: flex; gap: 12px;">
                  <a href="${siteUrl}/crm/tickets/${ticket.id}" style="background: #8B2BE2; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Open in CRM</a>
                  <a href="${siteUrl}/portal/tickets/${ticket.token}" style="background: rgba(255,255,255,0.1); color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Client View</a>
                </div>
              </div>
            </div>
          `,
        }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, confidence, can_handle: canHandle })
}
