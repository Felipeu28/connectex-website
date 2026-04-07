'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CRMShell } from '@/components/crm/CRMShell'
import {
  PenLine,
  ExternalLink,
  Trash2,
  FileText,
  BookOpen,
  CheckCircle2,
  Clock4,
  Edit3,
} from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  title: string
  category: string
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  excerpt: string
}

type Filter = 'all' | 'published' | 'drafts'

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  async function fetchPosts() {
    setLoading(true)
    try {
      const res = await fetch('/api/blog?all=true')
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
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

  const filtered = posts.filter((p) => {
    if (filter === 'published') return p.status === 'published'
    if (filter === 'drafts') return p.status === 'draft'
    return true
  })

  const totalCount = posts.length
  const publishedCount = posts.filter((p) => p.status === 'published').length
  const draftCount = posts.filter((p) => p.status === 'draft').length

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
                    <tr key={post.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/crm/blog/${post.id}`}
                          className="font-semibold text-white hover:text-[#00C9A7] transition-colors"
                        >
                          {post.title}
                        </Link>
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
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/crm/blog/${post.id}`}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors"
                            aria-label="Edit post"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          {post.slug && (
                            <a
                              href={`/resources/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors"
                              aria-label="View post"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            className="p-1.5 rounded-lg hover:bg-[#FF6B6B]/20 text-[var(--color-text-muted)] hover:text-[#FF6B6B] transition-colors"
                            aria-label="Delete post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
