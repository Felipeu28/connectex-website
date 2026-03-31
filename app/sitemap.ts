import type { MetadataRoute } from 'next'
import { solutions } from '@/data/solutions'
import { posts } from '@/data/posts'

const BASE_URL = 'https://connectex.net'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE_URL, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/solutions`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/marketplace`, priority: 0.8, changeFrequency: 'monthly' as const },
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

  const postPages = posts.map((p) => ({
    url: `${BASE_URL}/resources/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    priority: 0.8,
    changeFrequency: 'monthly' as const,
  }))

  const staticDate = new Date('2026-03-31')

  return [
    ...staticPages.map((p) => ({ ...p, lastModified: staticDate })),
    ...solutionPages.map((p) => ({ ...p, lastModified: staticDate })),
    ...postPages,
  ]
}
