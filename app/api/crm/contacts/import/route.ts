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
  // Devices parsed from Airtable device columns
  devices?: {
    device_type: string
    manufacturer: string | null
    model: string
    serial_number: string | null
  }[]
}

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { contacts } = await req.json() as { contacts: ImportContact[] }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] }

    for (const contact of contacts) {
      if (!contact.name?.trim()) {
        result.skipped++
        continue
      }

      try {
        // Check for existing contact by email
        if (contact.email) {
          const { data: existing } = await admin
            .from('crm_contacts')
            .select('id')
            .eq('email', contact.email.toLowerCase().trim())
            .maybeSingle()

          if (existing) {
            result.skipped++
            continue
          }
        }

        // Insert contact
        const { data: newContact, error: insertError } = await admin
          .from('crm_contacts')
          .insert({
            name: contact.name.trim(),
            email: contact.email?.toLowerCase().trim() || null,
            phone: contact.phone?.trim() || null,
            company: contact.company?.trim() || null,
            title: contact.title?.trim() || null,
            stage: contact.stage,
            notes: contact.notes?.trim() || null,
            source: 'airtable',
            tags: ['airtable-import'],
            deal_value: 0,
          })
          .select('id, email')
          .single()

        if (insertError || !newContact) {
          result.errors.push(`Failed to import ${contact.name}: ${insertError?.message ?? 'unknown error'}`)
          continue
        }

        // Import devices if any
        if (contact.devices && contact.devices.length > 0) {
          const deviceRows = contact.devices.map((d) => ({
            contact_id: newContact.id,
            client_email: newContact.email ?? contact.email ?? '',
            device_type: d.device_type,
            manufacturer: d.manufacturer,
            model: d.model,
            serial_number: d.serial_number || null,
          }))

          await admin.from('client_products').insert(deviceRows).throwOnError()
        }

        // Log to CRM activity
        if (newContact.id) {
          await admin.from('crm_activity').insert({
            type: 'contact_created',
            contact_id: newContact.id,
            description: `Contact imported from Airtable`,
            metadata: { source: 'airtable_import' },
          })
        }

        result.imported++
      } catch (err) {
        result.errors.push(`Error importing ${contact.name}: ${String(err)}`)
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
