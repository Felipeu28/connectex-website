'use client'

import { useEffect, useState, useCallback } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { PIPELINE_STAGES, type Campaign, type PipelineStage } from '@/lib/crm-types'
import { Plus, Sparkles, Pencil, Trash2, X, Eye, Send, Users, Filter, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#94A3B8' },
  scheduled: { label: 'Scheduled', color: '#60A5FA' },
  sending: { label: 'Sending', color: '#F59E0B' },
  sent: { label: 'Sent', color: '#00C9A7' },
  paused: { label: 'Paused', color: '#FF6B6B' },
}

type RecipientFilter = 'all' | { stage: PipelineStage }

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
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  // Send modal state
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendCampaign, setSendCampaign] = useState<Campaign | null>(null)
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('all')
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; sent: number; failed: number; errors?: string[] } | null>(null)

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

  // Fetch recipient count when filter changes
  useEffect(() => {
    if (!sendModalOpen) return

    ;(async () => {
      setLoadingCount(true)
      const supabase = createSupabaseBrowser()

      let query = supabase
        .from('crm_contacts')
        .select('id', { count: 'exact', head: true })
        .not('email', 'is', null)

      if (recipientFilter !== 'all' && recipientFilter.stage) {
        query = query.eq('stage', recipientFilter.stage)
      }

      const { count } = await query
      setRecipientCount(count ?? 0)
      setLoadingCount(false)
    })()
  }, [sendModalOpen, recipientFilter])

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
    setEditorOpen(true)
  }

  async function saveCampaign() {
    if (!name.trim() || !subject.trim() || !body.trim()) return
    setSaving(true)
    const supabase = createSupabaseBrowser()

    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
      status: 'draft' as const,
      updated_at: new Date().toISOString(),
    }

    if (editCampaign) {
      await supabase.from('crm_campaigns').update(payload).eq('id', editCampaign.id)
    } else {
      await supabase.from('crm_campaigns').insert(payload)
    }

    setSaving(false)
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

    try {
      const res = await fetch('/api/crm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', prompt: aiPrompt }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.subject) setSubject(data.subject)
        if (data.body) setBody(data.body)
        if (data.name && !name) setName(data.name)
      }
    } catch {
      // AI generation failed — user can still write manually
    }

    setGenerating(false)
  }

  function openSendModal(campaign: Campaign) {
    setSendCampaign(campaign)
    setRecipientFilter('all')
    setRecipientCount(null)
    setSendResult(null)
    setSending(false)
    setSendModalOpen(true)
  }

  function closeSendModal() {
    setSendModalOpen(false)
    setSendCampaign(null)
    setSendResult(null)
    if (sendResult?.success) {
      load()
    }
  }

  async function handleSend() {
    if (!sendCampaign || sending) return
    setSending(true)
    setSendResult(null)

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
        // Refresh campaigns list to update status
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
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditorOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-2xl p-6 bg-[#0F1B2D] border border-white/10">
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
          <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl p-6 bg-white text-gray-900">
            <button onClick={() => setPreviewOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" aria-label="Close preview">
              <X className="w-5 h-5" />
            </button>
            <p className="text-xs text-gray-500 mb-1">From: ConnectEx Solutions &lt;mark@connectex.net&gt;</p>
            <p className="text-xs text-gray-500 mb-3">Subject: <strong>{previewCampaign.subject}</strong></p>
            <hr className="mb-4" />
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{previewCampaign.body}</div>
          </div>
        </div>
      )}

      {/* Send Campaign Modal */}
      {sendModalOpen && sendCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={!sending ? closeSendModal : undefined} />
          <div className="relative w-full max-w-md glass rounded-2xl p-6 bg-[#0F1B2D] border border-white/10">
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
                <div className="mb-5">
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
                        onChange={() => setRecipientFilter('all')}
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
                          checked={recipientFilter !== 'all' && recipientFilter.stage === stage.key}
                          onChange={() => setRecipientFilter({ stage: stage.key })}
                          className="accent-[#00C9A7]"
                          disabled={sending}
                        />
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                          <span className="text-sm text-white">{stage.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Recipient count preview */}
                <div className="mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Recipients with email:</span>
                  {loadingCount ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-muted)]" />
                  ) : (
                    <span className="text-sm font-semibold text-white">{recipientCount ?? '--'}</span>
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
                    disabled={sending || recipientCount === 0 || recipientCount === null}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] rounded-xl transition-colors disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send to {recipientCount ?? 0} contact{recipientCount !== 1 ? 's' : ''}
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
                      <p className="text-sm font-medium text-white">Campaign sent successfully</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {sendResult.sent} email{sendResult.sent !== 1 ? 's' : ''} delivered
                        {sendResult.failed > 0 && `, ${sendResult.failed} failed`}
                      </p>
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
