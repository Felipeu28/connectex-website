'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { logActivity } from '@/lib/crm-activity'
import { PIPELINE_STAGES, type Deal, type Contact } from '@/lib/crm-types'

interface DealFormData {
  title: string
  contact_id: string
  value: number
  stage: Deal['stage']
  probability: number
  expected_close: string
  notes: string
}

interface DealModalProps {
  deal?: Deal | null
  contacts: Contact[]
  defaultStage?: Deal['stage']
  defaultContactId?: string
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function DealModal({ deal, contacts, defaultStage, defaultContactId, open, onClose, onSaved }: DealModalProps) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DealFormData>()

  useEffect(() => {
    if (deal) {
      reset({
        title: deal.title,
        contact_id: deal.contact_id ?? '',
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        expected_close: deal.expected_close ?? '',
        notes: deal.notes ?? '',
      })
    } else {
      reset({
        title: '',
        contact_id: defaultContactId ?? '',
        value: 0,
        stage: defaultStage ?? 'lead',
        probability: 10,
        expected_close: '',
        notes: '',
      })
    }
  }, [deal, defaultStage, defaultContactId, reset])

  async function onSubmit(data: DealFormData) {
    setSaving(true)
    const supabase = createSupabaseBrowser()

    const payload = {
      title: data.title,
      contact_id: data.contact_id || null,
      value: data.value,
      stage: data.stage,
      probability: data.probability,
      expected_close: data.expected_close || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    }

    if (deal) {
      await supabase.from('crm_deals').update(payload).eq('id', deal.id)
    } else {
      const { data: inserted } = await supabase.from('crm_deals').insert(payload).select('id').single()
      await logActivity({
        type: 'deal_created',
        description: `Created deal: ${data.title} ($${data.value.toLocaleString()})`,
        deal_id: inserted?.id ?? undefined,
        contact_id: data.contact_id || undefined,
      })
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-[#0F1B2D]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {deal ? 'Edit Deal' : 'New Deal'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="deal-title" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Deal Title *</label>
            <input
              id="deal-title"
              {...register('title', { required: 'Title is required' })}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
              placeholder="e.g., Managed IT - Acme Corp"
            />
            {errors.title && <p className="text-[#FF6B6B] text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="deal-contact" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Contact</label>
            <select
              id="deal-contact"
              {...register('contact_id')}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
            >
              <option value="">No contact linked</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="deal-value" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Value ($)</label>
              <input
                id="deal-value"
                type="number"
                step="0.01"
                {...register('value', { valueAsNumber: true })}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
              />
            </div>
            <div>
              <label htmlFor="deal-probability" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Probability (%)</label>
              <input
                id="deal-probability"
                type="number"
                min={0}
                max={100}
                {...register('probability', { valueAsNumber: true })}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="deal-stage" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Stage</label>
              <select
                id="deal-stage"
                {...register('stage')}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
              >
                {PIPELINE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="deal-close" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Expected Close</label>
              <input
                id="deal-close"
                type="date"
                {...register('expected_close')}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="deal-notes" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Notes</label>
            <textarea
              id="deal-notes"
              rows={2}
              {...register('notes')}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-semibold bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] rounded-xl transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : deal ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
