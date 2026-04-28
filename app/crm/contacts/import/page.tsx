'use client'

import { useState, useRef } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { ArrowLeft, Upload, AlertTriangle, CheckCircle2, Loader2, X, Info } from 'lucide-react'
import {
  buildDefaultStatusMapping,
  parseAirtableContactsCsv,
  type AirtableImportRow,
  type AirtableStatusMapping,
} from '@/lib/airtable-import'
import Link from 'next/link'
import type { PipelineStage } from '@/lib/crm-types'

const PIPELINE_STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'lead', label: 'Lead' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'closed_won', label: 'Closed Won' },
  { key: 'closed_lost', label: 'Closed Lost' },
]

export default function ImportContactsPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload')
  const [rows, setRows] = useState<AirtableImportRow[]>([])
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([])
  const [statusMapping, setStatusMapping] = useState<AirtableStatusMapping>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; devices_imported?: number; errors: string[] } | null>(null)
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result ?? '')
        const { rows: parsed, uniqueStatuses: statuses } = parseAirtableContactsCsv(text)
        if (parsed.length === 0) {
          setParseError('No importable Airtable rows were found in this file.')
          return
        }

        setRows(parsed)
        setUniqueStatuses(statuses)
        setStatusMapping(buildDefaultStatusMapping(statuses))
        setStep(statuses.length > 0 ? 'map' : 'preview')
      } catch (error) {
        setParseError(error instanceof Error ? error.message : 'Unable to parse this Airtable export.')
      }
    }
    reader.readAsText(file)
  }

  function applyStatusMapping(): AirtableImportRow[] {
    return rows.map((r) => ({
      ...r,
      stage: (r.rawStatus && statusMapping[r.rawStatus]) ? statusMapping[r.rawStatus] : 'lead',
    }))
  }

  async function runImport() {
    setImporting(true)
    const mapped = applyStatusMapping()
    const valid = mapped.filter((r) => r.valid)

    const payload = valid.map((r) => ({
      name: r.name,
      email: r.email || null,
      phone: r.phone || null,
      company: r.company || null,
      title: null,
      stage: r.stage,
      notes: r.notes || null,
      source: 'airtable',
      devices: r.devices,
    }))

    const res = await fetch('/api/crm/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: payload }),
    })

    const data = await res.json()
    setResult(
      res.ok
        ? data
        : {
            imported: 0,
            skipped: 0,
            devices_imported: 0,
            errors: [data?.error ?? `Import failed (${res.status})`],
          }
    )
    setStep('done')
    setImporting(false)
  }

  const validRows = rows.filter((r) => r.valid)
  const skippedRows = rows.filter((r) => !r.valid)
  const totalDevices = rows.reduce((acc, r) => acc + r.devices.length, 0)

  return (
    <CRMShell>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/crm/contacts" className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Import from Airtable</h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-0.5">Upload your Airtable CSV export to import contacts</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-faint)]">
          {['upload', 'map', 'preview', 'done'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full font-medium ${step === s ? 'bg-[#8B2BE2] text-white' : i < ['upload','map','preview','done'].indexOf(step) ? 'bg-[#00C9A7]/20 text-[#00C9A7]' : 'bg-white/5 text-[var(--color-text-faint)]'}`}>
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < 3 && <span className="text-white/20">→</span>}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="glass rounded-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#8B2BE2]/15 flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-[#8B2BE2]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Upload your Airtable CSV</h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Export from Airtable → Grid view → Download CSV. Drag &amp; drop or click to browse.
              </p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-6 py-3 bg-[#8B2BE2] hover:bg-[#7a26c7] text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Choose CSV file
            </button>
            <input ref={fileRef} type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" className="hidden" onChange={handleFile} />

            {parseError && (
              <div className="max-w-lg mx-auto text-left p-3 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-xl">
                <p className="text-sm text-[#FF6B6B]">{parseError}</p>
              </div>
            )}

            {/* Sensitive data notice */}
            <div className="flex items-start gap-2 text-left p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl max-w-lg mx-auto">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#F59E0B]/90">
                <span className="font-semibold">Sensitive fields are skipped automatically:</span> One Talk passwords, PINs, and security answers are NOT imported. Keep those in Airtable.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Status mapping */}
        {step === 'map' && (
          <div className="space-y-4">
            <div className="glass rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-1">Map Airtable Status → CRM Pipeline Stage</h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                Found <strong className="text-white">{uniqueStatuses.length}</strong> unique status values in your CSV. Set the correct pipeline stage for each.
              </p>
              <div className="space-y-3">
                {uniqueStatuses.map((status) => (
                  <div key={status} className="flex items-center gap-4">
                    <span className="text-sm text-white w-48 flex-shrink-0 font-medium">{status || '(blank)'}</span>
                    <span className="text-[var(--color-text-faint)] text-sm">→</span>
                    <select
                      value={statusMapping[status] ?? 'lead'}
                      onChange={(e) => setStatusMapping((prev) => ({ ...prev, [status]: e.target.value as PipelineStage }))}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8B2BE2]"
                    >
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setStep('upload')} className="px-4 py-2.5 text-sm text-[var(--color-text-muted)] hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                Back
              </button>
              <button
                onClick={() => setStep('preview')}
                className="px-5 py-2.5 bg-[#8B2BE2] hover:bg-[#7a26c7] text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Preview Import →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{validRows.length}</p>
                <p className="text-xs text-[#00C9A7] mt-0.5">Contacts to import</p>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{totalDevices}</p>
                <p className="text-xs text-[#A78BFA] mt-0.5">Devices to import</p>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{skippedRows.length}</p>
                <p className="text-xs text-[var(--color-text-faint)] mt-0.5">Rows skipped</p>
              </div>
            </div>

            {/* Notice about existing contacts */}
            <div className="flex items-start gap-2 p-3 bg-[#60A5FA]/10 border border-[#60A5FA]/20 rounded-xl">
              <Info className="w-4 h-4 text-[#60A5FA] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#60A5FA]/90">
                Contacts with a matching email already in the CRM will be <strong>skipped automatically</strong> (no duplicates created).
              </p>
            </div>

            {/* Preview table */}
            <div className="glass rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Preview — {fileName}</h2>
                <span className="text-xs text-[var(--color-text-faint)]">Showing first 20</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left px-4 py-2.5 text-[var(--color-text-faint)] font-medium">Name</th>
                      <th className="text-left px-4 py-2.5 text-[var(--color-text-faint)] font-medium">Company</th>
                      <th className="text-left px-4 py-2.5 text-[var(--color-text-faint)] font-medium">Email</th>
                      <th className="text-left px-4 py-2.5 text-[var(--color-text-faint)] font-medium">Stage</th>
                      <th className="text-left px-4 py-2.5 text-[var(--color-text-faint)] font-medium">Devices</th>
                      <th className="text-left px-4 py-2.5 text-[var(--color-text-faint)] font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applyStatusMapping().slice(0, 20).map((r, i) => (
                      <tr key={i} className={`border-b border-white/5 ${!r.valid ? 'opacity-40' : ''}`}>
                        <td className="px-4 py-2.5 text-white font-medium">{r.name || '—'}</td>
                        <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{r.company || '—'}</td>
                        <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{r.email || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#8B2BE2]/20 text-[#C084FC]">
                            {PIPELINE_STAGES.find((s) => s.key === r.stage)?.label ?? r.stage}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[var(--color-text-faint)]">{r.devices.length || '—'}</td>
                        <td className="px-4 py-2.5">
                          {r.valid ? (
                            <span className="text-[#00C9A7]">✓ Import</span>
                          ) : (
                            <span className="text-[#FF6B6B]">Skip: {r.skipReason}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 20 && (
                <div className="px-4 py-2.5 border-t border-white/8 text-xs text-[var(--color-text-faint)]">
                  + {rows.length - 20} more rows not shown
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setStep(uniqueStatuses.length > 0 ? 'map' : 'upload')} className="px-4 py-2.5 text-sm text-[var(--color-text-muted)] hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                Back
              </button>
              <button
                onClick={runImport}
                disabled={importing || validRows.length === 0}
                className="px-5 py-2.5 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {importing ? 'Importing…' : `Import ${validRows.length} Contacts`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && result && (
          <div className="glass rounded-xl p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#00C9A7]/15 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#00C9A7]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import complete</h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Your Airtable contacts are now in the CRM.</p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="p-4 rounded-xl bg-[#00C9A7]/10 border border-[#00C9A7]/20">
                <p className="text-2xl font-bold text-[#00C9A7]">{result.imported}</p>
                <p className="text-xs text-[#00C9A7]/80 mt-0.5">Contacts</p>
              </div>
              <div className="p-4 rounded-xl bg-[#A78BFA]/10 border border-[#A78BFA]/20">
                <p className="text-2xl font-bold text-[#A78BFA]">{result.devices_imported ?? 0}</p>
                <p className="text-xs text-[#A78BFA]/80 mt-0.5">Devices</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-2xl font-bold text-white">{result.skipped}</p>
                <p className="text-xs text-[var(--color-text-faint)] mt-0.5">Skipped</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="text-left p-3 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-xl max-w-lg mx-auto">
                <p className="text-xs font-semibold text-[#FF6B6B] mb-2 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" /> {result.errors.length} errors
                </p>
                {result.errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-[#FF6B6B]/80">{e}</p>
                ))}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Link
                href="/crm/contacts"
                className="px-5 py-2.5 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] font-semibold rounded-xl text-sm transition-colors"
              >
                View Contacts
              </Link>
              <button
                onClick={() => { setStep('upload'); setRows([]); setResult(null) }}
                className="px-5 py-2.5 border border-white/10 text-[var(--color-text-muted)] hover:text-white rounded-xl text-sm hover:bg-white/5 transition-colors"
              >
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </CRMShell>
  )
}
