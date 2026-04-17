'use client'

import { useEffect, useState, useCallback } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { PIPELINE_STAGES, type Campaign, type PipelineStage } from '@/lib/crm-types'
import { Plus, Sparkles, Pencil, Trash2, X, Eye, Send, Users, Filter, Loader2, CheckCircle2, AlertCircle, Search, Clock, UserCheck } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#94A3B8' },
  scheduled: { label: 'Scheduled', color: '#60A5FA' },
  sending: { label: 'Sending', color: '#F59E0B' },
  sent: { label: 'Sent', color: '#00C9A7' },
  paused: { label: 'Paused', color: '#FF6B6B' },
}

type RecipientFilter = 'all' | { stage: PipelineStage } | { ids: string[] }

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null)

  // Editor state
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Send modal state
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendCampaign, setSendCampaign] = useState<Campaign | null>(null)
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('all')
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; sent: number; failed: number; errors?: string[] } | null>(null)

  // Specific-contacts picker state
  const [contactSearch, setContactSearch] = useState('')
  const [contactSearchResults, setContactSearchResults] = useState<{ id: string; name: string; email: string | null; company: string | null }[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Map<string, { name: string; email: string | null }>>(new Map())
  const [searchingContacts, setSearchingContacts] = useState(false)

  // Schedule state
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowser()
    const { data } = await supabase.from('crm_campaigns').select('*').order('created_at', { ascending: false })
    setCampaigns(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    ;(async () => {
      await load()
    })()
  }, [load])

  // Specific-contacts count is purely derivable — no effect needed.
  const isSpecificIds = recipientFilter !== 'all' && 'ids' in recipientFilter
  const displayRecipientCount = isSpecificIds
    ? (recipientFilter as { ids: string[] }).ids.length
    : recipientCount

  // Only query the DB for 'all' / 'stage' filters. For the ids case the count
  // is derived above, so we skip the effect entirely.
  useEffect(() => {
    if (!sendModalOpen || isSpecificIds) return

    ;(async () => {
      setLoadingCount(true)
      const supabase = createSupabaseBrowser()

      let query = supabase
        .from('crm_contacts')
        .select('id', { count: 'exact', head: true })
        .not('email', 'is', null)

      if (recipientFilter !== 'all' && 'stage' in recipientFilter) {
        query = query.eq('stage', recipientFilter.stage)
      }

      const { count } = await query
      setRecipientCount(count ?? 0)
      setLoadingCount(false)
    })()
  }, [sendModalOpen, recipientFilter, isSpecificIds])

  // Contact search (debounced). All setState happens inside the async
  // timeout callback — not synchronously in the effect body.
  useEffect(() => {
    const query = contactSearch.trim()
    const timer = setTimeout(async () => {
      if (!query) {
        setContactSearchResults([])
        return
      }
      setSearchingContacts(true)
      const supabase = createSupabaseBrowser()
      const { data } = await supabase
        .from('crm_contacts')
        .select('id, name, email, company')
        .not('email', 'is', null)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
        .limit(10)
      setContactSearchResults(data ?? [])
      setSearchingContacts(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [contactSearch])

  function openEditor(campaign?: Campaign) {
    if (campaign) {
      setEditCampaign(campaign)
      setName(campaign.name)
      setSubject(campaign.subject)
      setBody(campaign.body)
    } else {
      setEditCampaign(null)
      setName('')
      setSubject('')
      setBody('')
    }
    setAiPrompt('')
    setAiError(null)
    setSaveError(null)
    setEditorOpen(true)
  }

  async function saveCampaign() {
    if (!name.trim() || !subject.trim() || !body.trim()) return
    setSaving(true)
    setSaveError(null)
    const supabase = createSupabaseBrowser()

    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
      status: 'draft' as const,
      updated_at: new Date().toISOString(),
    }

    const { error } = editCampaign
      ? await supabase.from('crm_campaigns').update(payload).eq('id', editCampaign.id)
      : await supabase.from('crm_campaigns').insert(payload)

    setSaving(false)

    if (error) {
      setSaveError(error.message)
      return
    }

    setEditorOpen(false)
    load()
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Delete this campaign?')) return
    const supabase = createSupabaseBrowser()
    await supabase.from('crm_campaigns').delete().eq('id', id)
    load()
  }

  async function generateWithAI() {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    setAiError(null)

    try {
      const res = await fetch('/api/crm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', prompt: aiPrompt }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setAiError(data?.error ?? `AI generation failed (${res.status})`)
      } else if (data) {
        if (data.subject) setSubject(data.subject)
        if (data.body) setBody(data.body)
        if (data.name && !name) setName(data.name)
      } else {
        setAiError('AI generation returned an empty response.')
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Network error contacting AI.')
    }

    setGenerating(false)
  }

  function openSendModal(campaign: Campaign) {
    setSendCampaign(campaign)
    setRecipientFilter('all')
    setRecipientCount(null)
    setSendResult(null)
    setSending(false)
    setContactSearch('')
    setContactSearchResults([])
    setSelectedContacts(new Map())
    setScheduleMode(false)
    setScheduledAt('')
    setSendModalOpen(true)
  }

  function closeSendModal() {
    const wasSuccess = sendResult?.success
    setSendModalOpen(false)
    setSendCampaign(null)
    setSendResult(null)
    setSelectedContacts(new Map())
    setContactSearch('')
    if (wasSuccess) {
      load()
    }
  }

  function toggleContact(c: { id: string; name: string; email: string | null }) {
    setSelectedContacts((prev) => {
      const next = new Map(prev)
      if (next.has(c.id)) {
        next.delete(c.id)
      } else {
        next.set(c.id, { name: c.name, email: c.email })
      }
      setRecipientFilter({ ids: [...next.keys()] })
      return next
    })
  }

  async function handleSend() {
    if (!sendCampaign || sending) return
    setSending(true)
    setSendResult(null)

    // Schedule mode: just save scheduled_at, don't send now
    if (scheduleMode) {
      if (!scheduledAt) { setSending(false); return }
      try {
        const supabase = createSupabaseBrowser()
        await supabase
          .from('crm_campaigns')
          .update({ status: 'scheduled', scheduled_at: new Date(scheduledAt).toISOString(), updated_at: new Date().toISOString() })
          .eq('id', sendCampaign.id)
        setSendResult({ success: true, sent: 0, failed: 0 })
        load()
      } catch {
        setSendResult({ success: false, sent: 0, failed: 0, errors: ['Failed to schedule campaign'] })
      }
      setSending(false)
      return
    }

    try {
      const filterPayload = recipientFilter === 'all' ? 'all' : recipientFilter
      const res = await fetch('/api/crm/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: sendCampaign.id, filter: filterPayload }),
      })

      const data = await res.json()

      if (res.ok) {
        setSendResult({ success: true, sent: data.sent, failed: data.failed, errors: data.errors })
        load()
      } else {
        setSendResult({ success: false, sent: 0, failed: 0, errors: [data.error || 'Failed to send campaign'] })
        load()
      }
    } catch {
      setSendResult({ success: false, sent: 0, failed: 0, errors: ['Network error — could not reach server'] })
    }

    setSending(false)
  }

  return (
    <CRMShell>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Email Campaigns</h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-0.5">
              {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => openEditor()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] font-semibold text-sm rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        {/* Campaign List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-40 glass rounded-xl animate-pulse" />)
          ) : campaigns.length === 0 ? (
            <div className="col-span-full glass rounded-xl p-10 text-center">
              <p className="text-[var(--color-text-muted)]">No campaigns yet. Create your first one.</p>
            </div>
          ) : (
            campaigns.map((c) => {
              const status = STATUS_CONFIG[c.status]
              const canSend = c.status === 'draft' || c.status === 'paused'
              return (
                <div key={c.id} className="glass rounded-xl p-5 hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${status?.color}20`, color: status?.color }}
                    >
                      {status?.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {canSend && (
                        <button
                          onClick={() => openSendModal(c)}
                          className="p-1.5 rounded-lg hover:bg-[#00C9A7]/20 text-[var(--color-text-faint)] hover:text-[#00C9A7] transition-colors"
                          aria-label="Send campaign"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => { setPreviewCampaign(c); setPreviewOpen(true) }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-faint)] hover:text-white transition-colors"
                        aria-label="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canSend && (
                        <button
                          onClick={() => openEditor(c)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-faint)] hover:text-white transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteCampaign(c.id)}
                        className="p-1.5 rounded-lg hover:bg-[#FF6B6B]/20 text-[var(--color-text-faint)] hover:text-[#FF6B6B] transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-white font-medium text-sm mb-1">{c.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mb-3 line-clamp-1">Subject: {c.subject}</p>
                  {c.status === 'sent' && (
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-faint)]">
                      <span>Sent: {c.sent_count}</span>
                      <span>Opens: {c.open_count}</span>
                      <span>Clicks: {c.click_count}</span>
                    </div>
                  )}
                  {c.status === 'scheduled' && c.scheduled_at && (
                    <div className="flex items-center gap-1.5 text-xs text-[#60A5FA]">
                      <Clock className="w-3 h-3" />
                      <span>Scheduled {new Date(c.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                  )}
                  {c.status === 'sending' && (
                    <div className="flex items-center gap-2 text-xs text-[#F59E0B]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Sending in progress...</span>
                    </div>
                  )}
                  <p className="text-xs text-[var(--color-text-faint)] mt-2">
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Campaign Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditorOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-[#0F1B2D]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editCampaign ? 'Edit Campaign' : 'New Campaign'}
              </h2>
              <button onClick={() => setEditorOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Generate */}
            <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-[#A78BFA]/10 to-[#00C9A7]/10 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                <span className="text-sm font-medium text-white">AI Email Writer</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generateWithAI()}
                  placeholder="Describe the email you want... e.g., 'Follow up after cybersecurity scan for Austin dental practice'"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#A78BFA] text-sm"
                />
                <button
                  onClick={generateWithAI}
                  disabled={generating || !aiPrompt.trim()}
                  className="px-4 py-2 bg-[#A78BFA] hover:bg-[#9575d2] text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Generate
                </button>
              </div>
              {aiError && (
                <p className="mt-2 text-xs text-[#FF6B6B] flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span className="break-words">{aiError}</span>
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="camp-name" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Campaign Name *</label>
                <input
                  id="camp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                  placeholder="e.g., Cybersecurity Scan Follow-up"
                />
              </div>
              <div>
                <label htmlFor="camp-subject" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Email Subject *</label>
                <input
                  id="camp-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                  placeholder="Your scan results are ready — here's what we found"
                />
              </div>
              <div>
                <label htmlFor="camp-body" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Email Body *</label>
                <textarea
                  id="camp-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm resize-none font-mono"
                  placeholder="Hi {{name}},&#10;&#10;We recently completed a complimentary vulnerability scan on your company domain..."
                />
              </div>
            </div>

            {saveError && (
              <div className="mt-4 p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-sm text-[#FF6B6B] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="break-words">Couldn&apos;t save: {saveError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              <button onClick={() => setEditorOpen(false)} className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                onClick={saveCampaign}
                disabled={saving || !name.trim() || !subject.trim() || !body.trim()}
                className="px-5 py-2.5 text-sm font-semibold bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && previewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPreviewOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl p-6 bg-white text-gray-900">
            <button onClick={() => setPreviewOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" aria-label="Close preview">
              <X className="w-5 h-5" />
            </button>
            <p className="text-xs text-gray-500 mb-1">From: Connectex Solutions &lt;mark@connectex.net&gt;</p>
            <p className="text-xs text-gray-500 mb-3">Subject: <strong>{previewCampaign.subject}</strong></p>
            <hr className="mb-4" />
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{previewCampaign.body}</div>
          </div>
        </div>
      )}

      {/* Send Campaign Modal */}
      {sendModalOpen && sendCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!sending ? closeSendModal : undefined} />
          <div className="relative w-full max-w-md rounded-2xl p-6 bg-[#0F1B2D]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-[#00C9A7]" />
                Send Campaign
              </h2>
              {!sending && (
                <button onClick={closeSendModal} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] transition-colors" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Campaign info */}
            <div className="mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm font-medium text-white mb-0.5">{sendCampaign.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Subject: {sendCampaign.subject}</p>
            </div>

            {!sendResult ? (
              <>
                {/* Recipient filter */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] mb-3">
                    <Filter className="w-4 h-4" />
                    Choose Recipients
                  </label>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="recipientFilter"
                        checked={recipientFilter === 'all'}
                        onChange={() => { setRecipientFilter('all'); setSelectedContacts(new Map()) }}
                        className="accent-[#00C9A7]"
                        disabled={sending}
                      />
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#00C9A7]" />
                        <span className="text-sm text-white">All Contacts</span>
                      </div>
                    </label>

                    {PIPELINE_STAGES.filter(s => s.key !== 'closed_lost').map((stage) => (
                      <label
                        key={stage.key}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name="recipientFilter"
                          checked={recipientFilter !== 'all' && 'stage' in recipientFilter && recipientFilter.stage === stage.key}
                          onChange={() => { setRecipientFilter({ stage: stage.key }); setSelectedContacts(new Map()) }}
                          className="accent-[#00C9A7]"
                          disabled={sending}
                        />
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                          <span className="text-sm text-white">{stage.label}</span>
                        </div>
                      </label>
                    ))}

                    {/* Specific contacts option */}
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="recipientFilter"
                        checked={recipientFilter !== 'all' && 'ids' in recipientFilter}
                        onChange={() => { setRecipientFilter({ ids: [] }); setSelectedContacts(new Map()) }}
                        className="accent-[#00C9A7]"
                        disabled={sending}
                      />
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#A78BFA]" />
                        <span className="text-sm text-white">Specific Contacts</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Specific contacts picker */}
                {recipientFilter !== 'all' && 'ids' in recipientFilter && (
                  <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-faint)]" />
                      <input
                        type="text"
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder="Search contacts to add..."
                        className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-1 focus:ring-[#A78BFA] text-sm"
                      />
                      {searchingContacts && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-[var(--color-text-faint)]" />}
                    </div>

                    {contactSearchResults.length > 0 && (
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {contactSearchResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => toggleContact(c)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-sm transition-colors ${selectedContacts.has(c.id) ? 'bg-[#A78BFA]/15 text-[#A78BFA]' : 'hover:bg-white/5 text-white'}`}
                          >
                            <span>{c.name} {c.company ? <span className="text-xs opacity-60">· {c.company}</span> : null}</span>
                            {selectedContacts.has(c.id) && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedContacts.size > 0 && (
                      <div className="pt-1 border-t border-white/8">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1.5">{selectedContacts.size} selected:</p>
                        <div className="flex flex-wrap gap-1">
                          {[...selectedContacts.entries()].map(([id, c]) => (
                            <span key={id} className="inline-flex items-center gap-1 text-xs bg-[#A78BFA]/15 text-[#A78BFA] px-2 py-0.5 rounded-full">
                              {c.name}
                              <button onClick={() => toggleContact({ id, name: c.name, email: c.email })} className="hover:text-white">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recipient count preview */}
                <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Recipients with email:</span>
                  {loadingCount ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-muted)]" />
                  ) : (
                    <span className="text-sm font-semibold text-white">{displayRecipientCount ?? '--'}</span>
                  )}
                </div>

                {/* Schedule toggle */}
                <div className="mb-5">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-colors">
                    <input
                      type="checkbox"
                      checked={scheduleMode}
                      onChange={(e) => setScheduleMode(e.target.checked)}
                      className="accent-[#60A5FA]"
                      disabled={sending}
                    />
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#60A5FA]" />
                      <span className="text-sm text-white">Schedule for later</span>
                    </div>
                  </label>
                  {scheduleMode && (
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="mt-2 w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#60A5FA]"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={closeSendModal}
                    disabled={sending}
                    className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending || (!scheduleMode && (displayRecipientCount === 0 || displayRecipientCount === null)) || (scheduleMode && !scheduledAt)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] rounded-xl transition-colors disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {scheduleMode ? 'Scheduling...' : 'Sending...'}
                      </>
                    ) : scheduleMode ? (
                      <>
                        <Clock className="w-4 h-4" />
                        Schedule Campaign
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send to {displayRecipientCount ?? 0} contact{displayRecipientCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Send result */
              <div className="space-y-4">
                {sendResult.success ? (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-[#00C9A7]/10 border border-[#00C9A7]/20">
                    <CheckCircle2 className="w-5 h-5 text-[#00C9A7] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {sendResult.sent === 0 ? 'Campaign scheduled successfully' : 'Campaign sent successfully'}
                      </p>
                      {sendResult.sent > 0 && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          {sendResult.sent} email{sendResult.sent !== 1 ? 's' : ''} delivered
                          {sendResult.failed > 0 && `, ${sendResult.failed} failed`}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20">
                    <AlertCircle className="w-5 h-5 text-[#FF6B6B] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">Failed to send campaign</p>
                      {sendResult.errors?.map((err, i) => (
                        <p key={i} className="text-xs text-[var(--color-text-muted)] mt-1">{err}</p>
                      ))}
                    </div>
                  </div>
                )}

                {sendResult.success && sendResult.failed > 0 && sendResult.errors && (
                  <div className="p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                    <p className="text-xs font-medium text-[#F59E0B] mb-1">Failed deliveries:</p>
                    {sendResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-[var(--color-text-muted)]">{err}</p>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={closeSendModal}
                    className="px-5 py-2.5 text-sm font-semibold bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </CRMShell>
  )
}
