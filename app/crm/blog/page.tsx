'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CRMShell } from '@/components/crm/CRMShell'
import {
  PenLine,
  ExternalLink,
  Trash2,
  FileText,
  BookOpen,
  CheckCircle2,
  Clock4,
  Download,
} from 'lucide-react'
import { posts as staticPosts } from '@/data/posts'

interface BlogPost {
  id: string | null
  slug: string
  title: string
  category: string
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  excerpt: string
  isStatic: boolean
}

type Filter = 'all' | 'published' | 'drafts'

export default function BlogListPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [importing, setImporting] = useState<string | null>(null)

  async function fetchPosts() {
    setLoading(true)
    try {
      const res = await fetch('/api/blog?all=true')
      const data = await res.json()
      const supabasePosts: BlogPost[] = Array.isArray(data) ? data : []

      const supabaseSlugs = new Set(supabasePosts.map((p: BlogPost) => p.slug))

      // Build unified list: Supabase posts first (managed), then static-only
      const staticOnly = staticPosts
        .filter(sp => !supabaseSlugs.has(sp.slug))
        .map(sp => ({
          id: null,           // null = not yet in Supabase
          slug: sp.slug,
          title: sp.title,
          excerpt: sp.excerpt,
          category: sp.category,
          read_time: sp.readTime,
          featured: sp.featured,
          status: 'published' as const,
          published_at: sp.publishedAt,
          created_at: sp.publishedAt,
          updated_at: sp.publishedAt,
          isStatic: true,     // flag for UI
        }))

      setPosts([...supabasePosts.map((p: BlogPost) => ({ ...p, isStatic: false })), ...staticOnly])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    await fetch(`/api/blog/${id}`, { method: 'DELETE' })
    fetchPosts()
  }

  async function handleImport(slug: string) {
    setImporting(slug)
    try {
      const res = await fetch('/api/blog/import-static', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const { post } = await res.json()
      if (post?.id) {
        // Replace the static entry with the newly imported Supabase post
        router.push(`/crm/blog/${post.id}`)
      }
    } catch {
      setImporting(null)
    }
  }

  const filtered = posts.filter((p) => {
    if (filter === 'published') return p.status === 'published'
    if (filter === 'drafts') return p.status === 'draft'
    return true
  })

  // Stats: total = all posts (supabase + static-only), published includes static (all published),
  // drafts = supabase drafts only
  const supabasePosts = posts.filter(p => !p.isStatic)
  const staticOnlyPosts = posts.filter(p => p.isStatic)
  const totalCount = posts.length
  const publishedCount = supabasePosts.filter(p => p.status === 'published').length + staticOnlyPosts.length
  const draftCount = supabasePosts.filter(p => p.status === 'draft').length

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'published', label: 'Published', count: publishedCount },
    { key: 'drafts', label: 'Drafts', count: draftCount },
  ]

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <CRMShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Blog</h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-0.5">Publish and manage your articles</p>
          </div>
          <Link
            href="/crm/blog/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00b396] text-[#0a1218] font-semibold text-sm rounded-xl transition-colors self-start sm:self-auto"
          >
            <PenLine className="w-4 h-4" />
            New Article
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4 border border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#60A5FA]/15">
                <FileText className="w-4 h-4 text-[#60A5FA]" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{loading ? '—' : totalCount}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Total Articles</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4 border border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#00C9A7]/15">
                <CheckCircle2 className="w-4 h-4 text-[#00C9A7]" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{loading ? '—' : publishedCount}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Published</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4 border border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#F59E0B]/15">
                <Clock4 className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{loading ? '—' : draftCount}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Drafts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Static posts info banner */}
        {!loading && posts.some(p => p.isStatic) && (
          <div className="glass rounded-xl px-4 py-3 border border-[#A78BFA]/20 flex items-center gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-[#A78BFA] flex-shrink-0" />
            <p className="text-[var(--color-text-muted)]">
              <span className="text-white font-medium">{posts.filter(p => p.isStatic).length} articles</span> were written before the CRM and are read-only until imported.{' '}
              <span className="text-[#A78BFA]">Click &quot;Import &amp; Edit&quot; to bring them into the CRM.</span>
            </p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-white/8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                filter === tab.key
                  ? 'text-[#00C9A7] border-[#00C9A7]'
                  : 'text-[var(--color-text-muted)] border-transparent hover:text-white'
              }`}
            >
              {tab.label}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.key ? 'bg-[#00C9A7]/15 text-[#00C9A7]' : 'bg-white/8 text-[var(--color-text-faint)]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Posts table */}
        <div className="glass rounded-xl overflow-hidden border border-white/8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium hidden sm:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-[var(--color-text-muted)] font-medium w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-4 py-4"><div className="h-4 bg-white/8 animate-pulse rounded w-3/4" /></td>
                      <td className="px-4 py-4 hidden md:table-cell"><div className="h-4 bg-white/8 animate-pulse rounded w-24" /></td>
                      <td className="px-4 py-4"><div className="h-5 bg-white/8 animate-pulse rounded w-20" /></td>
                      <td className="px-4 py-4 hidden sm:table-cell"><div className="h-4 bg-white/8 animate-pulse rounded w-24" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-white/8 animate-pulse rounded w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <BookOpen className="w-10 h-10 text-[var(--color-text-faint)] mx-auto mb-3" />
                      <p className="text-[var(--color-text-muted)] font-medium mb-1">No articles yet</p>
                      <Link href="/crm/blog/new" className="text-sm text-[#00C9A7] hover:underline">
                        Write your first article →
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filtered.map((post) => (
                    <tr key={post.id ?? post.slug} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        {post.isStatic ? (
                          <span className="font-semibold text-white">{post.title}</span>
                        ) : (
                          <Link
                            href={`/crm/blog/${post.id}`}
                            className="font-semibold text-white hover:text-[#00C9A7] transition-colors"
                          >
                            {post.title}
                          </Link>
                        )}
                        {post.excerpt && (
                          <p className="text-xs text-[var(--color-text-faint)] mt-0.5 line-clamp-1">{post.excerpt}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {post.category ? (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/8 text-[var(--color-text-muted)]">
                            {post.category}
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-faint)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {post.status === 'published' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-[#00C9A7]/15 text-[#00C9A7] border border-[#00C9A7]/25">
                            <CheckCircle2 className="w-3 h-3" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25">
                            <Clock4 className="w-3 h-3" />
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-[var(--color-text-muted)] text-xs">
                        {formatDate(post.published_at ?? post.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {post.isStatic ? (
                          // Static post — not yet in Supabase
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[var(--color-text-muted)] mr-1">Static</span>
                            <button
                              onClick={() => handleImport(post.slug)}
                              disabled={importing === post.slug}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#A78BFA]/15 text-[#A78BFA] hover:bg-[#A78BFA]/25 border border-[#A78BFA]/25 transition-colors disabled:opacity-50"
                            >
                              {importing === post.slug ? (
                                <span className="w-3 h-3 border border-[#A78BFA] border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                              Import &amp; Edit
                            </button>
                            <a
                              href={`/resources/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          // Supabase-managed post — normal Edit/View/Delete buttons
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/crm/blog/${post.id}`}
                              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <PenLine className="w-3.5 h-3.5" />
                            </Link>
                            <a
                              href={`/resources/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDelete(post.id!, post.title)}
                              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CRMShell>
  )
}
