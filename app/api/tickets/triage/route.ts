import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ─── Category detection ──────────────────────────────────────────────────────

type TicketCategory = 'verizon' | 'microsoft365' | 'ucaas' | 'general'

const CATEGORY_KEYWORDS: Record<TicketCategory, string[]> = {
  verizon: [
    'verizon', 'jetpack', 'mifi', 'hotspot', 'cellular', 'lte', '5g', '4g',
    'sim', 'data plan', 'mobile', 'phone plan', 'smartphone', 'iphone', 'samsung',
    'galaxy', 'pixel', 'apn', 'signal', 'network bars', 'mobile data', 'roaming',
    'business internet', 'fios', 'verizon router', 'one talk', 'mdm', 'bmm',
    'device management', 'knox', 'corporate phone', 'company phone',
  ],
  microsoft365: [
    'microsoft', 'office 365', 'microsoft 365', 'outlook', 'teams', 'onedrive',
    'sharepoint', 'excel', 'word', 'powerpoint', 'onenote', 'exchange', 'email',
    'calendar sync', 'mfa', 'multi-factor', 'authenticator', 'azure', 'entra',
    'office app', 'licensing', 'admin center', 'm365', 'o365',
  ],
  ucaas: [
    'voip', 'phone system', 'ringcentral', 'dial tone', 'desk phone', 'softphone',
    'sip', 'pbx', 'extension', 'voicemail', 'call forwarding', 'auto attendant',
    'hunt group', 'teams phone', 'calling plan', 'business phone', 'polycom',
    'yealink', 'one talk', 'ucaas', 'cloud phone', 'virtual phone', 'ivr',
    'no dial tone', 'can\'t make calls', 'calls dropping',
  ],
  general: [],
}

function detectCategory(subject: string, description: string): TicketCategory[] {
  const text = `${subject} ${description}`.toLowerCase()
  const matched: TicketCategory[] = []

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [TicketCategory, string[]][]) {
    if (category === 'general') continue
    if (keywords.some((kw) => text.includes(kw))) {
      matched.push(category)
    }
  }

  return matched.length > 0 ? matched : ['general']
}

// ─── Knowledge base loading ──────────────────────────────────────────────────

function loadKnowledge(categories: TicketCategory[]): string {
  const knowledgeDir = join(process.cwd(), 'lib', 'knowledge')
  const files: Record<TicketCategory, string> = {
    verizon: 'verizon-devices.md',
    microsoft365: 'microsoft365.md',
    ucaas: 'ucaas-voip.md',
    general: '',
  }

  const sections: string[] = []

  for (const category of categories) {
    const filename = files[category]
    if (!filename) continue
    try {
      const content = readFileSync(join(knowledgeDir, filename), 'utf-8')
      sections.push(content)
    } catch {
      // file not found — skip silently
    }
  }

  return sections.join('\n\n---\n\n')
}

// ─── System prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(knowledgeContext: string): string {
  const basePrompt = `You are an expert IT support assistant for ConnectEx Solutions, a vendor-neutral technology advisor for SMBs in Austin, TX. You represent Mark, a 20+ year technology veteran.

Your job: triage IT support tickets using the knowledge base provided. Be specific, use exact steps, and reference real product names and settings.

## Confidence Scoring
Rate your confidence 0–100:
- 90–100: You have exact steps in the knowledge base. AI handles it.
- 70–89: You can help with general guidance but steps may vary by exact model/version. AI handles it, flags uncertainty.
- 50–69: Partially covered. Provide what you can, route to Mark for the rest.
- 0–49: Outside knowledge base or requires account/portal access. Route to Mark.

## Automation Rules
**You CAN fully resolve:**
- Device setup, APN configuration, network settings
- App login issues, password resets (with steps)
- Email sync problems, calendar issues
- Hotspot/MiFi connectivity
- VoIP call quality, desk phone registration
- Microsoft 365 common errors
- Wi-Fi and general connectivity troubleshooting

**Always route to Mark:**
- Adding/removing lines or upgrading devices (sales action)
- Contract, billing disputes, or account changes
- MDM policy configuration (not just enrollment)
- Number porting
- Security incidents or suspected breaches
- Multi-site infrastructure setup
- Anything requiring Verizon Business Center or vendor portal admin access

## Response Style
- Be direct and friendly. "Here's how to fix this:" not "I would suggest..."
- Use numbered steps, specific settings paths (e.g., Settings → Cellular → APN)
- Include model-specific details when relevant
- If routing to Mark, explain WHY briefly and what Mark will do
- Maximum 400 words in auto_response`

  if (knowledgeContext) {
    return `${basePrompt}

## Knowledge Base
${knowledgeContext}`
  }

  return basePrompt
}

// ─── Route handler ───────────────────────────────────────────────────────────

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

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticket_id)
      .single()

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (ticket.ai_handled || ticket.routed_to_mark) {
      return NextResponse.json({ skipped: true })
    }

    // Detect categories and load relevant knowledge
    const categories = detectCategory(ticket.subject, ticket.description)
    const knowledgeContext = loadKnowledge(categories)
    const systemPrompt = buildSystemPrompt(knowledgeContext)

    const textPrompt = `Ticket subject: ${ticket.subject}
Issue description: ${ticket.description}
Priority: ${ticket.priority}
${ticket.company ? `Company: ${ticket.company}` : ''}
Detected categories: ${categories.join(', ')}
${ticket.image_url ? 'An attachment/screenshot has been included — analyze it for additional context (error messages, device state, UI issues visible in the image).' : ''}

Analyze this ticket and respond with ONLY valid JSON in this exact format:
{
  "can_handle": true or false,
  "confidence": 0-100,
  "category": "verizon" | "microsoft365" | "ucaas" | "general",
  "auto_response": "the message to send to the client (friendly, professional, specific steps)",
  "priority_override": "low" | "medium" | "high" | "urgent" | null,
  "routing_reason": "one sentence for Mark explaining why this needs him (only if can_handle is false)"
}`

    // Build message content — include image if present
    type ContentBlock =
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
      | { type: 'image'; source: { type: 'url'; url: string } }

    const userContent: ContentBlock[] = []

    if (ticket.image_url) {
      try {
        // Fetch image and convert to base64 for Claude Vision
        const imgRes = await fetch(ticket.image_url)
        if (imgRes.ok) {
          const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
          const mediaType = allowedTypes.includes(contentType) ? contentType : 'image/jpeg'
          const buffer = await imgRes.arrayBuffer()
          const base64 = Buffer.from(buffer).toString('base64')
          userContent.push({
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          })
        }
      } catch {
        // Image fetch failed — continue with text only
      }
    }

    userContent.push({ type: 'text', text: textPrompt })

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    })

    if (!res.ok) {
      console.error('Anthropic API error:', await res.text())
      return NextResponse.json({ error: 'AI triage failed' }, { status: 502 })
    }

    const aiData = await res.json()
    const text = aiData.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error('Failed to parse AI response:', text)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    const triage = JSON.parse(jsonMatch[0]) as {
      can_handle: boolean
      confidence: number
      category: string
      auto_response: string
      priority_override: string | null
      routing_reason: string
    }

    // If confidence < 60, always route to Mark even if AI thinks it can handle it
    const shouldHandle = triage.can_handle && triage.confidence >= 60

    const now = new Date().toISOString()

    const ticketUpdate: Record<string, unknown> = {
      ai_response: triage.auto_response,
      ai_handled: shouldHandle,
      routed_to_mark: !shouldHandle,
      updated_at: now,
    }
    if (triage.priority_override) {
      ticketUpdate.priority = triage.priority_override
    }

    await supabase.from('tickets').update(ticketUpdate).eq('id', ticket_id)

    if (shouldHandle) {
      await supabase.from('ticket_messages').insert({
        ticket_id,
        sender_type: 'admin',
        sender_name: 'ConnectEx AI Support',
        message: triage.auto_response,
      })

      await supabase
        .from('tickets')
        .update({ status: 'in_progress', updated_at: now })
        .eq('id', ticket_id)
        .eq('status', 'open')
    }

    if (ticket.contact_id) {
      await supabase.from('crm_activity').insert({
        type: 'ticket',
        contact_id: ticket.contact_id,
        description: shouldHandle
          ? `AI resolved ticket [${triage.category}]: "${ticket.subject}" (confidence: ${triage.confidence}%)`
          : `Ticket routed to Mark [${triage.category}]: "${ticket.subject}" — ${triage.routing_reason}`,
        metadata: {
          ticket_id,
          category: triage.category,
          confidence: triage.confidence,
          ai_handled: shouldHandle,
          routing_reason: triage.routing_reason ?? null,
        },
      })
    }

    // Notify Mark via email when AI can't handle it
    if (!shouldHandle) {
      const resendKey = process.env.RESEND_API_KEY
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://connectex-website.vercel.app'
      if (resendKey) {
        const priorityLabel = triage.priority_override ?? ticket.priority
        const priorityColor: Record<string, string> = {
          urgent: '#FF6B6B', high: '#F59E0B', medium: '#60A5FA', low: '#94A3B8',
        }
        const color = priorityColor[priorityLabel] ?? '#94A3B8'
        const ticketUrl = `${siteUrl}/crm/tickets/${ticket_id}`
        const clientUrl = `${siteUrl}/ticketing/${ticket.token}`

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'ConnectEx Support <support@connectex.net>',
            to: ['mark@connectex.net'],
            subject: `[${priorityLabel.toUpperCase()}] New ticket needs your attention: ${ticket.subject}`,
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0F1B2D; color: #E8EAED; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #8B2BE2, #4B6CF7, #00C9A7); padding: 24px;">
                  <h1 style="margin: 0; font-size: 20px; color: white;">New Support Ticket</h1>
                  <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">AI routed this to you — needs your expertise</p>
                </div>
                <div style="padding: 24px; space-y: 16px;">
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr><td style="padding: 8px 0; color: #94A3B8; font-size: 13px; width: 120px;">Subject</td><td style="padding: 8px 0; font-weight: 600;">${ticket.subject}</td></tr>
                    <tr><td style="padding: 8px 0; color: #94A3B8; font-size: 13px;">From</td><td style="padding: 8px 0;">${ticket.name} &lt;${ticket.email}&gt;${ticket.company ? ` · ${ticket.company}` : ''}</td></tr>
                    <tr><td style="padding: 8px 0; color: #94A3B8; font-size: 13px;">Priority</td><td style="padding: 8px 0;"><span style="background: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600;">${priorityLabel.toUpperCase()}</span></td></tr>
                    <tr><td style="padding: 8px 0; color: #94A3B8; font-size: 13px;">Category</td><td style="padding: 8px 0;">${triage.category}</td></tr>
                    <tr><td style="padding: 8px 0; color: #94A3B8; font-size: 13px;">Why AI routed</td><td style="padding: 8px 0; color: #F59E0B;">${triage.routing_reason}</td></tr>
                  </table>
                  <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <p style="margin: 0 0 8px; font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em;">Description</p>
                    <p style="margin: 0; font-size: 14px; white-space: pre-wrap;">${ticket.description}</p>
                  </div>
                  ${ticket.image_url ? `<div style="margin-bottom: 20px;"><p style="margin: 0 0 8px; font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em;">Attachment</p><img src="${ticket.image_url}" style="max-width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" alt="Ticket attachment" /></div>` : ''}
                  <div style="display: flex; gap: 12px;">
                    <a href="${ticketUrl}" style="display: inline-block; background: #00C9A7; color: #0F1B2D; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">Open in CRM</a>
                    <a href="${clientUrl}" style="display: inline-block; background: rgba(255,255,255,0.08); color: #E8EAED; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">Client View</a>
                  </div>
                </div>
              </div>
            `,
          }),
        }).catch((err) => console.error('Mark notification email failed:', err))
      }
    }

    return NextResponse.json({
      can_handle: shouldHandle,
      confidence: triage.confidence,
      category: triage.category,
      priority_override: triage.priority_override,
      routing_reason: triage.routing_reason ?? null,
    })
  } catch (err) {
    console.error('Triage error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
