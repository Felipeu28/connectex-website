import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/ticket-triage'
import { PortalShell } from '@/components/portal/PortalShell'
import { StatusBadge } from '@/components/ticketing/TicketStatusBadge'
import {
  Plus,
  Ticket,
  Monitor,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'
import type { Ticket as TicketType } from '@/lib/crm-types'

interface ClientProduct {
  id: string
  device_type: string
  manufacturer: string | null
  model: string
  serial_number: string | null
  notes: string | null
}

const statusOrder: Record<string, number> = {
  open: 0,
  in_progress: 1,
  waiting: 2,
  resolved: 3,
  closed: 4,
}

const statusIcon: Record<string, React.ReactNode> = {
  open: <AlertCircle className="w-4 h-4 text-[#00C9A7]" />,
  in_progress: <Clock className="w-4 h-4 text-[#60A5FA]" />,
  waiting: <Clock className="w-4 h-4 text-[#F59E0B]" />,
  resolved: <CheckCircle2 className="w-4 h-4 text-[#A78BFA]" />,
  closed: <CheckCircle2 className="w-4 h-4 text-[#94A3B8]" />,
}

export default async function PortalDashboardPage() {
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/portal/login')
  }

  const userEmail = session.user.email!
  const admin = getSupabaseAdmin()

  // Backfill user_id on historical tickets for this email (runs silently)
  await admin
    .from('tickets')
    .update({ user_id: session.user.id })
    .eq('email', userEmail)
    .is('user_id', null)

  // Fetch all tickets for this client
  const { data: tickets } = await admin
    .from('tickets')
    .select('*')
    .or(`user_id.eq.${session.user.id},email.eq.${userEmail}`)
    .order('updated_at', { ascending: false })

  // Fetch client's device inventory
  const { data: products } = await admin
    .from('client_products')
    .select('*')
    .eq('client_email', userEmail)
    .order('device_type', { ascending: true })

  const activeTickets = (tickets ?? []).filter(
    (t) => !['resolved', 'closed'].includes(t.status)
  )
  const closedTickets = (tickets ?? []).filter((t) =>
    ['resolved', 'closed'].includes(t.status)
  )

  return (
    <PortalShell userEmail={userEmail}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Support Dashboard</h1>
            <p className="text-[#94A3B8] text-sm">{userEmail}</p>
          </div>
          <Link
            href="/portal/tickets/new"
            className="inline-flex items-center gap-2 bg-[#8B2BE2] hover:bg-[#7624c4] text-white font-semibold py-2.5 px-5 rounded-xl transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Open Tickets', value: activeTickets.length, color: '#00C9A7' },
            { label: 'Total Tickets', value: (tickets ?? []).length, color: '#8B2BE2' },
            { label: 'Devices on File', value: (products ?? []).length, color: '#60A5FA' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-5 text-center"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-2xl font-bold text-white mb-1" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs text-[#94A3B8] font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Active tickets */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="w-4 h-4 text-[#8B2BE2]" />
            <h2 className="font-semibold text-white text-sm">Active Tickets</h2>
          </div>

          {activeTickets.length === 0 ? (
            <div
              className="glass rounded-2xl p-8 text-center"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <CheckCircle2 className="w-10 h-10 text-[#00C9A7] mx-auto mb-3 opacity-60" />
              <p className="text-[#94A3B8] text-sm">No open tickets — everything&apos;s running smoothly.</p>
              <Link
                href="/portal/tickets/new"
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-[#00C9A7] hover:underline"
              >
                Submit a new ticket
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTickets.map((ticket: TicketType) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </section>

        {/* Device inventory */}
        {(products ?? []).length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-4 h-4 text-[#60A5FA]" />
              <h2 className="font-semibold text-white text-sm">Your Devices</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {(products as ClientProduct[]).map((product) => (
                <div
                  key={product.id}
                  className="glass rounded-xl p-4"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#60A5FA]/15 border border-[#60A5FA]/25 flex items-center justify-center shrink-0">
                      <Monitor className="w-4 h-4 text-[#60A5FA]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {product.manufacturer ? `${product.manufacturer} ` : ''}{product.model}
                      </p>
                      <p className="text-xs text-[#94A3B8] capitalize">{product.device_type.replace('_', ' ')}</p>
                      {product.serial_number && (
                        <p className="text-xs text-[#4B5563] mt-0.5 font-mono">S/N: {product.serial_number}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Closed tickets */}
        {closedTickets.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-[#94A3B8]" />
              <h2 className="font-semibold text-[#94A3B8] text-sm">Resolved & Closed</h2>
            </div>
            <div className="space-y-2">
              {closedTickets.slice(0, 5).map((ticket: TicketType) => (
                <TicketRow key={ticket.id} ticket={ticket} muted />
              ))}
            </div>
          </section>
        )}
      </div>
    </PortalShell>
  )
}

function TicketRow({ ticket, muted }: { ticket: TicketType; muted?: boolean }) {
  const updatedAt = new Date(ticket.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/portal/tickets/${ticket.token}`}
      className={`flex items-center gap-4 glass rounded-xl p-4 border transition-all group ${
        muted
          ? 'border-white/5 hover:border-white/10'
          : 'border-white/8 hover:border-[#8B2BE2]/30'
      }`}
    >
      <div className="shrink-0">{statusIcon[ticket.status]}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${muted ? 'text-[#94A3B8]' : 'text-white'} group-hover:text-[#00C9A7] transition-colors`}>
          {ticket.subject}
        </p>
        <p className="text-xs text-[#4B5563] mt-0.5">Updated {updatedAt}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <StatusBadge status={ticket.status} />
        <ChevronRight className="w-4 h-4 text-[#4B5563] group-hover:text-[#94A3B8] transition-colors" />
      </div>
    </Link>
  )
}
