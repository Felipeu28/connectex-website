'use client'

import { useState, useRef } from 'react'
import { X, Upload, AlertCircle, CheckCircle, FileText, ChevronDown } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { PipelineStage } from '@/lib/crm-types'

interface ImportRow {
  name: string
  email: string
  phone: string
  company: string
  title: string
  notes: string
}

interface ImportResult {
  inserted: number
  skipped: number
  errors: string[]
}

// Robust CSV parser — handles quoted fields, commas in values, \r\n
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]
    const next = normalized[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { field += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { row.push(field.trim()); field = '' }
      else if (ch === '\n') {
        row.push(field.trim())
        if (row.some((c) => c !== '')) rows.push(row)
        row = []; field = ''
      } else { field += ch }
    }
  }
  if (field || row.length) { row.push(field.trim()); if (row.some((c) => c !== '')) rows.push(row) }

  return rows
}

// Map common column name variations to our schema
const FIELD_MAP: Record<string, keyof ImportRow> = {
  name: 'name', 'full name': 'name', fullname: 'name', contact: 'name', 'contact name': 'name',
  email: 'email', 'email address': 'email', 'work email': 'email',
  phone: 'phone', 'phone number': 'phone', mobile: 'phone', 'cell phone': 'phone', tel: 'phone',
  company: 'company', organization: 'company', 'company name': 'company', account: 'company',
  title: 'title', 'job title': 'title', role: 'title', position: 'title',
  notes: 'notes', note: 'notes', description: 'notes', comments: 'notes',
}

function mapHeaders(headers: string[]): (keyof ImportRow | null)[] {
  return headers.map((h) => FIELD_MAP[h.toLowerCase().trim()] ?? null)
}

interface Props {
  open: boolean
  onClose: () => void
  onImported: (count: number) => void
}

export function ContactImportModal({ open, onClose, onImported }: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mappings, setMappings] = useState<(keyof ImportRow | null)[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  function reset() {
    setStep('upload')
    setRows([])
    setHeaders([])
    setMappings([])
    setResult(null)
    setError(null)
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleClose() { reset(); onClose() }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'txt'].includes(ext ?? '')) {
      setError('Please upload a CSV file. Export from Airtable or Excel as CSV first.')
      return
    }

    const text = await file.text()
    const parsed = parseCSV(text)
    if (parsed.length < 2) { setError('File appears empty or invalid.'); return }

    const hdrs = parsed[0]
    const maps = mapHeaders(hdrs)
    const dataRows: ImportRow[] = parsed.slice(1).map((row) => {
      const r: ImportRow = { name: '', email: '', phone: '', company: '', title: '', notes: '' }
      row.forEach((val, i) => {
        const field = maps[i]
        if (field) r[field] = val
      })
      return r
    }).filter((r) => r.name || r.email)

    if (dataRows.length === 0) { setError('No valid rows found. Make sure your file has Name or Email columns.'); return }

    setHeaders(hdrs)
    setMappings(maps)
    setRows(dataRows)
    setStep('preview')
  }

  async function runImport() {
    setImporting(true)
    const supabase = createSupabaseBrowser()
    let inserted = 0
    let skipped = 0
    const errors: string[] = []

    for (const row of rows) {
      if (!row.name && !row.email) { skipped++; continue }
      const name = row.name || row.email.split('@')[0]

      // Dedup by email
      if (row.email) {
        const { count } = await supabase
          .from('crm_contacts')
          .select('id', { count: 'exact', head: true })
          .eq('email', row.email.toLowerCase().trim())
        if (count && count > 0) { skipped++; continue }
      }

      const { error: insertError } = await supabase.from('crm_contacts').insert({
        name,
        email: row.email?.toLowerCase().trim() || null,
        phone: row.phone || null,
        company: row.company || null,
        title: row.title || null,
        notes: row.notes || null,
        source: 'manual' as const,
        stage: 'lead' as PipelineStage,
        deal_value: 0,
        tags: [],
      })

      if (insertError) { errors.push(`${name}: ${insertError.message}`); skipped++ }
      else { inserted++ }
    }

    setResult({ inserted, skipped, errors })
    setStep('done')
    setImporting(false)
    if (inserted > 0) onImported(inserted)
  }

  const fieldOptions: { value: keyof ImportRow | ''; label: string }[] = [
    { value: '', label: '— Skip —' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'company', label: 'Company' },
    { value: 'title', label: 'Title' },
    { value: 'notes', label: 'Notes' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0F1B2D]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Import Contacts</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Upload a CSV from Airtable, Google Sheets, or Excel
            </p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center justify-center gap-3 w-full h-40 rounded-xl border-2 border-dashed border-white/10 hover:border-[#00C9A7]/40 cursor-pointer transition-colors group"
              >
                <Upload className="w-8 h-8 text-[var(--color-text-muted)] group-hover:text-[#00C9A7] transition-colors" />
                <div className="text-center">
                  <p className="text-sm text-white font-medium">Click to upload CSV</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Export from Airtable → CSV, or Excel → Save As CSV
                  </p>
                </div>
              </label>
              <input
                id="csv-upload"
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                className="sr-only"
                onChange={handleFile}
              />

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-[#FF6B6B] text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-xs text-[var(--color-text-muted)] font-medium mb-1">Expected columns (any order):</p>
                <p className="text-xs text-[var(--color-text-faint)]">
                  Name · Email · Phone · Company · Title · Notes — extra columns are ignored
                </p>
              </div>
            </div>
          )}

          {/* Step: Preview + field mapping */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00C9A7]" />
                <p className="text-sm text-white font-medium">{rows.length} contacts ready to import</p>
              </div>

              {/* Column mapping */}
              <div>
                <p className="text-xs text-[var(--color-text-muted)] font-medium mb-2">Column mapping — adjust if needed:</p>
                <div className="grid grid-cols-2 gap-2">
                  {headers.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
                      <span className="text-xs text-[var(--color-text-muted)] truncate flex-1">{h}</span>
                      <span className="text-[var(--color-text-faint)] text-xs">→</span>
                      <div className="relative">
                        <select
                          value={mappings[i] ?? ''}
                          onChange={(e) => {
                            const m = [...mappings]
                            m[i] = (e.target.value as keyof ImportRow) || null
                            setMappings(m)
                          }}
                          className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-[#00C9A7] appearance-none pr-5"
                        >
                          {fieldOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--color-text-faint)] pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview rows */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <p className="text-xs text-[var(--color-text-muted)] px-3 py-2 border-b border-white/5 font-medium">
                  Preview (first 5 rows)
                </p>
                <div className="divide-y divide-white/5">
                  {rows.slice(0, 5).map((r, i) => (
                    <div key={i} className="px-3 py-2 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#00C9A7]/15 flex items-center justify-center text-xs font-bold text-[#00C9A7] shrink-0">
                        {(r.name || r.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{r.name || '—'}</p>
                        <p className="text-xs text-[var(--color-text-faint)] truncate">{r.email || ''}{r.company ? ` · ${r.company}` : ''}</p>
                      </div>
                    </div>
                  ))}
                  {rows.length > 5 && (
                    <p className="px-3 py-2 text-xs text-[var(--color-text-faint)]">
                      +{rows.length - 5} more rows…
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={runImport}
                  disabled={importing}
                  className="flex-1 px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm"
                >
                  {importing ? `Importing ${rows.length} contacts…` : `Import ${rows.length} Contacts`}
                </button>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#00C9A7]/10 border border-[#00C9A7]/20">
                <CheckCircle className="w-6 h-6 text-[#00C9A7] shrink-0" />
                <div>
                  <p className="text-white font-semibold">Import complete</p>
                  <p className="text-sm text-[#00C9A7]">
                    {result.inserted} contacts added · {result.skipped} skipped (duplicates or empty)
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20">
                  <p className="text-xs text-[#FF6B6B] font-medium mb-1">Errors ({result.errors.length})</p>
                  {result.errors.slice(0, 5).map((e, i) => (
                    <p key={i} className="text-xs text-[#FF6B6B]/80">{e}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={reset} className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors">
                  Import Another
                </button>
                <button onClick={handleClose} className="flex-1 px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] font-semibold rounded-xl transition-colors text-sm">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
