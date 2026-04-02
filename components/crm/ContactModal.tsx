'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { logActivity } from '@/lib/crm-activity'
import { PIPELINE_STAGES, type Contact } from '@/lib/crm-types'

interface ContactFormData {
  name: string
  email: string
  phone: string
  company: string
  title: string
  source: Contact['source']
  stage: Contact['stage']
  notes: string
  deal_value: number
}

interface ContactModalProps {
  contact?: Contact | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const SOURCES: { value: Contact['source']; label: string }[] = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'networking', label: 'Networking' },
  { value: 'cold', label: 'Cold Outreach' },
]

export function ContactModal({ contact, open, onClose, onSaved }: ContactModalProps) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>()

  useEffect(() => {
    if (contact) {
      reset({
        name: contact.name,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        company: contact.company ?? '',
        title: contact.title ?? '',
        source: contact.source,
        stage: contact.stage,
        notes: contact.notes ?? '',
        deal_value: contact.deal_value,
      })
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        company: '',
        title: '',
        source: 'manual',
        stage: 'lead',
        notes: '',
        deal_value: 0,
      })
    }
  }, [contact, reset])

  async function onSubmit(data: ContactFormData) {
    setSaving(true)
    const supabase = createSupabaseBrowser()

    const payload = {
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      title: data.title || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    }

    if (contact) {
      const stageChanged = data.stage !== contact.stage
      await supabase.from('crm_contacts').update(payload).eq('id', contact.id)

      // Sync stage change to all linked deals
      if (stageChanged) {
        await supabase.from('crm_deals').update({
          stage: data.stage,
          updated_at: new Date().toISOString(),
        }).eq('contact_id', contact.id)

        await logActivity({
          type: 'stage_change',
          description: `Moved ${data.name} from ${contact.stage} to ${data.stage} (synced to deals)`,
          contact_id: contact.id,
          metadata: { from: contact.stage, to: data.stage },
        })
      } else {
        await logActivity({
          type: 'contact_updated',
          description: `Updated contact: ${data.name}`,
          contact_id: contact.id,
        })
      }
    } else {
      const { data: inserted } = await supabase.from('crm_contacts').insert(payload).select('id').single()
      await logActivity({
        type: 'contact_created',
        description: `Created new contact: ${data.name}${data.company ? ` (${data.company})` : ''}`,
        contact_id: inserted?.id ?? undefined,
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
            {contact ? 'Edit Contact' : 'New Contact'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Name *</label>
            <input
              id="name"
              {...register('name', { required: 'Name is required' })}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
              placeholder="John Doe"
            />
            {errors.name && <p className="text-[#FF6B6B] text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Email</label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Phone</label>
              <input
                id="phone"
                {...register('phone')}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                placeholder="(512) 555-1234"
              />
            </div>
          </div>

          {/* Company + Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Company</label>
              <input
                id="company"
                {...register('company')}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Title</label>
              <input
                id="title"
                {...register('title')}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                placeholder="CEO"
              />
            </div>
          </div>

          {/* Source + Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Source</label>
              <select
                id="source"
                {...register('source')}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
              >
                {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Stage</label>
              <select
                id="stage"
                {...register('stage')}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
              >
                {PIPELINE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Deal Value */}
          <div>
            <label htmlFor="deal_value" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Deal Value ($)</label>
            <input
              id="deal_value"
              type="number"
              step="0.01"
              {...register('deal_value', { valueAsNumber: true })}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
              placeholder="0.00"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Notes</label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm resize-none"
              placeholder="Any notes about this contact..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : contact ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
