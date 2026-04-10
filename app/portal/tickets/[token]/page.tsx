import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Mail, Building2, CheckCircle, BotMessageSquare } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/ticket-triage'
import { StatusBadge, PriorityBadge } from '@/components/ticketing/TicketStatusBadge'
import { PortalTicketThread } from '@/components/portal/PortalTicketThread'
import { PortalShell } from '@/components/portal/PortalShell'
import type { TicketWithMessages } from '@/lib/ticket-types'

interface Props {
  params: Promise<{ token: string }>
  searchParams: Promise<{ new?: string }>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default async function PortalTicketPage({ params, searchParams }: Props) {
  const { token } = await params
  const { new: isNew } = await searchParams

  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect(`/portal/login`)
  }

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('tickets')
    .select('*, ticket_messages(*)')
    .eq('token', token)
    .single()

  if (error || !data) notFound()

  // Verify this ticket belongs to the authenticated user
  if (data.email !== session.user.email && data.user_id !== session.user.id) {
    redirect('/portal/dashboard')
  }

  // Sort messages chronologically
  if (data.ticket_messages) {
    data.ticket_messages.sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }

  const ticket = data as TicketWithMessages & {
    routed_to_mark?: boolean
    human_took_over?: boolean
    ai_handled?: boolean
  }

  return (
    <PortalShell userEmail={session.user.email!}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Back */}
        <Link
          href="/portal/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {/* New ticket banner */}
        {isNew && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#00C9A7]/10 border border-[#00C9A7]/20 text-[#00C9A7] text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-medium text-white">Ticket submitted — AI is reviewing it now</p>
              <p className="text-[#00C9A7]/80 text-xs mt-0.5">
                You&apos;ll see a response below within seconds. If the AI needs more information, Mark will follow up.
              </p>
            </div>
          </div>
        )}

        {/* AI routing banner */}
        {ticket.routed_to_mark && !ticket.human_took_over && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-sm">
            <BotMessageSquare className="w-5 h-5 text-[#F59E0B] shrink-0" />
            <p className="text-[#F59E0B]">
              This request has been passed to Mark — he&apos;ll follow up personally via this thread.
            </p>
          </div>
        )}

        {/* Ticket header */}
        <div className="glass rounded-2xl p-6 sm:p-8 space-y-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white">{ticket.subject}</h1>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#94A3B8]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(ticket.created_at)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {ticket.email}
            </span>
            {ticket.company && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {ticket.company}
              </span>
            )}
          </div>

          <div className="pt-3 border-t border-white/8">
            <h2 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2">Description</h2>
            <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</div>
          </div>

          {ticket.image_url && (
            <div className="pt-3 border-t border-white/8">
              <h2 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-3">Attachment</h2>
              <a href={ticket.image_url} target="_blank" rel="noopener noreferrer" className="block group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ticket.image_url}
                  alt="Ticket attachment"
                  className="rounded-xl max-h-64 w-auto border border-white/10 group-hover:border-[#00C9A7]/40 transition-colors"
                />
                <p className="text-xs text-[#94A3B8] mt-1.5 hover:text-[#00C9A7]">
                  Click to open full size ↗
                </p>
              </a>
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className="glass rounded-2xl p-6 sm:p-8" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-base font-semibold text-white mb-6">Conversation</h2>
          <PortalTicketThread
            ticket={ticket}
            senderName={session.user.user_metadata?.full_name ?? ticket.name}
          />
        </div>
      </div>
    </PortalShell>
  )
}
