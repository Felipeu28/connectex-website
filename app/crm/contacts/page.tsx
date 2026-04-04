'use client'

import { useEffect, useState } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { ContactModal } from '@/components/crm/ContactModal'
import { ContactImportModal } from '@/components/crm/ContactImportModal'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { PIPELINE_STAGES, type Contact } from '@/lib/crm-types'
import { logActivity } from '@/lib/crm-activity'
import { Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import Link from 'next/link'

const PAGE_SIZE = 25

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    (async () => {
      setLoading(true)
      const supabase = createSupabaseBrowser()
      const from = (page - 1) * PAGE_SIZE
      const to = page * PAGE_SIZE - 1

      let query = supabase
        .from('crm_contacts')
        .select('*', { count: 'exact', head: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (stageFilter !== 'all') {
        query = query.eq('stage', stageFilter)
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
      }

      const { data, count } = await query
      setContacts(data ?? [])
      setTotalCount(count ?? 0)
      setLoading(false)
    })()
  }, [search, stageFilter, page])

  async function loadContacts() {
    setLoading(true)
    const supabase = createSupabaseBrowser()
    const from = (page - 1) * PAGE_SIZE
    const to = page * PAGE_SIZE - 1

    let query = supabase
      .from('crm_contacts')
      .select('*', { count: 'exact', head: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (stageFilter !== 'all') {
      query = query.eq('stage', stageFilter)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
    }

    const { data, count } = await query
    setContacts(data ?? [])
    setTotalCount(count ?? 0)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const target = contacts.find((c) => c.id === id)
    if (!confirm('Delete this contact? This cannot be undone.')) return
    const supabase = createSupabaseBrowser()
    await supabase.from('crm_contacts').delete().eq('id', id)
    await logActivity({
      type: 'contact_updated',
      description: `Deleted contact: ${target?.name ?? 'Unknown'}`,
      contact_id: id,
    })
    loadContacts()
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount)

  return (
    <CRMShell>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Contacts</h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-0.5">
              {totalCount} contact{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm rounded-xl transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <button
              onClick={() => { setEditContact(null); setModalOpen(true) }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] font-semibold text-sm rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-faint)]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPage(1) }}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
          >
            <option value="all">All Stages</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium hidden md:table-cell">Company</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Stage</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium hidden lg:table-cell">Value</th>
                  <th className="text-right px-4 py-3 text-[var(--color-text-muted)] font-medium w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td colSpan={6} className="px-4 py-3"><div className="h-5 bg-white/5 animate-pulse rounded w-3/4" /></td>
                    </tr>
                  ))
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-text-muted)]">
                      No contacts found. Add your first contact to get started.
                    </td>
                  </tr>
                ) : (
                  contacts.map((c) => {
                    const stage = PIPELINE_STAGES.find((s) => s.key === c.stage)
                    return (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/crm/contacts/${c.id}`} className="text-white font-medium hover:text-[#00C9A7] transition-colors">
                            {c.name}
                          </Link>
                          {c.title && <p className="text-xs text-[var(--color-text-faint)]">{c.title}</p>}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)] hidden md:table-cell">{c.company ?? '---'}</td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)] hidden sm:table-cell">{c.email ?? '---'}</td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ backgroundColor: `${stage?.color ?? '#94A3B8'}20`, color: stage?.color ?? '#94A3B8' }}
                          >
                            {stage?.label ?? c.stage}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)] hidden lg:table-cell">
                          ${Number(c.deal_value).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditContact(c); setModalOpen(true) }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors"
                              aria-label={`Edit ${c.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-1.5 rounded-lg hover:bg-[#FF6B6B]/20 text-[var(--color-text-muted)] hover:text-[#FF6B6B] transition-colors"
                              aria-label={`Delete ${c.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
          {totalCount > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
              <p className="text-xs text-[var(--color-text-muted)]">
                Showing {rangeStart}&ndash;{rangeEnd} of {totalCount} contacts
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <span className="text-xs text-[var(--color-text-muted)] px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ContactModal
        contact={editContact}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditContact(null) }}
        onSaved={loadContacts}
      />
      <ContactImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(count) => { loadContacts(); setImportOpen(false) }}
      />
    </CRMShell>
  )
}
