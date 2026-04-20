import { Button } from '@/components/ui/Button'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { breadcrumbSchema } from '@/lib/schema'
import { generateMetadata as genMeta } from '@/lib/seo'
import { featuredVendor, gridVendors, type Vendor } from '@/data/vendors'

export const metadata = genMeta({
  title: 'Preferred Technology Vendors — Direct Partnerships | Connectex',
  description:
    'Connectex has preferred direct partnerships with leading technology providers — giving SMBs better pricing, faster support, and dedicated account management.',
  path: '/preferred-vendors',
})

const whyItMatters = [
  {
    title: 'Negotiated Pricing',
    description:
      "Direct relationships mean pricing tiers not available through retail or comparison sites. Mark's volume and tenure unlock rates SMBs can't access alone.",
    color: '#00C9A7',
  },
  {
    title: 'Dedicated Escalation',
    description:
      "When something goes wrong, Mark calls his direct contact — not a 1-800 number. Issues that take days through standard support get resolved in hours.",
    color: '#60A5FA',
  },
  {
    title: 'Contract Expertise',
    description:
      "Mark has reviewed hundreds of carrier contracts. He knows what's negotiable, what's a red flag, and how to get the best terms before you sign.",
    color: '#A78BFA',
  },
]

function VendorCard({ vendor }: { vendor: Vendor }) {
  const card = (
    <div className="glass rounded-2xl p-6 border border-white/8 relative overflow-hidden group transition-all hover:border-white/15">
      {/* Local ribbon */}
      {vendor.local && (
        <div className="absolute top-3 right-3">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{
              background: `${vendor.color}18`,
              color: vendor.color,
              border: `1px solid ${vendor.color}30`,
            }}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Local
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
          style={{
            background: `${vendor.color}15`,
            border: `1px solid ${vendor.color}25`,
            color: vendor.color,
          }}
        >
          {vendor.initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[var(--text)] truncate">{vendor.name}</h3>
          </div>
          <span
            className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
            style={{
              background: `${vendor.color}10`,
              color: vendor.color,
            }}
          >
            {vendor.category}
          </span>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{vendor.tagline}</p>
        </div>
      </div>
    </div>
  )

  if (vendor.url) {
    return (
      <a href={vendor.url} target="_blank" rel="noopener noreferrer" className="block">
        {card}
      </a>
    )
  }

  return card
}

function FeaturedPartner({ vendor }: { vendor: Vendor }) {
  return (
    <SectionWrapper className="py-20 px-4 sm:px-6 bg-[#0a1520]">
      <div className="max-w-4xl mx-auto">
        <p className="text-[#00C9A7] text-sm font-semibold uppercase tracking-widest mb-8 text-center">
          Featured Partner
        </p>

        <div
          className="glass rounded-2xl p-8 sm:p-10 border border-white/8 relative overflow-hidden"
          style={{ borderLeft: `4px solid ${vendor.color}` }}
        >
          <div
            className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ background: `${vendor.color}08` }}
          />

          <div className="relative z-10">
            <div className="flex flex-wrap items-start gap-6 mb-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-lg font-bold"
                style={{
                  background: `${vendor.color}15`,
                  border: `1px solid ${vendor.color}30`,
                  color: vendor.color,
                }}
              >
                {vendor.initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-[var(--text)]">{vendor.name}</h2>
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: `${vendor.color}12`,
                      color: vendor.color,
                      border: `1px solid ${vendor.color}25`,
                    }}
                  >
                    Preferred Partner
                  </span>
                </div>
                <p className="text-[var(--text-muted)] text-sm">{vendor.tagline}</p>
              </div>
            </div>

            {vendor.offerings && (
              <div className="mb-8">
                <h3 className="font-semibold text-[var(--text)] mb-4">
                  What we offer through our {vendor.name} partnership:
                </h3>
                <ul className="space-y-3">
                  {vendor.offerings.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                        style={{
                          background: `${vendor.color}12`,
                          border: `1px solid ${vendor.color}25`,
                          color: vendor.color,
                        }}
                      >
                        ✓
                      </div>
                      <span className="text-[var(--text-muted)] text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button variant="cta" size="lg" href="/contact">
              Talk to Mark About {vendor.name} →
            </Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

export default function PreferredVendorsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: 'Preferred Vendors', url: '/preferred-vendors' },
            ])
          ),
        }}
      />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 grid-bg">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#00C9A7] text-sm font-semibold uppercase tracking-widest mb-4">
            Preferred Partnerships
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)] leading-tight mb-5">
            Direct vendor relationships. Better pricing. Faster service.
          </h1>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto mb-8">
            Mark has built 20+ years of direct relationships with leading technology providers. These
            aren&rsquo;t catalog referrals &mdash; these are preferred partnerships with dedicated
            account access and negotiated pricing that smaller businesses don&rsquo;t get on their
            own.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/25">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7]" />
            <span className="text-sm font-semibold text-[#00C9A7]">
              20+ years of direct carrier relationships
            </span>
          </div>
        </div>
      </section>

      {/* What "Preferred Partner" means */}
      <SectionWrapper className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-4">
              What &ldquo;Preferred Partner&rdquo; means
            </h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
              Not all vendor relationships are equal. Here&rsquo;s why direct partnerships deliver
              meaningfully better outcomes for your business.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {whyItMatters.map((item) => (
              <div key={item.title} className="glass rounded-2xl p-8 border border-white/8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 text-lg font-bold"
                  style={{
                    background: `${item.color}12`,
                    border: `1px solid ${item.color}25`,
                    color: item.color,
                  }}
                >
                  ✓
                </div>
                <h3 className="font-semibold text-[var(--text)] text-lg mb-3">{item.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Featured Partner */}
      {featuredVendor && <FeaturedPartner vendor={featuredVendor} />}

      {/* Preferred Vendor Grid */}
      <SectionWrapper className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-4">
              Our preferred vendor network
            </h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
              Every vendor below is a direct partnership &mdash; not a catalog listing. Mark has
              vetted each one and can get you pricing and terms you won&rsquo;t find on your own.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gridVendors.map((vendor) => (
              <VendorCard key={vendor.name} vendor={vendor} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              variant="secondary"
              size="lg"
              href="mailto:mark@connectex.net?subject=Preferred Partner Inquiry"
            >
              Become a Preferred Partner →
            </Button>
          </div>
        </div>
      </SectionWrapper>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 bg-[#0a1520]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-4">
            Let Mark connect you with the right vendor
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            Get a free assessment of your current technology costs. Mark will match you with the right
            preferred partner and show you what better rates look like &mdash; no commitment required.
          </p>
          <Button variant="cta" size="lg" href="/contact">
            Get My Free Assessment
          </Button>
        </div>
      </section>
    </>
  )
}
