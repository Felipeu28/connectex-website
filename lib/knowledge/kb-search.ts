// Chunk-and-rank retrieval over the kb_documents table.
//
// No embeddings yet — we keyword-score query tokens against ~800-char chunks
// of each candidate document and return the top N. Good enough for the
// current corpus (a few PDFs per category) and avoids a pgvector migration.
// The Phase-2 plan is to swap the scoring function for cosine similarity
// over Gemini embeddings, keeping the same retrieval surface.

import { getSupabaseAdmin } from '@/lib/ticket-triage'

const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 120

export interface KbHit {
  doc_id: string
  doc_title: string
  category: string
  chunk: string
  score: number
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
  'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
  'every', 'some', 'any', 'to', 'of', 'in', 'on', 'at', 'by', 'for',
  'with', 'about', 'as', 'from', 'my', 'your', 'their', 'our', 'me',
  'us', 'them', 'his', 'her', 'its', 'so', 'if', 'than', 'then',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
}

function chunkText(text: string): string[] {
  if (!text) return []
  const clean = text.trim()
  if (clean.length <= CHUNK_SIZE) return [clean]

  const chunks: string[] = []
  let i = 0
  while (i < clean.length) {
    let end = Math.min(i + CHUNK_SIZE, clean.length)

    // Prefer to break on a paragraph or sentence boundary near `end`.
    if (end < clean.length) {
      const slice = clean.slice(i, end)
      const para = slice.lastIndexOf('\n\n')
      const sent = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('.\n'))
      const breakPoint = para > CHUNK_SIZE * 0.5 ? para + 2 : sent > CHUNK_SIZE * 0.5 ? sent + 1 : -1
      if (breakPoint > 0) end = i + breakPoint
    }

    chunks.push(clean.slice(i, end).trim())
    if (end >= clean.length) break
    i = Math.max(end - CHUNK_OVERLAP, i + 1)
  }
  return chunks.filter((c) => c.length > 60)
}

function scoreChunk(chunkTokens: string[], queryTokens: string[]): number {
  if (queryTokens.length === 0 || chunkTokens.length === 0) return 0
  const chunkSet = new Set(chunkTokens)
  let hits = 0
  let bigramHits = 0
  for (const q of queryTokens) {
    if (chunkSet.has(q)) hits += 1
  }
  // Bigram bonus — exact two-token phrase appearing in the chunk.
  const chunkJoined = ` ${chunkTokens.join(' ')} `
  for (let i = 0; i < queryTokens.length - 1; i++) {
    if (chunkJoined.includes(` ${queryTokens[i]} ${queryTokens[i + 1]} `)) {
      bigramHits += 1
    }
  }
  // Normalize by query length so longer queries don't artificially inflate.
  const coverage = hits / queryTokens.length
  return coverage * 100 + bigramHits * 25
}

/**
 * Returns the top N most-relevant chunks across all matching kb_documents.
 *
 * @param query free-text user query
 * @param categories restrict to these categories (empty = all)
 * @param limit max chunks returned (default 4)
 */
export async function searchKbDocuments(
  query: string,
  categories: string[] = [],
  limit = 4
): Promise<KbHit[]> {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return []

  const admin = getSupabaseAdmin()
  let q = admin
    .from('kb_documents')
    .select('id, title, category, content')
    .not('content', 'is', null)

  if (categories.length > 0) {
    q = q.in('category', categories)
  }

  const { data, error } = await q.limit(50)
  if (error || !data) return []

  const allHits: KbHit[] = []
  for (const doc of data) {
    const content = (doc.content as string) ?? ''
    // Skip the placeholder strings the extraction code falls back to.
    if (!content || content.startsWith('(')) continue
    const chunks = chunkText(content)
    for (const chunk of chunks) {
      const score = scoreChunk(tokenize(chunk), queryTokens)
      if (score > 0) {
        allHits.push({
          doc_id: doc.id as string,
          doc_title: doc.title as string,
          category: doc.category as string,
          chunk,
          score,
        })
      }
    }
  }

  return allHits.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Convenience: turn KbHits into a single prompt-ready context block.
 */
export function formatKbHits(hits: KbHit[]): string {
  if (hits.length === 0) return ''
  return hits
    .map(
      (h, i) =>
        `### Source ${i + 1}: ${h.doc_title} (${h.category})\n${h.chunk}`
    )
    .join('\n\n---\n\n')
}
