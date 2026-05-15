// Gemini API client — drop-in for the Anthropic calls we had before

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

// Model aliases
export const GEMINI_FLASH = 'gemini-2.0-flash'      // fast + cheap — triage, AI generate
export const GEMINI_PRO = 'gemini-2.0-flash'         // campaigns (can upgrade to gemini-1.5-pro later)

/** Hard timeout for every Gemini request — keeps a hung upstream from
 *  hanging a serverless function until its own timeout. */
const GEMINI_TIMEOUT_MS = 30_000

export interface GeminiTextPart { text: string }
export interface GeminiImagePart { inlineData: { mimeType: string; data: string } }
export type GeminiPart = GeminiTextPart | GeminiImagePart

interface GeminiRequest {
  model?: string
  systemInstruction?: string
  parts: GeminiPart[]
  maxOutputTokens?: number
  temperature?: number
  /**
   * Optional structured-output hint. Gemini honors
   * `response_mime_type: 'application/json'` on the newer models and
   * returns valid JSON in the text field, which lets callGeminiJSON skip
   * the markdown/prose extraction step.
   */
  responseMimeType?: 'application/json' | 'text/plain'
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

export type FailureKind = 'no_key' | 'http_error' | 'blocked' | 'empty' | 'parse' | 'timeout'

export async function callGemini({
  model = GEMINI_FLASH,
  systemInstruction,
  parts,
  maxOutputTokens = 1200,
  temperature = 0.3,
  responseMimeType,
}: GeminiRequest): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: false, text: '', error: 'GEMINI_API_KEY not set', failureKind: 'no_key' }
  }

  const generationConfig: Record<string, unknown> = { maxOutputTokens, temperature }
  if (responseMimeType) generationConfig.responseMimeType = responseMimeType

  const body: Record<string, unknown> = {
    contents: [{ parts }],
    generationConfig,
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    console.error('Gemini fetch failed:', message)
    return {
      ok: false,
      text: '',
      error: isTimeout
        ? `Gemini request timed out after ${GEMINI_TIMEOUT_MS / 1000}s`
        : `Network error calling Gemini: ${message}`,
      failureKind: isTimeout ? 'timeout' : 'http_error',
    }
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
 * Strategy:
 *   1. Ask Gemini for JSON via `response_mime_type: 'application/json'`
 *      so newer models return a clean JSON body.
 *   2. Fall back to the regex extractor for the cases where Gemini still
 *      wraps the JSON in ```json``` fences or surrounding prose (older
 *      models, or when the JSON hint isn't honored).
 */
export async function callGeminiJSON<T>(
  args: GeminiRequest
): Promise<{ ok: true; data: T } | { ok: false; error: string; failureKind: FailureKind }> {
  const result = await callGemini({ ...args, responseMimeType: 'application/json' })
  if (!result.ok) {
    return {
      ok: false,
      error: result.error ?? 'Unknown Gemini error',
      failureKind: result.failureKind ?? 'http_error',
    }
  }

  // Fast path: response is already valid JSON (response_mime_type honored).
  const trimmed = result.text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return { ok: true, data: JSON.parse(trimmed) as T }
    } catch {
      // fall through to the recovery extractor
    }
  }

  // Recovery: strip markdown code fences if present, then find the first
  // balanced JSON object in what remains.
  const fenceStripped = result.text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

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
