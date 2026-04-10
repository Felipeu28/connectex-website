'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Send, Upload, AlertCircle, X, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

interface FormData {
  name: string
  email: string
  company: string
  subject: string
  description: string
}

export function TicketForm() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    if (file && file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
  }

  function clearFile() {
    setSelectedFile(null)
    setPreview(null)
  }

  async function uploadFile(file: File): Promise<string | null> {
    const supabase = createSupabaseBrowser()
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('ticket-attachments')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (error) {
      console.error('Storage upload error:', error)
      return null
    }

    const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(path)
    return data.publicUrl
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Upload image if provided
      let image_url: string | undefined
      if (selectedFile) {
        const url = await uploadFile(selectedFile)
        if (!url) throw new Error('Failed to upload attachment. Please try again.')
        image_url = url
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          company: data.company || undefined,
          subject: data.subject,
          description: data.description,
          priority: 'medium',
          image_url,
        }),
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
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
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

      {/* Attachment */}
      <div>
        <label className={labelClasses}>
          Attachment <span className="text-[var(--color-text-muted)] text-xs">(optional)</span>
        </label>
          {selectedFile ? (
            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-[var(--color-accent)]/30 px-4 py-3">
              <ImageIcon className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
              <span className="text-sm text-[var(--color-text-light)] truncate flex-1">
                {selectedFile.name}
              </span>
              <button
                type="button"
                onClick={clearFile}
                className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-cta)] transition-colors"
                aria-label="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="image"
              className={inputClasses + ' flex items-center gap-2 cursor-pointer hover:border-[var(--color-accent)]/50'}
            >
              <Upload className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
              <span className="text-[var(--color-text-muted)] text-sm truncate">
                Upload screenshot or image
              </span>
            </label>
          )}
          <input
            id="image"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
      </div>

      {/* Image preview */}
      {preview && (
        <div className="rounded-xl overflow-hidden border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Attachment preview" className="w-full max-h-48 object-cover" />
        </div>
      )}

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

      <Button
        type="submit"
        variant="cta"
        size="lg"
        loading={isSubmitting}
        icon={<Send className="w-4 h-4" aria-hidden="true" />}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
      </Button>
    </form>
  )
}
