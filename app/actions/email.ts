'use server'

/**
 * Server actions for email surfaces:
 *   - Email templates CRUD
 *   - Gmail inbox sync into crm_email_threads / crm_emails
 *   - One-off send (Resend → Gmail fallback)
 *   - Image upload for the RichEmailEditor
 *
 * All reads/writes use the cookie-aware Supabase server client so RLS
 * sees the signed-in advisor; the unified email adapter (sendEmail) handles
 * provider selection.
 */

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, type SendEmailParams } from '@/lib/email-send'
import { fetchInboxMetadata, fetchGmailMessage } from '@/lib/gmail'
import { getStoredTokens } from '@/lib/google-tokens'

async function db() {
  return createSupabaseServer()
}

// ─── Email Templates ───────────────────────────────────────────────────────

export interface EmailTemplate {
  id: string
  name: string
  category: string
  subject: string
  body: string
  preview_text?: string | null
  description?: string | null
  tags: string[]
  is_archived: boolean
  created_at: string
  updated_at: string
}

export async function listEmailTemplates(opts?: { category?: string; includeArchived?: boolean }) {
  const supabase = await db()
  let q = supabase.from('email_templates').select('*').order('updated_at', { ascending: false })
  if (!opts?.includeArchived) q = q.eq('is_archived', false)
  if (opts?.category && opts.category !== 'all') q = q.eq('category', opts.category)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as EmailTemplate[]
}

export async function getEmailTemplate(id: string) {
  const supabase = await db()
  const { data, error } = await supabase.from('email_templates').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data as EmailTemplate
}

export async function saveEmailTemplate(input: Partial<EmailTemplate> & { id?: string }) {
  const supabase = await db()
  const payload = {
    name: input.name,
    category: input.category ?? 'general',
    subject: input.subject,
    body: input.body,
    preview_text: input.preview_text ?? null,
    description: input.description ?? null,
    tags: input.tags ?? [],
  }
  if (input.id) {
    const { data, error } = await supabase
      .from('email_templates')
      .update(payload)
      .eq('id', input.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    revalidatePath('/crm/templates')
    return data as EmailTemplate
  }
  const { data, error } = await supabase
    .from('email_templates')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/crm/templates')
  return data as EmailTemplate
}

export async function deleteEmailTemplate(id: string) {
  const supabase = await db()
  const { error } = await supabase.from('email_templates').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/templates')
}

export async function archiveEmailTemplate(id: string, archive: boolean) {
  const supabase = await db()
  await supabase.from('email_templates').update({ is_archived: archive }).eq('id', id)
  revalidatePath('/crm/templates')
}

// ─── Inbox / Gmail sync ───────────────────────────────────────────────────────

export async function getGoogleConnectionStatus() {
  const stored = await getStoredTokens()
  return {
    connected: !!stored,
    email: stored?.email ?? null,
  }
}

/**
 * Pull recent INBOX metadata from Gmail and upsert into our `crm_emails` /
 * `crm_email_threads` tables. We use the admin client to bypass RLS — the
 * sync runs on behalf of the workspace, not a single advisor.
 */
export async function syncGmailInbox(opts?: { maxResults?: number }) {
  const max = opts?.maxResults ?? 100
  const stored = await getStoredTokens()
  if (!stored) {
    return { ok: false as const, error: 'Google account not connected', synced: 0 }
  }

  // Wrap the Gmail API call so failures (API disabled in the GCP project,
  // revoked consent, network blip) bubble up as a structured error the
  // Inbox banner can display instead of crashing the action.
  let messages: Awaited<ReturnType<typeof fetchInboxMetadata>>
  try {
    messages = await fetchInboxMetadata(max)
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Gmail API error'
    // Detect the most common gotcha and rewrite it with a one-click fix link.
    const friendlier = /has not been used|is disabled/.test(raw)
      ? 'Gmail API is not enabled in your Google Cloud project. Enable it at https://console.cloud.google.com/apis/library/gmail.googleapis.com — wait a couple of minutes after enabling, then re-sync.'
      : raw
    return { ok: false as const, error: friendlier, synced: 0 }
  }
  if (messages.length === 0) return { ok: true as const, synced: 0, threads: 0 }

  const admin = createAdminClient()

  // Group by Gmail threadId — one DB thread per Gmail thread.
  const byThread = new Map<string, typeof messages>()
  for (const m of messages) {
    if (!m.threadId) continue
    const arr = byThread.get(m.threadId) ?? []
    arr.push(m)
    byThread.set(m.threadId, arr)
  }

  let upsertedThreads = 0
  let upsertedEmails = 0
  for (const [threadId, msgs] of byThread.entries()) {
    msgs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const last = msgs[msgs.length - 1]
    const participants = Array.from(
      new Set(msgs.flatMap((m) => [m.fromEmail, ...m.toEmails]).filter(Boolean))
    )

    // Try to link to an existing CRM contact by sender email.
    let contactId: string | null = null
    {
      const { data } = await admin
        .from('crm_contacts')
        .select('id')
        .eq('email', last.fromEmail.toLowerCase())
        .maybeSingle()
      contactId = data?.id ?? null
    }

    // Upsert thread — prefer matching on Gmail's thread id (stable) and
    // fall back to subject+sender so existing rows keep getting updated.
    let existingThread: { id: string } | null = null
    {
      const byExternal = await admin
        .from('crm_email_threads')
        .select('id')
        .eq('external_thread_id', threadId)
        .maybeSingle()
      existingThread = (byExternal.data as { id: string } | null) ?? null
      if (!existingThread) {
        const bySubject = await admin
          .from('crm_email_threads')
          .select('id')
          .eq('subject', last.subject)
          .contains('participants', [last.fromEmail])
          .maybeSingle()
        existingThread = (bySubject.data as { id: string } | null) ?? null
      }
    }

    let threadDbId = existingThread?.id as string | undefined
    if (threadDbId) {
      await admin
        .from('crm_email_threads')
        .update({
          last_message_at: new Date(last.date).toISOString(),
          message_count: msgs.length,
          participants,
          contact_id: contactId,
          external_thread_id: threadId,
          is_unread: true,
        })
        .eq('id', threadDbId)
    } else {
      const { data } = await admin
        .from('crm_email_threads')
        .insert({
          subject: last.subject,
          participants,
          last_message_at: new Date(last.date).toISOString(),
          message_count: msgs.length,
          contact_id: contactId,
          external_thread_id: threadId,
          is_unread: true,
        })
        .select('id')
        .single()
      threadDbId = data?.id
      upsertedThreads++
    }

    if (!threadDbId) continue

    for (const m of msgs) {
      // Skip if already imported
      const { count } = await admin
        .from('crm_emails')
        .select('id', { count: 'exact', head: true })
        .eq('external_id', m.gmailMessageId)
      if (count && count > 0) continue

      await admin.from('crm_emails').insert({
        thread_id: threadDbId,
        contact_id: contactId,
        external_id: m.gmailMessageId,
        provider: 'gmail',
        direction: 'inbound',
        from_email: m.fromEmail,
        to_emails: m.toEmails,
        subject: m.subject,
        body_text: m.snippet,
        is_read: false,
        received_at: new Date(m.date).toISOString(),
      })
      upsertedEmails++
    }

    // Use the synthetic threadId from Gmail as a stable hash but we don't
    // expose it (the table identifies threads by id); referenced for trace.
    void threadId
  }

  revalidatePath('/crm/inbox')
  return { ok: true as const, synced: upsertedEmails, threads: upsertedThreads }
}

/**
 * Combined fetch for the inbox landing — saves the client a round trip vs.
 * calling getGoogleConnectionStatus() and listInboxThreads() separately.
 */
export async function getInboxBootstrap(opts?: { folder?: 'inbox' | 'starred' | 'archived' }) {
  const [status, threads] = await Promise.all([
    getGoogleConnectionStatus(),
    listInboxThreads(opts),
  ])
  return { ...status, threads }
}

export async function listInboxThreads(opts?: { folder?: 'inbox' | 'starred' | 'archived' }) {
  const supabase = await db()
  let q = supabase
    .from('crm_email_threads')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(50)
  if (opts?.folder === 'starred') q = q.eq('is_starred', true)
  else if (opts?.folder === 'archived') q = q.not('archived_at', 'is', null)
  else q = q.is('archived_at', null)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getInboxThread(id: string) {
  const supabase = await db()
  const [threadRes, msgsRes] = await Promise.all([
    supabase.from('crm_email_threads').select('*').eq('id', id).single(),
    supabase
      .from('crm_emails')
      .select('*')
      .eq('thread_id', id)
      .order('received_at', { ascending: true }),
  ])
  if (threadRes.error) throw new Error(threadRes.error.message)
  return {
    thread: threadRes.data,
    messages: msgsRes.data ?? [],
  }
}

export async function markThreadRead(id: string) {
  const supabase = await db()
  await supabase.from('crm_email_threads').update({ is_unread: false }).eq('id', id)
  await supabase.from('crm_emails').update({ is_read: true }).eq('thread_id', id)
  revalidatePath('/crm/inbox')
}

export async function toggleThreadStarred(id: string, starred: boolean) {
  const supabase = await db()
  await supabase.from('crm_email_threads').update({ is_starred: starred }).eq('id', id)
  revalidatePath('/crm/inbox')
}

/**
 * Escalate an inbox thread into a support ticket. Uses the admin client so
 * the insert bypasses RLS, links the ticket to a CRM contact when the sender
 * email matches one, marks the source thread as resolved (the conversation
 * now lives on the ticket), and logs an activity entry. Does NOT send the
 * client confirmation email — they already emailed in.
 */
export async function escalateThreadToTicket(input: {
  threadId: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}) {
  const supabase = await db()
  const admin = createAdminClient()

  const { data: thread, error: threadErr } = await supabase
    .from('crm_email_threads')
    .select('id, subject, participants, contact_id')
    .eq('id', input.threadId)
    .single()
  if (threadErr || !thread) throw new Error(threadErr?.message ?? 'Thread not found')

  const { data: msgs, error: msgsErr } = await supabase
    .from('crm_emails')
    .select('from_email, body_text, body_html, direction, received_at')
    .eq('thread_id', input.threadId)
    .order('received_at', { ascending: true })
  if (msgsErr) throw new Error(msgsErr.message)

  const firstInbound = (msgs ?? []).find((m) => m.direction === 'inbound')
  const senderEmail = firstInbound?.from_email ?? thread.participants?.[0] ?? ''
  if (!senderEmail) throw new Error('No sender email found on this thread')

  const description =
    firstInbound?.body_text ??
    (firstInbound?.body_html ? firstInbound.body_html.replace(/<[^>]+>/g, ' ').trim() : '') ??
    '(no body)'

  // Use the local part as a fallback name when we don't have a contact name.
  let contactName = senderEmail.split('@')[0]
  let contactCompany: string | null = null
  let contactId = thread.contact_id as string | null
  if (!contactId) {
    const { data: c } = await admin
      .from('crm_contacts')
      .select('id, name, company')
      .eq('email', senderEmail.toLowerCase())
      .maybeSingle()
    if (c) {
      contactId = c.id
      contactName = c.name ?? contactName
      contactCompany = c.company ?? null
    }
  } else {
    const { data: c } = await admin
      .from('crm_contacts')
      .select('name, company')
      .eq('id', contactId)
      .maybeSingle()
    if (c) {
      contactName = c.name ?? contactName
      contactCompany = c.company ?? null
    }
  }

  const { data: ticket, error: insertErr } = await admin
    .from('tickets')
    .insert({
      name: contactName,
      email: senderEmail,
      company: contactCompany,
      subject: thread.subject || '(no subject)',
      description,
      priority: input.priority ?? 'medium',
      contact_id: contactId,
    })
    .select('id, token')
    .single()
  if (insertErr || !ticket) throw new Error(insertErr?.message ?? 'Failed to create ticket')

  // Log activity on the linked contact, when one exists
  if (contactId) {
    await admin.from('crm_activity').insert({
      type: 'ticket',
      contact_id: contactId,
      description: `Ticket escalated from inbox: "${thread.subject || '(no subject)'}"`,
      metadata: { ticket_id: ticket.id, thread_id: thread.id },
    })
  }

  // Mark the source thread as resolved — the conversation moves to the ticket.
  await supabase
    .from('crm_email_threads')
    .update({ status: 'resolved' })
    .eq('id', thread.id)

  revalidatePath('/crm/inbox')
  revalidatePath('/crm/tickets')
  return { ok: true as const, ticketId: ticket.id as string, token: ticket.token as string }
}

export async function setThreadStatus(id: string, status: 'open' | 'resolved') {
  const supabase = await db()
  const { error } = await supabase
    .from('crm_email_threads')
    .update({ status })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function setThreadCategory(id: string, category: string | null) {
  const supabase = await db()
  const { error } = await supabase
    .from('crm_email_threads')
    .update({ category })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Reply within an existing thread. Sends through Gmail (so it lands in the
 * same Gmail conversation thread the user is reading) and persists the
 * outbound message into crm_emails. Replying does NOT mark the thread as
 * resolved — the user controls that via setThreadStatus.
 */
export async function replyToThread(input: {
  threadId: string
  to: string
  subject: string
  html: string
  text?: string
  inReplyTo?: string | null
  attachments?: { filename: string; content: string; mimeType: string; size: number }[]
}) {
  const supabase = await db()

  const { data: thread, error: threadErr } = await supabase
    .from('crm_email_threads')
    .select('id, external_thread_id, contact_id, participants')
    .eq('id', input.threadId)
    .single()
  if (threadErr || !thread) throw new Error(threadErr?.message ?? 'Thread not found')

  const subject = /^re:\s/i.test(input.subject) ? input.subject : `Re: ${input.subject}`

  const result = await sendEmail({
    to: input.to,
    subject,
    html: input.html,
    text: input.text,
    threadId: thread.external_thread_id ?? undefined,
    inReplyTo: input.inReplyTo ?? undefined,
    references: input.inReplyTo ?? undefined,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      mimeType: a.mimeType,
      content: a.content,
    })),
    // Force Gmail when we have a Gmail threadId so the reply joins the
    // existing conversation; Resend would create a new thread.
    preferGmail: !!thread.external_thread_id,
  })

  if (!result.ok) {
    throw new Error(result.errors.join('; ') || 'Failed to send reply')
  }

  await supabase.from('crm_emails').insert({
    thread_id: thread.id,
    contact_id: thread.contact_id,
    external_id: result.messageId,
    provider: result.provider === 'none' ? null : result.provider,
    direction: 'outbound',
    from_email: process.env.RESEND_FROM_EMAIL || 'support@connectex.net',
    to_emails: [input.to],
    subject,
    body_html: input.html,
    body_text: input.text ?? null,
    is_read: true,
    received_at: new Date().toISOString(),
  })

  await supabase
    .from('crm_email_threads')
    .update({
      last_message_at: new Date().toISOString(),
      external_thread_id: thread.external_thread_id ?? result.threadId ?? null,
    })
    .eq('id', thread.id)

  revalidatePath('/crm/inbox')
  return { ok: true as const, provider: result.provider, messageId: result.messageId }
}

export async function archiveThread(id: string) {
  const supabase = await db()
  await supabase
    .from('crm_email_threads')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/crm/inbox')
}

/**
 * Fetch the full HTML body of a single message from Gmail. Result is not
 * persisted — call sites cache the rendered HTML in component state.
 */
export async function getGmailFullMessage(externalId: string) {
  const stored = await getStoredTokens()
  if (!stored) throw new Error('Google account not connected')
  return fetchGmailMessage(externalId)
}

// ─── Google Calendar pull sync ───────────────────────────────────────────────────────

/**
 * Pull events from the connected Google Calendar (primary) for the given
 * window and upsert into `crm_events`. Each row is keyed by `google_event_id`
 * so re-running the sync updates rather than duplicates.
 */
export async function pullGoogleCalendarEvents(opts?: {
  daysBack?: number
  daysAhead?: number
}) {
  const stored = await getStoredTokens()
  if (!stored) {
    return { ok: false as const, error: 'Google account not connected', synced: 0 }
  }

  const daysBack = opts?.daysBack ?? 30
  const daysAhead = opts?.daysAhead ?? 60
  const timeMin = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
  const timeMax = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString()

  const { listGoogleEvents } = await import('@/lib/google-calendar')
  const { getAuthedClient } = await import('@/lib/google-tokens')
  const auth = await getAuthedClient()
  if (!auth) return { ok: false as const, error: 'Google auth missing', synced: 0 }

  let events: Awaited<ReturnType<typeof listGoogleEvents>> = []
  try {
    events = await listGoogleEvents(timeMin, timeMax, auth)
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Google API error'
    const friendlier = /has not been used|is disabled/.test(raw)
      ? 'Google Calendar API is not enabled in your Google Cloud project. Enable it at https://console.cloud.google.com/apis/library/calendar-json.googleapis.com — wait a couple of minutes after enabling, then re-sync.'
      : raw
    return {
      ok: false as const,
      error: friendlier,
      synced: 0,
    }
  }

  // Use the cookie-aware client (authenticated user) to write into crm_events.
  const supabase = await db()
  let upserted = 0
  for (const ev of events) {
    if (!ev.google_event_id || !ev.start_time) continue
    const { data: existing } = await supabase
      .from('crm_events')
      .select('id')
      .eq('google_event_id', ev.google_event_id)
      .maybeSingle()

    const payload = {
      title: ev.title,
      description: ev.description,
      start_time: ev.start_time,
      end_time: ev.end_time || ev.start_time,
      location: ev.location,
      type: 'meeting',
      google_event_id: ev.google_event_id,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { error } = await supabase
        .from('crm_events')
        .update(payload)
        .eq('id', existing.id)
      if (!error) upserted++
    } else {
      const { error } = await supabase.from('crm_events').insert(payload)
      if (!error) upserted++
    }
  }

  revalidatePath('/crm/calendar')
  return { ok: true as const, synced: upserted, total: events.length }
}

// ─── One-off send ─────────────────────────────────────────────────────────────────

export async function sendOneOffEmail(params: SendEmailParams & { contactId?: string }) {
  const result = await sendEmail(params)
  if (result.ok) {
    // Log the outbound email so it shows up in the contact + inbox views.
    const supabase = await db()
    await supabase.from('crm_emails').insert({
      contact_id: params.contactId ?? null,
      external_id: result.messageId,
      provider: result.provider,
      direction: 'outbound',
      from_email: params.fromEmail ?? 'support@connectex.net',
      to_emails: [params.to],
      subject: params.subject,
      body_html: params.html,
      body_text: params.text ?? null,
      is_read: true,
      received_at: new Date().toISOString(),
    })
  }
  return result
}

// ─── Image upload (for editor) ───────────────────────────────────────────────────────

export async function uploadEmailImage(formData: FormData) {
  const file = formData.get('file') as File | null
  if (!file) throw new Error('No file provided')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5MB')

  const admin = createAdminClient()
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `email-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const { error } = await admin.storage
    .from('ticket-attachments')
    .upload(path, new Uint8Array(arrayBuffer), {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })
  if (error) throw new Error(error.message)
  const { data } = admin.storage.from('ticket-attachments').getPublicUrl(path)
  return data.publicUrl
}
