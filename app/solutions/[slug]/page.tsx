import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { solutions, getSolution } from '@/data/solutions'
import { solutionIcons, Check } from '@/components/ui/Icons'
import { Button } from '@/components/ui/Button'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { serviceSchema, breadcrumbSchema, faqSchema } from '@/lib/schema'
import { AccordionItem } from '@/components/ui/Accordion'

export async function generateStaticParams() {
  return solutions.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const solution = getSolution(slug)
  if (!solution) return {}

  const url = `https://connectex.net/solutions/${solution.slug}`

  return {
    title: `${solution.title} | ConnectEx Solutions`,
    description: solution.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: solution.title,
      description: solution.metaDescription,
      url,
      type: 'article',
      siteName: 'ConnectEx Solutions',
      images: [
        {
          url: `/solutions/${solution.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: solution.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: solution.title,
      description: solution.metaDescription,
      images: [`/solutions/${solution.slug}/opengraph-image`],
    },
  }
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const solution = getSolution(slug)
  if (!solution) notFound()

  const Icon = solutionIcons[solution.slug]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema({
              name: solution.title,
              description: solution.metaDescription,
              url: `/solutions/${solution.slug}`,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: 'Solutions', url: '/solutions' },
              { name: solution.shortTitle, url: `/solutions/${solution.slug}` },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(solution.faqs)) }}
      />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden grid-bg">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: `${solution.color}08` }}
        />
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/solutions" className="hover:text-[var(--text)] transition-colors">Solutions</Link>
            <span>/</span>
            <span style={{ color: solution.color }}>{solution.shortTitle}</span>
          </nav>

          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${solution.color}12`, border: `1px solid ${solution.color}25` }}
            >
              {Icon && <Icon className="w-7 h-7" style={{ color: solution.color }} strokeWidth={1.5} />}
            </div>
            <span
              className="text-sm font-semibold px-3 py-1.5 rounded-full"
              style={{ background: `${solution.color}12`, color: solution.color, border: `1px solid ${solution.color}25` }}
            >
              {solution.stat.value} — {solution.stat.label}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)] leading-tight mb-5">
            {solution.title}
          </h1>
          <p className="text-xl font-medium mb-4" style={{ color: solution.color }}>
            {solution.tagline}
          </p>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed max-w-2xl mb-10">
            {solution.description}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button variant="cta" size="lg" href="/contact">
              Get a Free {solution.shortTitle} Assessment
            </Button>
            <Button variant="secondary" size="lg" href="/marketplace">
              Browse the Marketplace
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <SectionWrapper className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-8">What&rsquo;s included</h2>
            <ul className="space-y-4">
              {solution.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${solution.color}15`, border: `1px solid ${solution.color}30` }}
                  >
                    <Check className="w-3.5 h-3.5" style={{ color: solution.color }} strokeWidth={2.5} />
                  </div>
                  <span className="text-[var(--text-muted)] text-sm">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-8">Who this is for</h2>
            <ul className="space-y-4">
              {solution.useCases.map((uc, i) => (
                <li key={i} className="glass rounded-xl p-4 border border-white/8 text-sm text-[var(--text-muted)] flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${solution.color}12`, border: `1px solid ${solution.color}25` }}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" style={{ color: solution.color }} strokeWidth={1.5} />}
                  </div>
                  {uc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionWrapper>

      {/* Differentiators */}
      <SectionWrapper className="py-20 px-4 sm:px-6 bg-[#0a1520]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-10 text-center">
            Why ConnectEx vs. a single vendor
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {solution.differentiators.map((d, i) => (
              <div key={i} className="glass rounded-2xl p-7 border border-white/8">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mb-4"
                  style={{ background: `${solution.color}15`, color: solution.color, border: `1px solid ${solution.color}30` }}
                >
                  {i + 1}
                </div>
                <h3 className="font-semibold text-[var(--text)] mb-3">{d.heading}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* FAQ */}
      <SectionWrapper className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-10 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {solution.faqs.map((faq, i) => (
              <AccordionItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 bg-[#0a1520]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-4">
            Ready to find the right {solution.shortTitle.toLowerCase()} solution?
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            We run a free assessment and source the best fit from 600+ providers — at no extra cost to you.
          </p>
          <Button variant="cta" size="lg" href="/contact">
            Get My Free Assessment
          </Button>
        </div>
      </section>

      {/* Other solutions */}
      <SectionWrapper className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-6">Other solutions</h3>
          <div className="flex flex-wrap gap-3">
            {solutions
              .filter((s) => s.slug !== solution.slug)
              .map((s) => {
                const SIcon = solutionIcons[s.slug]
                return (
                  <Link
                    key={s.slug}
                    href={`/solutions/${s.slug}`}
                    className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] border border-white/8 hover:border-white/20 transition-all"
                  >
                    {SIcon && <SIcon className="w-4 h-4" style={{ color: s.color }} strokeWidth={1.5} />}
                    {s.shortTitle}
                  </Link>
                )
              })}
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}
