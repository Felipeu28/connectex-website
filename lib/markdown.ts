/**
 * Naive but safe markdown → HTML converter for blog-style content.
 *
 * The prior implementations (duplicated in app/resources/[slug]/page.tsx and
 * components/crm/BlogEditor.tsx) ran regex replacements directly on the raw
 * input and piped the result into `dangerouslySetInnerHTML`. Any literal
 * `<script>` or other HTML in the input flowed straight through as live
 * DOM — a stored-XSS vector as soon as the blog body came from the DB
 * (which it does via the /resources/[slug] fallback to blog_posts).
 *
 * This version:
 *  1. HTML-escapes the entire input first, so any HTML tokens become
 *     inert text (`&lt;script&gt;`).
 *  2. Runs the markdown regex on the escaped text — the output HTML tags
 *     are all constants we control (<h2>, <strong>, <a>, etc.).
 *  3. Validates `href` targets on link expansion so `javascript:` /
 *     `data:` / `vbscript:` URLs can't sneak in.
 *
 * This is not a full markdown parser and is only appropriate for the
 * lightweight authoring surface we have today.
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeHref(raw: string): string {
  const trimmed = raw.trim()
  // Allow http(s), mailto, tel, relative, and fragment URLs. Reject
  // anything else — notably javascript:, data:, vbscript:.
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed
  return '#'
}

export interface MarkdownOptions {
  /** Render task-list checkboxes + tables. Default true for blog posts. */
  rich?: boolean
}

export function markdownToHtml(md: string, opts: MarkdownOptions = {}): string {
  const rich = opts.rich ?? true
  // Escape first so authored HTML can't execute.
  let html = escapeHtml(md.trim())

  html = html
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Link text comes from already-escaped input; href is validated.
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, text: string, url: string) => {
      return `<a href="${safeHref(url)}">${text}</a>`
    })

  if (rich) {
    html = html
      .replace(/^- \[ \] (.+)$/gm, '<li><input type="checkbox" disabled> $1</li>')
      .replace(/^- \[x\] (.+)$/gm, '<li><input type="checkbox" checked disabled> $1</li>')
  }

  html = html
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, (m) => {
      if (m.includes('type="checkbox"')) return `<ul class="checklist">${m}</ul>`
      return `<ul>${m}</ul>`
    })

  if (rich) {
    html = html
      .replace(/^\| (.+) \|$/gm, (_, row: string) => {
        const cells = row.split(' | ').map((c: string) => c.trim())
        return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join('')}</tr>`
      })
      .replace(/^(\|[-: |]+\|)$/gm, '') // remove separator rows
      .replace(/(<tr>.*<\/tr>\n?)+/gs, (m: string) => {
        const rows = m.trim().split('\n')
        const header = rows[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>')
        const body = rows.slice(1).join('\n')
        return `<table><thead>${header}</thead><tbody>${body}</tbody></table>`
      })
  }

  return html
    .split('\n\n')
    .map((block) => {
      if (
        block.startsWith('<h') ||
        block.startsWith('<ul') ||
        block.startsWith('<ol') ||
        block.startsWith('<table')
      )
        return block
      if (block.trim() === '') return ''
      return `<p>${block.replace(/\n/g, ' ')}</p>`
    })
    .join('\n')
}
