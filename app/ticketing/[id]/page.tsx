import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Mail, Building2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { StatusBadge, PriorityBadge } from '@/components/ticketing/TicketStatusBadge'
import { TicketThread } from '@/components/ticketing/TicketThread'
import type { TicketWithMessages } from '@/lib/ticket-types'

interface TicketPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ new?: string }>
}

async function getTicket(token: string): Promise<TicketWithMessages | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tickets')
    .select('*, ticket_messages(*)')
    .eq('token', token)
    .single()

  if (error || !data) return null

  // Sort messages chronologically
  if (data.ticket_messages) {
    data.ticket_messages.sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }

  return data as TicketWithMessages
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function TicketViewPage({ params, searchParams }: TicketPageProps) {
  const { id } = await params
  const { new: isNew } = await searchParams

  const ticket = await getTicket(id)

  if (!ticket) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/ticketing"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Submit another ticket
      </Link>

      {/* New ticket banner */}
      {isNew && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Ticket submitted successfully!</p>
            <p className="text-emerald-400/80 text-xs mt-0.5">
              Bookmark this page to check the status of your ticket. A confirmation has been noted
              for our team.
            </p>
          </div>
        </div>
      )}

      {/* Ticket header */}
      <div className="glass rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-light)]">
          {ticket.subject}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            {formatDate(ticket.created_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            {ticket.email}
          </span>
          {ticket.company && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
              {ticket.company}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="pt-3 border-t border-white/10">
          <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">Description</h2>
          <div className="text-[var(--color-text-light)] text-sm leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </div>
        </div>

        {/* Attachment — inline image */}
        {ticket.image_url && (
          <div className="pt-3 border-t border-white/10">
            <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Attachment</h2>
            <a href={ticket.image_url} target="_blank" rel="noopener noreferrer" className="block group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ticket.image_url}
                alt="Ticket attachment"
                className="rounded-xl max-h-72 w-auto border border-white/10 group-hover:border-[var(--color-accent)]/40 transition-colors"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5 hover:text-[var(--color-accent)]">
                Click to open full size ↗
              </p>
            </a>
          </div>
        )}
      </div>

      {/* Conversation thread */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-[var(--color-text-light)] mb-6">Conversation</h2>
        <TicketThread ticket={ticket} />
      </div>
    </div>
  )
}
