import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { createAdminClient } from '@/lib/supabase'
import { PARTNER_CATEGORIES } from '@/lib/partner-types'

const VALID_CATEGORIES = new Set<string>(PARTNER_CATEGORIES)

export async function GET() {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('partners').select('*').order('featured', { ascending: false }).order('sort_order', { ascending: true }).order('name', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('Partners GET exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse
  try {
    const body = await req.json()
    if (!body?.name?.trim() || !body?.category?.trim()) return NextResponse.json({ error: 'name and category are required' }, { status: 400 })
    if (!VALID_CATEGORIES.has(body.category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    const admin = createAdminClient()
    const { data, error } = await admin.from('partners').insert({
      name: body.name.trim(),
      category: body.category.trim(),
      description: body.description?.trim() || null,
      website: body.website?.trim() || null,
      contact_email: body.contact_email?.trim() || null,
      contact_phone: body.contact_phone?.trim() || null,
      logo_url: body.logo_url?.trim() || null,
      color: body.color?.trim() || '#00C9A7',
      featured: Boolean(body.featured),
      visible: body.visible !== false,
      sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
      notes: body.notes?.trim() || null,
    }).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Partners POST exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
