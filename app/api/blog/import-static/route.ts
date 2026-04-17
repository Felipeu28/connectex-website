import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getPost } from '@/data/posts'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json()
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

    const staticPost = getPost(slug)
    if (!staticPost) return NextResponse.json({ error: 'Static post not found' }, { status: 404 })

    const supabase = await createSupabaseServer()

    // Check if already imported (don't duplicate)
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ post: existing, alreadyImported: true })
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        slug: staticPost.slug,
        title: staticPost.title,
        excerpt: staticPost.excerpt,
        body: staticPost.body,
        category: staticPost.category,
        read_time: staticPost.readTime,
        featured: staticPost.featured,
        status: 'published',
        meta_description: staticPost.excerpt,
        published_at: new Date(staticPost.publishedAt).toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/resources')
    revalidatePath(`/resources/${slug}`)

    return NextResponse.json({ post: data }, { status: 201 })
  } catch (err) {
    console.error('Import static post error:', err)
    return NextResponse.json({ error: 'Failed to import post' }, { status: 500 })
  }
}
