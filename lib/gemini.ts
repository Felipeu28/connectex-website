// Gemini API client — drop-in for the Anthropic calls we had before

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

// Model aliases
export const GEMINI_FLASH = 'gemini-2.0-flash'      // fast + cheap — triage, AI generate
export const GEMINI_PRO = 'gemini-2.0-flash'         // campaigns (can upgrade to gemini-1.5-pro later)

export interface GeminiTextPart { text: string }
export interface GeminiImagePart { inlineData: { mimeType: string; data: string } }
export type GeminiPart = GeminiTextPart | GeminiImagePart

interface GeminiRequest {
  model?: string
  systemInstruction?: string
  parts: GeminiPart[]
  maxOutputTokens?: number
  temperature?: number
}

interface GeminiResponse {
  text: string
  ok: boolean
  error?: string
}

export async function callGemini({
  model = GEMINI_FLASH,
  systemInstruction,
  parts,
  maxOutputTokens = 1200,
  temperature = 0.3,
}: GeminiRequest): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { ok: false, text: '', error: 'GEMINI_API_KEY not set' }

  const body: Record<string, unknown> = {
    contents: [{ parts }],
    generationConfig: { maxOutputTokens, temperature },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Gemini API error:', err)
    return { ok: false, text: '', error: `Gemini API error: ${res.status}` }
  }

  const data = await res.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return { ok: true, text }
}

/** Convenience: call Gemini and parse JSON from the response */
export async function callGeminiJSON<T>(args: GeminiRequest): Promise<T | null> {
  const result = await callGemini(args)
  if (!result.ok || !result.text) return null
  const match = result.text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) as T }
  catch { return null }
}
