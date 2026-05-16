// Clean up text extracted from PDFs (or PDF-exported TXT files) so it is
// useful as AI grounding context — not a wall of TOC leader dots and page
// numbers.
//
// The transformations are intentionally conservative: we only strip artifacts
// that are unambiguously layout noise. Real prose is left alone.

export interface CleanResult {
  text: string
  /** Chars dropped during cleaning — useful to surface in the UI as a quality signal. */
  removedChars: number
  /** Heuristic confidence the cleaned text is useful (0-100). */
  usefulness: number
}

/**
 * Clean extracted PDF/TXT text in place. Returns the cleaned text along with
 * a usefulness score so the caller can warn the user about low-quality extractions.
 */
export function cleanExtractedText(raw: string): CleanResult {
  if (!raw) return { text: '', removedChars: 0, usefulness: 0 }

  const original = raw
  let text = raw

  // 1) Normalize line endings.
  text = text.replace(/\r\n?/g, '\n')

  // 2) Strip table-of-contents leader dots. PDF extractors render the dotted
  //    leaders ("Searching for contacts ........... 40") as long runs of "."
  //    or ". . . . ." separated by spaces. Collapse 4+ dots (with optional
  //    spaces between) to a single space.
  text = text.replace(/(?:\.\s*){4,}/g, ' ')

  // 3) Strip leader dashes and underscores used the same way ("Title --- 12").
  text = text.replace(/(?:[-_]\s*){4,}/g, ' ')

  // 4) Drop standalone page-number lines ("12", "Page 12", "12 of 240").
  text = text
    .split('\n')
    .filter((line) => {
      const t = line.trim()
      if (!t) return true // keep blanks for paragraph breaks
      if (/^(?:page\s+)?\d{1,4}(?:\s+of\s+\d{1,4})?$/i.test(t)) return false
      return true
    })
    .join('\n')

  // 5) Drop repeating headers/footers. If the same short line (<= 80 chars)
  //    appears 3+ times across the document, treat it as a header/footer and
  //    remove all occurrences. Long lines are real content even if repeated.
  const lineCounts = new Map<string, number>()
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (t && t.length <= 80) {
      lineCounts.set(t, (lineCounts.get(t) ?? 0) + 1)
    }
  }
  const repeats = new Set<string>()
  for (const [line, count] of lineCounts) {
    if (count >= 3) repeats.add(line)
  }
  if (repeats.size > 0) {
    text = text
      .split('\n')
      .filter((line) => !repeats.has(line.trim()))
      .join('\n')
  }

  // 6) De-hyphenate words split across line breaks ("config-\nuration" → "configuration").
  text = text.replace(/(\w)-\n(\w)/g, '$1$2')

  // 7) Join soft line breaks inside paragraphs. A line that doesn't end with
  //    sentence punctuation and is followed by a lowercase letter is almost
  //    always a wrapped line. Keep blank lines (paragraph separators).
  text = text.replace(/([^.!?:\n])\n(?=[a-z(])/g, '$1 ')

  // 8) Collapse runs of whitespace inside a line.
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trimEnd())
    .join('\n')

  // 9) Collapse 3+ blank lines to 2 (preserves paragraph spacing).
  text = text.replace(/\n{3,}/g, '\n\n')

  text = text.trim()

  // Usefulness heuristic: ratio of alpha chars to total chars, penalize very
  // short results.
  const alpha = (text.match(/[a-zA-Z]/g) ?? []).length
  const alphaRatio = text.length > 0 ? alpha / text.length : 0
  let usefulness = Math.round(alphaRatio * 100)
  if (text.length < 200) usefulness = Math.min(usefulness, 30)
  if (text.length < 500) usefulness = Math.min(usefulness, 60)

  return {
    text,
    removedChars: Math.max(0, original.length - text.length),
    usefulness,
  }
}
