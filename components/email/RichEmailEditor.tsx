'use client'

// Minimal RichEmailEditor placeholder. The full WYSIWYG version from moil
// is being ported separately; this stub lets the campaigns/templates pages
// build and function with plain-text/HTML editing in the meantime.

import { useId } from 'react'

export interface RichEmailEditorProps {
  value: string
  onChange: (value: string) => void
  minHeight?: number
  placeholder?: string
}

export function RichEmailEditor({ value, onChange, minHeight = 240, placeholder }: RichEmailEditorProps) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Write your email here… supports HTML. {{first_name}}, {{company}} substitutions.'}
        style={{ minHeight }}
        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm font-mono leading-relaxed resize-y"
      />
      <p className="text-[11px] text-[var(--color-text-faint)]">
        Plain-text editor. The rich toolbar is being ported — paste HTML directly for now.
      </p>
    </div>
  )
}
