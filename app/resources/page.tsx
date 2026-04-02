import Link from 'next/link'
import { posts } from '@/data/posts'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema } from '@/lib/schema'
import { generateMetadata as genMeta } from '@/lib/seo'

export const metadata = genMeta({
  title: 'Resources — Technology Guides for Austin SMBs',
  description:
    'Expert guides, cybersecurity checklists, and IT cost breakdowns for Austin small businesses. Written by a 20-year technology advisor with no vendor bias.',
  path: '/resources',
})

export default function ResourcesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: 'Resources', url: '/resources' },
            ])
          ),
        }}
      />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 grid-bg">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#00C9A7] text-sm font-semibold uppercase tracking-widest mb-4">Resources</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5">
            Technology guides for Austin small business owners
          </h1>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
            Real numbers, plain language, no vendor bias. Everything you need to make smarter technology decisions for your business.
          </p>
        </div>
      </section>

      {/* Featured post */}
      <SectionWrapper className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-6">Featured</h2>
          {posts.filter((p) => p.featured).slice(0, 1).map((post) => (
            <Link
              key={post.slug}
              href={`/resources/${post.slug}`}
              className="block glass rounded-3xl p-10 border border-white/8 hover:border-[#00C9A7]/20 transition-all duration-200 group"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="accent">{post.category}</Badge>
                    <span className="text-xs text-[var(--text-muted)]">{post.readTime} read</span>
                    <span className="text-xs text-[var(--text-muted)]">{post.publishedAt}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 group-hover:text-[#00C9A7] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-[var(--text-muted)] leading-relaxed mb-6">{post.excerpt}</p>
                  <span className="text-sm font-medium text-[#00C9A7] flex items-center gap-1.5">
                    Read guide
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
                <div className="glass rounded-2xl p-8 border border-white/8 hidden md:flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#00C9A7]/12 border border-[#00C9A7]/25 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-[#00C9A7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-[var(--text)]">{post.category}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{post.readTime} read</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SectionWrapper>

      {/* All posts grid */}
      <SectionWrapper className="pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-6">All guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/resources/${post.slug}`}
                className="glass rounded-2xl p-7 border border-white/8 hover:border-[#00C9A7]/20 transition-all duration-200 hover:-translate-y-0.5 group flex flex-col"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="muted" size="sm">{post.category}</Badge>
                  <span className="text-xs text-[var(--text-muted)]">{post.readTime}</span>
                </div>
                <h3 className="font-bold text-white text-base mb-3 flex-1 group-hover:text-[#00C9A7] transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">{post.publishedAt}</span>
                  <svg className="w-4 h-4 text-[#00C9A7] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Email capture */}
      <section className="py-20 px-4 sm:px-6 bg-[#0a1520]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Get new guides in your inbox</h2>
          <p className="text-[var(--text-muted)] mb-8">
            Monthly guides on technology, cybersecurity, and cost optimization for Austin small businesses. No spam.
          </p>
          <Button variant="cta" size="lg" href="/contact">Subscribe via Contact Form</Button>
        </div>
      </section>
    </>
  )
}
