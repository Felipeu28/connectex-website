'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { CalendarEvent, Contact } from '@/lib/crm-types'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  ExternalLink,
  Unplug,
  Loader2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { clsx } from 'clsx'

const EVENT_COLORS: Record<string, string> = {
  meeting: '#60A5FA',
  call: '#00C9A7',
  follow_up: '#F59E0B',
  task: '#A78BFA',
  other: '#94A3B8',
}

interface EventFormData {
  title: string
  description: string
  start_time: string
  end_time: string
  location: string
  type: CalendarEvent['type']
  contact_id: string
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [contacts, setContacts] = useState<Pick<Contact, 'id' | 'name'>[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [saving, setSaving] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormData>()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowser()
    const startOfMonth = new Date(year, month, 1).toISOString()
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

    const [eventsRes, contactsRes] = await Promise.all([
      supabase
        .from('crm_events')
        .select('*, contact:crm_contacts(id,name)')
        .gte('start_time', startOfMonth)
        .lte('start_time', endOfMonth)
        .order('start_time'),
      supabase.from('crm_contacts').select('id,name').order('name'),
    ])
    setEvents(eventsRes.data ?? [])
    setContacts(contactsRes.data ?? [])
  }, [year, month])

  useEffect(() => {
    ;(async () => {
      await load()
      // Check Google Calendar connection status
      try {
        const res = await fetch('/api/google/calendar/status')
        const data = await res.json()
        setGoogleConnected(data.connected)
      } catch {
        // Google not configured, that's fine
      }
    })()
  }, [load])

  function openModal(event?: CalendarEvent, date?: string) {
    if (event) {
      setEditEvent(event)
      reset({
        title: event.title,
        description: event.description ?? '',
        start_time: event.start_time.slice(0, 16),
        end_time: event.end_time.slice(0, 16),
        location: event.location ?? '',
        type: event.type,
        contact_id: event.contact_id ?? '',
      })
    } else {
      setEditEvent(null)
      const start = date ? `${date}T09:00` : ''
      const end = date ? `${date}T10:00` : ''
      reset({
        title: '',
        description: '',
        start_time: start,
        end_time: end,
        location: '',
        type: 'meeting',
        contact_id: '',
      })
    }
    setModalOpen(true)
  }

  async function syncToGoogle(
    action: 'create' | 'update' | 'delete',
    eventId: string,
    eventData?: {
      title: string
      description?: string | null
      start_time: string
      end_time: string
      location?: string | null
    }
  ) {
    if (!googleConnected) return
    try {
      setSyncing(true)
      await fetch('/api/google/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          event_id: eventId,
          event: eventData,
        }),
      })
    } catch (err) {
      console.error('Google sync failed:', err)
    } finally {
      setSyncing(false)
    }
  }

  async function onSubmit(data: EventFormData) {
    setSaving(true)
    const supabase = createSupabaseBrowser()

    const payload = {
      title: data.title,
      description: data.description || null,
      start_time: new Date(data.start_time).toISOString(),
      end_time: new Date(data.end_time).toISOString(),
      location: data.location || null,
      type: data.type,
      contact_id: data.contact_id || null,
      updated_at: new Date().toISOString(),
    }

    if (editEvent) {
      await supabase.from('crm_events').update(payload).eq('id', editEvent.id)
      await syncToGoogle('update', editEvent.id, payload)
    } else {
      const { data: inserted } = await supabase
        .from('crm_events')
        .insert(payload)
        .select('id')
        .single()
      if (inserted) {
        await syncToGoogle('create', inserted.id, payload)
      }
    }

    setSaving(false)
    setModalOpen(false)
    load()
  }

  async function deleteEvent() {
    if (!editEvent || !confirm('Delete this event?')) return
    const supabase = createSupabaseBrowser()
    await syncToGoogle('delete', editEvent.id)
    await supabase.from('crm_events').delete().eq('id', editEvent.id)
    setModalOpen(false)
    load()
  }

  async function disconnectGoogle() {
    if (!confirm('Disconnect Google Calendar?')) return
    await fetch('/api/google/calendar/status', { method: 'DELETE' })
    setGoogleConnected(false)
  }

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []

    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    while (days.length % 7 !== 0) days.push(null)

    return days
  }, [year, month])

  function eventsOnDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((e) => e.start_time.startsWith(dateStr))
  }

  const today = new Date()
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

  const monthLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <CRMShell>
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1))}
              className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-white min-w-[200px] text-center">
              {monthLabel}
            </h1>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1))}
              className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors ml-2"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Google Calendar connection */}
            {googleConnected ? (
              <div className="flex items-center gap-2">
                {syncing && <Loader2 className="w-4 h-4 text-[#00C9A7] animate-spin" />}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#00C9A7] bg-[#00C9A7]/10 border border-[#00C9A7]/20 rounded-lg">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google Calendar Synced
                </span>
                <button
                  onClick={disconnectGoogle}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
                  title="Disconnect Google Calendar"
                >
                  <Unplug className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <a
                href="/api/google/connect"
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Connect Google Calendar</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            )}

            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] font-semibold text-sm rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Event
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="glass rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/8">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="px-2 py-2.5 text-xs font-medium text-[var(--color-text-muted)] text-center"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              if (day === null) {
                return (
                  <div
                    key={i}
                    className="min-h-[100px] border-b border-r border-white/5 bg-white/[0.01]"
                  />
                )
              }

              const dayEvents = eventsOnDay(day)
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

              return (
                <div
                  key={i}
                  className={clsx(
                    'min-h-[100px] border-b border-r border-white/5 p-1.5 cursor-pointer hover:bg-white/[0.03] transition-colors',
                    isToday(day) && 'bg-[#00C9A7]/5'
                  )}
                  onClick={() => openModal(undefined, dateStr)}
                >
                  <span
                    className={clsx(
                      'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium mb-1',
                      isToday(day) ? 'bg-[#00C9A7] text-[#0F1B2D]' : 'text-white'
                    )}
                  >
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        onClick={(ev) => {
                          ev.stopPropagation()
                          openModal(e)
                        }}
                        className="w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-colors hover:brightness-125"
                        style={{
                          backgroundColor: `${EVENT_COLORS[e.type]}20`,
                          color: EVENT_COLORS[e.type],
                        }}
                      >
                        {e.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-xs text-[var(--color-text-faint)] px-1">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Events List */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Upcoming Events</h2>
          {events.filter((e) => new Date(e.start_time) >= new Date()).length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-sm">
              No upcoming events this month.
            </p>
          ) : (
            <div className="space-y-2">
              {events
                .filter((e) => new Date(e.start_time) >= new Date())
                .slice(0, 10)
                .map((e) => (
                  <button
                    key={e.id}
                    onClick={() => openModal(e)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left"
                  >
                    <div
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: EVENT_COLORS[e.type] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{e.title}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--color-text-faint)]">
                        <Clock className="w-3 h-3" />
                        {new Date(e.start_time).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.google_event_id && (
                        <svg
                          className="w-3.5 h-3.5 text-[#4285F4]"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-label="Synced with Google Calendar"
                        >
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        </svg>
                      )}
                      <span className="text-xs capitalize text-[var(--color-text-faint)]">
                        {e.type.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-[#0F1B2D]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="event-title"
                  className="block text-sm font-medium text-[var(--color-text-muted)] mb-1"
                >
                  Title *
                </label>
                <input
                  id="event-title"
                  {...register('title', { required: 'Title is required' })}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                  placeholder="Meeting with client..."
                />
                {errors.title && (
                  <p className="text-[#FF6B6B] text-xs mt-1">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="event-start"
                    className="block text-sm font-medium text-[var(--color-text-muted)] mb-1"
                  >
                    Start *
                  </label>
                  <input
                    id="event-start"
                    type="datetime-local"
                    {...register('start_time', { required: true })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="event-end"
                    className="block text-sm font-medium text-[var(--color-text-muted)] mb-1"
                  >
                    End *
                  </label>
                  <input
                    id="event-end"
                    type="datetime-local"
                    {...register('end_time', { required: true })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="event-type"
                    className="block text-sm font-medium text-[var(--color-text-muted)] mb-1"
                  >
                    Type
                  </label>
                  <select
                    id="event-type"
                    {...register('type')}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="call">Call</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="task">Task</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="event-contact"
                    className="block text-sm font-medium text-[var(--color-text-muted)] mb-1"
                  >
                    Contact
                  </label>
                  <select
                    id="event-contact"
                    {...register('contact_id')}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
                  >
                    <option value="">None</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="event-location"
                  className="block text-sm font-medium text-[var(--color-text-muted)] mb-1"
                >
                  Location
                </label>
                <input
                  id="event-location"
                  {...register('location')}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                  placeholder="Office / Zoom / Coffee shop..."
                />
              </div>

              <div>
                <label
                  htmlFor="event-desc"
                  className="block text-sm font-medium text-[var(--color-text-muted)] mb-1"
                >
                  Description
                </label>
                <textarea
                  id="event-desc"
                  rows={2}
                  {...register('description')}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm resize-none"
                />
              </div>

              {/* Google Calendar sync notice */}
              {googleConnected && (
                <p className="text-xs text-[var(--color-text-faint)] flex items-center gap-1.5">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="#4285F4">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  </svg>
                  This event will sync to Google Calendar automatically.
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <div>
                  {editEvent && (
                    <button
                      type="button"
                      onClick={deleteEvent}
                      className="px-3 py-2 text-sm text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-xl transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 text-sm font-semibold bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] rounded-xl transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editEvent ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </CRMShell>
  )
}
