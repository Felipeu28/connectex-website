'use client'

import { useEffect, useState, use } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { ContactModal } from '@/components/crm/ContactModal'
import { DealModal } from '@/components/crm/DealModal'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { PIPELINE_STAGES, type Contact, type Activity, type Deal } from '@/lib/crm-types'
import { ArrowLeft, Pencil, Mail, Phone, Building2, Briefcase, Clock, Plus, DollarSign, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [contact, setContact] = useState<Contact | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [dealModalOpen, setDealModalOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowser()
      const [contactRes, activityRes, dealsRes] = await Promise.all([
        supabase.from('crm_contacts').select('*').eq('id', id).single(),
        supabase.from('crm_activity').select('*').eq('contact_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.from('crm_deals').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
      ])
      setContact(contactRes.data)
      setActivity(activityRes.data ?? [])
      setDeals(dealsRes.data ?? [])
      setLoading(false)
    })()
  }, [id])

  async function load() {
    const supabase = createSupabaseBrowser()
    const [contactRes, activityRes, dealsRes] = await Promise.all([
      supabase.from('crm_contacts').select('*').eq('id', id).single(),
      supabase.from('crm_activity').select('*').eq('contact_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('crm_deals').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
    ])
    setContact(contactRes.data)
    setActivity(activityRes.data ?? [])
    setDeals(dealsRes.data ?? [])
    setLoading(false)
  }

  async function loadDeals() {
    const supabase = createSupabaseBrowser()
    const { data } = await supabase.from('crm_deals').select('*').eq('contact_id', id).order('created_at', { ascending: false })
    setDeals(data ?? [])
  }

  async function addNote() {
    if (!noteText.trim()) return
    setAddingNote(true)
    const supabase = createSupabaseBrowser()
    await supabase.from('crm_activity').insert({
      type: 'note',
      contact_id: id,
      description: noteText.trim(),
    })
    setNoteText('')
    setAddingNote(false)
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

  if (!contact) {
    return (
      <CRMShell>
        <div className="text-center py-20">
          <p className="text-[var(--color-text-muted)]">Contact not found.</p>
          <Link href="/crm/contacts" className="text-[#00C9A7] text-sm mt-2 inline-block hover:underline">Back to Contacts</Link>
        </div>
      </CRMShell>
    )
  }

  const stage = PIPELINE_STAGES.find((s) => s.key === contact.stage)

  return (
    <CRMShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/crm/contacts" className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{contact.name}</h1>
            {contact.title && contact.company && (
              <p className="text-sm text-[var(--color-text-muted)]">{contact.title} at {contact.company}</p>
            )}
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info Card */}
          <div className="glass rounded-xl p-5 lg:col-span-1 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Details</h2>

            <div className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[var(--color-text-faint)]" />
                  <a href={`mailto:${contact.email}`} className="text-sm text-[#00C9A7] hover:underline">{contact.email}</a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[var(--color-text-faint)]" />
                  <a href={`tel:${contact.phone}`} className="text-sm text-white">{contact.phone}</a>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-[var(--color-text-faint)]" />
                  <span className="text-sm text-white">{contact.company}</span>
                </div>
              )}
              {contact.title && (
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-[var(--color-text-faint)]" />
                  <span className="text-sm text-white">{contact.title}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/8 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-faint)]">Stage</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${stage?.color}20`, color: stage?.color }}>
                  {stage?.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-faint)]">Source</span>
                <span className="text-xs text-white capitalize">{contact.source}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-faint)]">Deal Value</span>
                <span className="text-xs text-white">${Number(contact.deal_value).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-faint)]">Created</span>
                <span className="text-xs text-white">{new Date(contact.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {contact.notes && (
              <div className="pt-3 border-t border-white/8">
                <p className="text-xs text-[var(--color-text-faint)] mb-1">Notes</p>
                <p className="text-sm text-[var(--color-text-muted)] whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </div>

          {/* Activity Feed + Deals */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deals Section */}
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Deals <span className="text-[var(--color-text-faint)]">({deals.length})</span>
                </h2>
                <button
                  onClick={() => setDealModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Deal
                </button>
              </div>

              {deals.length === 0 ? (
                <p className="text-[var(--color-text-muted)] text-sm py-4 text-center">
                  No deals yet. Create one to track opportunities for this contact.
                </p>
              ) : (
                <div className="space-y-2">
                  {deals.map((deal) => {
                    const dealStage = PIPELINE_STAGES.find((s) => s.key === deal.stage)
                    return (
                      <div key={deal.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                        <DollarSign className="w-4 h-4 text-[var(--color-text-faint)] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{deal.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: `${dealStage?.color ?? '#94A3B8'}20`, color: dealStage?.color ?? '#94A3B8' }}
                            >
                              {dealStage?.label ?? deal.stage}
                            </span>
                            {deal.expected_close && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-faint)]">
                                <Calendar className="w-3 h-3" />
                                {new Date(deal.expected_close).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-white flex-shrink-0">
                          ${Number(deal.value).toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div className="glass rounded-xl p-5">
              <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Activity</h2>

              {/* Add Note */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                />
                <button
                  onClick={addNote}
                  disabled={addingNote || !noteText.trim()}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[var(--color-text-muted)] hover:text-white transition-colors disabled:opacity-50"
                  aria-label="Add note"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {activity.length === 0 ? (
                <p className="text-[var(--color-text-muted)] text-sm py-6 text-center">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {activity.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03]">
                      <Clock className="w-4 h-4 text-[var(--color-text-faint)] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{a.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[var(--color-text-faint)] capitalize">{a.type}</span>
                          <span className="text-xs text-[var(--color-text-faint)]">
                            {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ContactModal
        contact={editOpen ? contact : null}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
      />

      <DealModal
        contacts={contact ? [contact] : []}
        defaultContactId={id}
        open={dealModalOpen}
        onClose={() => setDealModalOpen(false)}
        onSaved={loadDeals}
      />
    </CRMShell>
  )
}
