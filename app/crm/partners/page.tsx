'use client'

import { useEffect, useState, useCallback } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { Plus, Pencil, Trash2, X, ExternalLink, Star, Eye, EyeOff, GripVertical, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { PARTNER_CATEGORIES, type Partner } from '@/lib/partner-types'
import { clsx } from 'clsx'

const COLOR_OPTIONS = ['#00C9A7', '#8B2BE2', '#60A5FA', '#F59E0B', '#FF6B6B', '#A78BFA']

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>(PARTNER_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [color, setColor] = useState('#00C9A7')
  const [featured, setFeatured] = useState(false)
  const [visible, setVisible] = useState(true)
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/crm/partners')
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? `Failed to load (${res.status})`)
        setPartners([])
      } else {
        const data = await res.json()
        setPartners(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function openNew() {
    setEditing(null)
    setName('')
    setCategory(PARTNER_CATEGORIES[0])
    setDescription('')
    setWebsite('')
    setContactEmail('')
    setContactPhone('')
    setColor('#00C9A7')
    setFeatured(false)
    setVisible(true)
    setNotes('')
    setError(null)
    setEditorOpen(true)
  }

  function openEdit(p: Partner) {
    setEditing(p)
    setName(p.name)
    setCategory(p.category)
    setDescription(p.description ?? '')
    setWebsite(p.website ?? '')
    setContactEmail(p.contact_email ?? '')
    setContactPhone(p.contact_phone ?? '')
    setColor(p.color ?? '#00C9A7')
    setFeatured(p.featured)
    setVisible(p.visible)
    setNotes(p.notes ?? '')
    setError(null)
    setEditorOpen(true)
  }

  async function save() {
    if (!name.trim() || !category.trim()) {
      setError('Name and category are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        website: website.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        color,
        featured,
        visible,
        notes: notes.trim() || null,
      }
      const url = editing ? `/api/crm/partners/${editing.id}` : '/api/crm/partners'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.error ?? `Save failed (${res.status})`)
        return
      }
      setEditorOpen(false)
      flash(editing ? 'Partner updated' : 'Partner added')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(p: Partner) {
    if (!confirm(`Delete partner "${p.name}"?`)) return
    const res = await fetch(`/api/crm/partners/${p.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      alert(body?.error ?? 'Delete failed')
      return
    }
    flash('Partner removed')
    await load()
  }

  async function toggleVisible(p: Partner) {
    await fetch(`/api/crm/partners/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !p.visible }),
    })
    load()
  }

  async function toggleFeatured(p: Partner) {
    await fetch(`/api/crm/partners/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !p.featured }),
    })
    load()
  }

  async function move(p: Partner, direction: 'up' | 'down') {
    const sorted = [...partners]
      .filter((x) => x.featured === p.featured)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    const idx = sorted.findIndex((x) => x.id === p.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const items = sorted.map((x, i) => ({
      id: x.id,
      sort_order: i === idx ? swapIdx : i === swapIdx ? idx : x.sort_order,
    }))
    // Simpler: just swap their sort_orders
    const a = sorted[idx]
    const b = sorted[swapIdx]
    await fetch('/api/crm/partners/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { id: a.id, sort_order: b.sort_order },
          { id: b.id, sort_order: a.sort_order },
        ],
      }),
    })
    void items // unused; reserved for future bulk reorder
    load()
  }

  return (
    <CRMShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">Partners</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Manage preferred partners shown on the public /partners page.
            </p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add partner
          </button>
        </div>

        {toast && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {toast}
          </div>
        )}

        {error && !editorOpen && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-cta)]/10 border border-[var(--color-cta)]/30 text-[var(--color-cta)] text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading partners...
          </div>
        ) : partners.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-[var(--text-muted)] mb-4">No partners yet.</p>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add your first partner
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {partners.map((p, idx) => (
              <div
                key={p.id}
                className={clsx(
                  'glass rounded-xl p-4 flex items-center gap-4 transition-colors',
                  !p.visible && 'opacity-50'
                )}
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => move(p, 'up')}
                    disabled={idx === 0}
                    className="text-[var(--text-muted)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move up"
                  >
                    <GripVertical className="w-4 h-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(p, 'down')}
                    disabled={idx === partners.length - 1}
                    className="text-[var(--text-muted)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move down"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                </div>

                <div
                  className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white truncate">{p.name}</h3>
                    {p.featured && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-semibold uppercase tracking-wide">
                        <Star className="w-3 h-3" /> Featured
                      </span>
                    )}
                    {!p.visible && (
                      <span className="px-1.5 py-0.5 rounded-md bg-white/8 text-[var(--text-muted)] text-[10px] font-semibold uppercase tracking-wide">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: p.color }}>{p.category}</p>
                  {p.description && (
                    <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">{p.description}</p>
                  )}
                  {p.website && (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline mt-1"
                    >
                      {p.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleFeatured(p)}
                    className={clsx(
                      'p-2 rounded-lg hover:bg-white/8 transition-colors',
                      p.featured ? 'text-[var(--color-accent)]' : 'text-[var(--text-muted)]'
                    )}
                    aria-label={p.featured ? 'Unfeature' : 'Feature'}
                    title={p.featured ? 'Unfeature' : 'Feature'}
                  >
                    <Star className="w-4 h-4" fill={p.featured ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleVisible(p)}
                    className="p-2 rounded-lg hover:bg-white/8 text-[var(--text-muted)] hover:text-white transition-colors"
                    aria-label={p.visible ? 'Hide' : 'Show'}
                    title={p.visible ? 'Hide from public site' : 'Show on public site'}
                  >
                    {p.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="p-2 rounded-lg hover:bg-white/8 text-[var(--text-muted)] hover:text-white transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    className="p-2 rounded-lg hover:bg-[var(--color-cta)]/10 text-[var(--text-muted)] hover:text-[var(--color-cta)] transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editorOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !saving && setEditorOpen(false)}
        >
          <div
            className="glass rounded-2xl w-full max-w-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/8 sticky top-0 bg-[var(--bg)]/95 backdrop-blur-sm z-10">
              <h2 className="text-lg font-semibold text-white">
                {editing ? 'Edit partner' : 'Add partner'}
              </h2>
              <button
                onClick={() => setEditorOpen(false)}
                disabled={saving}
                className="p-1 hover:bg-white/8 rounded-lg text-[var(--text-muted)] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-cta)]/10 border border-[var(--color-cta)]/30 text-[var(--color-cta)] text-sm">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">
                    Name <span className="text-[var(--color-cta)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Partner business name"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">
                    Category <span className="text-[var(--color-cta)]">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  >
                    {PARTNER_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short blurb shown publicly (1-2 sentences)"
                  rows={2}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-white mb-1.5">Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Accent color</label>
                  <div className="flex gap-2 items-center">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={clsx(
                          'w-7 h-7 rounded-full border-2 transition-all',
                          color === c ? 'border-white scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: c }}
                        aria-label={`Pick ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Contact email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Contact phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(512) 555-0100"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Internal notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Not shown publicly — for your reference"
                  rows={2}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="inline-flex items-center gap-2 text-sm text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  Featured
                  <span className="text-[var(--text-muted)] text-xs">(pin to top)</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setVisible(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  Visible on public site
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-white/8 flex justify-end gap-3 sticky bottom-0 bg-[var(--bg)]/95 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-white hover:bg-white/8 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !name.trim() || !category.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Save changes' : 'Add partner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CRMShell>
  )
}
