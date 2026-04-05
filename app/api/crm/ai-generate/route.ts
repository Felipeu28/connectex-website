import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON, GEMINI_FLASH } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 503 })
  }

  try {
    const { prompt, contactContext } = await req.json()

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

    const systemInstruction = `You are writing emails for Mark at ConnectEx Solutions, a vendor-neutral technology advisor in Austin, TX who helps SMBs find IT, cybersecurity, cloud, and communications solutions from 600+ providers.

Mark's tone: warm, direct, personal. Never salesy. Short emails win. Always a clear CTA.
Rules:
- Under 200 words
- Use {{name}} for recipient's first name
- No emojis
- End with: "Best,\\nMark\\nConnectEx Solutions\\n(512) 555-0100"
- Return ONLY valid JSON: {"subject": "...", "body": "..."}`

    const userPrompt = `Task: ${prompt}${contextSection}

Use the contact context above to make this email feel like Mark wrote it personally after their interactions. Reference specific details from the activity log if relevant.`

    const result = await callGeminiJSON<{ subject: string; body: string }>({
      model: GEMINI_FLASH,
      systemInstruction,
      parts: [{ text: userPrompt }],
      maxOutputTokens: 1024,
    })

    if (!result) {
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('AI generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
