import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const all = request.nextUrl.searchParams.get('all') === 'true'

    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false })

    if (!all) {
      query = query.eq('status', 'published')
    }

    const { data, error } = await query

    if (error) {
      console.error('blog GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  try {
    const supabase = await createSupabaseServer()
    const body = await request.json()

    const { slug, title, excerpt, body: postBody, category, read_time, featured, status, meta_description } = body

    const insert: Record<string, unknown> = {
      slug,
      title,
      excerpt,
      body: postBody,
      category,
      read_time,
      featured,
      status,
      meta_description,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(insert)
      .select()
      .single()

    if (error) {
      console.error('blog POST error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
