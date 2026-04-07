'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Code,
  Eye,
  Edit3,
  Sparkles,
  Save,
  Rocket,
  Copy,
  CheckCircle2,
  Loader2,
  Plus,
  type LucideIcon,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlogPostData {
  id?: string
  slug: string
  title: string
  excerpt: string
  body: string
  category: string
  read_time: string
  featured: boolean
  status: 'draft' | 'published'
  meta_description: string
  published_at?: string | null
}

interface Props {
  postId?: string
  initialData?: Partial<BlogPostData>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Cybersecurity',
  'Cloud',
  'Connectivity',
  'Communications',
  'IT Strategy',
  'AI & Automation',
  'Business Technology',
  'Case Study',
]

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function markdownToHtml(md: string): string {
  return md
    .trim()
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, (m) => `<ul>${m}</ul>`)
    .split('\n\n')
    .map((block) => {
      if (block.startsWith('<h') || block.startsWith('<ul')) return block
      if (block.trim() === '') return ''
      return `<p>${block.replace(/\n/g, ' ')}</p>`
    })
    .join('\n')
}

// ─── Main component ────────────────────────────────────────────────────────────

export function BlogEditor({ postId, initialData }: Props) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Form state
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '')
  const [body, setBody] = useState(initialData?.body ?? '')
  const [category, setCategory] = useState(initialData?.category ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description ?? '')
  const [featured, setFeatured] = useState(initialData?.featured ?? false)
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status ?? 'draft')
  const [currentPostId, setCurrentPostId] = useState(postId)

  // UI state
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData?.slug)

  // AI state
  const [aiOutput, setAiOutput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAction, setAiAction] = useState<string | null>(null)
  const [aiCopied, setAiCopied] = useState(false)

  // Auto-slug from title
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(toSlug(title))
    }
  }, [title, slugManuallyEdited])

  // Word count + read time
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200))

  // ── Save logic ──────────────────────────────────────────────────────────────

  const buildPayload = useCallback(
    (overrideStatus?: 'draft' | 'published') => ({
      slug,
      title,
      excerpt,
      body,
      category,
      read_time: `${readTimeMin} min read`,
      featured,
      status: overrideStatus ?? status,
      meta_description: metaDescription,
    }),
    [slug, title, excerpt, body, category, readTimeMin, featured, status, metaDescription]
  )

  async function save(overrideStatus?: 'draft' | 'published') {
    if (!title.trim()) return
    setSaveStatus('saving')
    try {
      const payload = buildPayload(overrideStatus)
      let res: Response
      if (currentPostId) {
        res = await fetch(`/api/blog/${currentPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        setSaveStatus('error')
        return
      }

      const saved = await res.json()

      if (!currentPostId && saved.id) {
        setCurrentPostId(saved.id)
        router.replace(`/crm/blog/${saved.id}`)
      }

      if (overrideStatus) {
        setStatus(overrideStatus)
      }

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
    }
  }

  // Auto-save: 2 s debounce
  useEffect(() => {
    if (!title.trim()) return
    if (!currentPostId) return // only auto-save existing posts
    const timer = setTimeout(() => {
      save('draft')
    }, 2000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, title, excerpt])

  // ── Toolbar ─────────────────────────────────────────────────────────────────

  function insertAtCursor(before: string, after = '') {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = body.slice(start, end)
    const newBody =
      body.slice(0, start) + before + selected + after + body.slice(end)
    setBody(newBody)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      )
    }, 0)
  }

  const toolbarButtons: { icon: LucideIcon | null; label?: string; title: string; action: () => void }[] = [
    { icon: Bold, title: 'Bold', action: () => insertAtCursor('**', '**') },
    { icon: Italic, title: 'Italic', action: () => insertAtCursor('*', '*') },
    { icon: Heading2, title: 'Heading 2', action: () => insertAtCursor('\n## ', '') },
    { icon: Heading3, title: 'Heading 3', action: () => insertAtCursor('\n### ', '') },
    { icon: List, title: 'Bullet list', action: () => insertAtCursor('\n- ', '') },
    { icon: ListOrdered, title: 'Numbered list', action: () => insertAtCursor('\n1. ', '') },
    { icon: Link2, title: 'Link', action: () => insertAtCursor('[', '](url)') },
    { icon: Code, title: 'Inline code', action: () => insertAtCursor('`', '`') },
  ]

  // ── AI Assistant ─────────────────────────────────────────────────────────────

  async function runAi(action: string) {
    setAiLoading(true)
    setAiAction(action)
    setAiOutput('')

    const textarea = textareaRef.current
    const selectedText = textarea
      ? body.slice(textarea.selectionStart, textarea.selectionEnd)
      : ''

    const payload: Record<string, string> = { action }
    if (action === 'outline') { payload.title = title; payload.excerpt = excerpt }
    if (action === 'intro') { payload.title = title; payload.body = body }
    if (action === 'meta') { payload.title = title; payload.excerpt = excerpt }
    if (action === 'improve') { payload.action = 'improve'; payload.selection = selectedText }

    try {
      const res = await fetch('/api/blog/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setAiOutput(json.text ?? json.error ?? 'No response')
    } catch {
      setAiOutput('Error calling AI assistant.')
    } finally {
      setAiLoading(false)
      setAiAction(null)
    }
  }

  function insertAiOutput() {
    if (!aiOutput) return
    setBody((prev) => (prev ? `${prev}\n\n${aiOutput}` : aiOutput))
  }

  async function copyAiOutput() {
    if (!aiOutput) return
    await navigator.clipboard.writeText(aiOutput)
    setAiCopied(true)
    setTimeout(() => setAiCopied(false), 2000)
  }

  function getSelectedText(): string {
    const textarea = textareaRef.current
    if (!textarea) return ''
    return body.slice(textarea.selectionStart, textarea.selectionEnd)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-[#0a1218]">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-4 px-6 h-14 border-b border-white/8 bg-[#0F1B2D] flex-shrink-0">
        <Link
          href="/crm/blog"
          className="flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Blog
        </Link>

        <span className="text-white/20">|</span>

        <p className="text-sm text-white flex-1 truncate font-medium">
          {title || <span className="text-[var(--color-text-faint)]">Untitled article</span>}
        </p>

        {/* Save status */}
        <div className="flex items-center gap-2 text-xs">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-[#00C9A7]">
              <span className="w-2 h-2 rounded-full bg-[#00C9A7]" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-[#FF6B6B]">
              <span className="w-2 h-2 rounded-full bg-[#FF6B6B]" />
              Error saving
            </span>
          )}
        </div>

        <button
          onClick={() => save('draft')}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          Save Draft
        </button>

        <button
          onClick={() => save('published')}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#00C9A7] hover:bg-[#00b396] text-[#0a1218] text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          <Rocket className="w-3.5 h-3.5" />
          Publish
        </button>
      </header>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title…"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-4 text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[#00C9A7]/50 text-2xl font-bold"
          />

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary / excerpt shown in listings…"
            rows={3}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[#00C9A7]/50 text-sm resize-none"
          />

          {/* Editor card */}
          <div className="glass rounded-xl border border-white/10 overflow-hidden">
            {/* Write / Preview tabs + Toolbar */}
            <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2">
              <button
                onClick={() => setActiveTab('write')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'write'
                    ? 'bg-[#00C9A7]/15 text-[#00C9A7]'
                    : 'text-[var(--color-text-muted)] hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Write
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-[#00C9A7]/15 text-[#00C9A7]'
                    : 'text-[var(--color-text-muted)] hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>

              {activeTab === 'write' && (
                <>
                  <span className="w-px h-5 bg-white/10 mx-1" />
                  {toolbarButtons.map((btn) => {
                    const Icon = btn.icon
                    return (
                      <button
                        key={btn.title}
                        title={btn.title}
                        onClick={btn.action}
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                      >
                        {Icon ? <Icon className="w-3.5 h-3.5" /> : <span className="text-xs font-mono font-semibold">{btn.label}</span>}
                      </button>
                    )
                  })}
                </>
              )}
            </div>

            {/* Editor / Preview content */}
            <div className="p-4">
              {activeTab === 'write' ? (
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Start writing your article in Markdown…"
                  className="w-full bg-transparent text-[var(--color-text-muted)] resize-none focus:outline-none leading-relaxed text-sm min-h-96 font-mono"
                />
              ) : (
                <div
                  className="prose prose-invert prose-sm max-w-none text-[var(--color-text-muted)] leading-relaxed min-h-96
                    [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
                    [&_h3]:text-white [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                    [&_p]:mb-3 [&_ul]:pl-4 [&_li]:mb-1 [&_strong]:text-white [&_em]:text-white/80
                    [&_code]:bg-white/10 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[#00C9A7]
                    [&_a]:text-[#00C9A7] [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(body) || '<p class="text-[var(--color-text-faint)]">Nothing to preview yet.</p>' }}
                />
              )}
            </div>
          </div>

          {/* Word count */}
          <p className="text-xs text-[var(--color-text-faint)] px-1">
            Words: {wordCount} &nbsp;|&nbsp; ~{readTimeMin} min read
          </p>
        </div>

        {/* ── Right sidebar ──────────────────────────────────────────────── */}
        <aside className="w-80 flex-shrink-0 overflow-y-auto border-l border-white/8 p-4 bg-[#0F1B2D] space-y-4">
          {/* Article Settings */}
          <div className="glass rounded-xl p-4 border border-white/8 space-y-3">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              Article Settings
            </h3>

            {/* Status */}
            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Status</label>
              <div className="flex gap-2">
                {(['draft', 'published'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors border ${
                      status === s
                        ? s === 'published'
                          ? 'bg-[#00C9A7]/15 text-[#00C9A7] border-[#00C9A7]/25'
                          : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/25'
                        : 'bg-white/[0.04] text-[var(--color-text-muted)] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {s === 'draft' ? 'Draft' : 'Published'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00C9A7]/50 text-sm [&>option]:bg-[#0F1B2D]"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Slug */}
            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setSlugManuallyEdited(true)
                }}
                placeholder="url-slug"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[#00C9A7]/50 text-sm font-mono"
              />
            </div>

            {/* Meta description */}
            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Meta Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="SEO meta description (150–155 chars)…"
                rows={3}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[#00C9A7]/50 text-sm resize-none"
              />
              <p className={`text-xs mt-1 ${metaDescription.length > 155 ? 'text-[#FF6B6B]' : 'text-[var(--color-text-faint)]'}`}>
                {metaDescription.length}/155
              </p>
            </div>

            {/* Featured */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--color-text-muted)]">Featured Article</label>
              <button
                onClick={() => setFeatured((f) => !f)}
                className={`relative w-9 h-5 rounded-full transition-colors ${featured ? 'bg-[#00C9A7]' : 'bg-white/15'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${featured ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {/* Read time */}
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <span>Estimated read time</span>
              <span className="text-white font-medium">~{readTimeMin} min</span>
            </div>
          </div>

          {/* AI Assistant */}
          <div className="glass rounded-xl p-4 border border-white/8 space-y-3">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
              AI Assistant
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => runAi('outline')}
                disabled={aiLoading || !title.trim()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-[#A78BFA]/10 text-[#A78BFA] hover:bg-[#A78BFA]/20 border border-[#A78BFA]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {aiAction === 'outline' && aiLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                Generate Outline
              </button>

              <button
                onClick={() => runAi('intro')}
                disabled={aiLoading || !title.trim()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-[#A78BFA]/10 text-[#A78BFA] hover:bg-[#A78BFA]/20 border border-[#A78BFA]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {aiAction === 'intro' && aiLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Edit3 className="w-3 h-3" />
                )}
                Write Intro
              </button>

              <button
                onClick={() => runAi('meta')}
                disabled={aiLoading || !title.trim()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-[#A78BFA]/10 text-[#A78BFA] hover:bg-[#A78BFA]/20 border border-[#A78BFA]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {aiAction === 'meta' && aiLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Suggest Meta
              </button>

              <button
                onClick={() => runAi('improve')}
                disabled={aiLoading || !getSelectedText()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-[#A78BFA]/10 text-[#A78BFA] hover:bg-[#A78BFA]/20 border border-[#A78BFA]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Select text in the editor first"
              >
                {aiAction === 'improve' && aiLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Bold className="w-3 h-3" />
                )}
                Expand Selection
              </button>
            </div>

            {/* AI output */}
            {(aiLoading || aiOutput) && (
              <div className="bg-[#A78BFA]/10 border border-[#A78BFA]/20 rounded-xl p-4 space-y-3">
                {aiLoading ? (
                  <div className="flex items-center gap-2 text-[#A78BFA] text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating…
                  </div>
                ) : (
                  <>
                    <pre className="text-xs text-[var(--color-text-muted)] whitespace-pre-wrap leading-relaxed font-sans max-h-48 overflow-y-auto">
                      {aiOutput}
                    </pre>
                    <div className="flex gap-2">
                      <button
                        onClick={insertAiOutput}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#A78BFA]/15 text-[#A78BFA] hover:bg-[#A78BFA]/25 border border-[#A78BFA]/25 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Insert
                      </button>
                      <button
                        onClick={copyAiOutput}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#A78BFA]/15 text-[#A78BFA] hover:bg-[#A78BFA]/25 border border-[#A78BFA]/25 transition-colors"
                      >
                        {aiCopied ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {aiCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
