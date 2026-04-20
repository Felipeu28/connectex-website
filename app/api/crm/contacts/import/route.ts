import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/ticket-triage'

type PipelineStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'

interface ImportContact {
  name: string
  email: string | null
  phone: string | null
  company: string | null
  title: string | null
  stage: PipelineStage
  notes: string | null
  source: 'airtable'
  devices?: {
    device_type: string
    manufacturer: string | null
    model: string
    serial_number: string | null
  }[]
}

const CHUNK_SIZE = 200 // Supabase bulk insert limit per request

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { contacts } = await req.json() as { contacts: ImportContact[] }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // ── Step 1: Filter out blank names ────────────────────────────────────────
    const valid = contacts.filter((c) => c.name?.trim())
    const blankSkipped = contacts.length - valid.length

    // ── Step 2: Deduplicate by email in ONE query ──────────────────────────────
    const emailsToCheck = valid
      .map((c) => c.email?.toLowerCase().trim())
      .filter((e): e is string => Boolean(e))

    const existingEmails = new Set<string>()
    if (emailsToCheck.length > 0) {
      // Query in chunks of 500 to stay within URL limits
      for (const chunk of chunkArray(emailsToCheck, 500)) {
        const { data } = await admin
          .from('crm_contacts')
          .select('email')
          .in('email', chunk)
        if (data) {
          data.forEach((row: { email: string | null }) => {
            if (row.email) existingEmails.add(row.email.toLowerCase())
          })
        }
      }
    }

    const toInsert = valid.filter((c) => {
      if (!c.email) return true // no email — always import (no dupe check possible)
      return !existingEmails.has(c.email.toLowerCase().trim())
    })

    const dupeSkipped = valid.length - toInsert.length

    if (toInsert.length === 0) {
      return NextResponse.json({ imported: 0, skipped: blankSkipped + dupeSkipped, errors: [] })
    }

    // ── Step 3: Bulk insert contacts in chunks ────────────────────────────────
    const contactRows = toInsert.map((c) => ({
      name: c.name.trim(),
      email: c.email?.toLowerCase().trim() || null,
      phone: c.phone?.trim() || null,
      company: c.company?.trim() || null,
      title: c.title?.trim() || null,
      stage: c.stage,
      notes: c.notes?.trim() || null,
      source: 'airtable',
      tags: ['airtable-import'],
      deal_value: 0,
    }))

    const insertedContacts: { id: string; email: string | null }[] = []
    const errors: string[] = []

    for (const chunk of chunkArray(contactRows, CHUNK_SIZE)) {
      const { data, error } = await admin
        .from('crm_contacts')
        .insert(chunk)
        .select('id, email')

      if (error) {
        errors.push(`Chunk insert error: ${error.message}`)
      } else if (data) {
        insertedContacts.push(...data)
      }
    }

    // ── Step 4: Bulk insert devices ───────────────────────────────────────────
    // Build email→id map for device association
    const emailToId = new Map<string, string>()
    insertedContacts.forEach((c) => {
      if (c.email) emailToId.set(c.email.toLowerCase(), c.id)
    })

    const deviceRows: {
      contact_id: string
      client_email: string
      device_type: string
      manufacturer: string | null
      model: string
      serial_number: string | null
    }[] = []

    toInsert.forEach((c, i) => {
      if (!c.devices || c.devices.length === 0) return
      // Find the inserted contact id — by email or by position
      const contactId = c.email
        ? emailToId.get(c.email.toLowerCase().trim())
        : insertedContacts[i]?.id

      if (!contactId) return

      c.devices.forEach((d) => {
        deviceRows.push({
          contact_id: contactId,
          client_email: c.email?.toLowerCase().trim() ?? '',
          device_type: d.device_type,
          manufacturer: d.manufacturer,
          model: d.model,
          serial_number: d.serial_number || null,
        })
      })
    })

    if (deviceRows.length > 0) {
      for (const chunk of chunkArray(deviceRows, CHUNK_SIZE)) {
        const { error } = await admin.from('client_products').insert(chunk)
        if (error) errors.push(`Device insert error: ${error.message}`)
      }
    }

    // ── Step 5: Bulk insert activity logs ─────────────────────────────────────
    const activityRows = insertedContacts.map((c) => ({
      type: 'contact_created',
      contact_id: c.id,
      description: 'Contact imported from Airtable',
      metadata: { source: 'airtable_import' },
    }))

    for (const chunk of chunkArray(activityRows, CHUNK_SIZE)) {
      await admin.from('crm_activity').insert(chunk)
      // Activity logging is best-effort — don't fail the whole import
    }

    return NextResponse.json({
      imported: insertedContacts.length,
      skipped: blankSkipped + dupeSkipped,
      devices_imported: deviceRows.length,
      errors,
    })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
