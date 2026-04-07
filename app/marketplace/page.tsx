import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { breadcrumbSchema } from '@/lib/schema'
import { BuiltfirstEmbed } from './BuiltfirstEmbed'

export const metadata: Metadata = {
  title: 'Technology Marketplace — 600+ Business Solutions | Connectex',
  description:
    'Browse 600+ vetted technology solutions for your business — managed IT, cybersecurity, cloud, communications, and AI tools. Sourced and supported by Connectex, Austin\'s vendor-neutral technology advisor.',
  alternates: { canonical: 'https://connectex.net/marketplace' },
  openGraph: {
    title: 'Technology Marketplace — 600+ Business Solutions | Connectex',
    description:
      'Browse 600+ vetted technology solutions for your business — managed IT, cybersecurity, cloud, communications, and AI tools. Sourced and supported by Connectex.',
    url: 'https://connectex.net/marketplace',
    siteName: 'Connectex Solutions',
  },
}

export default function MarketplacePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: 'Marketplace', url: '/marketplace' },
            ])
          ),
        }}
      />

      {/* Hero */}
      <section className="pt-32 pb-12 px-4 sm:px-6 grid-bg">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#00C9A7] text-sm font-semibold uppercase tracking-widest mb-4">
            The Connectex Marketplace
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)] leading-tight mb-5">
            600+ solutions. Every category. One agreement.
          </h1>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto mb-8">
            Browse managed IT, cybersecurity, cloud, communications, and AI tools from vetted
            providers — all accessible through a single Master Services Agreement with Connectex.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="text-xs font-semibold px-4 py-2 rounded-full bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/25">
              Powered by AppDirect
            </span>
            <span className="text-xs font-semibold px-4 py-2 rounded-full bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/25">
              600+ Vetted Providers
            </span>
          </div>

          <p className="text-sm text-[var(--text-muted)] italic">
            Need help choosing? Mark will personally recommend the right fit —{' '}
            <Link href="/contact" className="text-[#00C9A7] hover:underline not-italic font-medium">
              Get a free assessment →
            </Link>
          </p>
        </div>
      </section>

      {/* Builtfirst embed */}
      <section className="py-8 px-0">
        <BuiltfirstEmbed />
      </section>

      {/* Bottom CTA */}
      <SectionWrapper className="py-20 px-4 sm:px-6 bg-[#0a1520]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-4">Not sure where to start?</h2>
          <p className="text-[var(--text-muted)] mb-8">
            Mark reviews your current technology stack, identifies the right providers for your
            specific needs, and handles the setup — at no extra cost to you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="cta" size="lg" href="/contact">
              Talk to Mark
            </Button>
            <Button variant="secondary" size="lg" href="/solutions">
              View Solutions
            </Button>
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}
