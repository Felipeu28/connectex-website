'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface FormData {
  name: string
  company: string
  domain: string
  challenge: string
  timeline: string
  email: string
  phone?: string
  how_heard?: string
}

const challenges = [
  'Cybersecurity threats / we were hacked',
  'IT costs are too high',
  'Phone / communications system',
  'Cloud migration / Microsoft 365',
  'Need to find the right technology vendor',
  "General IT support — it's not working",
  'Just researching options',
]

const timelines = [
  'ASAP — this is urgent',
  '1–3 months',
  '3–6 months',
  'Just researching',
]

const howHeard = [
  'Google search',
  'Referral from a colleague',
  'LinkedIn',
  'Networking event',
  'Business card',
  'Other',
]

export function ContactForm({ defaultDomain = '' }: { defaultDomain?: string }) {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { domain: defaultDomain } })

  async function nextStep() {
    const fields: (keyof FormData)[][] = [
      ['name', 'company', 'domain'],
      ['challenge', 'timeline'],
      ['email'],
    ]
    const valid = await trigger(fields[step - 1])
    if (valid) setStep((s) => s + 1)
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Submission failed')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please email mark@connectex.net directly.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-[#00C9A7]/15 border border-[#00C9A7]/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#00C9A7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">You&rsquo;re all set!</h3>
        <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
          Mark will personally review your domain and send your vulnerability report within 24 hours.
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          In the meantime, download our{' '}
          <Link href="/resources/smb-cybersecurity-checklist-2026" className="text-[#00C9A7] hover:underline">
            SMB Cybersecurity Checklist →
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: n <= step ? '#00C9A7' : 'rgba(255,255,255,0.1)' }}
          />
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4">Step 1 of 3 — The basics</p>
            <h3 className="text-xl font-bold text-white mb-6">Tell us about your business</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              {...register('name', { required: 'Required' })}
              className="w-full glass rounded-xl px-4 py-3 text-white text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 border border-white/10"
              placeholder="Mark Johnson"
            />
            {errors.name && <p className="text-xs text-[#FF6B6B] mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="company">Company name</label>
            <input
              id="company"
              type="text"
              autoComplete="organization"
              {...register('company', { required: 'Required' })}
              className="w-full glass rounded-xl px-4 py-3 text-white text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 border border-white/10"
              placeholder="Acme Corp"
            />
            {errors.company && <p className="text-xs text-[#FF6B6B] mt-1">{errors.company.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="domain">
              Company domain
              <span className="ml-2 text-xs text-[#00C9A7]">(We&rsquo;ll scan this for vulnerabilities)</span>
            </label>
            <input
              id="domain"
              type="text"
              {...register('domain', { required: 'Required' })}
              className="w-full glass rounded-xl px-4 py-3 text-white text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 border border-white/10"
              placeholder="yourbusiness.com"
            />
            {errors.domain && <p className="text-xs text-[#FF6B6B] mt-1">{errors.domain.message}</p>}
          </div>

          <Button type="button" variant="cta" size="lg" onClick={nextStep} className="w-full justify-center">
            Continue
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4">Step 2 of 3 — Your situation</p>
            <h3 className="text-xl font-bold text-white mb-6">What&rsquo;s your biggest technology challenge?</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="challenge">Primary challenge</label>
            <select
              id="challenge"
              {...register('challenge', { required: 'Required' })}
              className="w-full glass rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 border border-white/10 bg-[#0F1B2D]"
            >
              <option value="" className="bg-[#0F1B2D]">Select your challenge</option>
              {challenges.map((c) => (
                <option key={c} value={c} className="bg-[#0F1B2D]">{c}</option>
              ))}
            </select>
            {errors.challenge && <p className="text-xs text-[#FF6B6B] mt-1">{errors.challenge.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="timeline">Timeline</label>
            <select
              id="timeline"
              {...register('timeline', { required: 'Required' })}
              className="w-full glass rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 border border-white/10 bg-[#0F1B2D]"
            >
              <option value="" className="bg-[#0F1B2D]">When do you need this resolved?</option>
              {timelines.map((t) => (
                <option key={t} value={t} className="bg-[#0F1B2D]">{t}</option>
              ))}
            </select>
            {errors.timeline && <p className="text-xs text-[#FF6B6B] mt-1">{errors.timeline.message}</p>}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" size="lg" onClick={() => setStep(1)} className="flex-1 justify-center">
              Back
            </Button>
            <Button type="button" variant="cta" size="lg" onClick={nextStep} className="flex-[2] justify-center">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4">Step 3 of 3 — Contact</p>
            <h3 className="text-xl font-bold text-white mb-6">Where should we send your report?</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email', {
                required: 'Required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
              className="w-full glass rounded-xl px-4 py-3 text-white text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 border border-white/10"
              placeholder="you@yourcompany.com"
            />
            {errors.email && <p className="text-xs text-[#FF6B6B] mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="phone">
              Phone <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              {...register('phone')}
              className="w-full glass rounded-xl px-4 py-3 text-white text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 border border-white/10"
              placeholder="(512) 000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2" htmlFor="how_heard">How did you hear about us?</label>
            <select
              id="how_heard"
              {...register('how_heard')}
              className="w-full glass rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 border border-white/10 bg-[#0F1B2D]"
            >
              <option value="" className="bg-[#0F1B2D]">Select one</option>
              {howHeard.map((h) => (
                <option key={h} value={h} className="bg-[#0F1B2D]">{h}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="glass rounded-xl p-4 border border-[#FF6B6B]/30 text-sm text-[#FF6B6B]">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="ghost" size="lg" onClick={() => setStep(2)} className="flex-1 justify-center">
              Back
            </Button>
            <Button
              type="submit"
              variant="cta"
              size="lg"
              loading={submitting}
              className="flex-[2] justify-center"
            >
              Get My Free Report
            </Button>
          </div>

          <p className="text-xs text-center text-[var(--text-muted)]">
            No spam. No sales pressure. Just your vulnerability report within 24 hours.
          </p>
        </div>
      )}
    </form>
  )
}
