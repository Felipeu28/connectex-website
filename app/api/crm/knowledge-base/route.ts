import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/ticket-triage'

const VALID_CATEGORIES = ['verizon', 'microsoft365', 'ucaas', 'general'] as const

export async function GET() {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('kb_documents')
      .select('id, title, category, file_name, created_at, updated_at')
      .order('category')
      .order('title')

    if (error) {
      console.error('KB list error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('KB GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, category, content, file_name } = await req.json()

    if (!title?.trim() || !category || !content?.trim()) {
      return NextResponse.json({ error: 'title, category, and content are required' }, { status: 400 })
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('kb_documents')
      .insert({
        title: title.trim(),
        category,
        content: content.trim(),
        file_name: file_name ?? null,
      })
      .select('id, title, category, file_name, created_at, updated_at')
      .single()

    if (error) {
      console.error('KB insert error:', error)
      return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('KB POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
