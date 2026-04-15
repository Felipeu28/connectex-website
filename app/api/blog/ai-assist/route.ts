import { NextRequest, NextResponse } from 'next/server'
import { callGemini, GEMINI_FLASH } from '@/lib/gemini'
import { requireAdmin } from '@/lib/auth-guard'

const SYSTEM_INSTRUCTION =
  "You are a content writing assistant for Mark Polanco, founder of Connectex Solutions — a vendor-neutral technology advisor for Austin small businesses. Help write clear, authoritative blog content about IT, cybersecurity, cloud, connectivity, communications, and AI automation for small business owners. Write in a direct, conversational, plain-language style. Be specific with real numbers and statistics where relevant. Mark's key differentiators: vendor-neutral (no vendor bias), 20+ years experience, sources from 600+ providers via AppDirect, Austin TX based with nationwide reach."

const CHAT_SYSTEM_INSTRUCTION = `You are an AI article creation assistant for Mark Polanco, founder of Connectex Solutions — a vendor-neutral technology advisor for Austin, TX small businesses.

Your job is to help Mark create high-quality blog articles through conversation. You'll ask clarifying questions, understand his angle and audience, then write a complete, publish-ready article.

## How to work:

**Phase 1 — Discovery**: Ask 2-4 focused questions to understand:
- The specific topic and angle Mark wants to take
- Target audience (industry, business size, pain point)
- Any specific points, stats, or examples Mark wants to include
- The desired tone (educational, urgent, case-study style, etc.)

Keep questions short and conversational — don't list them all at once. Ask one or two at a time.

**Phase 2 — Writing**: When you have enough context (after 3-5 exchanges), offer to write the article. When Mark confirms (or asks you to go ahead), write the full article in a special format.

**Phase 3 — Refinement**: After the article is applied, Mark can ask for specific changes. You can rewrite sections, adjust tone, add/remove content, etc. Return updated fields using the same article format.

## Article format:
When writing or updating an article, wrap the JSON in special delimiters EXACTLY like this:

<<<ARTICLE>>>
{
  "title": "Article title here",
  "excerpt": "One-sentence summary for listings (100-160 chars)",
  "body": "Full article body in Markdown. Use ## for H2 sections, ### for H3. Use **bold** for emphasis. Write 800-1400 words minimum. Include a clear intro, 4-6 main sections, and a conclusion with a CTA to contact Connectex.",
  "meta_description": "SEO meta description, 150-155 chars exactly",
  "category": "One of: Cybersecurity, Cloud, Connectivity, Communications, IT Strategy, AI & Automation, Business Technology, Case Study",
  "read_time": "X min read"
}
<<<END>>>

## Style guidelines:
- Write for Austin small business owners (10-150 employees)
- Plain English — avoid jargon unless explained
- Include specific statistics and dollar amounts where relevant
- Each article should answer a real question a business owner would Google
- End with a soft CTA mentioning Mark's free assessment at Connectex Solutions
- Target 1,000-1,400 words for main content

## Context about Mark:
- 20+ years IT industry experience
- Sources from 600+ technology providers (AppDirect marketplace)
- Completely vendor-neutral — no commissions from specific vendors for recommendations
- Services: Managed IT, Cybersecurity, Cloud, Connectivity, Communications, AI/Automation
- Free assessments and technology audits are his main lead-generation tool`

type Action = 'outline' | 'intro' | 'meta' | 'improve' | 'titles' | 'chat'

interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

interface AiAssistBody {
  action: Action
  title?: string
  excerpt?: string
  body?: string
  selection?: string
  // Chat-specific
  messages?: ChatMessage[]
  currentArticle?: {
    title?: string
    excerpt?: string
    body?: string
    category?: string
  }
}

function buildPrompt(body: AiAssistBody): { prompt: string; maxOutputTokens: number } {
  const { action, title, excerpt, body: postBody, selection } = body

  switch (action) {
    case 'outline':
      return {
        prompt: `Generate a detailed markdown outline for an article titled "${title}".
Excerpt/summary: ${excerpt}

Create a structured outline with H2 and H3 sections (8-12 sections total). For each section, include a brief description of what it should cover. Use ## for main sections and ### for subsections.`,
        maxOutputTokens: 800,
      }

    case 'intro':
      return {
        prompt: `Write an engaging 2-3 paragraph introduction for an article titled "${title}".

Current outline/draft:
${postBody}

The introduction should open with a relatable problem or compelling statistic relevant to Austin small business owners. Make it conversational and direct.`,
        maxOutputTokens: 400,
      }

    case 'meta':
      return {
        prompt: `Write an SEO meta description for this article.
Title: "${title}"
Excerpt: ${excerpt}

Requirements:
- Exactly 150-155 characters (count carefully)
- Optimized for search click-through
- No quotes around the output
- Return only the meta description text, nothing else`,
        maxOutputTokens: 200,
      }

    case 'improve':
      return {
        prompt: `Rewrite the following selected text to be clearer, more specific, and more authoritative while preserving the original meaning. Keep the same approximate length.

Selected text:
${selection}`,
        maxOutputTokens: 600,
      }

    case 'titles':
      return {
        prompt: `Generate 5 alternative article title options for the following topic/title: "${title}"

Requirements:
- Optimized for SEO and click-through rate
- Relevant to Austin small business owners
- Clear and specific (avoid vague titles)
- Return as a plain newline-separated list with no numbering, bullets, or extra formatting`,
        maxOutputTokens: 300,
      }

    default:
      return { prompt: '', maxOutputTokens: 400 }
  }
}

async function callGeminiMultiTurn(
  messages: ChatMessage[],
  contextNote?: string
): Promise<{ ok: boolean; text: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { ok: false, text: '', error: 'GEMINI_API_KEY not set' }

  // Inject context about current article state into first user message if provided
  let contents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }))

  if (contextNote && contents.length > 0) {
    // Prepend context to the last user message
    const last = contents[contents.length - 1]
    if (last.role === 'user') {
      contents = [
        ...contents.slice(0, -1),
        {
          role: 'user' as const,
          parts: [{ text: `${contextNote}\n\n${last.parts[0].text}` }],
        },
      ]
    }
  }

  const body = {
    contents,
    systemInstruction: { parts: [{ text: CHAT_SYSTEM_INSTRUCTION }] },
    generationConfig: { maxOutputTokens: 2400, temperature: 0.75 },
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FLASH}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error('Gemini chat error:', err)
    return { ok: false, text: '', error: `Gemini API error: ${res.status}` }
  }

  const data = await res.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return { ok: true, text }
}

function parseArticleFromResponse(text: string): Record<string, string> | null {
  const match = text.match(/<<<ARTICLE>>>([\s\S]*?)<<<END>>>/)
  if (!match) return null
  try {
    return JSON.parse(match[1].trim())
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  try {
    const body: AiAssistBody = await request.json()

    // ── Chat action ────────────────────────────────────────────────────────────
    if (body.action === 'chat') {
      const messages = body.messages ?? []
      if (messages.length === 0) {
        return NextResponse.json({ ok: false, text: '', error: 'No messages provided' }, { status: 400 })
      }

      // Build context note if current article has content
      let contextNote: string | undefined
      const art = body.currentArticle
      if (art && (art.title || art.body)) {
        const parts = []
        if (art.title) parts.push(`Current title: "${art.title}"`)
        if (art.excerpt) parts.push(`Current excerpt: "${art.excerpt}"`)
        if (art.category) parts.push(`Current category: ${art.category}`)
        if (art.body) parts.push(`Current article body (first 800 chars):\n${art.body.slice(0, 800)}...`)
        contextNote = `[Context: ${parts.join('. ')}]`
      }

      const result = await callGeminiMultiTurn(messages, contextNote)

      if (!result.ok) {
        return NextResponse.json({ ok: false, text: result.error ?? 'AI error' }, { status: 500 })
      }

      const article = parseArticleFromResponse(result.text)
      // Strip the article block from the displayed text
      const displayText = result.text
        .replace(/<<<ARTICLE>>>[\s\S]*?<<<END>>>/g, '')
        .trim()

      return NextResponse.json({
        ok: true,
        text: displayText || (article ? 'Your article is ready! I\'ve filled in the title, body, excerpt, meta description, and category. Review it and let me know if you\'d like any changes.' : ''),
        article,
      })
    }

    // ── Classic single-turn actions ────────────────────────────────────────────
    const { prompt, maxOutputTokens } = buildPrompt(body)

    if (!prompt) {
      return NextResponse.json({ ok: false, text: '', error: 'Unknown action' }, { status: 400 })
    }

    const result = await callGemini({
      model: GEMINI_FLASH,
      systemInstruction: SYSTEM_INSTRUCTION,
      parts: [{ text: prompt }],
      maxOutputTokens,
      temperature: 0.7,
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ ok: false, text: '', error: 'Internal server error' }, { status: 500 })
  }
}
