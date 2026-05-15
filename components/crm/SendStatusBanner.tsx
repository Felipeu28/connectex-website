'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface Status {
  ready: boolean
  sender: string
  cron_secret_set: boolean
  notes: string
}

export function SendStatusBanner() {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    fetch('/api/crm/send-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStatus(d))
      .catch(() => setStatus(null))
  }, [])

  if (!status) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[var(--text-muted)]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Checking email send status...
      </div>
    )
  }

  if (!status.ready) {
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-cta)]/10 border border-[var(--color-cta)]/30 text-xs text-[var(--color-cta)]">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Emails will NOT send.</p>
          <p className="text-[var(--color-cta)]/80 mt-0.5">{status.notes}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/30 text-xs text-[var(--color-accent)]">
      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">Email send ready.</p>
        <p className="text-[var(--color-accent)]/80 mt-0.5">
          Sending as <code className="bg-black/20 px-1 rounded">{status.sender}</code>
          {!status.cron_secret_set && ' — CRON_SECRET not set, scheduled sends will fail.'}
        </p>
      </div>
    </div>
  )
}
