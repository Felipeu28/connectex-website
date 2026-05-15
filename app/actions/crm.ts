'use server'

/**
 * Server actions for the CRM. Every database read or write that used to run
 * via the browser Supabase client now goes through one of these. They use
 * the cookie-aware server client so RLS sees the signed-in advisor.
 *
 * Pages stay 'use client' for their interactive state (filters, pagination,
 * drag-drop, modal open/close), but instead of calling supabase.from() they
 * await one of these actions.
 */

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'
import { LIST_HARD_LIMIT, warnIfAtLimit } from '@/lib/list-limits'
import type {
  Contact,
  Deal,
  PipelineStage,
  Activity,
  Ticket,
  Campaign,
  CalendarEvent,
} from '@/lib/crm-types'
import type { TicketMessage } from '@/lib/ticket-types'

// Light types for entities that don't have a dedicated TS interface yet —
// the data still travels as untyped objects from Supabase.
type Sequence = Record<string, unknown> & { id?: string }
type SequenceStep = Record<string, unknown>
type BlogPost = Record<string, unknown> & { id?: string }

// Helpers ---------------------------------------------------------------

async function db() {
  return createSupabaseServer()
}

async function logActivityRow(args: {
  type: string
  description: string
  contact_id?: string | null
  deal_id?: string | null
  metadata?: Record<string, unknown>
}) {
  const supabase = await db()
  await supabase.from('crm_activity').insert({
    type: args.type,
    description: args.description,
    contact_id: args.contact_id ?? null,
    deal_id: args.deal_id ?? null,
    metadata: args.metadata ?? null,
  })
}

// ───── Contacts ─────────────────────────────────────────────────────────

export async function listContacts(opts: {
  search?: string
  stage?: string
  page?: number
  pageSize?: number
}) {
  const supabase = await db()
  const page = opts.page ?? 1
  const pageSize = opts.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = page * pageSize - 1
  let q = supabase
    .from('crm_contacts')
    .select('*', { count: 'exact', head: false })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (opts.stage && opts.stage !== 'all') q = q.eq('stage', opts.stage)
  if (opts.search) {
    q = q.or(
      `name.ilike.%${opts.search}%,email.ilike.%${opts.search}%,company.ilike.%${opts.search}%`
    )
  }
  const { data, count, error } = await q
  if (error) throw new Error(error.message)
  return { contacts: (data ?? []) as Contact[], total: count ?? 0 }
}

export async function getContact(id: string) {
  const supabase = await db()
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data as Contact
}

export async function listAllContacts() {
  const supabase = await db()
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .order('name')
    .limit(LIST_HARD_LIMIT)
  if (error) throw new Error(error.message)
  warnIfAtLimit('listAllContacts', data)
  return (data ?? []) as Contact[]
}

export async function saveContact(input: Partial<Contact> & { id?: string }) {
  const supabase = await db()
  if (input.id) {
    const { data, error } = await supabase
      .from('crm_contacts')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', input.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    await logActivityRow({
      type: 'contact_updated',
      description: `Updated contact ${input.name ?? data?.name ?? ''}`,
      contact_id: input.id,
    })
    revalidatePath('/crm/contacts')
    revalidatePath(`/crm/contacts/${input.id}`)
    return data as Contact
  }
  const { data, error } = await supabase.from('crm_contacts').insert(input).select().single()
  if (error) throw new Error(error.message)
  await logActivityRow({
    type: 'contact_created',
    description: `Added contact ${input.name ?? ''}`,
    contact_id: data?.id,
  })
  revalidatePath('/crm/contacts')
  return data as Contact
}

export async function deleteContact(id: string) {
  const supabase = await db()
  const { data: target } = await supabase
    .from('crm_contacts')
    .select('name')
    .eq('id', id)
    .single()
  const { error } = await supabase.from('crm_contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await logActivityRow({
    type: 'contact_updated',
    description: `Deleted contact: ${target?.name ?? 'Unknown'}`,
    contact_id: id,
  })
  revalidatePath('/crm/contacts')
}

export async function bulkInsertContacts(rows: Partial<Contact>[]) {
  if (rows.length === 0) return { inserted: 0 }
  const supabase = await db()
  const { error, count } = await supabase
    .from('crm_contacts')
    .insert(rows, { count: 'exact' })
  if (error) throw new Error(error.message)
  revalidatePath('/crm/contacts')
  return { inserted: count ?? rows.length }
}

/**
 * Bulk import that dedupes by email — used by the CSV import modal.
 * Returns counts and per-row errors so the modal can show a result summary.
 */
export async function bulkImportContactsDedup(
  rows: { name?: string; email?: string; phone?: string; company?: string; title?: string; notes?: string }[]
) {
  const supabase = await db()
  let inserted = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    if (!row.name && !row.email) { skipped++; continue }
    const name = row.name || row.email!.split('@')[0]
    const email = row.email?.toLowerCase().trim() || null

    if (email) {
      const { count } = await supabase
        .from('crm_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('email', email)
      if (count && count > 0) { skipped++; continue }
    }

    const { error } = await supabase.from('crm_contacts').insert({
      name,
      email,
      phone: row.phone || null,
      company: row.company || null,
      title: row.title || null,
      notes: row.notes || null,
      source: 'manual',
      stage: 'lead',
      deal_value: 0,
      tags: [],
    })
    if (error) { errors.push(`${name}: ${error.message}`); skipped++ }
    else { inserted++ }
  }

  if (inserted > 0) revalidatePath('/crm/contacts')
  return { inserted, skipped, errors }
}

// ─── Staff (advisors who can be assigned to tickets) ──────────────────────

export interface Staff {
  id: string
  email: string
  full_name: string | null
  role: 'owner' | 'advisor' | 'viewer'
  status: 'invited' | 'active' | 'revoked'
  invited_at: string
  accepted_at: string | null
}

export async function listStaff() {
  const supabase = await db()
  const { data, error } = await supabase
    .from('crm_staff')
    .select('*')
    .neq('status', 'revoked')
    .order('full_name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Staff[]
}

export async function addStaff(input: {
  email: string
  full_name?: string
  role?: Staff['role']
}) {
  const email = input.email.trim().toLowerCase()
  if (!email) throw new Error('Email is required')
  const supabase = await db()
  const { data, error } = await supabase
    .from('crm_staff')
    .insert({
      email,
      full_name: input.full_name?.trim() || null,
      role: input.role ?? 'advisor',
      status: 'active',
      accepted_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) {
    // Friendlier error for the unique-email constraint.
    if (error.code === '23505') throw new Error('A staff member with that email already exists')
    throw new Error(error.message)
  }
  revalidatePath('/crm/settings')
  return data as Staff
}

export async function updateStaff(input: {
  id: string
  full_name?: string | null
  role?: Staff['role']
}) {
  const supabase = await db()
  const { error } = await supabase
    .from('crm_staff')
    .update({
      full_name: input.full_name ?? null,
      role: input.role,
    })
    .eq('id', input.id)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/settings')
}

export async function removeStaff(id: string) {
  const supabase = await db()
  // Soft-delete by marking revoked so historical ticket assignments stay
  // navigable; the listStaff query filters revoked rows out.
  const { error } = await supabase
    .from('crm_staff')
    .update({ status: 'revoked' })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/settings')
}

export async function assignTicketStaff(ticketId: string, staffId: string | null) {
  const supabase = await db()
  await supabase
    .from('tickets')
    .update({ assigned_staff_id: staffId, updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  // Log activity so the change shows up in the contact timeline (when the
  // ticket is linked to a contact).
  if (staffId) {
    const { data: staff } = await supabase
      .from('crm_staff')
      .select('full_name, email')
      .eq('id', staffId)
      .single()
    const { data: ticket } = await supabase
      .from('tickets')
      .select('subject, contact_id')
      .eq('id', ticketId)
      .single()
    await logActivityRow({
      type: 'ticket',
      description: `Assigned ticket "${ticket?.subject ?? ''}" to ${
        staff?.full_name || staff?.email || 'a staff member'
      }`,
      contact_id: ticket?.contact_id ?? null,
    })
  }

  revalidatePath('/crm/tickets')
  revalidatePath(`/crm/tickets/${ticketId}`)
}

// ─── Contact documents (Supabase Storage) ──────────────────────────────────

export interface ContactDocument {
  id: string
  contact_id: string
  file_url: string
  filename: string
  mime_type: string | null
  size_bytes: number | null
  notes: string | null
  uploaded_at: string
}

export async function listContactDocuments(contactId: string) {
  const supabase = await db()
  const { data, error } = await supabase
    .from('crm_contact_documents')
    .select('*')
    .eq('contact_id', contactId)
    .order('uploaded_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ContactDocument[]
}

export async function uploadContactDocument(formData: FormData) {
  const file = formData.get('file') as File | null
  const contactId = String(formData.get('contact_id') ?? '')
  const notes = String(formData.get('notes') ?? '')

  if (!file) throw new Error('No file provided')
  if (!contactId) throw new Error('contact_id is required')
  if (file.size > 25 * 1024 * 1024) throw new Error('File must be under 25MB')

  // Upload via the admin client because Storage RLS would otherwise require
  // a per-user bucket policy. The server action runs server-side only.
  const { createAdminClient } = await import('@/lib/supabase')
  const admin = createAdminClient()
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `contacts/${contactId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: upErr } = await admin.storage
    .from('ticket-attachments')
    .upload(path, bytes, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })
  if (upErr) throw new Error(upErr.message)
  const { data: pub } = admin.storage.from('ticket-attachments').getPublicUrl(path)

  const supabase = await db()
  const { data, error } = await supabase
    .from('crm_contact_documents')
    .insert({
      contact_id: contactId,
      file_url: pub.publicUrl,
      filename: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
      notes: notes || null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)

  await logActivityRow({
    type: 'note',
    description: `Uploaded document: ${file.name}`,
    contact_id: contactId,
  })
  revalidatePath(`/crm/contacts/${contactId}`)
  return data as ContactDocument
}

export async function deleteContactDocument(id: string) {
  const supabase = await db()
  const { data: doc } = await supabase
    .from('crm_contact_documents')
    .select('contact_id')
    .eq('id', id)
    .single()
  await supabase.from('crm_contact_documents').delete().eq('id', id)
  if (doc?.contact_id) revalidatePath(`/crm/contacts/${doc.contact_id}`)
}

export async function getContactBundle(id: string) {
  const supabase = await db()
  const [contactRes, activityRes, dealsRes, eventsRes] = await Promise.all([
    supabase.from('crm_contacts').select('*').eq('id', id).single(),
    supabase
      .from('crm_activity')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('crm_deals')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('crm_events')
      .select('*')
      .eq('contact_id', id)
      .order('start_time', { ascending: false })
      .limit(10),
  ])
  return {
    contact: contactRes.data as Contact | null,
    activity: (activityRes.data ?? []) as Activity[],
    deals: (dealsRes.data ?? []) as Deal[],
    events: (eventsRes.data ?? []) as CalendarEvent[],
  }
}

export async function listActiveSequences() {
  const supabase = await db()
  const { data } = await supabase
    .from('crm_sequences')
    .select('id, name, status')
    .eq('status', 'active')
    .order('name')
  return (data ?? []) as { id: string; name: string; status: string }[]
}

export async function enrollContactInSequence(args: { sequenceId: string; contactId: string }) {
  const supabase = await db()
  const { data: existing } = await supabase
    .from('crm_sequence_enrollments')
    .select('id, status')
    .eq('sequence_id', args.sequenceId)
    .eq('contact_id', args.contactId)
    .single()

  if (existing && existing.status === 'active') return { ok: true, already: true }

  const now = new Date().toISOString()
  if (existing) {
    await supabase
      .from('crm_sequence_enrollments')
      .update({ status: 'active', current_step: 1, next_send_at: now })
      .eq('id', existing.id)
  } else {
    await supabase.from('crm_sequence_enrollments').insert({
      sequence_id: args.sequenceId,
      contact_id: args.contactId,
      next_send_at: now,
    })
  }
  revalidatePath(`/crm/contacts/${args.contactId}`)
  return { ok: true, already: false }
}

/**
 * Save a contact (create or update) with the side effects the ContactModal
 * needs: sync stage to linked deals when stage changes, auto-create a deal
 * when `deal_value > 0` and no deal exists yet, log appropriate activity.
 */
export async function saveContactComplete(args: {
  contact: Partial<Contact> & { id?: string; deal_value?: number }
  prevStage?: string
}) {
  const supabase = await db()
  const { deal_value, ...rest } = args.contact
  const payload = {
    ...rest,
    first_name: (rest.first_name as string | undefined) || null,
    last_name: (rest.last_name as string | undefined) || null,
    phone_country_code:
      (rest.phone_country_code as string | undefined) || '+1',
    email: rest.email || null,
    phone: rest.phone || null,
    company: rest.company || null,
    title: rest.title || null,
    notes: rest.notes || null,
    deal_value: deal_value ?? 0,
    updated_at: new Date().toISOString(),
  }

  let contactId = rest.id
  if (rest.id) {
    await supabase.from('crm_contacts').update(payload).eq('id', rest.id)
    if (args.prevStage && rest.stage && rest.stage !== args.prevStage) {
      await supabase
        .from('crm_deals')
        .update({ stage: rest.stage, updated_at: new Date().toISOString() })
        .eq('contact_id', rest.id)
      await logActivityRow({
        type: 'stage_change',
        description: `Moved ${rest.name} from ${args.prevStage} to ${rest.stage} (synced to deals)`,
        contact_id: rest.id,
        metadata: { from: args.prevStage, to: rest.stage },
      })
    } else {
      await logActivityRow({
        type: 'contact_updated',
        description: `Updated contact: ${rest.name}`,
        contact_id: rest.id,
      })
    }
  } else {
    const { data: inserted } = await supabase
      .from('crm_contacts')
      .insert(payload)
      .select('id')
      .single()
    contactId = inserted?.id
    await logActivityRow({
      type: 'contact_created',
      description: `Created new contact: ${rest.name}${rest.company ? ` (${rest.company})` : ''}`,
      contact_id: contactId,
    })
  }

  // Auto-create deal if deal_value > 0 and none exists yet
  if (deal_value && deal_value > 0 && contactId) {
    const { count } = await supabase
      .from('crm_deals')
      .select('id', { count: 'exact', head: true })
      .eq('contact_id', contactId)
    if (!count || count === 0) {
      const { data: newDeal } = await supabase
        .from('crm_deals')
        .insert({
          contact_id: contactId,
          title: rest.company ? `${rest.company} — ${rest.name}` : rest.name,
          value: deal_value,
          stage: rest.stage,
        })
        .select('id')
        .single()
      await logActivityRow({
        type: 'deal_created',
        description: `Deal auto-created for ${rest.name} ($${deal_value.toLocaleString()})`,
        contact_id: contactId,
        deal_id: newDeal?.id,
      })
    }
  }

  revalidatePath('/crm/contacts')
  if (contactId) revalidatePath(`/crm/contacts/${contactId}`)
  return { id: contactId }
}

// ───── Deals ────────────────────────────────────────────────────────────

export async function listDeals() {
  const supabase = await db()
  const { data, error } = await supabase
    .from('crm_deals')
    .select('*, contact:crm_contacts(id,name,company)')
    .order('created_at', { ascending: false })
    .limit(LIST_HARD_LIMIT)
  if (error) throw new Error(error.message)
  warnIfAtLimit('listDeals', data)
  return (data ?? []) as Deal[]
}

export async function saveDeal(input: Partial<Deal> & { id?: string }) {
  const supabase = await db()
  if (input.id) {
    const { data, error } = await supabase
      .from('crm_deals')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', input.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    revalidatePath('/crm/pipeline')
    return data as Deal
  }
  const { data, error } = await supabase.from('crm_deals').insert(input).select().single()
  if (error) throw new Error(error.message)
  await logActivityRow({
    type: 'deal_created',
    description: `Created deal "${input.title ?? ''}"`,
    contact_id: input.contact_id ?? null,
    deal_id: data?.id,
  })
  revalidatePath('/crm/pipeline')
  return data as Deal
}

export async function moveDeal(dealId: string, newStage: PipelineStage) {
  const supabase = await db()
  const { data: deal } = await supabase
    .from('crm_deals')
    .select('*')
    .eq('id', dealId)
    .single()
  if (!deal) throw new Error('Deal not found')
  const { error } = await supabase
    .from('crm_deals')
    .update({ stage: newStage, updated_at: new Date().toISOString() })
    .eq('id', dealId)
  if (error) throw new Error(error.message)
  if (deal.contact_id) {
    await supabase
      .from('crm_contacts')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', deal.contact_id)
  }
  const isClosed = newStage === 'closed_won' || newStage === 'closed_lost'
  await logActivityRow({
    type: isClosed ? 'deal_closed' : 'deal_moved',
    description: isClosed
      ? `Deal "${deal.title}" closed as ${newStage}`
      : `Moved "${deal.title}" to ${newStage}`,
    deal_id: dealId,
    contact_id: deal.contact_id ?? null,
    metadata: { from: deal.stage, to: newStage },
  })
  revalidatePath('/crm/pipeline')
}

export async function deleteDeal(id: string) {
  const supabase = await db()
  const { error } = await supabase.from('crm_deals').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/pipeline')
}

// ───── Tickets ──────────────────────────────────────────────────────────

export async function listTickets(opts: {
  search?: string
  status?: string
  needsYou?: boolean
  page?: number
  pageSize?: number
}) {
  const supabase = await db()
  const page = opts.page ?? 1
  const pageSize = opts.pageSize ?? 25
  let q = supabase
    .from('tickets')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
  if (opts.needsYou) {
    q = q.eq('routed_to_mark', true).eq('human_took_over', false)
  } else if (opts.status && opts.status !== 'all') {
    q = q.eq('status', opts.status)
  }
  if (opts.search) {
    q = q.or(
      `subject.ilike.%${opts.search}%,name.ilike.%${opts.search}%,email.ilike.%${opts.search}%`
    )
  }
  q = q.range((page - 1) * pageSize, page * pageSize - 1)
  const { data, count, error } = await q
  if (error) throw new Error(error.message)
  return { tickets: (data ?? []) as Ticket[], total: count ?? 0 }
}

export async function countNeedsYou() {
  const supabase = await db()
  const { count } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('routed_to_mark', true)
    .eq('human_took_over', false)
  return count ?? 0
}

export async function getTicketWithMessages(id: string) {
  const supabase = await db()
  const [ticketRes, messagesRes] = await Promise.all([
    supabase.from('tickets').select('*').eq('id', id).single(),
    supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true }),
  ])
  if (ticketRes.error) throw new Error(ticketRes.error.message)
  return {
    ticket: ticketRes.data as Ticket,
    messages: (messagesRes.data ?? []) as TicketMessage[],
  }
}

export async function updateTicketStatus(id: string, status: string) {
  const supabase = await db()
  const { error } = await supabase
    .from('tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/tickets')
  revalidatePath(`/crm/tickets/${id}`)
}

export async function addTicketMessage(args: {
  ticketId: string
  body: string
  senderName: string
  senderType: 'admin' | 'client'
}) {
  const supabase = await db()
  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: args.ticketId,
      body: args.body,
      sender_name: args.senderName,
      sender_type: args.senderType,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(`/crm/tickets/${args.ticketId}`)
  return data as TicketMessage
}

export async function getTicketDetail(id: string) {
  const supabase = await db()
  const [ticketRes, msgsRes] = await Promise.all([
    supabase
      .from('tickets')
      .select('*, contact:crm_contacts(id, name, email)')
      .eq('id', id)
      .single(),
    supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true }),
  ])
  return {
    ticket: ticketRes.data as Ticket | null,
    messages: (msgsRes.data ?? []) as TicketMessage[],
  }
}

export async function searchContactsForAssign(query: string) {
  if (!query.trim()) return []
  const supabase = await db()
  const { data } = await supabase
    .from('crm_contacts')
    .select('id, name, email, company')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
    .limit(8)
  return (data ?? []) as { id: string; name: string; email: string | null; company: string | null }[]
}

export async function assignTicketContact(ticketId: string, contactId: string | null) {
  const supabase = await db()
  await supabase
    .from('tickets')
    .update({ contact_id: contactId, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
  revalidatePath(`/crm/tickets/${ticketId}`)
}

// ───── Activity ─────────────────────────────────────────────────────────

export async function listActivity(opts?: { limit?: number; contactId?: string; dealId?: string }) {
  const supabase = await db()
  let q = supabase.from('crm_activity').select('*').order('created_at', { ascending: false })
  if (opts?.contactId) q = q.eq('contact_id', opts.contactId)
  if (opts?.dealId) q = q.eq('deal_id', opts.dealId)
  q = q.limit(opts?.limit ?? 50)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as Activity[]
}

export async function logActivity(args: {
  type: string
  description: string
  contact_id?: string | null
  deal_id?: string | null
  metadata?: Record<string, unknown>
}) {
  await logActivityRow(args)
}

// ───── Campaigns ────────────────────────────────────────────────────────

export async function listCampaigns() {
  const supabase = await db()
  const { data, error } = await supabase
    .from('crm_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Campaign[]
}

export async function saveCampaign(input: Partial<Campaign> & { id?: string }) {
  const supabase = await db()
  if (input.id) {
    const { data, error } = await supabase
      .from('crm_campaigns')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', input.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    revalidatePath('/crm/campaigns')
    return data as Campaign
  }
  const { data, error } = await supabase.from('crm_campaigns').insert(input).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/crm/campaigns')
  return data as Campaign
}

export async function deleteCampaign(id: string) {
  const supabase = await db()
  const { error } = await supabase.from('crm_campaigns').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/campaigns')
}

export async function countCampaignRecipients(filter: 'all' | { stage: string }) {
  const supabase = await db()
  let q = supabase
    .from('crm_contacts')
    .select('id', { count: 'exact', head: true })
    .not('email', 'is', null)
  if (filter !== 'all' && 'stage' in filter) q = q.eq('stage', filter.stage)
  const { count } = await q
  return count ?? 0
}

export async function searchContactsForCampaign(query: string) {
  if (!query.trim()) return []
  const supabase = await db()
  const { data } = await supabase
    .from('crm_contacts')
    .select('id, name, email, company')
    .not('email', 'is', null)
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
    .limit(10)
  return (data ?? []) as { id: string; name: string; email: string | null; company: string | null }[]
}

export async function scheduleCampaign(id: string, scheduledAt: string) {
  const supabase = await db()
  await supabase
    .from('crm_campaigns')
    .update({
      status: 'scheduled',
      scheduled_at: new Date(scheduledAt).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  revalidatePath('/crm/campaigns')
}

// ───── Sequences ────────────────────────────────────────────────────────

export async function listSequences() {
  const supabase = await db()
  const { data, error } = await supabase
    .from('crm_sequences')
    .select('*, steps:crm_sequence_steps(*)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as (Sequence & { steps?: SequenceStep[] })[]
}

export async function saveSequence(input: Partial<Sequence> & { id?: string }) {
  const supabase = await db()
  if (input.id) {
    const { data, error } = await supabase
      .from('crm_sequences')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', input.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    revalidatePath('/crm/sequences')
    return data as Sequence
  }
  const { data, error } = await supabase.from('crm_sequences').insert(input).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/crm/sequences')
  return data as Sequence
}

export async function deleteSequence(id: string) {
  const supabase = await db()
  const { error } = await supabase.from('crm_sequences').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/sequences')
}

export async function loadSequencesWithStats() {
  const supabase = await db()
  const { data: seqs } = await supabase
    .from('crm_sequences')
    .select('*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
  if (!seqs) return []
  const enriched = await Promise.all(
    seqs.map(async (seq) => {
      const [stepsRes, enrollRes] = await Promise.all([
        supabase
          .from('crm_sequence_steps')
          .select('*')
          .eq('sequence_id', seq.id)
          .order('step_number'),
        supabase
          .from('crm_sequence_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('sequence_id', seq.id)
          .eq('status', 'active'),
      ])
      return {
        ...seq,
        steps: stepsRes.data ?? [],
        enrollment_count: enrollRes.count ?? 0,
      }
    })
  )
  return enriched as (Sequence & { steps: SequenceStep[]; enrollment_count: number })[]
}

export async function saveSequenceWithSteps(args: {
  id?: string
  name: string
  description?: string | null
  steps: { step_number: number; delay_days: number; subject: string; body: string }[]
}) {
  const supabase = await db()
  if (args.id) {
    const r1 = await supabase
      .from('crm_sequences')
      .update({
        name: args.name,
        description: args.description ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', args.id)
    if (r1.error) throw new Error(r1.error.message)

    const r2 = await supabase.from('crm_sequence_steps').delete().eq('sequence_id', args.id)
    if (r2.error) throw new Error(r2.error.message)

    const r3 = await supabase
      .from('crm_sequence_steps')
      .insert(args.steps.map((s) => ({ ...s, sequence_id: args.id })))
    if (r3.error) throw new Error(r3.error.message)
    revalidatePath('/crm/sequences')
    return { id: args.id }
  }
  const { data: seq, error: seqErr } = await supabase
    .from('crm_sequences')
    .insert({ name: args.name, description: args.description ?? null })
    .select('id')
    .single()
  if (seqErr) throw new Error(seqErr.message)
  if (!seq) throw new Error('Sequence insert returned no row (RLS blocked it?).')
  const r = await supabase
    .from('crm_sequence_steps')
    .insert(args.steps.map((s) => ({ ...s, sequence_id: seq.id })))
  if (r.error) throw new Error(r.error.message)
  revalidatePath('/crm/sequences')
  return { id: seq.id as string }
}

export async function toggleSequenceStatus(id: string, currentStatus: string) {
  const supabase = await db()
  const newStatus = currentStatus === 'active' ? 'paused' : 'active'
  await supabase.from('crm_sequences').update({ status: newStatus }).eq('id', id)
  revalidatePath('/crm/sequences')
}

export async function archiveSequence(id: string) {
  const supabase = await db()
  await supabase.from('crm_sequences').update({ status: 'archived' }).eq('id', id)
  revalidatePath('/crm/sequences')
}

export async function bulkEnrollInSequence(args: { sequenceId: string; contactIds: string[] }) {
  const supabase = await db()
  const { data: firstStep } = await supabase
    .from('crm_sequence_steps')
    .select('delay_days')
    .eq('sequence_id', args.sequenceId)
    .eq('step_number', 1)
    .single()
  const delayDays = (firstStep?.delay_days as number | undefined) ?? 0
  const nextSendAt = new Date()
  nextSendAt.setDate(nextSendAt.getDate() + delayDays)

  let enrolled = 0
  let skipped = 0
  for (const contactId of args.contactIds) {
    const { error } = await supabase.from('crm_sequence_enrollments').insert({
      sequence_id: args.sequenceId,
      contact_id: contactId,
      current_step: 1,
      status: 'active',
      next_send_at: nextSendAt.toISOString(),
    })
    if (error && error.code === '23505') skipped++
    else if (!error) enrolled++
  }
  revalidatePath('/crm/sequences')
  return { enrolled, skipped }
}

// ───── Calendar / Events ────────────────────────────────────────────────

export async function listEvents() {
  const supabase = await db()
  // NOTE: column is `start_time` in migration 002, not `start_at`. The previous
  // implementation queried `start_at` and would error in production; the
  // calendar page uses `loadCalendarMonth` which has the right column name.
  const { data, error } = await supabase
    .from('crm_events')
    .select('*')
    .order('start_time', { ascending: true })
    .limit(LIST_HARD_LIMIT)
  if (error) throw new Error(error.message)
  warnIfAtLimit('listEvents', data)
  return (data ?? []) as CalendarEvent[]
}

export async function loadCalendarMonth(year: number, month: number) {
  const supabase = await db()
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
  return {
    events: (eventsRes.data ?? []) as CalendarEvent[],
    contacts: (contactsRes.data ?? []) as { id: string; name: string }[],
  }
}

export async function saveCalendarEvent(input: {
  id?: string
  title: string
  description?: string | null
  start_time: string
  end_time: string
  location?: string | null
  type: string
  contact_id?: string | null
}) {
  const supabase = await db()
  const payload = {
    title: input.title,
    description: input.description ?? null,
    start_time: input.start_time,
    end_time: input.end_time,
    location: input.location ?? null,
    type: input.type,
    contact_id: input.contact_id ?? null,
    updated_at: new Date().toISOString(),
  }
  if (input.id) {
    await supabase.from('crm_events').update(payload).eq('id', input.id)
    revalidatePath('/crm/calendar')
    return { id: input.id }
  }
  const { data } = await supabase.from('crm_events').insert(payload).select('id').single()
  revalidatePath('/crm/calendar')
  return { id: data?.id as string | undefined }
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await db()
  await supabase.from('crm_events').delete().eq('id', id)
  revalidatePath('/crm/calendar')
}

export async function saveEvent(input: Partial<CalendarEvent> & { id?: string }) {
  const supabase = await db()
  if (input.id) {
    const { data, error } = await supabase
      .from('crm_events')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', input.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    revalidatePath('/crm/calendar')
    return data as CalendarEvent
  }
  const { data, error } = await supabase.from('crm_events').insert(input).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/crm/calendar')
  return data as CalendarEvent
}

export async function deleteEvent(id: string) {
  const supabase = await db()
  const { error } = await supabase.from('crm_events').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/calendar')
}

// ───── Storage ──────────────────────────────────────────────────────────

/**
 * Upload a single attachment to the ticket-attachments bucket and return
 * the public URL. Called from PortalTicketForm and ticketing TicketForm.
 *
 * Uses the admin client because the bucket policy allows anon writes today
 * but RLS could change later — the service role makes this resilient.
 */
export async function uploadTicketAttachment(formData: FormData) {
  const file = formData.get('file') as File | null
  if (!file) throw new Error('No file provided')
  const { createAdminClient } = await import('@/lib/supabase')
  const supabase = createAdminClient()
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from('ticket-attachments')
    .upload(path, new Uint8Array(arrayBuffer), {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(path)
  return data.publicUrl
}

// ───── Analytics ────────────────────────────────────────────────────────

export async function getAnalytics(rangeDays: number) {
  const supabase = await db()
  const since = new Date()
  since.setDate(since.getDate() - rangeDays)
  const sinceIso = since.toISOString()
  const nowIso = new Date().toISOString()
  const upcomingCutoff = new Date()
  upcomingCutoff.setDate(upcomingCutoff.getDate() + rangeDays)

  const [
    contactsRes,
    contactsAllRes,
    contactsByStageRes,
    dealsRes,
    ticketsRes,
    eventsRangeRes,
    eventsUpcomingRes,
    campaignsRes,
  ] = await Promise.all([
    supabase
      .from('crm_contacts')
      .select('created_at, stage')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .limit(5000),
    supabase.from('crm_contacts').select('id', { count: 'exact', head: true }),
    supabase.from('crm_contacts').select('stage').limit(10000),
    supabase.from('crm_deals').select('stage, value'),
    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceIso),
    supabase
      .from('crm_events')
      .select('start_time, type')
      .gte('start_time', sinceIso)
      .limit(5000),
    supabase
      .from('crm_events')
      .select('id', { count: 'exact', head: true })
      .gte('start_time', nowIso)
      .lte('start_time', upcomingCutoff.toISOString()),
    supabase
      .from('crm_campaigns')
      .select('id, name, status, sent_count, open_count, click_count, sent_at, scheduled_at, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Per-day buckets, used for both contacts and appointments
  const days: string[] = []
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  const contactBuckets = new Map(days.map((d) => [d, 0]))
  for (const r of contactsRes.data ?? []) {
    const k = (r.created_at as string).slice(0, 10)
    if (contactBuckets.has(k)) contactBuckets.set(k, (contactBuckets.get(k) || 0) + 1)
  }

  // Contacts by stage (full DB, not just range — gives a snapshot of pipeline)
  const contactStageCounts: Record<string, number> = {}
  for (const r of contactsByStageRes.data ?? []) {
    const s = (r.stage as string) ?? 'lead'
    contactStageCounts[s] = (contactStageCounts[s] || 0) + 1
  }

  // Deals
  let open = 0, won = 0, lost = 0, openValue = 0, wonValue = 0
  for (const d of dealsRes.data ?? []) {
    const v = Number(d.value)
    if (d.stage === 'closed_won') { won++; wonValue += v }
    else if (d.stage === 'closed_lost') { lost++ }
    else { open++; openValue += v }
  }

  // Appointments (calendar events) in range — daily series + breakdown by type
  const eventBuckets = new Map(days.map((d) => [d, 0]))
  const eventTypeCounts: Record<string, number> = {}
  let eventsInRange = 0
  for (const e of eventsRangeRes.data ?? []) {
    const start = e.start_time as string
    if (!start) continue
    const k = start.slice(0, 10)
    if (eventBuckets.has(k)) eventBuckets.set(k, (eventBuckets.get(k) || 0) + 1)
    eventsInRange++
    const t = (e.type as string) ?? 'other'
    eventTypeCounts[t] = (eventTypeCounts[t] || 0) + 1
  }

  // Campaigns aggregated
  type CampaignRow = {
    id: string; name: string; status: string;
    sent_count: number | null; open_count: number | null; click_count: number | null;
    sent_at: string | null; scheduled_at: string | null; created_at: string
  }
  const campaigns = (campaignsRes.data ?? []) as CampaignRow[]
  let totalSent = 0, totalOpens = 0, totalClicks = 0
  let sentCampaignsInRange = 0
  for (const c of campaigns) {
    totalSent += c.sent_count ?? 0
    totalOpens += c.open_count ?? 0
    totalClicks += c.click_count ?? 0
    if (c.sent_at && c.sent_at >= sinceIso) sentCampaignsInRange++
  }
  const openRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0
  const clickRate = totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0
  const campaignStatusCounts: Record<string, number> = {}
  for (const c of campaigns) {
    campaignStatusCounts[c.status] = (campaignStatusCounts[c.status] || 0) + 1
  }
  const recentCampaigns = campaigns.slice(0, 5).map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    sent_count: c.sent_count ?? 0,
    open_count: c.open_count ?? 0,
    click_count: c.click_count ?? 0,
    sent_at: c.sent_at,
    open_rate: (c.sent_count ?? 0) > 0 ? Math.round(((c.open_count ?? 0) / (c.sent_count ?? 1)) * 100) : 0,
    click_rate: (c.sent_count ?? 0) > 0 ? Math.round(((c.click_count ?? 0) / (c.sent_count ?? 1)) * 100) : 0,
  }))

  return {
    contactSeries: Array.from(contactBuckets.entries()).map(([date, count]) => ({ date, count })),
    contactCount: contactsAllRes.count ?? 0,
    contactStageCounts,
    ticketCount: ticketsRes.count ?? 0,
    dealStats: { open, won, lost, openValue, wonValue },
    appointments: {
      total: eventsInRange,
      upcoming: eventsUpcomingRes.count ?? 0,
      series: Array.from(eventBuckets.entries()).map(([date, count]) => ({ date, count })),
      byType: eventTypeCounts,
    },
    campaigns: {
      totalSent,
      totalOpens,
      totalClicks,
      openRate,
      clickRate,
      sentInRange: sentCampaignsInRange,
      statusCounts: campaignStatusCounts,
      recent: recentCampaigns,
    },
  }
}

// ───── Blog ─────────────────────────────────────────────────────────────

export async function listBlogPosts() {
  const supabase = await db()
  const { data, error } = await supabase
    .from('crm_blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as BlogPost[]
}

export async function getBlogPost(id: string) {
  const supabase = await db()
  const { data, error } = await supabase
    .from('crm_blog_posts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data as BlogPost
}

export async function saveBlogPost(input: Partial<BlogPost> & { id?: string }) {
  const supabase = await db()
  if (input.id) {
    const { data, error } = await supabase
      .from('crm_blog_posts')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', input.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    revalidatePath('/crm/blog')
    revalidatePath(`/crm/blog/${input.id}`)
    return data as BlogPost
  }
  const { data, error } = await supabase.from('crm_blog_posts').insert(input).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/crm/blog')
  return data as BlogPost
}

export async function deleteBlogPost(id: string) {
  const supabase = await db()
  const { error } = await supabase.from('crm_blog_posts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/blog')
}
