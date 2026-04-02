'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Send, Upload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { TicketPriority } from '@/lib/ticket-types'

interface FormData {
  name: string
  email: string
  company: string
  subject: string
  description: string
  priority: TicketPriority
  image: FileList | null
}

export function TicketForm() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      priority: 'medium',
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Placeholder: if an image was selected, we would upload to Supabase Storage here
      // and get back a URL. For now, image_url is omitted.
      const payload = {
        name: data.name,
        email: data.email,
        company: data.company || undefined,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to create ticket')
      }

      const { token } = await res.json()
      router.push(`/ticketing/${token}?new=1`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClasses =
    'w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[var(--color-text-light)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all'

  const labelClasses = 'block text-sm font-medium text-[var(--color-text-light)] mb-1.5'

  const errorClasses = 'mt-1 text-xs text-[var(--color-cta)]'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Name & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelClasses}>
            Name <span className="text-[var(--color-cta)]">*</span>
          </label>
          <input
            id="name"
            type="text"
            className={inputClasses}
            placeholder="Your full name"
            {...register('name', { required: 'Name is required' })}
            aria-invalid={errors.name ? 'true' : 'false'}
          />
          {errors.name && <p className={errorClasses} role="alert">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className={labelClasses}>
            Email <span className="text-[var(--color-cta)]">*</span>
          </label>
          <input
            id="email"
            type="email"
            className={inputClasses}
            placeholder="you@company.com"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email',
              },
            })}
            aria-invalid={errors.email ? 'true' : 'false'}
          />
          {errors.email && <p className={errorClasses} role="alert">{errors.email.message}</p>}
        </div>
      </div>

      {/* Company */}
      <div>
        <label htmlFor="company" className={labelClasses}>
          Company <span className="text-[var(--color-text-muted)] text-xs">(optional)</span>
        </label>
        <input
          id="company"
          type="text"
          className={inputClasses}
          placeholder="Your company name"
          {...register('company')}
        />
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className={labelClasses}>
          Subject <span className="text-[var(--color-cta)]">*</span>
        </label>
        <input
          id="subject"
          type="text"
          className={inputClasses}
          placeholder="Brief summary of your issue"
          {...register('subject', { required: 'Subject is required' })}
          aria-invalid={errors.subject ? 'true' : 'false'}
        />
        {errors.subject && <p className={errorClasses} role="alert">{errors.subject.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClasses}>
          Description <span className="text-[var(--color-cta)]">*</span>
        </label>
        <textarea
          id="description"
          rows={5}
          className={inputClasses + ' resize-y min-h-[120px]'}
          placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, and what you expected to happen."
          {...register('description', { required: 'Description is required' })}
          aria-invalid={errors.description ? 'true' : 'false'}
        />
        {errors.description && (
          <p className={errorClasses} role="alert">{errors.description.message}</p>
        )}
      </div>

      {/* Priority & Image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className={labelClasses}>
            Priority
          </label>
          <select
            id="priority"
            className={inputClasses + ' appearance-none cursor-pointer'}
            {...register('priority')}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label htmlFor="image" className={labelClasses}>
            Attachment <span className="text-[var(--color-text-muted)] text-xs">(optional)</span>
          </label>
          <label
            htmlFor="image"
            className={
              inputClasses +
              ' flex items-center gap-2 cursor-pointer hover:border-[var(--color-accent)]/50'
            }
          >
            <Upload className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
            <span className="text-[var(--color-text-muted)] text-sm truncate">
              {fileName || 'Upload screenshot or file'}
            </span>
          </label>
          <input
            id="image"
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="sr-only"
            {...register('image', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0]
                setFileName(file ? file.name : null)
              },
            })}
          />
        </div>
      </div>

      {/* Error banner */}
      {submitError && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-cta)]/10 border border-[var(--color-cta)]/20 text-[var(--color-cta)] text-sm"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {submitError}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="cta"
        size="lg"
        loading={isSubmitting}
        icon={<Send className="w-4 h-4" aria-hidden="true" />}
        className="w-full"
      >
        Submit Ticket
      </Button>
    </form>
  )
}
