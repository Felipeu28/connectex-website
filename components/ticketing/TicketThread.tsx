'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, User, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { TicketMessage, TicketWithMessages } from '@/lib/ticket-types'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function MessageBubble({ msg }: { msg: TicketMessage }) {
  const isAdmin = msg.sender_type === 'admin'

  return (
    <div className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAdmin
            ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
            : 'bg-white/5 text-[var(--color-text-muted)]'
        }`}
        aria-hidden="true"
      >
        {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>
      <div className={`max-w-[75%] ${isAdmin ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-medium text-[var(--color-text-light)]">
            {msg.sender_name}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {formatDate(msg.created_at)}
          </span>
        </div>
        <div
          className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
            isAdmin
              ? 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-text-light)]'
              : 'glass text-[var(--color-text-light)]'
          }`}
        >
          {msg.message.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

interface TicketThreadProps {
  ticket: TicketWithMessages
}

export function TicketThread({ ticket }: TicketThreadProps) {
  const [messages, setMessages] = useState<TicketMessage[]>(ticket.ticket_messages)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const threadEndRef = useRef<HTMLDivElement>(null)

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved'

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = reply.trim()
    if (!trimmed) return

    setSending(true)
    setError(null)

    try {
      const res = await fetch(`/api/tickets/${ticket.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_type: 'client',
          sender_name: ticket.name,
          message: trimmed,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to send message')
      }

      const newMsg: TicketMessage = await res.json()
      setMessages((prev) => [...prev, newMsg])
      setReply('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col">
      {/* Messages */}
      <div className="space-y-4 mb-6">
        {messages.length === 0 ? (
          <p className="text-center text-[var(--color-text-muted)] text-sm py-8">
            No messages yet. Start the conversation below.
          </p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={threadEndRef} />
      </div>

      {/* Reply form */}
      {isClosed ? (
        <div className="text-center text-[var(--color-text-muted)] text-sm py-4 glass rounded-xl px-4">
          This ticket has been {ticket.status}. If you need further assistance, please submit a new
          ticket.
        </div>
      ) : (
        <div className="space-y-3">
          <label htmlFor="reply" className="sr-only">
            Reply message
          </label>
          <textarea
            id="reply"
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reply... (Ctrl+Enter to send)"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[var(--color-text-light)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all resize-y min-h-[80px] text-sm"
          />
          {error && (
            <p className="text-xs text-[var(--color-cta)]" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="cta"
              size="md"
              loading={sending}
              disabled={!reply.trim()}
              icon={<Send className="w-4 h-4" aria-hidden="true" />}
              onClick={handleSend}
            >
              Send Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
