'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'

interface ReferralData {
  referrer_name: string
  referrer_email?: string
  business_name: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  service_needed: string
  notes?: string
}

const services = [
  'Managed IT / IT Support',
  'Cybersecurity',
  'Cloud / Microsoft 365',
  'Business Phone / UCaaS',
  'AI & Automation',
  'General Technology Assessment',
  'Other',
]

export function ReferralForm() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<ReferralData>()

  async function onSubmit(data: ReferralData) {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please email mark@connectex.net directly.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-[#00D4AA]/15 border border-[#00D4AA]/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-[#00D4AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-bold text-white mb-2">Referral submitted!</h3>
        <p className="text-sm text-[var(--text-muted)]">Mark will reach out to your contact within 24 hours.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="referrer_name">Your name</label>
          <input
            id="referrer_name"
            type="text"
            {...register('referrer_name', { required: 'Required' })}
            className="w-full glass rounded-xl px-4 py-3 text-white text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/40 border border-white/10"
            placeholder="Your name"
          />
          {errors.referrer_name && <p className="text-xs text-[#FF6B6B] mt-1">{errors.referrer_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="referrer_email">Your email <span className="font-normal">(optional)</span></label>
          <input
            id="referrer_email"
            type="email"
            {...register('referrer_email')}
            className="w-full glass rounded-xl px-4 py-3 text-white text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/40 border border-white/10"
            placeholder="you@company.com"
          />
        </div>
      </div>

      <div className="border-t border-white/8 pt-5">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4">About the business you&rsquo;re referring</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="business_name">Business name</label>
        <input
          id="business_name"
          type="text"
          {...register('business_name', { required: 'Required' })}
          className="w-full glass rounded-xl px-4 py-3 text-white text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/40 border border-white/10"
          placeholder="Acme Corp"
        />
        {errors.business_name && <p className="text-xs text-[#FF6B6B] mt-1">{errors.business_name.message}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="contact_name">Contact name</label>
          <input
            id="contact_name"
            type="text"
            {...register('contact_name', { required: 'Required' })}
            className="w-full glass rounded-xl px-4 py-3 text-white text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/40 border border-white/10"
            placeholder="Jane Smith"
          />
          {errors.contact_name && <p className="text-xs text-[#FF6B6B] mt-1">{errors.contact_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="contact_email">Contact email</label>
          <input
            id="contact_email"
            type="email"
            {...register('contact_email', {
              required: 'Required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
            })}
            className="w-full glass rounded-xl px-4 py-3 text-white text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/40 border border-white/10"
            placeholder="jane@acme.com"
          />
          {errors.contact_email && <p className="text-xs text-[#FF6B6B] mt-1">{errors.contact_email.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="contact_phone">Contact phone <span className="font-normal">(optional)</span></label>
        <input
          id="contact_phone"
          type="tel"
          {...register('contact_phone')}
          className="w-full glass rounded-xl px-4 py-3 text-white text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/40 border border-white/10"
          placeholder="(512) 000-0000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="service_needed">Service they need</label>
        <select
          id="service_needed"
          {...register('service_needed', { required: 'Required' })}
          className="w-full glass rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/40 border border-white/10 bg-[#0F1B2D]"
        >
          <option value="" className="bg-[#0F1B2D]">Select service</option>
          {services.map((s) => (
            <option key={s} value={s} className="bg-[#0F1B2D]">{s}</option>
          ))}
        </select>
        {errors.service_needed && <p className="text-xs text-[#FF6B6B] mt-1">{errors.service_needed.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="notes">Notes <span className="font-normal">(optional)</span></label>
        <textarea
          id="notes"
          rows={3}
          {...register('notes')}
          className="w-full glass rounded-xl px-4 py-3 text-white text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/40 border border-white/10 resize-none"
          placeholder="Any context that would help Mark — current challenges, budget range, urgency, etc."
        />
      </div>

      {error && (
        <div className="glass rounded-xl p-4 border border-[#FF6B6B]/30 text-sm text-[#FF6B6B]">{error}</div>
      )}

      <Button type="submit" variant="cta" size="lg" loading={submitting} className="w-full justify-center">
        Submit Referral
      </Button>
    </form>
  )
}
