'use client'

import { useEffect, useState, useRef } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { BookOpen, Plus, Trash2, Upload, X, ChevronDown, ChevronUp } from 'lucide-react'

interface KBDocument {
  id: string
  title: string
  category: 'verizon' | 'microsoft365' | 'ucaas' | 'general'
  file_name: string | null
  created_at: string
  updated_at: string
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  verizon: { label: 'Verizon', color: '#EF4444', bg: 'bg-red-500/10' },
  microsoft365: { label: 'Microsoft 365', color: '#60A5FA', bg: 'bg-blue-500/10' },
  ucaas: { label: 'UCaaS / VoIP', color: '#A78BFA', bg: 'bg-purple-500/10' },
  general: { label: 'General', color: '#94A3B8', bg: 'bg-slate-500/10' },
}

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<KBDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedContent, setExpandedContent] = useState<string>('')
  const [loadingContent, setLoadingContent] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>('general')
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDocs()
  }, [])

  async function loadDocs() {
    setLoading(true)
    const res = await fetch('/api/crm/knowledge-base')
    const data = await res.json()
    setDocs(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
    const text = await file.text()
    setContent(text)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!title.trim() || !content.trim()) {
      setFormError('Title and content are required.')
      return
    }
    setSaving(true)
    const res = await fetch('/api/crm/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), category, content: content.trim(), file_name: fileName }),
    })
    if (res.ok) {
      setTitle('')
      setCategory('general')
      setContent('')
      setFileName(null)
      setShowForm(false)
      loadDocs()
    } else {
      const err = await res.json()
      setFormError(err.error ?? 'Failed to save document.')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document? The AI will no longer have access to it.')) return
    setDeleting(id)
    await fetch(`/api/crm/knowledge-base/${id}`, { method: 'DELETE' })
    setDocs((prev) => prev.filter((d) => d.id !== id))
    if (expandedId === id) setExpandedId(null)
    setDeleting(null)
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedContent('')
      return
    }
    setExpandedId(id)
    setExpandedContent('')
    setLoadingContent(true)
    const res = await fetch(`/api/crm/knowledge-base/${id}`)
    if (res.ok) {
      const data = await res.json()
      setExpandedContent(data.content ?? '')
    }
    setLoadingContent(false)
  }

  const grouped = Object.keys(CATEGORY_CONFIG).reduce<Record<string, KBDocument[]>>((acc, cat) => {
    acc[cat] = docs.filter((d) => d.category === cat)
    return acc
  }, {})

  return (
    <CRMShell>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-0.5">
              Documents the AI uses when answering support tickets
            </p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setFormError(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-[#8B2BE2] hover:bg-[#7a26c7] text-white font-medium rounded-xl text-sm transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Document'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="glass rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#8B2BE2]" />
              New Knowledge Base Document
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--color-text-muted)]">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Verizon Jetpack Troubleshooting"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#8B2BE2] text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--color-text-muted)]">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8B2BE2]"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* File upload */}
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--color-text-muted)]">Upload file (optional — .txt or .md)</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Choose file
                </button>
                {fileName && (
                  <span className="text-xs text-[#00C9A7] flex items-center gap-1">
                    {fileName}
                    <button
                      type="button"
                      onClick={() => { setFileName(null); if (fileRef.current) fileRef.current.value = '' }}
                      className="ml-1 text-[var(--color-text-faint)] hover:text-[#FF6B6B]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.md,text/plain,text/markdown"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Content textarea */}
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--color-text-muted)]">Content (paste text or edit after upload)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the document content here. The AI will search this text when answering tickets in the selected category."
                rows={10}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#8B2BE2] text-sm resize-y font-mono"
                required
              />
              <p className="text-xs text-[var(--color-text-faint)]">{content.length.toLocaleString()} characters</p>
            </div>

            {formError && (
              <p className="text-xs text-[#FF6B6B]">{formError}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#8B2BE2] hover:bg-[#7a26c7] text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Document'}
              </button>
            </div>
          </form>
        )}

        {/* Document list */}
        {loading ? (
          <div className="glass rounded-xl p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-white/5 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="glass rounded-xl p-10 text-center">
            <BookOpen className="w-10 h-10 text-[var(--color-text-faint)] mx-auto mb-3" />
            <p className="text-[var(--color-text-muted)] text-sm">No documents yet.</p>
            <p className="text-[var(--color-text-faint)] text-xs mt-1">
              Add documents to help the AI answer tickets more accurately.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => {
              const catDocs = grouped[cat]
              if (catDocs.length === 0) return null
              return (
                <div key={cat} className="glass rounded-xl overflow-hidden">
                  <div className={`px-4 py-2.5 border-b border-white/8 flex items-center gap-2 ${cfg.bg}`}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-[var(--color-text-faint)] ml-1">{catDocs.length} doc{catDocs.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {catDocs.map((doc) => (
                      <div key={doc.id}>
                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{doc.title}</p>
                            <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
                              {doc.file_name ? `${doc.file_name} · ` : ''}
                              Added {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleExpand(doc.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-faint)] hover:text-white transition-colors"
                              title="Preview content"
                            >
                              {expandedId === doc.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              disabled={deleting === doc.id}
                              className="p-1.5 rounded-lg hover:bg-[#FF6B6B]/10 text-[var(--color-text-faint)] hover:text-[#FF6B6B] transition-colors"
                              title="Delete document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {expandedId === doc.id && (
                          <div className="px-4 pb-4 border-t border-white/5 bg-white/[0.01]">
                            {loadingContent ? (
                              <div className="h-20 bg-white/5 animate-pulse rounded-lg mt-3" />
                            ) : (
                              <pre className="mt-3 text-xs text-[var(--color-text-muted)] whitespace-pre-wrap font-mono overflow-auto max-h-64 leading-relaxed">
                                {expandedContent || '(no content)'}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </CRMShell>
  )
}
