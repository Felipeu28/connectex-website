'use client'

import { useEffect, useState } from 'react'
import { listTickets, countNeedsYou, updateTicketStatus } from '@/app/actions/crm'
import { TICKET_STATUS_CONFIG, TICKET_PRIORITY_CONFIG } from '@/lib/crm-types'
import type { Ticket } from '@/lib/crm-types'
import { Search, ExternalLink, Bot, AlertTriangle, Ticket as TicketIcon, Inbox as InboxIcon } from 'lucide-react'
import Link from 'next/link'

const PAGE_SIZE = 25

export default function CRMTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [needsYou, setNeedsYou] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [needsYouCount, setNeedsYouCount] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 250)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, page, needsYou])

  async function load() {
    setLoading(true)
    try {
      const [{ tickets, total }, needsYouNum] = await Promise.all([
        listTickets({ search, status: statusFilter, needsYou, page, pageSize: PAGE_SIZE }),
        countNeedsYou(),
      ])
      setTickets(tickets)
      setTotalCount(total)
      setNeedsYouCount(needsYouNum)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(ticketId: string, newStatus: string) {
    await updateTicketStatus(ticketId, newStatus)
    void load()
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
        <div className="space-y-2">
          <div className="eyebrow"><TicketIcon className="w-3 h-3" />Support Desk</div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets<span className="ml-3 text-[14px] font-mono text-white/40 align-middle">{totalCount.toLocaleString()}</span></h1>
          <p className="text-[13px] text-white/50">Conversations with clients — auto-triaged by AI, routed to you when judgment is needed.</p>
        </div>
      </header>
      <div className="flex items-center gap-2 border-b hairline">
        <TabButton active={!needsYou} onClick={() => { setNeedsYou(false); setPage(1) }} label="All Tickets" />
        <TabButton active={needsYou} onClick={() => { setNeedsYou(true); setPage(1) }} label="Needs You" badge={needsYouCount} tone="warn" icon={<AlertTriangle className="w-3.5 h-3.5" />} />
      </div>
      <div className="surface-2 rounded-xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by subject, name, or email…" className="w-full pl-9 pr-4 h-9 bg-transparent text-[13px] text-white placeholder:text-white/30 focus:outline-none" />
        </div>
        {!needsYou && (
          <div className="flex items-center gap-1 px-1 border-l border-white/5 sm:pl-2">
            <button onClick={() => { setStatusFilter('all'); setPage(1) }} className={`h-7 px-3 rounded-md text-[11.5px] font-medium transition-colors ${statusFilter === 'all' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>All</button>
            {Object.entries(TICKET_STATUS_CONFIG).map(([key, config]) => (
              <button key={key} onClick={() => { setStatusFilter(key); setPage(1) }} className={`h-7 px-3 rounded-md text-[11.5px] font-medium transition-colors flex items-center gap-1.5 ${statusFilter === key ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.color }} />{config.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="surface-2 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b hairline">
              <th className="text-left px-4 py-3 font-semibold text-white/50 text-[11px] tracking-[0.16em] uppercase">Subject</th>
              <th className="text-left px-4 py-3 font-semibold text-white/50 text-[11px] tracking-[0.16em] uppercase hidden md:table-cell">Requester</th>
              <th className="text-left px-4 py-3 font-semibold text-white/50 text-[11px] tracking-[0.16em] uppercase">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-white/50 text-[11px] tracking-[0.16em] uppercase hidden sm:table-cell">Priority</th>
              <th className="text-left px-4 py-3 font-semibold text-white/50 text-[11px] tracking-[0.16em] uppercase hidden lg:table-cell">Created</th>
              <th className="text-right px-4 py-3 font-semibold text-white/50 text-[11px] tracking-[0.16em] uppercase w-28" />
            </tr></thead>
            <tbody>
              {loading ? [...Array(8)].map((_, i) => <tr key={i} className="border-b hairline"><td colSpan={6} className="px-4 py-3.5"><div className="h-5 rounded shimmer w-3/4" /></td></tr>)
              : tickets.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center">
                  <div className="inline-flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg surface-1 flex items-center justify-center mb-3"><InboxIcon className="w-4 h-4 text-white/50" /></div>
                    <div className="text-[13px] font-medium text-white/80">All clear</div>
                    <div className="text-[12px] text-white/40 mt-1 max-w-xs">No tickets match your current filters.</div>
                  </div>
                </td></tr>
              ) : tickets.map((t) => {
                const status = TICKET_STATUS_CONFIG[t.status]
                const priority = TICKET_PRIORITY_CONFIG[t.priority]
                return (
                  <tr key={t.id} className="border-b hairline group hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <Link href={`/crm/tickets/${t.id}`} className="text-white font-medium hover:text-[#00C9A7] transition-colors truncate flex-1">{t.subject}</Link>
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                          {t.ai_handled && <span title="AI handled" className="inline-flex"><Bot className="w-3.5 h-3.5 text-[#C084FC]" /></span>}
                          {t.routed_to_mark && !t.ai_handled && <span title="Needs you" className="inline-flex"><AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" /></span>}
                        </div>
                      </div>
                      <div className="text-[11.5px] text-white/40 mt-0.5 line-clamp-1">{t.description}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-white/80">{t.name}</div>
                      <div className="text-[11.5px] text-white/40 font-mono">{t.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} className="text-[11px] font-medium px-2 py-1 rounded-full border border-white/5 focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 cursor-pointer" style={{ backgroundColor: `${status?.color ?? '#94A3B8'}18`, color: status?.color ?? '#94A3B8' }}>
                        {Object.entries(TICKET_STATUS_CONFIG).map(([key, config]) => <option key={key} value={key} className="bg-[#0F1B2D] text-white">{config.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="pill" style={{ backgroundColor: `${priority?.color ?? '#94A3B8'}18`, color: priority?.color ?? '#94A3B8', borderColor: `${priority?.color ?? '#94A3B8'}33` }}>{priority?.label ?? t.priority}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-[11.5px] text-white/50 font-mono">{new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/crm/tickets/${t.id}`} className="text-[12px] text-[#00C9A7] hover:underline">View</Link>
                        <Link href={`/ticketing/${t.token}`} target="_blank" className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Open client view"><ExternalLink className="w-3.5 h-3.5" /></Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t hairline">
            <p className="text-[11.5px] text-white/40 font-mono">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="h-7 px-3 text-[11.5px] surface-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30">Prev</button>
              <span className="text-[11.5px] text-white/50 px-2 font-mono">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-7 px-3 text-[11.5px] surface-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, label, badge, tone, icon }: { active: boolean; onClick: () => void; label: string; badge?: number; tone?: 'warn'; icon?: React.ReactNode }) {
  const accent = tone === 'warn' ? '#F59E0B' : '#00C9A7'
  return (
    <button onClick={onClick} className="relative px-4 py-2.5 text-[13px] font-medium flex items-center gap-2 transition-colors" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.55)' }}>
      {icon}{label}
      {badge !== undefined && badge > 0 && <span className="pill !text-[10.5px] !py-0 !px-1.5" style={{ backgroundColor: `${accent}20`, color: accent, borderColor: `${accent}40` }}>{badge}</span>}
      {active && <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full" style={{ background: accent }} />}
    </button>
  )
}
