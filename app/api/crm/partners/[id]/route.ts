import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { getSupabaseAdmin } from '@/lib/ticket-triage'
import { PARTNER_CATEGORIES } from '@/lib/partner-types'

const VALID_CATEGORIES = new Set<string>(PARTNER_CATEGORIES)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const body = await req.json()
    if (body.category && !VALID_CATEGORIES.has(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const allowed = [
      'name', 'category', 'description', 'website', 'contact_email',
      'contact_phone', 'logo_url', 'color', 'featured', 'visible', 'sort_order', 'notes',
    ] as const
    for (const key of allowed) {
      if (key in body) {
        const value = body[key]
        if (typeof value === 'string') update[key] = value.trim() || null
        else update[key] = value
      }
    }

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('partners')
      .update(update)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Partners PATCH error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Partners PATCH exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin.from('partners').delete().eq('id', id)
    if (error) {
      console.error('Partners DELETE error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Partners DELETE exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
