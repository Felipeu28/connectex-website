import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { posts, getPost, Post } from '@/data/posts'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { breadcrumbSchema, blogPostSchema } from '@/lib/schema'
import { createSupabaseServer } from '@/lib/supabase-server'

export const revalidate = 60
export const dynamicParams = true

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  let post: Post | undefined = getPost(slug)

  if (!post) {
    try {
      const supabase = await createSupabaseServer()
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (data) {
        post = {
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          category: data.category,
          readTime: data.read_time,
          publishedAt: data.published_at ? data.published_at.split('T')[0] : '',
          featured: data.featured,
          body: data.body,
        }
      }
    } catch {
      // Supabase not configured
    }
  }

  if (!post) return {}

  const url = `https://connectex.net/resources/${post.slug}`

  return {
    title: `${post.title} | Connectex Solutions`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: 'article',
      siteName: 'Connectex Solutions',
      images: [
        {
          url: `/resources/${post.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [`/resources/${post.slug}/opengraph-image`],
    },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let post: Post | undefined = getPost(slug)

  if (!post) {
    try {
      const supabase = await createSupabaseServer()
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (data) {
        post = {
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          category: data.category,
          readTime: data.read_time,
          publishedAt: data.published_at ? data.published_at.split('T')[0] : '',
          featured: data.featured,
          body: data.body,
        }
      }
    } catch {
      // Supabase not configured
    }
  }

  if (!post) notFound()
  const safePost = post as Post

  const related = posts.filter((p) => p.slug !== slug && p.category === safePost.category).slice(0, 2)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: 'Resources', url: '/resources' },
              { name: safePost.title, url: `/resources/${safePost.slug}` },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            blogPostSchema({
              title: safePost.title,
              description: safePost.excerpt,
              slug: safePost.slug,
              datePublished: safePost.publishedAt,
            })
          ),
        }}
      />

      {/* Hero */}
      <section className="pt-32 pb-12 px-4 sm:px-6 grid-bg">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/resources" className="hover:text-white transition-colors">Resources</Link>
            <span>/</span>
            <span className="text-[#00C9A7]">{safePost.category}</span>
          </nav>

          <div className="flex items-center gap-3 mb-5">
            <Badge variant="accent">{safePost.category}</Badge>
            <span className="text-xs text-[var(--text-muted)]">{safePost.readTime} read</span>
            <span className="text-xs text-[var(--text-muted)]">{safePost.publishedAt}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-5">
            {safePost.title}
          </h1>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed mb-8">{safePost.excerpt}</p>

          <div className="flex items-center gap-3 pb-8 border-b border-white/8">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8B2BE2] to-[#00C9A7] flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Mark</p>
              <p className="text-xs text-[var(--text-muted)]">Connectex Solutions · Austin, TX</p>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <article className="py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div
            className="prose prose-invert prose-sm sm:prose-base max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-7 prose-h3:mb-3
              prose-p:text-[var(--text-muted)] prose-p:leading-relaxed prose-p:mb-4
              prose-li:text-[var(--text-muted)]
              prose-strong:text-white
              prose-a:text-[#00C9A7] prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-[#00C9A7] prose-blockquote:text-[var(--text-muted)]
              prose-table:text-sm
              prose-th:text-white prose-th:font-semibold prose-th:py-3 prose-th:px-4
              prose-td:text-[var(--text-muted)] prose-td:py-3 prose-td:px-4
              prose-tr:border-b prose-tr:border-white/8
              prose-code:text-[#00C9A7] prose-code:bg-[#00C9A7]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              [&_table]:glass [&_table]:rounded-xl [&_table]:border [&_table]:border-white/8 [&_table]:overflow-hidden [&_table]:w-full
              [&_thead]:bg-white/5
              [&_ul]:space-y-2 [&_ol]:space-y-2
              [&_input[type=checkbox]]:accent-[#00C9A7]"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(safePost.body) }}
          />

          {/* In-article CTA */}
          <div className="mt-12 glass rounded-2xl p-8 border border-[#FF6B6B]/20 text-center">
            <p className="text-sm font-semibold text-white mb-2">Ready to take action?</p>
            <p className="text-sm text-[var(--text-muted)] mb-5">
              Get a free vulnerability scan and see exactly where your business stands.
            </p>
            <Button variant="cta" size="md" href="/contact">Get My Free Report</Button>
          </div>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="py-16 px-4 sm:px-6 bg-[#0a1520]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-bold text-white mb-6">Related guides</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/resources/${p.slug}`}
                  className="glass rounded-2xl p-6 border border-white/8 hover:border-[#00C9A7]/20 transition-all group"
                >
                  <Badge variant="muted" size="sm" className="mb-3">{p.category}</Badge>
                  <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-[#00C9A7] transition-colors">
                    {p.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

// Minimal markdown parser for the blog post content
function markdownToHtml(md: string): string {
  return md
    .trim()
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^- \[ \] (.+)$/gm, '<li><input type="checkbox" disabled> $1</li>')
    .replace(/^- \[x\] (.+)$/gm, '<li><input type="checkbox" checked disabled> $1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, (m) => {
      if (m.includes('type="checkbox"')) return `<ul class="checklist">${m}</ul>`
      return `<ul>${m}</ul>`
    })
    .replace(/^\| (.+) \|$/gm, (_, row: string) => {
      const cells = row.split(' | ').map((c: string) => c.trim())
      return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join('')}</tr>`
    })
    .replace(/^(\|[-: |]+\|)$/gm, '') // remove separator rows
    .replace(/(<tr>.*<\/tr>\n?)+/gs, (m: string) => {
      const rows = m.trim().split('\n')
      const header = rows[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>')
      const body = rows.slice(1).join('\n')
      return `<table><thead>${header}</thead><tbody>${body}</tbody></table>`
    })
    .split('\n\n')
    .map((block) => {
      if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol') || block.startsWith('<table')) return block
      if (block.trim() === '') return ''
      return `<p>${block.replace(/\n/g, ' ')}</p>`
    })
    .join('\n')
}
