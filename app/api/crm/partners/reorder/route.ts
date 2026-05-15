import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { createAdminClient } from '@/lib/supabase'

interface ReorderItem { id: string; sort_order: number; featured?: boolean }

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse
  try {
    const body = await req.json()
    const items: ReorderItem[] = Array.isArray(body?.items) ? body.items : []
    if (items.length === 0) return NextResponse.json({ error: 'items required' }, { status: 400 })
    const admin = createAdminClient()
    const results = await Promise.all(items.map((item) => admin.from('partners').update({
      sort_order: item.sort_order,
      ...(typeof item.featured === 'boolean' ? { featured: item.featured } : {}),
      updated_at: new Date().toISOString(),
    }).eq('id', item.id)))
    const firstError = results.find((r) => r.error)?.error
    if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Partners reorder exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
