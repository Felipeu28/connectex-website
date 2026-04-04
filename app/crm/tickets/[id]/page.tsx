'use client'

import { useEffect, useState, use } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { TICKET_STATUS_CONFIG } from '@/lib/crm-types'
import type { Ticket } from '@/lib/crm-types'
import { ArrowLeft, Send, ExternalLink, User, Bot, AlertTriangle, Search, X } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'

interface TicketMessage {
  id: string
  ticket_id: string
  sender_type: 'client' | 'admin'
  sender_name: string
  message: string
  created_at: string
}

interface ContactOption {
  id: string
  name: string
  email: string | null
  company: string | null
}

export default function CRMTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  // Contact assignment
  const [assignOpen, setAssignOpen] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [contactResults, setContactResults] = useState<ContactOption[]>([])
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function load() {
    const supabase = createSupabaseBrowser()
    const [ticketRes, msgsRes] = await Promise.all([
      supabase
        .from('tickets')
        .select('*, contact:crm_contacts(id, name, email)')
        .eq('id', id)
        .single(),
      supabase.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true }),
    ])
    setTicket(ticketRes.data as Ticket | null)
    setMessages(msgsRes.data ?? [])
    setLoading(false)
  }

  // Search contacts for assignment
  useEffect(() => {
    if (!contactSearch.trim()) {
      setContactResults([])
      return
    }
    const timer = setTimeout(async () => {
      const supabase = createSupabaseBrowser()
      const { data } = await supabase
        .from('crm_contacts')
        .select('id, name, email, company')
        .or(`name.ilike.%${contactSearch}%,email.ilike.%${contactSearch}%,company.ilike.%${contactSearch}%`)
        .limit(8)
      setContactResults(data ?? [])
    }, 250)
    return () => clearTimeout(timer)
  }, [contactSearch])

  async function assignContact(contactId: string) {
    if (!ticket) return
    setAssigning(true)
    const supabase = createSupabaseBrowser()
    await supabase
      .from('tickets')
      .update({ contact_id: contactId, updated_at: new Date().toISOString() })
      .eq('id', ticket.id)
    setAssignOpen(false)
    setContactSearch('')
    setAssigning(false)
    load()
  }

  async function unassignContact() {
    if (!ticket) return
    const supabase = createSupabaseBrowser()
    await supabase
      .from('tickets')
      .update({ contact_id: null, updated_at: new Date().toISOString() })
      .eq('id', ticket.id)
    load()
  }

  async function sendReply() {
    if (!reply.trim() || !ticket) return
    setSending(true)
    const supabase = createSupabaseBrowser()
    await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_type: 'admin',
      sender_name: 'Mark',
      message: reply.trim(),
    })
    setReply('')
    setSending(false)
    load()
  }

  async function updateStatus(newStatus: string) {
    if (!ticket) return
    const supabase = createSupabaseBrowser()
    await supabase.from('tickets').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', ticket.id)
    load()
  }

  if (loading) {
    return (
      <CRMShell>
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-white/5 animate-pulse rounded mb-6" />
          <div className="glass rounded-xl p-6 space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-5 bg-white/5 animate-pulse rounded w-3/4" />)}
          </div>
        </div>
      </CRMShell>
    )
  }

  if (!ticket) {
    return (
      <CRMShell>
        <div className="text-center py-20">
          <p className="text-[var(--color-text-muted)]">Ticket not found.</p>
          <Link href="/crm/tickets" className="text-[#00C9A7] text-sm mt-2 inline-block hover:underline">Back to Tickets</Link>
        </div>
      </CRMShell>
    )
  }

  const status = TICKET_STATUS_CONFIG[ticket.status]
  const linkedContact = Array.isArray(ticket.contact) ? ticket.contact[0] : ticket.contact

  return (
    <CRMShell>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href="/crm/tickets" className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] transition-colors mt-0.5">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
              {ticket.ai_handled && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#8B2BE2]/20 text-[#C084FC] flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  AI Handled
                </span>
              )}
              {ticket.routed_to_mark && !ticket.ai_handled && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Needs Mark
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm text-[var(--color-text-muted)]">{ticket.name} &middot; {ticket.email}</span>
              {ticket.company && <span className="text-sm text-[var(--color-text-faint)]">{ticket.company}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={ticket.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-[#00C9A7] cursor-pointer"
              style={{ backgroundColor: `${status?.color}20`, color: status?.color }}
            >
              {Object.entries(TICKET_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <Link
              href={`/ticketing/${ticket.token}`}
              target="_blank"
              className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors"
              title="Open client view"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Contact link panel */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--color-text-muted)]" />
              <span className="text-sm font-medium text-[var(--color-text-muted)]">CRM Contact</span>
            </div>
            {linkedContact ? (
              <div className="flex items-center gap-3">
                <Link
                  href={`/crm/contacts/${linkedContact.id}`}
                  className="flex items-center gap-2 text-sm text-[#00C9A7] hover:underline"
                >
                  <span className="w-6 h-6 rounded-full bg-[#00C9A7]/15 flex items-center justify-center text-xs font-bold text-[#00C9A7]">
                    {linkedContact.name.charAt(0).toUpperCase()}
                  </span>
                  {linkedContact.name}
                </Link>
                <button
                  onClick={unassignContact}
                  className="p-1 rounded hover:bg-white/10 text-[var(--color-text-faint)] hover:text-[#FF6B6B] transition-colors"
                  title="Remove contact link"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAssignOpen((v) => !v)}
                className="text-xs text-[#00C9A7] hover:underline flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                Assign Contact
              </button>
            )}
          </div>

          {/* Contact search dropdown */}
          {assignOpen && (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search by name, email, or company..."
                autoFocus
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
              />
              {contactResults.length > 0 && (
                <div className="border border-white/10 rounded-lg overflow-hidden">
                  {contactResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => assignContact(c.id)}
                      disabled={assigning}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                    >
                      <span className="w-7 h-7 rounded-full bg-[#00C9A7]/15 flex items-center justify-center text-xs font-bold text-[#00C9A7] flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm text-white font-medium">{c.name}</p>
                        <p className="text-xs text-[var(--color-text-faint)]">{c.email}{c.company ? ` · ${c.company}` : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Original description + attachment */}
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-[var(--color-text-faint)] mb-2">
            Submitted {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
          <p className="text-sm text-white whitespace-pre-wrap">{ticket.description}</p>
          {ticket.image_url && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-[var(--color-text-faint)] mb-2">Attachment</p>
              <a href={ticket.image_url} target="_blank" rel="noopener noreferrer" className="block group w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ticket.image_url}
                  alt="Ticket attachment"
                  className="rounded-lg max-h-64 w-auto border border-white/10 group-hover:border-[#00C9A7]/40 transition-colors"
                />
                <p className="text-xs text-[var(--color-text-faint)] mt-1 group-hover:text-[#00C9A7]">
                  Open full size ↗
                </p>
              </a>
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Conversation</h2>

          {messages.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-sm py-4 text-center">No messages yet. Send a reply below.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={clsx(
                    'p-3 rounded-lg max-w-[85%]',
                    m.sender_type === 'admin'
                      ? m.sender_name === 'ConnectEx AI Support'
                        ? 'ml-auto bg-[#8B2BE2]/10 border border-[#8B2BE2]/20'
                        : 'ml-auto bg-[#00C9A7]/10 border border-[#00C9A7]/20'
                      : 'bg-white/[0.03] border border-white/5'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {m.sender_name === 'ConnectEx AI Support' && <Bot className="w-3 h-3 text-[#C084FC]" />}
                    <span className={clsx(
                      'text-xs font-medium',
                      m.sender_name === 'ConnectEx AI Support' ? 'text-[#C084FC]' :
                      m.sender_type === 'admin' ? 'text-[#00C9A7]' : 'text-white'
                    )}>
                      {m.sender_name}
                    </span>
                    <span className="text-xs text-[var(--color-text-faint)]">
                      {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-white whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply box */}
          <div className="flex gap-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) sendReply() }}
              placeholder="Type your reply... (Cmd+Enter to send)"
              rows={2}
              className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm resize-none"
            />
            <button
              onClick={sendReply}
              disabled={sending || !reply.trim()}
              className="px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] font-semibold rounded-xl transition-colors disabled:opacity-50 self-end"
              aria-label="Send reply"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </CRMShell>
  )
}
