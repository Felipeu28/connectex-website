'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, User, Shield, Bot } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
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
  const isAI = msg.sender_name === 'ConnectEx AI Support'

  const bubbleColor = isAI
    ? 'bg-[#8B2BE2]/10 border border-[#8B2BE2]/20'
    : isAdmin
    ? 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20'
    : 'glass'

  const nameColor = isAI ? 'text-[#C084FC]' : isAdmin ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-light)]'

  const Icon = isAI ? Bot : isAdmin ? Shield : User

  return (
    <div className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAI
            ? 'bg-[#8B2BE2]/15 text-[#C084FC]'
            : isAdmin
            ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
            : 'bg-white/5 text-[var(--color-text-muted)]'
        }`}
        aria-hidden="true"
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className={`max-w-[75%] ${isAdmin ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 flex-wrap ${isAdmin ? 'justify-end' : ''}`}>
          <span className={`text-sm font-medium ${nameColor}`}>
            {msg.sender_name}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {formatDate(msg.created_at)}
          </span>
        </div>
        <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${bubbleColor} text-[var(--color-text-light)]`}>
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

  // Scroll to bottom when messages change
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase Realtime — listen for new messages on this ticket
  useEffect(() => {
    const supabase = createSupabaseBrowser()

    const channel = supabase
      .channel(`ticket-messages-${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`,
        },
        (payload) => {
          const newMsg = payload.new as TicketMessage
          // Only add if not already in state (avoid duplicates from optimistic updates)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticket.id])

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

      // Realtime will add the message — just clear the input
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
            No messages yet. Our team will respond shortly.
          </p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={threadEndRef} />
      </div>

      {/* Reply form */}
      {isClosed ? (
        <div className="text-center text-[var(--color-text-muted)] text-sm py-4 glass rounded-xl px-4">
          This ticket has been {ticket.status}. If you need further assistance, please submit a new ticket.
        </div>
      ) : (
        <div className="space-y-3">
          <label htmlFor="reply" className="sr-only">Reply message</label>
          <textarea
            id="reply"
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reply... (Ctrl+Enter to send)"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[var(--color-text-light)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all resize-y min-h-[80px] text-sm"
          />
          {error && <p className="text-xs text-[var(--color-cta)]" role="alert">{error}</p>}
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
