import type { MetadataRoute } from 'next'
import { solutions } from '@/data/solutions'
import { posts } from '@/data/posts'
import { createSupabaseServer } from '@/lib/supabase-server'

const BASE_URL = 'https://connectex.net'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { url: BASE_URL, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/solutions`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/marketplace`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/preferred-vendors`, priority: 0.75, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/partners`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/resources`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/about`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/contact`, priority: 0.8, changeFrequency: 'monthly' as const },
  ]

  const solutionPages = solutions.map((s) => ({
    url: `${BASE_URL}/solutions/${s.slug}`,
    priority: 0.85,
    changeFrequency: 'monthly' as const,
  }))

  const staticPostPages = posts.map((p) => ({
    url: `${BASE_URL}/resources/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    priority: 0.8,
    changeFrequency: 'monthly' as const,
  }))

  // Pull CRM-authored blog posts out of the DB. /resources/[slug] falls
  // through to `blog_posts` for any slug not in data/posts.ts, but without
  // this pull Google has no way to discover those pages.
  let dbPostPages: MetadataRoute.Sitemap = []
  try {
    const supabase = await createSupabaseServer()
    const { data } = await supabase
      .from('blog_posts')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')

    const staticSlugs = new Set(posts.map((p) => p.slug))
    dbPostPages = (data ?? [])
      .filter((p: { slug: string }) => !staticSlugs.has(p.slug))
      .map((p: { slug: string; published_at: string | null; updated_at: string | null }) => ({
        url: `${BASE_URL}/resources/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : p.published_at ? new Date(p.published_at) : new Date(),
        priority: 0.8,
        changeFrequency: 'monthly' as const,
      }))
  } catch {
    // Supabase not configured (dev without env) — static posts only.
  }

  const staticDate = new Date('2026-03-31')

  return [
    ...staticPages.map((p) => ({ ...p, lastModified: staticDate })),
    ...solutionPages.map((p) => ({ ...p, lastModified: staticDate })),
    ...staticPostPages,
    ...dbPostPages,
  ]
}
