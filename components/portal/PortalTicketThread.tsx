'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Send, User, Shield, Bot, Loader2 } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { TicketMessage, TicketWithMessages } from '@/lib/ticket-types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function MessageBubble({ msg }: { msg: TicketMessage }) {
  const isAI = msg.sender_type === 'ai' || msg.sender_name === 'Connectex AI Support'
  const isAdmin = msg.sender_type === 'admin' && !isAI

  let bubbleBg = 'bg-white/4 border border-white/8'
  let nameColor = 'text-white'
  let Icon = User

  if (isAI) {
    bubbleBg = 'bg-[#8B2BE2]/10 border border-[#8B2BE2]/20'
    nameColor = 'text-[#C084FC]'
    Icon = Bot
  } else if (isAdmin) {
    bubbleBg = 'bg-[#00C9A7]/10 border border-[#00C9A7]/20'
    nameColor = 'text-[#00C9A7]'
    Icon = Shield
  }

  const alignRight = isAdmin

  return (
    <div className={`flex gap-3 ${alignRight ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAI
            ? 'bg-[#8B2BE2]/15 text-[#C084FC]'
            : isAdmin
            ? 'bg-[#00C9A7]/10 text-[#00C9A7]'
            : 'bg-white/5 text-[#94A3B8]'
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] ${alignRight ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 flex-wrap ${alignRight ? 'justify-end' : ''}`}>
          <span className={`text-xs font-semibold ${nameColor}`}>{msg.sender_name}</span>
          <span className="text-xs text-[#4B5563]">{formatDate(msg.created_at)}</span>
        </div>
        <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${bubbleBg} text-white/85`}>
          {msg.message.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>{line || <br />}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

function AITypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-[#8B2BE2]/15 text-[#C084FC] flex items-center justify-center">
        <Bot className="w-4 h-4" />
      </div>
      <div className="max-w-[78%]">
        <p className="text-xs font-semibold text-[#C084FC] mb-1">Connectex AI Support</p>
        <div className="rounded-xl px-4 py-3 bg-[#8B2BE2]/10 border border-[#8B2BE2]/20 inline-flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 text-[#C084FC] animate-spin" />
          <span className="text-xs text-[#C084FC]">Reviewing your message…</span>
        </div>
      </div>
    </div>
  )
}

interface PortalTicketThreadProps {
  ticket: TicketWithMessages & {
    routed_to_mark?: boolean
    human_took_over?: boolean
  }
  senderName: string
}

export function PortalTicketThread({ ticket, senderName }: PortalTicketThreadProps) {
  const [messages, setMessages] = useState<TicketMessage[]>(ticket.ticket_messages)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [aiTyping, setAiTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const threadEndRef = useRef<HTMLDivElement>(null)
  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved'

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiTyping])

  // Supabase Realtime — listen for new messages (including AI responses)
  useEffect(() => {
    const supabase = createSupabaseBrowser()
    const channel = supabase
      .channel(`portal-ticket-${ticket.id}`)
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
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Hide AI typing indicator when AI message arrives
          if (newMsg.sender_type === 'ai' || newMsg.sender_name === 'Connectex AI Support') {
            setAiTyping(false)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ticket.id])

  const handleSend = async () => {
    const trimmed = reply.trim()
    if (!trimmed || sending) return

    setSending(true)
    setError(null)
    setReply('')

    // Show AI typing indicator immediately (unless human has taken over)
    if (!ticket.human_took_over && !ticket.routed_to_mark) {
      setAiTyping(true)
    }

    try {
      const res = await fetch(`/api/tickets/${ticket.token}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sender_name: senderName || ticket.name,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to send message')
      }

      // Messages will arrive via Realtime — no need to update state manually
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      setAiTyping(false)
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
    <div className="flex flex-col gap-6">
      {/* Messages */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <Bot className="w-10 h-10 text-[#8B2BE2]/40 mx-auto mb-3" />
            <p className="text-[#94A3B8] text-sm">
              {ticket.human_took_over || ticket.routed_to_mark
                ? 'Mark will respond to this ticket shortly.'
                : 'AI is reviewing your ticket and will respond shortly.'}
            </p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}

        {/* AI typing indicator */}
        {aiTyping && <AITypingIndicator />}

        <div ref={threadEndRef} />
      </div>

      {/* Reply form */}
      {isClosed ? (
        <div className="text-center text-[#94A3B8] text-sm py-4 glass rounded-xl px-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          This ticket has been {ticket.status}.{' '}
          <Link href="/portal/tickets/new" className="text-[#00C9A7] hover:underline">
            Submit a new ticket
          </Link>{' '}
          if you need further assistance.
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder={
              ticket.routed_to_mark && !ticket.human_took_over
                ? 'Add more details for Mark… (Ctrl+Enter to send)'
                : 'Reply to this ticket… (Ctrl+Enter to send)'
            }
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#8B2BE2] focus:border-transparent transition-all resize-y min-h-[80px] text-sm disabled:opacity-60"
          />
          {error && <p className="text-xs text-[#FF6B6B]" role="alert">{error}</p>}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#4B5563]">Ctrl+Enter to send</p>
            <button
              type="button"
              onClick={handleSend}
              disabled={!reply.trim() || sending}
              className="inline-flex items-center gap-2 bg-[#8B2BE2] hover:bg-[#7624c4] text-white font-semibold py-2.5 px-5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
