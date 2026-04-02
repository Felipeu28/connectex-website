import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { action, prompt } = await req.json()

    if (action === 'generate') {
      // AI email generation via Claude API
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: 'AI generation not configured. Set ANTHROPIC_API_KEY in environment.' },
          { status: 503 }
        )
      }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `You are writing a sales email for ConnectEx Solutions, a vendor-neutral technology advisor based in Austin, TX. The sender is Mark, who helps SMBs source IT, cybersecurity, cloud, and communications solutions from 600+ providers.

Write a professional, warm, and concise email based on this brief: ${prompt}

Rules:
- Keep it under 250 words
- Use a conversational but professional tone
- Include a clear CTA
- Use {{name}} as a placeholder for the recipient's name
- Do not use emojis
- End with Mark's signature

Return ONLY a JSON object with these fields:
- "name": campaign name (short, for internal use)
- "subject": email subject line (compelling, under 60 chars)
- "body": the full email body text`,
            },
          ],
        }),
      })

      if (!res.ok) {
        return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
      }

      const data = await res.json()
      const text = data.content?.[0]?.text ?? ''

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json(parsed)
      }

      return NextResponse.json({ body: text })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('Campaign API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
