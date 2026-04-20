'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Send, Upload, X, ImageIcon, AlertCircle } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

interface FormData {
  name: string
  subject: string
  description: string
}

interface PortalTicketFormProps {
  userName: string
  userEmail: string
  userId: string
}

export function PortalTicketForm({ userName, userEmail, userId }: PortalTicketFormProps) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { name: userName },
  })

  const inputClasses =
    'w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#8B2BE2] focus:border-transparent transition-all text-sm'
  const labelClasses = 'block text-sm font-medium text-[#94A3B8] mb-1.5'

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    if (file && file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
  }

  async function uploadFile(file: File): Promise<string | null> {
    const supabase = createSupabaseBrowser()
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('ticket-attachments')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) return null
    const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(path)
    return data.publicUrl
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
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
          email: userEmail,
          subject: data.subject,
          description: data.description,
          priority: 'medium',
          image_url,
          user_id: userId,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to create ticket')
      }

      const { token } = await res.json()
      router.push(`/portal/tickets/${token}?new=1`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Name (read-only display if pre-filled) */}
      <div>
        <label htmlFor="name" className={labelClasses}>Your Name</label>
        <input
          id="name"
          type="text"
          className={inputClasses}
          placeholder="Your full name"
          {...register('name', { required: 'Name is required' })}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-[#FF6B6B]" role="alert">{errors.name.message}</p>
        )}
      </div>

      {/* Email (locked to session) */}
      <div>
        <label className={labelClasses}>Email</label>
        <div className="w-full rounded-xl bg-white/3 border border-white/8 px-4 py-3 text-[#94A3B8] text-sm cursor-not-allowed">
          {userEmail}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className={labelClasses}>
          Subject <span className="text-[#FF6B6B]">*</span>
        </label>
        <input
          id="subject"
          type="text"
          className={inputClasses}
          placeholder="Brief summary of your issue"
          {...register('subject', { required: 'Subject is required' })}
          aria-invalid={errors.subject ? 'true' : 'false'}
        />
        {errors.subject && (
          <p className="mt-1 text-xs text-[#FF6B6B]" role="alert">{errors.subject.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClasses}>
          Description <span className="text-[#FF6B6B]">*</span>
        </label>
        <textarea
          id="description"
          rows={5}
          className={inputClasses + ' resize-y min-h-[120px]'}
          placeholder="Describe your issue in detail — include any error messages, what you tried, and what you expected to happen."
          {...register('description', { required: 'Description is required' })}
          aria-invalid={errors.description ? 'true' : 'false'}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-[#FF6B6B]" role="alert">{errors.description.message}</p>
        )}
      </div>

      {/* Attachment */}
      <div>
        <label className={labelClasses}>
          Attachment <span className="text-[#94A3B8] text-xs">(optional)</span>
        </label>
        {selectedFile ? (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-[#00C9A7]/30 px-4 py-3">
            <ImageIcon className="w-4 h-4 text-[#00C9A7] shrink-0" />
            <span className="text-sm text-white truncate flex-1">{selectedFile.name}</span>
            <button
              type="button"
              onClick={() => { setSelectedFile(null); setPreview(null) }}
              className="shrink-0 text-[#94A3B8] hover:text-[#FF6B6B] transition-colors"
              aria-label="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="image"
            className={inputClasses + ' flex items-center gap-2 cursor-pointer hover:border-[#00C9A7]/50'}
          >
            <Upload className="w-4 h-4 text-[#94A3B8] shrink-0" />
            <span className="text-[#94A3B8] text-sm">Upload screenshot or image</span>
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

      {preview && (
        <div className="rounded-xl overflow-hidden border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Attachment preview" className="w-full max-h-48 object-cover" />
        </div>
      )}

      {submitError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-[#FF6B6B] text-sm" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-[#8B2BE2] hover:bg-[#7624c4] text-white font-semibold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isSubmitting ? (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Ticket
          </>
        )}
      </button>
    </form>
  )
}
