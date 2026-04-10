import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/ticket-triage'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('kb_documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('KB GET [id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const admin = getSupabaseAdmin()
    const { error } = await admin.from('kb_documents').delete().eq('id', id)

    if (error) {
      console.error('KB delete error:', error)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('KB DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
