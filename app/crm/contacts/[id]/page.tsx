'use client'

import { useEffect, useState, use } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { ContactModal } from '@/components/crm/ContactModal'
import { DealModal } from '@/components/crm/DealModal'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { PIPELINE_STAGES, type Contact, type Activity, type Deal, type CalendarEvent, type ActivityType } from '@/lib/crm-types'
import { logActivity } from '@/lib/crm-activity'
import {
  ArrowLeft, Pencil, Mail, Phone, Building2, Briefcase, Clock, Plus, DollarSign,
  Calendar, MessageSquare, PhoneCall, Video, FileText, StickyNote, Send, X,
} from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'

type QuickAction = 'note' | 'call' | 'email' | 'meeting' | 'document' | null

const ACTIVITY_ICONS: Record<string, typeof Clock> = {
  note: StickyNote,
  email: Mail,
  call: PhoneCall,
  meeting: Video,
  document: FileText,
  deal_created: DollarSign,
  deal_moved: DollarSign,
  deal_closed: DollarSign,
  contact_created: Plus,
  contact_updated: Pencil,
  stage_change: ArrowLeft,
  default: Clock,
}

const ACTIVITY_COLORS: Record<string, string> = {
  note: '#F59E0B',
  email: '#60A5FA',
  call: '#00C9A7',
  meeting: '#A78BFA',
  document: '#FF6B6B',
  stage_change: '#8B2BE2',
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [contact, setContact] = useState<Contact | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [dealModalOpen, setDealModalOpen] = useState(false)

  // Quick action state
  const [activeAction, setActiveAction] = useState<QuickAction>(null)
  const [actionText, setActionText] = useState('')
  const [actionSubject, setActionSubject] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    const supabase = createSupabaseBrowser()
    const [contactRes, activityRes, dealsRes, eventsRes] = await Promise.all([
      supabase.from('crm_contacts').select('*').eq('id', id).single(),
      supabase.from('crm_activity').select('*').eq('contact_id', id).order('created_at', { ascending: false }).limit(50),
      supabase.from('crm_deals').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
      supabase.from('crm_events').select('*').eq('contact_id', id).order('start_time', { ascending: false }).limit(10),
    ])
    setContact(contactRes.data)
    setActivity(activityRes.data ?? [])
    setDeals(dealsRes.data ?? [])
    setEvents(eventsRes.data ?? [])
    setLoading(false)
  }

  async function submitAction() {
    if (!actionText.trim()) return
    setSubmittingAction(true)
    const type = activeAction as ActivityType
    const subject = actionSubject.trim()
    const body = actionText.trim()

    let description = body
    if (type === 'call') description = `Call log: ${body}`
    if (type === 'email') description = subject ? `Email: ${subject}\n${body}` : `Email draft: ${body}`
    if (type === 'meeting') description = subject ? `Meeting: ${subject}\n${body}` : `Meeting notes: ${body}`
    if (type === 'document') description = subject ? `Document: ${subject}\n${body}` : `Document: ${body}`

    await logActivity({ type, description, contact_id: id })

    setActionText('')
    setActionSubject('')
    setActiveAction(null)
    setSubmittingAction(false)
    load()
  }

  if (loading) {
    return (
      <CRMShell>
        <div className="max-w-5xl mx-auto">
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

  const quickActions = [
    { key: 'note' as const, label: 'Note', icon: StickyNote, color: '#F59E0B' },
    { key: 'call' as const, label: 'Log Call', icon: PhoneCall, color: '#00C9A7' },
    { key: 'email' as const, label: 'Email', icon: Mail, color: '#60A5FA' },
    { key: 'meeting' as const, label: 'Meeting', icon: Video, color: '#A78BFA' },
    { key: 'document' as const, label: 'Document', icon: FileText, color: '#FF6B6B' },
  ]

  const needsSubject = activeAction === 'email' || activeAction === 'meeting' || activeAction === 'document'
  const placeholders: Record<string, string> = {
    note: 'Write a note about this client...',
    call: 'What was discussed on the call?',
    email: 'Paste email content or meeting notes for context...',
    meeting: 'Meeting notes, action items, key takeaways...',
    document: 'Paste document content, proposal details, or contract notes...',
  }

  return (
    <CRMShell>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/crm/contacts" className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{contact.name}</h1>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${stage?.color}20`, color: stage?.color }}
              >
                {stage?.label}
              </span>
            </div>
            {(contact.title || contact.company) && (
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {[contact.title, contact.company].filter(Boolean).join(' at ')}
              </p>
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

        {/* Quick Actions Bar */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {quickActions.map((qa) => {
              const Icon = qa.icon
              const isActive = activeAction === qa.key
              return (
                <button
                  key={qa.key}
                  onClick={() => setActiveAction(isActive ? null : qa.key)}
                  className={clsx(
                    'inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl transition-all',
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-[var(--color-text-muted)] hover:text-white bg-white/5 hover:bg-white/10'
                  )}
                  style={isActive ? { backgroundColor: `${qa.color}25`, color: qa.color, borderColor: `${qa.color}40` } : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {qa.label}
                </button>
              )
            })}
            <div className="flex-1" />
            <button
              onClick={() => { setDealModalOpen(true) }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-[#00C9A7]/10 text-[#00C9A7] hover:bg-[#00C9A7]/20 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Deal
            </button>
          </div>

          {/* Expanded action input */}
          {activeAction && (
            <div className="mt-4 space-y-3">
              {needsSubject && (
                <input
                  type="text"
                  value={actionSubject}
                  onChange={(e) => setActionSubject(e.target.value)}
                  placeholder={activeAction === 'email' ? 'Email subject...' : activeAction === 'meeting' ? 'Meeting title...' : 'Document name...'}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                />
              )}
              <div className="flex gap-2">
                <textarea
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) submitAction() }}
                  placeholder={placeholders[activeAction] ?? 'Write something...'}
                  rows={activeAction === 'note' || activeAction === 'call' ? 2 : 4}
                  className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm resize-none"
                  autoFocus
                />
                <div className="flex flex-col gap-1.5 self-end">
                  <button
                    onClick={submitAction}
                    disabled={submittingAction || !actionText.trim()}
                    className="p-2.5 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] rounded-xl transition-colors disabled:opacity-50"
                    aria-label="Save"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setActiveAction(null); setActionText(''); setActionSubject('') }}
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] rounded-xl transition-colors"
                    aria-label="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-faint)]">Cmd+Enter to save</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left sidebar */}
          <div className="space-y-5">
            {/* Contact Info */}
            <div className="glass rounded-xl p-5 space-y-4">
              <h2 className="text-xs font-semibold text-[var(--color-text-faint)] uppercase tracking-wider">Details</h2>
              <div className="space-y-3">
                {contact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[var(--color-text-faint)]" />
                    <a href={`mailto:${contact.email}`} className="text-sm text-[#00C9A7] hover:underline truncate">{contact.email}</a>
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
                  <span className="text-xs text-[var(--color-text-faint)]">Source</span>
                  <span className="text-xs text-white capitalize">{contact.source}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-faint)]">Deal Value</span>
                  <span className="text-xs text-white font-medium">${Number(contact.deal_value).toLocaleString()}</span>
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

            {/* Deals */}
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-[var(--color-text-faint)] uppercase tracking-wider">
                  Deals <span className="text-[var(--color-text-faint)]">({deals.length})</span>
                </h2>
                <button
                  onClick={() => setDealModalOpen(true)}
                  className="p-1 rounded hover:bg-white/10 text-[var(--color-text-faint)] hover:text-white transition-colors"
                  aria-label="Add deal"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {deals.length === 0 ? (
                <p className="text-[var(--color-text-muted)] text-sm py-3 text-center">No deals yet</p>
              ) : (
                <div className="space-y-2">
                  {deals.map((deal) => {
                    const dealStage = PIPELINE_STAGES.find((s) => s.key === deal.stage)
                    return (
                      <div key={deal.id} className="p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                        <p className="text-sm text-white font-medium truncate">{deal.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${dealStage?.color ?? '#94A3B8'}20`, color: dealStage?.color ?? '#94A3B8' }}
                          >
                            {dealStage?.label ?? deal.stage}
                          </span>
                          <span className="text-xs font-medium text-[#00C9A7]">${Number(deal.value).toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            {events.length > 0 && (
              <div className="glass rounded-xl p-5">
                <h2 className="text-xs font-semibold text-[var(--color-text-faint)] uppercase tracking-wider mb-3">Meetings</h2>
                <div className="space-y-2">
                  {events.slice(0, 5).map((evt) => (
                    <div key={evt.id} className="p-2.5 rounded-lg bg-white/[0.03]">
                      <p className="text-sm text-white font-medium truncate">{evt.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3 h-3 text-[var(--color-text-faint)]" />
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {new Date(evt.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="lg:col-span-2">
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-[var(--color-text-faint)] uppercase tracking-wider">Activity Timeline</h2>
                <span className="text-xs text-[var(--color-text-faint)]">{activity.length} entries</span>
              </div>

              {activity.length === 0 ? (
                <p className="text-[var(--color-text-muted)] text-sm py-8 text-center">
                  No activity yet. Use the quick actions above to start logging.
                </p>
              ) : (
                <div className="space-y-1">
                  {activity.map((a, idx) => {
                    const Icon = ACTIVITY_ICONS[a.type] ?? ACTIVITY_ICONS.default
                    const color = ACTIVITY_COLORS[a.type] ?? '#94A3B8'
                    const isLast = idx === activity.length - 1

                    return (
                      <div key={a.id} className="flex gap-3 group">
                        {/* Timeline line + icon */}
                        <div className="flex flex-col items-center">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${color}15` }}
                          >
                            <Icon className="w-3.5 h-3.5" style={{ color }} />
                          </div>
                          {!isLast && <div className="w-px flex-1 bg-white/8 my-1" />}
                        </div>

                        {/* Content */}
                        <div className={clsx('flex-1 pb-4', !isLast && 'border-b border-transparent')}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{a.description}</p>
                            <span className="text-[10px] text-[var(--color-text-faint)] whitespace-nowrap flex-shrink-0 mt-0.5">
                              {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          <span
                            className="inline-block text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded-full capitalize"
                            style={{ backgroundColor: `${color}15`, color }}
                          >
                            {a.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
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
        onSaved={load}
      />
    </CRMShell>
  )
}
