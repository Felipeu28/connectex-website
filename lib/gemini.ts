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
  /** HTTP status of the upstream Gemini call if it failed at the network level. */
  status?: number
  /** One of: 'no_key' | 'http_error' | 'blocked' | 'empty' | 'parse' */
  failureKind?: FailureKind
}

export type FailureKind = 'no_key' | 'http_error' | 'blocked' | 'empty' | 'parse'

export async function callGemini({
  model = GEMINI_FLASH,
  systemInstruction,
  parts,
  maxOutputTokens = 1200,
  temperature = 0.3,
}: GeminiRequest): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: false, text: '', error: 'GEMINI_API_KEY not set', failureKind: 'no_key' }
  }

  const body: Record<string, unknown> = {
    contents: [{ parts }],
    generationConfig: { maxOutputTokens, temperature },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Gemini fetch failed:', message)
    return { ok: false, text: '', error: `Network error calling Gemini: ${message}`, failureKind: 'http_error' }
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    // Try to pull out the human-readable message the Gemini API returns in
    // its JSON error body; fall back to the raw text.
    let detail = errText
    try {
      const parsed = JSON.parse(errText) as { error?: { message?: string } }
      if (parsed?.error?.message) detail = parsed.error.message
    } catch {
      // not JSON, keep raw
    }
    console.error('Gemini API error:', res.status, detail)
    return {
      ok: false,
      text: '',
      error: `Gemini API ${res.status}: ${detail || 'no detail returned'}`,
      status: res.status,
      failureKind: 'http_error',
    }
  }

  const data = await res.json()

  // Safety filters: Gemini returns a 200 but with promptFeedback.blockReason
  // or no candidates at all. Both collapse to "empty text" on the caller
  // today — surface the actual reason instead.
  const blockReason: string | undefined = data?.promptFeedback?.blockReason
  const finishReason: string | undefined = data?.candidates?.[0]?.finishReason
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  if (blockReason) {
    return { ok: false, text: '', error: `Gemini blocked the prompt: ${blockReason}`, failureKind: 'blocked' }
  }

  if (!text) {
    const reason = finishReason ? ` (finishReason: ${finishReason})` : ''
    return { ok: false, text: '', error: `Gemini returned empty response${reason}`, failureKind: 'empty' }
  }

  return { ok: true, text }
}

/**
 * Convenience: call Gemini and parse JSON from the response.
 *
 * Handles two common Gemini habits that the old implementation missed:
 *  1. Wrapping JSON in ```json ... ``` markdown fences.
 *  2. Emitting prose around the JSON (e.g. "Here's the email: { ... }").
 */
export async function callGeminiJSON<T>(
  args: GeminiRequest
): Promise<{ ok: true; data: T } | { ok: false; error: string; failureKind: FailureKind }> {
  const result = await callGemini(args)
  if (!result.ok) {
    return {
      ok: false,
      error: result.error ?? 'Unknown Gemini error',
      failureKind: result.failureKind ?? 'http_error',
    }
  }

  // Strip markdown code fences if present: ```json\n{...}\n```
  const fenceStripped = result.text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  // Find the first balanced JSON object in the stripped text. Greedy-last
  // `}` means we catch nested objects too.
  const match = fenceStripped.match(/\{[\s\S]*\}/)
  if (!match) {
    return {
      ok: false,
      error: `Gemini response did not contain JSON. Raw: ${result.text.slice(0, 300)}`,
      failureKind: 'parse',
    }
  }

  try {
    return { ok: true, data: JSON.parse(match[0]) as T }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      error: `Gemini returned malformed JSON: ${detail}`,
      failureKind: 'parse',
    }
  }
}
