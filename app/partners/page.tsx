import { ReferralForm } from '@/components/forms/ReferralForm'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { breadcrumbSchema } from '@/lib/schema'
import { generateMetadata as genMeta } from '@/lib/seo'

export const metadata = genMeta({
  title: 'Partners & Referrals — ConnectEx Solutions',
  description:
    'Refer a business to ConnectEx or become a preferred local technology partner in Austin TX. Direct referrals, direct payment — no middleman.',
  path: '/partners',
})

const preferredPartners: { name: string; category: string; color: string }[] = [
  // To be filled when Mark confirms preferred vendors
]

export default function PartnersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: 'Partners', url: '/partners' },
            ])
          ),
        }}
      />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 grid-bg">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#00D4AA] text-sm font-semibold uppercase tracking-widest mb-4">Partners & Referrals</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
            Know a business that needs technology help?
          </h1>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
            Submit a direct referral and Mark will take it from there. No platform fees, no middleman — if we close the deal, you get paid directly.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* For businesses */}
          <SectionWrapper className="pt-16">
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-white mb-3">For businesses</h2>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Looking for a reliable local technology vendor? Submit your information and Mark will connect you directly with the right solution — no AppDirect required.
              </p>
            </div>

            <div className="space-y-4 mb-10">
              {[
                ['Direct connection', 'Mark personally follows up on every referral within 24 hours'],
                ['No sales pressure', 'A conversation, not a pitch. We figure out what you actually need first'],
                ['Local knowledge', '20+ years in Central Texas business — we know the market'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-[#00D4AA]/15 border border-[#00D4AA]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-[#00D4AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* For vendors */}
            <div className="glass rounded-2xl p-7 border border-white/8">
              <h3 className="font-bold text-white mb-3">Are you a local technology vendor?</h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                ConnectEx is building a network of preferred local partners. If you provide technology services to Austin area businesses, we&rsquo;d like to talk.
              </p>
              <a
                href="mailto:mark@connectex.net?subject=Partner inquiry"
                className="text-sm font-medium text-[#00D4AA] hover:text-white transition-colors"
              >
                Email mark@connectex.net →
              </a>
            </div>

            {/* Preferred partners list */}
            {preferredPartners.length > 0 && (
              <div className="mt-10">
                <h3 className="font-bold text-white mb-5">Preferred local partners</h3>
                <div className="grid grid-cols-2 gap-3">
                  {preferredPartners.map((p) => (
                    <div key={p.name} className="glass rounded-xl p-4 border border-white/8">
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                      <p className="text-xs mt-1" style={{ color: p.color }}>{p.category}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionWrapper>

          {/* Referral form */}
          <SectionWrapper className="pt-16">
            <div className="glass rounded-3xl p-8 sm:p-10 border border-white/8 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-2">Submit a referral</h2>
              <p className="text-sm text-[var(--text-muted)] mb-7">
                Fill out the form and Mark will follow up directly with your contact.
              </p>
              <ReferralForm />
            </div>
          </SectionWrapper>
        </div>
      </div>
    </>
  )
}
