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
  CheckCircle2,
  Loader2,
  Send,
  Settings2,
  MessageSquare,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import { markdownToHtml } from '@/lib/markdown'

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

interface ChatMessage {
  role: 'user' | 'model'
  content: string
  article?: Record<string, string> | null
  isApplied?: boolean
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


// ─── Main component ────────────────────────────────────────────────────────────

export function BlogEditor({ postId, initialData }: Props) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

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
  const [sidebarMode, setSidebarMode] = useState<'settings' | 'chat'>(
    postId ? 'settings' : 'chat'
  )

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: postId
        ? "Hi! I'm your AI writing assistant. Ask me to rewrite a section, change the tone, add more detail, or anything else. I can also help with the meta description, excerpt, or title."
        : "Hi Mark! I'm your AI article assistant. Tell me what you'd like to write about — a topic, a question your clients ask a lot, or a specific pain point you want to address. I'll ask a few quick questions and then write the full article for you.",
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [appliedArticleIndex, setAppliedArticleIndex] = useState<number | null>(null)

  // Auto-slug from title
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(toSlug(title))
    }
  }, [title, slugManuallyEdited])

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

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
    if (!currentPostId) return
    const timer = setTimeout(() => {
      save()
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

  const toolbarButtons: { icon: LucideIcon; title: string; action: () => void }[] = [
    { icon: Bold, title: 'Bold', action: () => insertAtCursor('**', '**') },
    { icon: Italic, title: 'Italic', action: () => insertAtCursor('*', '*') },
    { icon: Heading2, title: 'Heading 2', action: () => insertAtCursor('\n## ', '') },
    { icon: Heading3, title: 'Heading 3', action: () => insertAtCursor('\n### ', '') },
    { icon: List, title: 'Bullet list', action: () => insertAtCursor('\n- ', '') },
    { icon: ListOrdered, title: 'Numbered list', action: () => insertAtCursor('\n1. ', '') },
    { icon: Link2, title: 'Link', action: () => insertAtCursor('[', '](url)') },
    { icon: Code, title: 'Inline code', action: () => insertAtCursor('`', '`') },
  ]

  // ── Chat logic ───────────────────────────────────────────────────────────────

  async function sendChatMessage() {
    const text = chatInput.trim()
    if (!text || chatLoading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const updatedMessages = [...chatMessages, userMsg]
    setChatMessages(updatedMessages)
    setChatInput('')
    setChatLoading(true)

    // Build messages array for API (only role+content, no UI-only fields)
    const apiMessages = updatedMessages.map((m) => ({
      role: m.role as 'user' | 'model',
      content: m.content,
    }))

    try {
      const res = await fetch('/api/blog/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          messages: apiMessages,
          currentArticle: {
            title,
            excerpt,
            body: body ? body.slice(0, 1200) : undefined,
            category,
          },
        }),
      })

      const json = await res.json()
      const assistantMsg: ChatMessage = {
        role: 'model',
        content: json.text ?? 'Sorry, something went wrong.',
        article: json.article ?? null,
      }

      setChatMessages((prev) => {
        const next = [...prev, assistantMsg]
        // Auto-apply article if returned
        if (json.article) {
          const art = json.article as Record<string, string>
          if (art.title) setTitle(art.title)
          if (art.excerpt) setExcerpt(art.excerpt)
          if (art.body) setBody(art.body)
          if (art.meta_description) setMetaDescription(art.meta_description)
          if (art.category) setCategory(art.category)
          setAppliedArticleIndex(next.length - 1)
        }
        return next
      })
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', content: 'Error reaching the AI. Please try again.' },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  function handleChatKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }

  function clearChat() {
    setChatMessages([
      {
        role: 'model',
        content: postId
          ? "Hi! I'm your AI writing assistant. What would you like to change or improve?"
          : "Hi Mark! Tell me what topic you want to write about and I'll create the full article for you.",
      },
    ])
    setAppliedArticleIndex(null)
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
          {title || <span className="text-white/30 font-normal">Untitled article</span>}
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
        {/* ── Left panel: Editor ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title…"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/25 focus:outline-none focus:border-[#00C9A7]/50 text-2xl font-bold"
          />

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary / excerpt shown in listings…"
            rows={3}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#00C9A7]/50 text-sm resize-none"
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
                        <Icon className="w-3.5 h-3.5" />
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
                  placeholder="Start writing your article in Markdown… or use the AI Chat →"
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
                  dangerouslySetInnerHTML={{
                    __html:
                      markdownToHtml(body) ||
                      '<p class="text-white/20">Nothing to preview yet.</p>',
                  }}
                />
              )}
            </div>
          </div>

          {/* Word count */}
          <p className="text-xs text-white/25 px-1">
            Words: {wordCount} &nbsp;|&nbsp; ~{readTimeMin} min read
          </p>
        </div>

        {/* ── Right sidebar ──────────────────────────────────────────────── */}
        <aside className="w-80 flex-shrink-0 flex flex-col border-l border-white/8 bg-[#0F1B2D]">
          {/* Sidebar mode tabs */}
          <div className="flex border-b border-white/8 flex-shrink-0">
            <button
              onClick={() => setSidebarMode('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                sidebarMode === 'chat'
                  ? 'text-[#A78BFA] border-b-2 border-[#A78BFA]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              AI Chat
            </button>
            <button
              onClick={() => setSidebarMode('settings')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                sidebarMode === 'settings'
                  ? 'text-[#00C9A7] border-b-2 border-[#00C9A7]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>

          {/* ── AI Chat panel ─────────────────────────────────────────── */}
          {sidebarMode === 'chat' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    AI Article Assistant
                  </span>
                </div>
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  className="text-white/25 hover:text-white/50 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#00C9A7]/20 text-[#00C9A7] rounded-br-sm'
                          : 'bg-white/[0.06] text-white/70 rounded-bl-sm'
                      }`}
                    >
                      {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                      {/* Article applied card */}
                      {msg.article && appliedArticleIndex === i && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <div className="flex items-center gap-1.5 text-[#00C9A7]">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="font-semibold">Article applied to editor</span>
                          </div>
                          <p className="text-white/40 mt-1 text-[11px]">
                            Title, body, excerpt, meta description, and category have been filled in. Switch to Settings to adjust metadata, then publish.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div className="flex-shrink-0 p-3 border-t border-white/8">
                <div className="flex gap-2 items-end bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#A78BFA]/40 transition-colors">
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Message AI… (Enter to send)"
                    rows={1}
                    className="flex-1 bg-transparent text-white text-xs leading-relaxed resize-none focus:outline-none placeholder-white/25 max-h-24"
                    style={{ fieldSizing: 'content' } as React.CSSProperties}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-[#A78BFA] hover:bg-[#9061f9] text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {chatLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-white/20 mt-1.5 px-1">
                  Shift+Enter for new line
                </p>
              </div>
            </div>
          )}

          {/* ── Settings panel ────────────────────────────────────────── */}
          {sidebarMode === 'settings' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="glass rounded-xl p-4 border border-white/8 space-y-3">
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
                  <p
                    className={`text-xs mt-1 ${
                      metaDescription.length > 155 ? 'text-[#FF6B6B]' : 'text-white/25'
                    }`}
                  >
                    {metaDescription.length}/155
                  </p>
                </div>

                {/* Featured */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[var(--color-text-muted)]">Featured Article</label>
                  <button
                    onClick={() => setFeatured((f) => !f)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      featured ? 'bg-[#00C9A7]' : 'bg-white/15'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        featured ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Read time */}
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>Estimated read time</span>
                  <span className="text-white font-medium">~{readTimeMin} min</span>
                </div>
              </div>

              {/* Quick tip */}
              <div className="rounded-xl p-3.5 bg-[#A78BFA]/8 border border-[#A78BFA]/15">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#A78BFA] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[#A78BFA] mb-1">AI Chat</p>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Switch to the AI Chat tab to write the full article through conversation, or to ask for edits to specific sections.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
