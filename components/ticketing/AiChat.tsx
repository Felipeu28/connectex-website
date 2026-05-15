'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, Sparkles, RefreshCw } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'model'
  content: string
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
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState(initialPrompt ?? '')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt)
  }, [initialPrompt])

  useEffect(() => {
    setMessages([WELCOME])
    setError(null)
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
        setError('Couldn\'t reach the AI. Please open a ticket below.')
      } else {
        setMessages([...next, { role: 'model', content: data.reply }])
      }
    } catch {
      setError('Network error. Please open a ticket below.')
    } finally {
      setSending(false)
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
      <p className="text-[10px] text-[var(--color-text-muted)]">
        AI replies are best-effort and based on Connectex&apos;s knowledge base. Complex issues are routed to Mark.
      </p>
    </div>
  )
}
