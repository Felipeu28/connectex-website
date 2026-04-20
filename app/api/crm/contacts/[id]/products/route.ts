import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/ticket-triage'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const admin = getSupabaseAdmin()

    // Get contact email first for the email-based lookup
    const { data: contact } = await admin
      .from('crm_contacts')
      .select('email')
      .eq('id', id)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const { data, error } = await admin
      .from('client_products')
      .select('*')
      .or(`contact_id.eq.${id}${contact.email ? `,client_email.eq.${contact.email}` : ''}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Products fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('Products GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { device_type, manufacturer, model, serial_number, notes } = body

    if (!device_type?.trim() || !model?.trim()) {
      return NextResponse.json({ error: 'device_type and model are required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    const { data: contact } = await admin
      .from('crm_contacts')
      .select('email')
      .eq('id', id)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const { data, error } = await admin
      .from('client_products')
      .insert({
        contact_id: id,
        client_email: contact.email ?? '',
        device_type: device_type.trim(),
        manufacturer: manufacturer?.trim() || null,
        model: model.trim(),
        serial_number: serial_number?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Product insert error:', error)
      return NextResponse.json({ error: 'Failed to add product' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Products POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
