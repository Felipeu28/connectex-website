import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON, GEMINI_PRO } from '@/lib/gemini'
import { requireAdmin } from '@/lib/auth-guard'
import { getSupabaseAdmin } from '@/lib/ticket-triage'

export async function GET() {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('crm_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('Campaigns GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { action, prompt, documentContext } = body

    // ── Save/create a campaign draft ─────────────────────────────────────────
    if (action === 'save' || (!action && body.name)) {
      const { id, name, subject, body: emailBody, status } = body
      if (!name?.trim() || !subject?.trim() || !emailBody?.trim()) {
        return NextResponse.json({ error: 'name, subject, body required' }, { status: 400 })
      }
      const admin = getSupabaseAdmin()
      const payload = {
        name: name.trim(),
        subject: subject.trim(),
        body: emailBody.trim(),
        status: status ?? 'draft',
        updated_at: new Date().toISOString(),
      }
      if (id) {
        const { data, error } = await admin
          .from('crm_campaigns')
          .update(payload)
          .eq('id', id)
          .select('*')
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
      } else {
        const { data, error } = await admin
          .from('crm_campaigns')
          .insert(payload)
          .select('*')
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
      }
    }

    if (action === 'delete') {
      if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
      const admin = getSupabaseAdmin()
      const { error } = await admin.from('crm_campaigns').delete().eq('id', body.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (action === 'generate') {
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
          { error: 'AI generation not configured. Set GEMINI_API_KEY in environment.' },
          { status: 503 }
        )
      }

      const docSection = documentContext?.trim()
        ? `\n\n## Reference Document\nUse the content below as the source material for the email — extract key benefits, features, or talking points from it:\n\n${documentContext.slice(0, 6000)}`
        : ''

      const result = await callGeminiJSON<{ name: string; subject: string; body: string }>({
        model: GEMINI_PRO,
        systemInstruction: `You are writing sales emails for Connectex Solutions, a vendor-neutral technology advisor in Austin, TX. The sender is Mark, who helps SMBs source IT, cybersecurity, cloud, and communications solutions from 600+ providers. Write professional, warm, and concise emails. Return ONLY valid JSON.`,
        parts: [{ text: `Write a sales email based on this brief: ${prompt}${docSection}

Rules:
- Under 250 words
- Conversational but professional tone
- Clear CTA
- Use {{name}} for recipient name placeholder
- No emojis
- End with Mark's signature

Return ONLY a JSON object:
{"name": "short campaign name for internal use", "subject": "email subject under 60 chars", "body": "full email body"}` }],
        maxOutputTokens: 1024,
        temperature: 0.5,
      })

      if (!result.ok) {
        const status =
          result.failureKind === 'no_key' ? 503 :
          result.failureKind === 'blocked' ? 422 :
          502
        return NextResponse.json(
          { error: result.error, failureKind: result.failureKind },
          { status }
        )
      }

      return NextResponse.json(result.data)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('Campaign API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
