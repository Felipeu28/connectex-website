import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON, GEMINI_FLASH } from '@/lib/gemini'
import { requireAdmin } from '@/lib/auth-guard'

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 503 })
  }

  try {
    const { prompt, contactContext } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    let contextSection = ''
    if (contactContext) {
      const { name, company, stage, notes, recentActivity } = contactContext
      contextSection = `\n\nCONTACT CONTEXT:\n- Name: ${name ?? 'Unknown'}${company ? `\n- Company: ${company}` : ''}${stage ? `\n- Pipeline stage: ${stage}` : ''}${notes ? `\n- Contact notes: ${notes}` : ''}`
      if (recentActivity?.length) {
        contextSection += '\n\nRECENT ACTIVITY LOG:\n'
        contextSection += recentActivity
          .slice(0, 10)
          .map((a: { type: string; description: string; created_at: string }) =>
            `- [${a.type}] ${a.description} (${new Date(a.created_at).toLocaleDateString()})`
          )
          .join('\n')
      }
    }

    const systemInstruction = `You are writing emails for Mark at Connectex Solutions, a vendor-neutral technology advisor in Austin, TX who helps SMBs find IT, cybersecurity, cloud, and communications solutions from 600+ providers.

Mark's tone: warm, direct, personal. Never salesy. Short emails win. Always a clear CTA.
Rules:
- Under 200 words
- Use {{name}} for recipient's first name
- No emojis
- End with: "Best,\\nMark\\nConnectex Solutions\\n(512) 555-0100"
- Return ONLY valid JSON: {"subject": "...", "body": "..."}`

    const userPrompt = `Task: ${prompt}${contextSection}

Use the contact context above to make this email feel like Mark wrote it personally after their interactions. Reference specific details from the activity log if relevant.`

    const result = await callGeminiJSON<{ subject: string; body: string }>({
      model: GEMINI_FLASH,
      systemInstruction,
      parts: [{ text: userPrompt }],
      maxOutputTokens: 1024,
    })

    if (!result.ok) {
      // Map Gemini's failure kind to an HTTP status the client can act on.
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
  } catch (err) {
    console.error('AI generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
