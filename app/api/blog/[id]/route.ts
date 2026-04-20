import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    const body = await request.json()

    // Fetch current post to check status transition
    const { data: current, error: fetchError } = await supabase
      .from('blog_posts')
      .select('status, published_at')
      .eq('id', id)
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const ALLOWED = ['slug', 'title', 'excerpt', 'body', 'category', 'read_time', 'featured', 'status', 'meta_description'] as const
    const patch: Record<string, unknown> = {}
    for (const key of ALLOWED) {
      if (key in body) patch[key] = body[key]
    }

    if (body.status === 'published' && current.status === 'draft') {
      patch.published_at = new Date().toISOString()
    } else if (body.status === 'draft') {
      patch.published_at = null
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('blog PATCH error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate public pages so published content appears immediately
    revalidatePath('/resources')
    if (data?.slug) {
      revalidatePath(`/resources/${data.slug}`)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('blog DELETE error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    revalidatePath('/resources')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
