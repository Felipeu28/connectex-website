'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2, Sparkles, RefreshCw, ArrowRight } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

interface ChatSource {
  title: string
  category: string
}

interface Props {
  /** Initial prefilled message in the input — e.g. when user clicks "Ask AI" from a walkthrough */
  initialPrompt?: string
  /** Reset signal — pass a new value to clear the conversation */
  resetKey?: number
}

const WELCOME: ChatMessage = {
  role: 'model',
  content:
    "Hi — I'm the Connectex AI assistant. Ask me anything about phone setup, voicemail, your devices, or an existing ticket. I'll pull the right walkthrough or loop in Mark when I can't.",
}

export function AiChat({ initialPrompt, resetKey }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState(initialPrompt ?? '')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [escalate, setEscalate] = useState(false)
  const [sources, setSources] = useState<ChatSource[]>([])
  const [showEscalateForm, setShowEscalateForm] = useState(false)
  const [escName, setEscName] = useState('')
  const [escEmail, setEscEmail] = useState('')
  const [escCompany, setEscCompany] = useState('')
  const [escalating, setEscalating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt)
  }, [initialPrompt])

  useEffect(() => {
    setMessages([WELCOME])
    setError(null)
    setEscalate(false)
    setSources([])
    setShowEscalateForm(false)
  }, [resetKey])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setError(null)
    setInput('')
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setSending(true)

    try {
      const res = await fetch('/api/ticketing/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.filter((m, i) => i > 0 || m.role !== 'model') }),
      })
      const data = await res.json().catch(() => null)
      if (!data?.reply) {
        setError("Couldn't reach the AI. Please open a ticket below.")
      } else {
        setMessages([...next, { role: 'model', content: data.reply }])
        setEscalate(Boolean(data.escalate))
        setSources(Array.isArray(data.sources) ? data.sources : [])
      }
    } catch {
      setError('Network error. Please open a ticket below.')
    } finally {
      setSending(false)
    }
  }

  async function escalateToTicket() {
    if (!escName.trim() || !escEmail.trim()) return
    setEscalating(true)
    try {
      const res = await fetch('/api/ticketing/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: escName.trim(),
          email: escEmail.trim(),
          company: escCompany.trim() || undefined,
          // Drop the canned welcome message — Mark doesn't need to see it.
          messages: messages.filter((_, i) => i !== 0),
        }),
      })
      const data = await res.json()
      if (res.ok && data?.token) {
        router.push(`/ticketing/${data.token}`)
      } else {
        setError(data?.error ?? 'Failed to create ticket. Please use the form below.')
      }
    } catch {
      setError('Network error escalating. Please use the form below.')
    } finally {
      setEscalating(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          </div>
          <p className="text-sm font-semibold text-white">Connectex AI Assistant</p>
        </div>
        <button
          type="button"
          onClick={() => setMessages([WELCOME])}
          disabled={sending || messages.length <= 1}
          className="text-xs text-[var(--color-text-muted)] hover:text-white inline-flex items-center gap-1 disabled:opacity-40"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div
        ref={scrollRef}
        className="rounded-xl bg-black/30 border border-white/10 p-4 space-y-3 h-72 overflow-y-auto"
      >
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--color-primary)]/90 text-white px-3 py-2 text-sm'
                  : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-white/8 text-[var(--color-text-light)] px-3 py-2 text-sm whitespace-pre-wrap'
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-white/8 text-[var(--color-text-muted)] px-3 py-2 text-sm inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-[var(--color-cta)]/10 border border-[var(--color-cta)]/30 text-[var(--color-cta)] px-3 py-2 text-xs">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask the AI — e.g. 'How do I set up voicemail on my One Talk phone?'"
          className="flex-1 resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] max-h-32"
          disabled={sending}
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !input.trim()}
          className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 disabled:opacity-40 disabled:cursor-not-allowed text-black transition-colors"
          aria-label="Send"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      {sources.length > 0 && (
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Sources: {sources.map((s) => s.title).join(' · ')}
        </p>
      )}

      {escalate && !showEscalateForm && messages.length > 1 && (
        <button
          type="button"
          onClick={() => setShowEscalateForm(true)}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-primary)]/15 hover:bg-[var(--color-primary)]/25 text-[var(--color-primary)] text-sm font-medium transition-colors"
        >
          Open a ticket with this conversation <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}

      {showEscalateForm && (
        <div className="rounded-xl bg-black/20 border border-white/10 p-3 space-y-2">
          <p className="text-xs text-[var(--color-text-muted)]">
            We&apos;ll save this conversation to a ticket so Mark sees the full context — no need to retype.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Your name"
              value={escName}
              onChange={(e) => setEscName(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <input
              type="email"
              placeholder="Your email"
              value={escEmail}
              onChange={(e) => setEscEmail(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <input
            type="text"
            placeholder="Company (optional)"
            value={escCompany}
            onChange={(e) => setEscCompany(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowEscalateForm(false)}
              disabled={escalating}
              className="px-3 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={escalateToTicket}
              disabled={escalating || !escName.trim() || !escEmail.trim()}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-medium hover:bg-[var(--color-primary)]/90 disabled:opacity-40 inline-flex items-center gap-1"
            >
              {escalating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Create ticket
            </button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-[var(--color-text-muted)]">
        AI replies are best-effort and based on Connectex&apos;s knowledge base. Complex issues are routed to Mark.
      </p>
    </div>
  )
}
