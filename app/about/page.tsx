import { Button } from '@/components/ui/Button'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { breadcrumbSchema } from '@/lib/schema'
import { generateMetadata as genMeta } from '@/lib/seo'
import { Target, Users, FileText } from '@/components/ui/Icons'
import type { LucideIcon } from '@/components/ui/Icons'

export const metadata = genMeta({
  title: 'About Mark — 20+ Year Technology Veteran in Austin TX',
  description:
    '20+ years in technology. Verizon partner. ConnectEx is Mark\'s answer to the question every Austin SMB asks: who helps me buy technology without a sales agenda?',
  path: '/about',
})

const certifications = [
  { name: 'Verizon Partner', color: '#FF6B6B' },
  { name: 'AppDirect Advisor', color: '#00C9A7' },
  { name: 'Microsoft Partner', color: '#60A5FA' },
  { name: '20+ Years Experience', color: '#A78BFA' },
]

const values: { Icon: LucideIcon; title: string; description: string; color: string }[] = [
  {
    Icon: Target,
    title: 'Vendor-neutral, always',
    description:
      'ConnectEx earns commissions from vendors — which means we only win when you adopt the right solution and stay happy. There\'s no incentive to oversell or lock you in.',
    color: '#00C9A7',
  },
  {
    Icon: Users,
    title: 'Local relationships, enterprise access',
    description:
      'Based in Austin with carrier-level partnerships across the country. You get someone who knows Central Texas business culture and has the market access of a national firm.',
    color: '#60A5FA',
  },
  {
    Icon: FileText,
    title: 'Plain language, not tech jargon',
    description:
      'Mark translates complex technology decisions into business terms. The goal is always the same: what\'s the right solution for your business, at the right price?',
    color: '#A78BFA',
  },
]

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: 'About', url: '/about' },
            ])
          ),
        }}
      />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 grid-bg">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#00C9A7] text-sm font-semibold uppercase tracking-widest mb-4">About ConnectEx</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)] leading-tight mb-5">
              The technology advisor Austin SMBs didn&rsquo;t know they needed
            </h1>
            <p className="text-[var(--text-muted)] text-lg leading-relaxed mb-8">
              Most technology companies sell their own labor. ConnectEx was built around a different question: what if someone with 20 years of industry experience shopped the entire market on your behalf, with no vendor bias?
            </p>
            <div className="flex flex-wrap gap-3">
              {certifications.map((cert) => (
                <span
                  key={cert.name}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: `${cert.color}12`, color: cert.color, border: `1px solid ${cert.color}25` }}
                >
                  {cert.name}
                </span>
              ))}
            </div>
          </div>

          {/* Photo placeholder */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-72 h-80 rounded-3xl glass border border-white/10 flex items-center justify-center overflow-hidden">
                {/* Placeholder professional headshot area */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#8B2BE2]/20 to-[#00C9A7]/10" />
                <div className="relative text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8B2BE2] to-[#00C9A7] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#00C9A7]/20">
                    <span className="text-white text-3xl font-bold">M</span>
                  </div>
                  <p className="text-[var(--text)] font-semibold text-lg">Mark</p>
                  <p className="text-[var(--text-muted)] text-sm">Founder, ConnectEx Solutions</p>
                  <p className="text-[var(--text-muted)] text-xs mt-1">Austin, Texas</p>
                  <p className="text-xs text-[var(--text-muted)] mt-4 px-6 italic">Photo coming soon</p>
                </div>
              </div>
              {/* Glow */}
              <div className="absolute -inset-4 bg-[#00C9A7]/5 rounded-[2rem] blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <SectionWrapper className="py-20 px-4 sm:px-6 bg-[#0a1520]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-8">The ConnectEx story</h2>
          <div className="space-y-5 text-[var(--text-muted)] leading-relaxed">
            <p>
              For over 20 years, Mark built his career in technology — most of it as a Verizon partner, building a business on carrier relationships, communication solutions, and the trust of Central Texas businesses that relied on him to keep them connected.
            </p>
            <p>
              The turning point came from a simple observation: his clients needed more than phone systems. They needed cybersecurity, cloud infrastructure, managed IT, AI tools — and every time they went looking, they got pitched by vendors with a product to sell.
            </p>
            <p>
              ConnectEx was built to solve that problem. By joining the AppDirect ecosystem, Mark gained access to 600+ technology providers across every category of business technology — without the conflict of interest that comes from selling any single vendor&rsquo;s product.
            </p>
            <p>
              The model is simple: you bring your technology challenge, Mark shops the entire market, and together you find the right solution. The right solution — not the one with the highest commission or the nicest sales rep.
            </p>
            <p>
              Central Texas small businesses have always needed this. Now they have it.
            </p>
          </div>
        </div>
      </SectionWrapper>

      {/* Values */}
      <SectionWrapper className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-10 text-center">How we work</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={i} className="glass rounded-2xl p-8 border border-white/8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${v.color}12`, border: `1px solid ${v.color}25` }}
                >
                  <v.Icon className="w-5 h-5" style={{ color: v.color }} strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-[var(--text)] text-lg mb-3">{v.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-[#0a1520]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-4">
            Ready to work with a vendor-neutral advisor?
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            We start with a free vulnerability scan of your domain. No commitment, no sales pitch — just data about where you stand.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="cta" size="lg" href="/contact">Get My Free Scan</Button>
            <Button variant="secondary" size="lg" href="/solutions">View Solutions</Button>
          </div>
        </div>
      </section>
    </>
  )
}
