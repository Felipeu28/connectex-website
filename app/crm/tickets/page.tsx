'use client'

import { useEffect, useState } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { TICKET_STATUS_CONFIG, TICKET_PRIORITY_CONFIG } from '@/lib/crm-types'
import type { Ticket } from '@/lib/crm-types'
import { Search, ExternalLink, Bot, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function CRMTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 25

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    (async () => {
      setLoading(true)
      const supabase = createSupabaseBrowser()
      let query = supabase.from('tickets').select('*', { count: 'exact' }).order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      if (search) {
        query = query.or(`subject.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      query = query.range((page - 1) * pageSize, page * pageSize - 1)

      const { data, count } = await query
      setTickets(data ?? [])
      setTotalCount(count ?? 0)
      setLoading(false)
    })()
  }, [search, statusFilter, page])

  async function load() {
    const supabase = createSupabaseBrowser()
    let query = supabase.from('tickets').select('*', { count: 'exact' }).order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }
    if (search) {
      query = query.or(`subject.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    query = query.range((page - 1) * pageSize, page * pageSize - 1)

    const { data, count } = await query
    setTickets(data ?? [])
    setTotalCount(count ?? 0)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  async function updateStatus(ticketId: string, newStatus: string) {
    const supabase = createSupabaseBrowser()
    await supabase.from('tickets').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', ticketId)
    load()
  }

  return (
    <CRMShell>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-0.5">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-faint)]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
          >
            <option value="all">All Status</option>
            {Object.entries(TICKET_STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Subject</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium hidden md:table-cell">Requester</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium hidden xl:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium hidden sm:table-cell">Priority</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium hidden lg:table-cell">Created</th>
                  <th className="text-right px-4 py-3 text-[var(--color-text-muted)] font-medium w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td colSpan={7} className="px-4 py-3"><div className="h-5 bg-white/5 animate-pulse rounded w-3/4" /></td>
                    </tr>
                  ))
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[var(--color-text-muted)]">
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => {
                    const status = TICKET_STATUS_CONFIG[t.status]
                    const priority = TICKET_PRIORITY_CONFIG[t.priority]
                    return (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{t.subject}</p>
                            {t.ai_handled && (
                              <span title="AI handled" className="flex-shrink-0">
                                <Bot className="w-3.5 h-3.5 text-[#C084FC]" />
                              </span>
                            )}
                            {t.routed_to_mark && !t.ai_handled && (
                              <span title="Needs Mark" className="flex-shrink-0">
                                <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--color-text-faint)] mt-0.5 line-clamp-1">{t.description}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-white text-sm">{t.name}</p>
                          <p className="text-xs text-[var(--color-text-faint)]">{t.email}</p>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          {t.contact ? (
                            <Link
                              href={`/crm/contacts/${(Array.isArray(t.contact) ? t.contact[0] : t.contact)?.id}`}
                              className="text-sm text-[#00C9A7] hover:underline"
                            >
                              {(Array.isArray(t.contact) ? t.contact[0] : t.contact)?.name}
                            </Link>
                          ) : (
                            <span className="text-xs text-[var(--color-text-faint)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={t.status}
                            onChange={(e) => updateStatus(t.id, e.target.value)}
                            className="text-xs font-medium px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-[#00C9A7] cursor-pointer"
                            style={{ backgroundColor: `${status?.color ?? '#94A3B8'}20`, color: status?.color ?? '#94A3B8' }}
                          >
                            {Object.entries(TICKET_STATUS_CONFIG).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${priority?.color ?? '#94A3B8'}20`, color: priority?.color ?? '#94A3B8' }}>
                            {priority?.label ?? t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs hidden lg:table-cell">
                          {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/crm/tickets/${t.id}`}
                              className="text-xs text-[#00C9A7] hover:underline"
                            >
                              View
                            </Link>
                            <Link
                              href={`/ticketing/${t.token}`}
                              target="_blank"
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-faint)] hover:text-white transition-colors"
                              title="Open client view"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
              <p className="text-xs text-[var(--color-text-muted)]">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs text-white font-medium">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CRMShell>
  )
}
