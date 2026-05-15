'use client'

import { useState, useMemo } from 'react'
import { Search, ArrowLeft, Phone, Voicemail, HelpCircle, Mail, Smartphone } from 'lucide-react'
import { markdownToHtml } from '@/lib/markdown'
import { WALKTHROUGHS, WALKTHROUGH_CATEGORIES, type Walkthrough } from '@/lib/knowledge/walkthroughs'

const CATEGORY_ICONS: Record<Walkthrough['category'], React.ComponentType<{ className?: string }>> = {
  'phone-setup': Phone,
  voicemail: Voicemail,
  devices: Smartphone,
  microsoft365: Mail,
  general: HelpCircle,
}

interface Props {
  onAskAi?: (suggested?: string) => void
}

export function HelpBrowse({ onAskAi }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return WALKTHROUGHS
    return WALKTHROUGHS.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.summary.toLowerCase().includes(q) ||
        w.keywords.some((k) => k.includes(q))
    )
  }, [query])

  if (activeSlug) {
    const article = WALKTHROUGHS.find((w) => w.slug === activeSlug)
    if (!article) {
      setActiveSlug(null)
      return null
    }
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setActiveSlug(null)}
          className="inline-flex items-center gap-1 text-sm text-[var(--color-accent)] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to help topics
        </button>
        <article className="prose prose-invert prose-sm max-w-none">
          <h2 className="text-xl font-bold text-white mb-2">{article.title}</h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-6">{article.summary}</p>
          <div
            className="text-[var(--color-text-light)] text-sm leading-relaxed space-y-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-xs [&_pre]:overflow-x-auto [&_table]:w-full [&_th]:text-left [&_th]:px-2 [&_th]:py-1 [&_th]:border-b [&_th]:border-white/10 [&_td]:px-2 [&_td]:py-1 [&_td]:border-b [&_td]:border-white/5 [&_a]:text-[var(--color-accent)]"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(article.body) }}
          />
        </article>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-[var(--color-text-muted)]">Still stuck?</p>
          <div className="flex gap-2">
            {onAskAi && (
              <button
                type="button"
                onClick={() => onAskAi(`I read "${article.title}" but I'm stuck. `)}
                className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-xs font-medium hover:bg-[var(--color-accent)]/25 transition-colors"
              >
                Ask the AI assistant
              </button>
            )}
            <a
              href="#new-ticket"
              className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-medium hover:bg-[var(--color-primary)]/90 transition-colors"
            >
              Open a ticket
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help topics — e.g., 'set up voicemail' or 'iPhone activation'"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </div>

      {query.trim() === '' ? (
        <div className="space-y-6">
          {WALKTHROUGH_CATEGORIES.map((cat) => {
            const items = WALKTHROUGHS.filter((w) => w.category === cat.key)
            if (items.length === 0) return null
            const Icon = CATEGORY_ICONS[cat.key]
            return (
              <div key={cat.key}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-[var(--color-accent)]" />
                  <h3 className="text-sm font-semibold text-white">{cat.label}</h3>
                  <span className="text-xs text-[var(--color-text-muted)]">— {cat.description}</span>
                </div>
                <ul className="space-y-2">
                  {items.map((w) => (
                    <li key={w.slug}>
                      <button
                        type="button"
                        onClick={() => setActiveSlug(w.slug)}
                        className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-colors group"
                      >
                        <p className="text-sm font-medium text-white group-hover:text-[var(--color-accent)] transition-colors">
                          {w.title}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">{w.summary}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            No matching articles. Try asking our AI or open a ticket.
          </p>
          <div className="flex gap-2 justify-center">
            {onAskAi && (
              <button
                type="button"
                onClick={() => onAskAi(query)}
                className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-xs font-medium hover:bg-[var(--color-accent)]/25 transition-colors"
              >
                Ask the AI: &ldquo;{query}&rdquo;
              </button>
            )}
            <a
              href="#new-ticket"
              className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-medium hover:bg-[var(--color-primary)]/90 transition-colors"
            >
              Open a ticket
            </a>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((w) => (
            <li key={w.slug}>
              <button
                type="button"
                onClick={() => setActiveSlug(w.slug)}
                className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-colors group"
              >
                <p className="text-sm font-medium text-white group-hover:text-[var(--color-accent)] transition-colors">{w.title}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{w.summary}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
