'use client'

import { useEffect, useState } from 'react'
import { ContactModal } from '@/components/crm/ContactModal'
import { ContactImportModal } from '@/components/crm/ContactImportModal'
import { listContacts, deleteContact as deleteContactAction } from '@/app/actions/crm'
import { PIPELINE_STAGES, type Contact } from '@/lib/crm-types'
import { Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight, Upload, Users, Filter, Download, MoreHorizontal } from 'lucide-react'
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

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 250)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    void loadContacts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, stageFilter, page])

  async function loadContacts() {
    setLoading(true)
    try {
      const { contacts, total } = await listContacts({ search, stage: stageFilter, page, pageSize: PAGE_SIZE })
      setContacts(contacts)
      setTotalCount(total)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact? This cannot be undone.')) return
    await deleteContactAction(id)
    void loadContacts()
  }

  function initials(name: string) { return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() }
  function avatarColor(name: string) {
    const palette = ['#8B2BE2', '#4B6CF7', '#00C9A7', '#F59E0B', '#FF6B6B', '#60A5FA', '#A78BFA']
    let h = 0
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
    return palette[Math.abs(h) % palette.length]
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount)

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
          <div className="space-y-2">
            <div className="eyebrow"><Users className="w-3 h-3" />Directory</div>
            <h1 className="text-3xl font-bold tracking-tight">Contacts<span className="ml-3 text-[14px] font-mono text-white/40 align-middle">{totalCount.toLocaleString()}</span></h1>
            <p className="text-[13px] text-white/50">Every person, prospect, and active client moving through your practice.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg surface-1 hover:bg-white/10 text-[12.5px] font-medium text-white/80 transition-colors"><Upload className="w-3.5 h-3.5" />Import CSV</button>
            <Link href="/crm/contacts/import" className="inline-flex items-center gap-2 h-9 px-3 rounded-lg surface-1 hover:bg-white/10 text-[12.5px] font-medium text-white/80 transition-colors"><Download className="w-3.5 h-3.5 rotate-180" />Airtable Sync</Link>
            <button onClick={() => { setEditContact(null); setModalOpen(true) }} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-[#8B2BE2] to-[#4B6CF7] hover:shadow-[0_8px_28px_-8px_rgba(139,43,226,0.7)] text-white text-[12.5px] font-semibold transition-shadow"><Plus className="w-3.5 h-3.5" />New Contact</button>
          </div>
        </header>
        <div className="surface-2 rounded-xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input type="text" value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setPage(1) }} placeholder="Search by name, email, or company…" className="w-full pl-9 pr-4 h-9 bg-transparent text-[13px] text-white placeholder:text-white/30 focus:outline-none" />
          </div>
          <div className="flex items-center gap-1 px-1 border-l border-white/5 sm:pl-2">
            <Filter className="w-3.5 h-3.5 text-white/40 ml-2" />
            <button onClick={() => { setStageFilter('all'); setPage(1) }} className={`h-7 px-3 rounded-md text-[11.5px] font-medium transition-colors ${stageFilter === 'all' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>All</button>
            {PIPELINE_STAGES.map((s) => (
              <button key={s.key} onClick={() => { setStageFilter(s.key); setPage(1) }} className={`h-7 px-3 rounded-md text-[11.5px] font-medium transition-colors flex items-center gap-1.5 ${stageFilter === s.key ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />{s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="surface-2 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead><tr className="border-b hairline">
                <th className="text-left px-4 py-3 font-semibold text-white/50 text-[11px] tracking-[0.16em] uppercase">Contact</th>
                <th className="text-left px-4 py-3 font-semibold text-white/50 text-[11px] tracking-[0.16em] uppercase hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-3 font-semibold text-white/50 text-[11px] tracking-[0.16em] uppercase">Stage</th>
                <th className="text-right px-4 py-3 font-semibold text-white/50 text-[11px] tracking-[0.16em] uppercase hidden lg:table-cell">Value</th>
                <th className="text-right px-4 py-3 font-semibold text-white/50 text-[11px] tracking-[0.16em] uppercase w-20" />
              </tr></thead>
              <tbody>
                {loading ? [...Array(8)].map((_, i) => <tr key={i} className="border-b hairline"><td colSpan={5} className="px-4 py-3.5"><div className="h-5 rounded shimmer w-3/4" /></td></tr>)
                : contacts.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-16 text-center">
                    <div className="inline-flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-lg surface-1 flex items-center justify-center mb-3"><Users className="w-4 h-4 text-white/50" /></div>
                      <div className="text-[13px] font-medium text-white/80">No contacts found</div>
                      <div className="text-[12px] text-white/40 mt-1 max-w-xs">Try clearing filters or add your first contact.</div>
                    </div>
                  </td></tr>
                ) : contacts.map((c) => {
                  const stage = PIPELINE_STAGES.find((s) => s.key === c.stage)
                  return (
                    <tr key={c.id} className="border-b hairline group hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg, ${avatarColor(c.name)}, ${avatarColor(c.name)}99)` }}>{initials(c.name)}</div>
                          <div className="min-w-0">
                            <Link href={`/crm/contacts/${c.id}`} className="text-white font-medium hover:text-[#00C9A7] transition-colors truncate block">{c.name}</Link>
                            <div className="text-[11.5px] text-white/40 truncate font-mono">{c.email ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-white/80">{c.company ?? '—'}</div>
                        {c.title && <div className="text-[11.5px] text-white/40">{c.title}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="pill" style={{ backgroundColor: `${stage?.color ?? '#94A3B8'}18`, color: stage?.color ?? '#94A3B8', borderColor: `${stage?.color ?? '#94A3B8'}33` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage?.color ?? '#94A3B8' }} />{stage?.label ?? c.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell font-mono text-white/70">${Number(c.deal_value).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditContact(c); setModalOpen(true) }} className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white" aria-label={`Edit ${c.name}`}><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md hover:bg-[#FF6B6B]/15 text-white/60 hover:text-[#FF6B6B]" aria-label={`Delete ${c.name}`}><Trash2 className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white" aria-label="More"><MoreHorizontal className="w-3.5 h-3.5" /></button>
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
              <p className="text-[11.5px] text-white/40 font-mono">{rangeStart}–{rangeEnd} of {totalCount.toLocaleString()}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 h-7 px-2.5 text-[11.5px] surface-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="w-3 h-3" />Prev</button>
                <span className="text-[11.5px] text-white/50 px-2 font-mono">{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="inline-flex items-center gap-1 h-7 px-2.5 text-[11.5px] surface-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed">Next<ChevronRight className="w-3 h-3" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ContactModal contact={editContact} open={modalOpen} onClose={() => { setModalOpen(false); setEditContact(null) }} onSaved={loadContacts} />
      <ContactImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={() => { void loadContacts(); setImportOpen(false) }} />
    </>
  )
}
