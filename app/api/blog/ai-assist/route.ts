import { NextRequest, NextResponse } from 'next/server'
import { callGemini, GEMINI_FLASH } from '@/lib/gemini'

const SYSTEM_INSTRUCTION =
  "You are a content writing assistant for Mark Polanco, founder of Connectex Solutions — a vendor-neutral technology advisor for Austin small businesses. Help write clear, authoritative blog content about IT, cybersecurity, cloud, connectivity, communications, and AI automation for small business owners. Write in a direct, conversational, plain-language style. Be specific with real numbers and statistics where relevant. Mark's key differentiators: vendor-neutral (no vendor bias), 20+ years experience, sources from 600+ providers via AppDirect, Austin TX based with nationwide reach."

type Action = 'outline' | 'intro' | 'meta' | 'improve' | 'titles'

interface AiAssistBody {
  action: Action
  title?: string
  excerpt?: string
  body?: string
  selection?: string
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

export async function POST(request: NextRequest) {
  try {
    const body: AiAssistBody = await request.json()
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
