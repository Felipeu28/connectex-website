import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/ticket-triage'

interface RouteContext {
  params: Promise<{ id: string; productId: string }>
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { productId } = await context.params
    const admin = getSupabaseAdmin()
    const { error } = await admin.from('client_products').delete().eq('id', productId)

    if (error) {
      console.error('Product delete error:', error)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Product DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
