import Link from 'next/link'
import { solutions } from '@/data/solutions'
import { solutionIcons, ArrowRight } from '@/components/ui/Icons'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema } from '@/lib/schema'
import { generateMetadata as genMeta } from '@/lib/seo'

export const metadata = genMeta({
  title: 'Technology Solutions for Austin SMBs',
  description:
    'ConnectEx sources managed IT, cybersecurity, cloud, communications, and AI solutions for Central Texas small businesses from 600+ vetted providers.',
  path: '/solutions',
})

export default function SolutionsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: 'Solutions', url: '/solutions' },
            ])
          ),
        }}
      />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 grid-bg">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#00D4AA] text-sm font-semibold uppercase tracking-widest mb-4">Solutions</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)] mb-5">
            Every technology your business needs, sourced from the best
          </h1>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto mb-8">
            We don&rsquo;t sell our own labor. We source the right provider from 600+ vendors across every category of business technology — then manage the relationship for you.
          </p>
          <Button variant="cta" size="lg" href="/contact">
            Get Your Free Vendor Assessment
          </Button>
        </div>
      </section>

      {/* Solutions grid */}
      <SectionWrapper className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((sol) => {
            const Icon = solutionIcons[sol.slug]
            return (
              <Link
                key={sol.slug}
                href={`/solutions/${sol.slug}`}
                className="glass rounded-2xl p-8 border border-white/8 hover:border-opacity-60 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group flex flex-col"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: `${sol.color}12`, border: `1px solid ${sol.color}25` }}
                >
                  {Icon && <Icon className="w-5 h-5" style={{ color: sol.color }} strokeWidth={1.5} />}
                </div>

                <h2 className="text-xl font-bold text-[var(--text)] mb-2 group-hover:text-[var(--text)]">
                  {sol.shortTitle}
                </h2>
                <p className="text-sm font-medium mb-3" style={{ color: sol.color }}>
                  {sol.tagline}
                </p>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5 flex-1">
                  {sol.description}
                </p>

                <div className="flex items-center justify-between">
                  <div
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: `${sol.color}12`, color: sol.color, border: `1px solid ${sol.color}25` }}
                  >
                    {sol.stat.value} — {sol.stat.label.split(' ').slice(0, 4).join(' ')}
                  </div>
                  <ArrowRight
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    style={{ color: sol.color }}
                    strokeWidth={2}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </SectionWrapper>

      {/* Bottom CTA */}
      <section className="py-16 px-4 sm:px-6 bg-[#0a1520]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-4">
            Not sure where to start?
          </h2>
          <p className="text-[var(--text-muted)] mb-7">
            We start every engagement with a free assessment. Tell us your biggest challenge and we&rsquo;ll show you exactly what the market offers.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="cta" size="lg" href="/contact">Get Free Assessment</Button>
            <Button variant="secondary" size="lg" href="/marketplace">Browse the Marketplace</Button>
          </div>
        </div>
      </section>
    </>
  )
}
