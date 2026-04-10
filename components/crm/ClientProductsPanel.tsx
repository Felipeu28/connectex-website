'use client'

import { useEffect, useState } from 'react'
import { Monitor, Plus, Trash2, X } from 'lucide-react'

interface ClientProduct {
  id: string
  device_type: string
  manufacturer: string | null
  model: string
  serial_number: string | null
  notes: string | null
  created_at: string
}

const DEVICE_TYPES = [
  'Router', 'Phone', 'Desk Phone', 'Laptop', 'Tablet', 'Jetpack / Hotspot',
  'Network Switch', 'Access Point', 'Server', 'Printer', 'Other',
]

export function ClientProductsPanel({ contactId }: { contactId: string }) {
  const [products, setProducts] = useState<ClientProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [deviceType, setDeviceType] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadProducts()
  }, [contactId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProducts() {
    setLoading(true)
    const res = await fetch(`/api/crm/contacts/${contactId}/products`)
    if (res.ok) {
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    }
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!deviceType || !model.trim()) {
      setError('Device type and model are required.')
      return
    }
    setSaving(true)
    const res = await fetch(`/api/crm/contacts/${contactId}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_type: deviceType,
        manufacturer: manufacturer || null,
        model: model.trim(),
        serial_number: serialNumber.trim() || null,
        notes: notes.trim() || null,
      }),
    })
    if (res.ok) {
      setDeviceType('')
      setManufacturer('')
      setModel('')
      setSerialNumber('')
      setNotes('')
      setShowForm(false)
      loadProducts()
    } else {
      const err = await res.json()
      setError(err.error ?? 'Failed to save.')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/crm/contacts/${contactId}/products/${id}`, { method: 'DELETE' })
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setDeleting(null)
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-[var(--color-text-faint)] uppercase tracking-wider flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5" />
          Devices <span className="text-[var(--color-text-faint)]">({products.length})</span>
        </h2>
        <button
          onClick={() => { setShowForm((v) => !v); setError(null) }}
          className="p-1 rounded hover:bg-white/10 text-[var(--color-text-faint)] hover:text-white transition-colors"
          aria-label={showForm ? 'Cancel' : 'Add device'}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 space-y-2.5 pb-4 border-b border-white/8">
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#8B2BE2]"
            required
          >
            <option value="">Device type...</option>
            {DEVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="text"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            placeholder="Manufacturer (e.g. Verizon, Apple)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#8B2BE2] text-xs"
          />
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model (e.g. iPhone 15 Pro, T77)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#8B2BE2] text-xs"
            required
          />
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Serial / IMEI (optional)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#8B2BE2] text-xs"
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#8B2BE2] text-xs"
          />
          {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 bg-[#8B2BE2] hover:bg-[#7a26c7] text-white font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add Device'}
          </button>
        </form>
      )}

      {/* Device list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg" />)}
        </div>
      ) : products.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-xs py-3 text-center">No devices on file.</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] group hover:bg-white/[0.05] transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">
                  {p.manufacturer ? `${p.manufacturer} ` : ''}{p.model}
                </p>
                <p className="text-[10px] text-[var(--color-text-faint)] mt-0.5">
                  {p.device_type}
                  {p.serial_number ? ` · ${p.serial_number}` : ''}
                </p>
                {p.notes && <p className="text-[10px] text-[var(--color-text-faint)] mt-0.5 truncate">{p.notes}</p>}
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                disabled={deleting === p.id}
                className="flex-shrink-0 p-1 rounded hover:bg-[#FF6B6B]/10 text-transparent group-hover:text-[var(--color-text-faint)] hover:text-[#FF6B6B] transition-colors"
                aria-label="Remove device"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
