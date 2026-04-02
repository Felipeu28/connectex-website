import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 503 })
  }

  try {
    const { prompt, contactContext } = await req.json()

    // Build context section from contact activity if provided
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

    const systemPrompt = `You are writing emails for Mark at ConnectEx Solutions, a vendor-neutral technology advisor in Austin, TX who helps SMBs find IT, cybersecurity, cloud, and communications solutions from 600+ providers.

Mark's tone: warm, direct, personal. Never salesy. Short emails win. Always a clear CTA.
Rules:
- Under 200 words
- Use {{name}} for recipient's first name
- No emojis
- End with: "Best,\nMark\nConnectEx Solutions\n(512) 555-0100"
- Return ONLY valid JSON: {"subject": "...", "body": "..."}`

    const userPrompt = `Task: ${prompt}${contextSection}

Use the contact context above to make this email feel like Mark wrote it personally after their interactions. Reference specific details from the activity log if relevant.`

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
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]))
    }

    return NextResponse.json({ body: text })
  } catch (err) {
    console.error('AI generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
