'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BlogEditor } from '@/components/crm/BlogEditor'
import { CRMShell } from '@/components/crm/CRMShell'

interface PostData {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  category: string
  read_time: string
  featured: boolean
  status: 'draft' | 'published'
  meta_description: string
  published_at: string | null
}

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/blog/${id}`)
      .then((r) => r.json())
      .then((data) => { setPost(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <CRMShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#00C9A7] border-t-transparent rounded-full animate-spin" />
        </div>
      </CRMShell>
    )
  }

  return <BlogEditor postId={id} initialData={post ?? undefined} />
}
