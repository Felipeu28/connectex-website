'use client'

import { useEffect, useState, useCallback } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { Plus, Play, Pause, Archive, ChevronDown, ChevronUp, Trash2, X, Users, Mail, Sparkles, Loader2, Pencil, UserPlus, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface SequenceStep {
  id?: string
  step_number: number
  delay_days: number
  subject: string
  body: string
}

interface Sequence {
  id: string
  name: string
  description: string | null
  status: 'active' | 'paused' | 'archived'
  created_at: string
  steps?: SequenceStep[]
  enrollment_count?: number
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editSeq, setEditSeq] = useState<Sequence | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Editor state
  const [seqName, setSeqName] = useState('')
  const [seqDesc, setSeqDesc] = useState('')
  const [steps, setSteps] = useState<SequenceStep[]>([
    { step_number: 1, delay_days: 0, subject: '', body: '' },
  ])
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<number | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')

  // Enroll contacts state
  const [enrollSeq, setEnrollSeq] = useState<Sequence | null>(null)
  const [enrollSearch, setEnrollSearch] = useState('')
  const [enrollResults, setEnrollResults] = useState<{ id: string; name: string; email: string | null; company: string | null }[]>([])
  const [enrollSelected, setEnrollSelected] = useState<Map<string, { name: string; email: string | null }>>(new Map())
  const [enrollSearching, setEnrollSearching] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollDone, setEnrollDone] = useState<{ enrolled: number; skipped: number } | null>(null)

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowser()
    const { data: seqs } = await supabase
      .from('crm_sequences')
      .select('*')
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (!seqs) { setLoading(false); return }

    // Load step counts and enrollment counts
    const enriched = await Promise.all(seqs.map(async (seq) => {
      const [stepsRes, enrollRes] = await Promise.all([
        supabase.from('crm_sequence_steps').select('*').eq('sequence_id', seq.id).order('step_number'),
        supabase.from('crm_sequence_enrollments').select('id', { count: 'exact' }).eq('sequence_id', seq.id).eq('status', 'active'),
      ])
      return { ...seq, steps: stepsRes.data ?? [], enrollment_count: enrollRes.count ?? 0 }
    }))

    setSequences(enriched)
    setLoading(false)
  }, [])

  useEffect(() => {
    ;(async () => { await load() })()
  }, [load])

  function openNew() {
    setEditSeq(null)
    setSeqName('')
    setSeqDesc('')
    setSteps([{ step_number: 1, delay_days: 0, subject: '', body: '' }])
    setAiPrompt('')
    setEditorOpen(true)
  }

  function openEdit(seq: Sequence) {
    setEditSeq(seq)
    setSeqName(seq.name)
    setSeqDesc(seq.description ?? '')
    setSteps(seq.steps?.length ? seq.steps.map(s => ({ ...s })) : [{ step_number: 1, delay_days: 0, subject: '', body: '' }])
    setAiPrompt('')
    setEditorOpen(true)
  }

  function addStep() {
    const last = steps[steps.length - 1]
    setSteps([...steps, { step_number: steps.length + 1, delay_days: last ? 3 : 0, subject: '', body: '' }])
  }

  function removeStep(idx: number) {
    if (steps.length === 1) return
    const updated = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_number: i + 1 }))
    setSteps(updated)
  }

  function updateStep(idx: number, field: keyof SequenceStep, value: string | number) {
    setSteps(steps.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  async function generateStepWithAI(idx: number) {
    if (!aiPrompt.trim()) return
    setGenerating(idx)
    try {
      const stepContext = steps[idx]
      const prompt = `Write a cold outreach / follow-up email for a technology advisor named Mark who helps SMBs in Austin, Texas find the right tech solutions. He's vendor-neutral and works with 600+ providers.

Context: ${aiPrompt}
Step ${stepContext.step_number} of ${steps.length} (sent ${stepContext.delay_days} days after previous)

Write a short, personal email (not salesy). Return JSON: {"subject": "...", "body": "..."}`

      const res = await fetch('/api/crm/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.subject) updateStep(idx, 'subject', data.subject)
      if (data.body) updateStep(idx, 'body', data.body)
    } catch {
      // fail silently
    }
    setGenerating(null)
  }

  async function saveSequence() {
    if (!seqName.trim() || steps.some(s => !s.subject.trim() || !s.body.trim())) return
    setSaving(true)
    const supabase = createSupabaseBrowser()

    if (editSeq) {
      await supabase.from('crm_sequences').update({ name: seqName, description: seqDesc || null, updated_at: new Date().toISOString() }).eq('id', editSeq.id)
      await supabase.from('crm_sequence_steps').delete().eq('sequence_id', editSeq.id)
      await supabase.from('crm_sequence_steps').insert(steps.map(s => ({ ...s, id: undefined, sequence_id: editSeq.id })))
    } else {
      const { data: seq } = await supabase.from('crm_sequences').insert({ name: seqName, description: seqDesc || null }).select('id').single()
      if (seq) {
        await supabase.from('crm_sequence_steps').insert(steps.map(s => ({ ...s, id: undefined, sequence_id: seq.id })))
      }
    }

    setSaving(false)
    setEditorOpen(false)
    load()
  }

  async function toggleStatus(seq: Sequence) {
    const supabase = createSupabaseBrowser()
    const newStatus = seq.status === 'active' ? 'paused' : 'active'
    await supabase.from('crm_sequences').update({ status: newStatus }).eq('id', seq.id)
    load()
  }

  async function archiveSequence(id: string) {
    const supabase = createSupabaseBrowser()
    await supabase.from('crm_sequences').update({ status: 'archived' }).eq('id', id)
    load()
  }

  // Enroll contacts search (debounced). All setState happens in the async
  // timeout callback so the lint rule (set-state-in-effect) is satisfied.
  useEffect(() => {
    const query = enrollSearch.trim()
    const timer = setTimeout(async () => {
      if (!query) {
        setEnrollResults([])
        return
      }
      setEnrollSearching(true)
      const supabase = createSupabaseBrowser()
      const { data } = await supabase
        .from('crm_contacts')
        .select('id, name, email, company')
        .not('email', 'is', null)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
        .limit(10)
      setEnrollResults(data ?? [])
      setEnrollSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [enrollSearch])

  function toggleEnrollContact(c: { id: string; name: string; email: string | null }) {
    setEnrollSelected((prev) => {
      const next = new Map(prev)
      if (next.has(c.id)) {
        next.delete(c.id)
      } else {
        next.set(c.id, { name: c.name, email: c.email })
      }
      return next
    })
  }

  async function handleEnroll() {
    if (!enrollSeq || enrollSelected.size === 0 || enrolling) return
    setEnrolling(true)

    const supabase = createSupabaseBrowser()
    // Get first step's delay_days to compute next_send_at
    const { data: firstStep } = await supabase
      .from('crm_sequence_steps')
      .select('delay_days')
      .eq('sequence_id', enrollSeq.id)
      .eq('step_number', 1)
      .single()

    const delayDays = firstStep?.delay_days ?? 0
    const nextSendAt = new Date()
    nextSendAt.setDate(nextSendAt.getDate() + delayDays)

    let enrolled = 0
    let skipped = 0

    for (const [contactId] of enrollSelected) {
      const { error } = await supabase.from('crm_sequence_enrollments').insert({
        sequence_id: enrollSeq.id,
        contact_id: contactId,
        current_step: 1,
        status: 'active',
        next_send_at: nextSendAt.toISOString(),
      })
      if (error && error.code === '23505') {
        skipped++ // unique constraint — already enrolled
      } else if (!error) {
        enrolled++
      }
    }

    setEnrollDone({ enrolled, skipped })
    setEnrolling(false)
    load()
  }

  function openEnrollModal(seq: Sequence) {
    setEnrollSeq(seq)
    setEnrollSearch('')
    setEnrollResults([])
    setEnrollSelected(new Map())
    setEnrollDone(null)
  }

  function closeEnrollModal() {
    setEnrollSeq(null)
    setEnrollDone(null)
  }

  return (
    <CRMShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Sequences</h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-0.5">Automated multi-step email sequences sent from your Gmail</p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] font-semibold text-sm rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Sequence
          </button>
        </div>

        {/* Sequences list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 glass rounded-xl animate-pulse" />)}
          </div>
        ) : sequences.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Mail className="w-10 h-10 text-[var(--color-text-faint)] mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No sequences yet</p>
            <p className="text-[var(--color-text-muted)] text-sm mb-4">Create a multi-step drip sequence to automatically follow up with leads over days or weeks.</p>
            <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] font-semibold text-sm rounded-xl transition-colors">
              <Plus className="w-4 h-4" />Create Your First Sequence
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sequences.map((seq) => {
              const isExpanded = expandedId === seq.id
              return (
                <div key={seq.id} className="glass rounded-xl overflow-hidden">
                  {/* Header row */}
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{seq.name}</h3>
                        <span className={clsx(
                          'text-[10px] font-medium px-2 py-0.5 rounded-full',
                          seq.status === 'active' ? 'bg-[#00C9A7]/15 text-[#00C9A7]' : 'bg-white/10 text-[var(--color-text-muted)]'
                        )}>
                          {seq.status}
                        </span>
                      </div>
                      {seq.description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{seq.description}</p>}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] flex-shrink-0">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {seq.steps?.length ?? 0} steps
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {seq.enrollment_count} active
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleStatus(seq)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors"
                        title={seq.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {seq.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(seq)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEnrollModal(seq)}
                        className="p-1.5 rounded-lg hover:bg-[#00C9A7]/20 text-[var(--color-text-muted)] hover:text-[#00C9A7] transition-colors"
                        title="Enroll contacts"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => archiveSequence(seq.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] hover:text-[#FF6B6B] transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : seq.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded steps */}
                  {isExpanded && seq.steps && seq.steps.length > 0 && (
                    <div className="px-4 pb-4 space-y-2 border-t border-white/8 pt-3">
                      {seq.steps.map((step, idx) => (
                        <div key={step.id ?? idx} className="flex gap-3 items-start p-3 rounded-lg bg-white/[0.03]">
                          <div className="w-6 h-6 rounded-full bg-[#00C9A7]/15 text-[#00C9A7] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {step.step_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{step.subject}</p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{step.body}</p>
                          </div>
                          <span className="text-xs text-[var(--color-text-faint)] flex-shrink-0">
                            {idx === 0 ? 'Day 0' : `+${step.delay_days}d`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sequence Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditorOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0F1B2D]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
            <div className="sticky top-0 flex items-center justify-between p-5 pb-4 border-b border-white/8 bg-[#0F1B2D]/95 backdrop-blur-xl z-10">
              <h2 className="text-lg font-semibold text-white">{editSeq ? 'Edit Sequence' : 'New Sequence'}</h2>
              <button onClick={() => setEditorOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Sequence meta */}
              <div className="space-y-3">
                <input
                  value={seqName}
                  onChange={(e) => setSeqName(e.target.value)}
                  placeholder="Sequence name (e.g., Cybersecurity scan follow-up)"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                />
                <input
                  value={seqDesc}
                  onChange={(e) => setSeqDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                />
              </div>

              {/* AI prompt for the whole sequence */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#A78BFA]/10 to-[#00C9A7]/10 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                  <span className="text-sm font-medium text-white">AI Step Writer</span>
                  <span className="text-xs text-[var(--color-text-muted)]">— describe the campaign, then generate each step</span>
                </div>
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., Following up after free vulnerability scan for Austin dental office"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#A78BFA] text-sm"
                />
              </div>

              {/* Steps */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Steps</h3>
                  <button
                    onClick={addStep}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />Add Step
                  </button>
                </div>

                {steps.map((step, idx) => (
                  <div key={idx} className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
                    {/* Step header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border-b border-white/8">
                      <div className="w-6 h-6 rounded-full bg-[#00C9A7]/15 text-[#00C9A7] text-xs font-bold flex items-center justify-center">
                        {step.step_number}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        {idx === 0 ? (
                          <span className="text-xs text-[var(--color-text-muted)]">Sent immediately on enrollment</span>
                        ) : (
                          <>
                            <span className="text-xs text-[var(--color-text-muted)]">Send</span>
                            <input
                              type="number"
                              min={1}
                              value={step.delay_days}
                              onChange={(e) => updateStep(idx, 'delay_days', parseInt(e.target.value) || 1)}
                              className="w-14 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#00C9A7]"
                            />
                            <span className="text-xs text-[var(--color-text-muted)]">days after step {step.step_number - 1}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => generateStepWithAI(idx)}
                          disabled={generating === idx || !aiPrompt.trim()}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#A78BFA]/10 text-[#A78BFA] hover:bg-[#A78BFA]/20 rounded-lg transition-colors disabled:opacity-40"
                        >
                          {generating === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          Generate
                        </button>
                        {steps.length > 1 && (
                          <button
                            onClick={() => removeStep(idx)}
                            className="p-1 rounded hover:bg-white/10 text-[var(--color-text-faint)] hover:text-[#FF6B6B] transition-colors"
                            aria-label="Remove step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Step content */}
                    <div className="p-4 space-y-3">
                      <input
                        value={step.subject}
                        onChange={(e) => updateStep(idx, 'subject', e.target.value)}
                        placeholder="Email subject..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                      />
                      <textarea
                        value={step.body}
                        onChange={(e) => updateStep(idx, 'body', e.target.value)}
                        placeholder={`Hi {{name}},\n\nWrite your email here...`}
                        rows={5}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm resize-none font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-[var(--color-text-faint)]">Use <code className="bg-white/10 px-1 rounded">{'{{name}}'}</code> to personalize with the contact&apos;s first name.</p>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 p-5 pt-4 border-t border-white/8 bg-[#0F1B2D]/95 backdrop-blur-xl">
              <button onClick={() => setEditorOpen(false)} className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                onClick={saveSequence}
                disabled={saving || !seqName.trim() || steps.some(s => !s.subject.trim() || !s.body.trim())}
                className="px-5 py-2.5 text-sm font-semibold bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editSeq ? 'Update Sequence' : 'Save Sequence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Contacts Modal */}
      {enrollSeq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!enrolling ? closeEnrollModal : undefined} />
          <div className="relative w-full max-w-md rounded-2xl p-6 bg-[#0F1B2D]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#00C9A7]" />
                  Enroll Contacts
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{enrollSeq.name}</p>
              </div>
              {!enrolling && (
                <button onClick={closeEnrollModal} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {!enrollDone ? (
              <>
                {/* Search */}
                <div className="relative mb-3">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-faint)]" />
                  <input
                    type="text"
                    value={enrollSearch}
                    onChange={(e) => setEnrollSearch(e.target.value)}
                    placeholder="Search contacts by name, email, or company..."
                    className="w-full pl-8 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                  />
                  {enrollSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-[var(--color-text-faint)]" />}
                </div>

                {/* Search results */}
                {enrollResults.length > 0 && (
                  <div className="mb-3 space-y-1 max-h-40 overflow-y-auto">
                    {enrollResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => toggleEnrollContact(c)}
                        className={clsx(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors',
                          enrollSelected.has(c.id) ? 'bg-[#00C9A7]/15 text-[#00C9A7]' : 'hover:bg-white/5 text-white'
                        )}
                      >
                        <div>
                          <span className="font-medium">{c.name}</span>
                          {c.company && <span className="text-xs opacity-60 ml-1.5">· {c.company}</span>}
                          <p className="text-xs opacity-50">{c.email}</p>
                        </div>
                        {enrollSelected.has(c.id) && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected contacts */}
                {enrollSelected.size > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/8">
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">{enrollSelected.size} contact{enrollSelected.size !== 1 ? 's' : ''} to enroll:</p>
                    <div className="flex flex-wrap gap-1">
                      {[...enrollSelected.entries()].map(([id, c]) => (
                        <span key={id} className="inline-flex items-center gap-1 text-xs bg-[#00C9A7]/15 text-[#00C9A7] px-2 py-0.5 rounded-full">
                          {c.name}
                          <button onClick={() => toggleEnrollContact({ id, name: c.name, email: c.email })} className="hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-[var(--color-text-faint)] mb-4">
                  Contacts will receive step 1 on the next hourly cron run. Already-enrolled contacts are skipped automatically.
                </p>

                <div className="flex items-center justify-end gap-3">
                  <button onClick={closeEnrollModal} disabled={enrolling} className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || enrollSelected.size === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] rounded-xl transition-colors disabled:opacity-50"
                  >
                    {enrolling ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Enrolling...</>
                    ) : (
                      <><UserPlus className="w-4 h-4" />Enroll {enrollSelected.size} Contact{enrollSelected.size !== 1 ? 's' : ''}</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#00C9A7]/10 border border-[#00C9A7]/20">
                  <CheckCircle className="w-5 h-5 text-[#00C9A7] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Enrollment complete</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {enrollDone.enrolled} enrolled
                      {enrollDone.skipped > 0 && `, ${enrollDone.skipped} already in sequence`}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={closeEnrollModal} className="px-5 py-2.5 text-sm font-semibold bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] rounded-xl transition-colors">
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
