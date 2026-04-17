import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON, GEMINI_PRO } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { action, prompt } = await req.json()

    if (action === 'generate') {
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
          { error: 'AI generation not configured. Set GEMINI_API_KEY in environment.' },
          { status: 503 }
        )
      }

      const result = await callGeminiJSON<{ name: string; subject: string; body: string }>({
        model: GEMINI_PRO,
        systemInstruction: `You are writing sales emails for Connectex Solutions, a vendor-neutral technology advisor in Austin, TX. The sender is Mark, who helps SMBs source IT, cybersecurity, cloud, and communications solutions from 600+ providers. Write professional, warm, and concise emails. Return ONLY valid JSON.`,
        parts: [{ text: `Write a sales email based on this brief: ${prompt}

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
