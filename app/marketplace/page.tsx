import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { breadcrumbSchema } from '@/lib/schema'
import { generateMetadata as genMeta } from '@/lib/seo'
import {
  Monitor, Shield, Cloud, Phone, Cpu, Globe, Server, Smartphone,
  FileText, Lock, Zap, DollarSign, Rocket, type LucideIcon,
} from '@/components/ui/Icons'

export const metadata = genMeta({
  title: 'Technology Marketplace — 600+ Vetted Solutions',
  description:
    'Browse Connectex\'s technology marketplace — 600+ providers across IT, cybersecurity, cloud, and communications for SMBs nationwide. One MDA, every category.',
  path: '/marketplace',
})

const categories: { name: string; Icon: LucideIcon; color: string; href: string; count: string }[] = [
  { name: 'Managed IT', Icon: Monitor, color: '#00C9A7', href: '/solutions/managed-it', count: '120+' },
  { name: 'Cybersecurity', Icon: Shield, color: '#FF6B6B', href: '/solutions/cybersecurity', count: '90+' },
  { name: 'Cloud & SaaS', Icon: Cloud, color: '#60A5FA', href: '/solutions/cloud', count: '150+' },
  { name: 'Communications', Icon: Phone, color: '#A78BFA', href: '/solutions/communications', count: '80+' },
  { name: 'AI & Automation', Icon: Cpu, color: '#F59E0B', href: '/solutions/ai-automation', count: '60+' },
  { name: 'Connectivity', Icon: Globe, color: '#34D399', href: '/solutions', count: '70+' },
  { name: 'Infrastructure', Icon: Server, color: '#FB923C', href: '/solutions', count: '50+' },
  { name: 'Devices & IoT', Icon: Smartphone, color: '#F472B6', href: '/solutions', count: '40+' },
]

const benefits: { Icon: LucideIcon; title: string; description: string; color: string }[] = [
  {
    Icon: FileText,
    title: 'One MDA covers everything',
    description: 'Sign one Master Services Agreement and access every vendor in the catalog. No separate contracts for each provider.',
    color: '#00C9A7',
  },
  {
    Icon: Lock,
    title: 'Vetted providers only',
    description: 'Every vendor in the marketplace has been validated for compatibility, support quality, and best-in-class performance.',
    color: '#60A5FA',
  },
  {
    Icon: Zap,
    title: 'Automated provisioning',
    description: 'Order services and licenses directly. Provisioning and setup are handled through the AppDirect platform.',
    color: '#F59E0B',
  },
  {
    Icon: DollarSign,
    title: 'Competitive pricing',
    description: 'Carrier-level purchasing power means you get pricing that individual businesses can\'t access by going direct.',
    color: '#A78BFA',
  },
]

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
      <section className="pt-32 pb-20 px-4 sm:px-6 grid-bg">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#00C9A7] text-sm font-semibold uppercase tracking-widest mb-4">Technology Marketplace</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)] leading-tight mb-5">
            600+ technology solutions.<br />One advisor. One agreement.
          </h1>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto mb-8">
            Browse the Connectex marketplace — powered by AppDirect — covering every category of business technology. Find the right solution, and we&rsquo;ll manage the relationship from day one.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="cta" size="lg" href="/contact">
              Talk to Mark First
            </Button>
            <Button variant="secondary" size="lg" href="#catalog">
              Browse Categories
            </Button>
          </div>
        </div>
      </section>

      {/* Category grid */}
      <SectionWrapper id="catalog" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Browse by category</h2>
              <p className="text-[var(--text-muted)] mt-2">92+ pages of vetted vendors across every technology category</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="glass rounded-2xl p-6 border border-white/8 hover:border-opacity-40 transition-all duration-200 hover:-translate-y-0.5 group text-center"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}25` }}
                >
                  <cat.Icon className="w-5 h-5" style={{ color: cat.color }} strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-[var(--text)] text-sm mb-1">{cat.name}</h3>
                <span
                  className="text-xs font-medium"
                  style={{ color: cat.color }}
                >
                  {cat.count} providers
                </span>
              </Link>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* AppDirect embed placeholder */}
      <SectionWrapper className="py-16 px-4 sm:px-6 bg-[#0a1520]">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-12 border border-[#00C9A7]/20 text-center">
            <div
              className="w-16 h-16 rounded-2xl bg-[#00C9A7]/15 border border-[#00C9A7]/30 flex items-center justify-center mx-auto mb-6"
            >
              <Rocket className="w-7 h-7 text-[#00C9A7]" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-3">Full marketplace coming soon</h2>
            <p className="text-[var(--text-muted)] max-w-xl mx-auto mb-8">
              The Connectex marketplace catalog — powered by AppDirect — is being finalized. In the meantime, talk to Mark directly to access any of the 600+ providers.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="cta" size="lg" href="/contact">Request Access</Button>
              <Button variant="secondary" size="lg" href="/solutions">View Solution Categories</Button>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Benefits */}
      <SectionWrapper className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-10 text-center">
            Why the Connectex marketplace?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="glass rounded-2xl p-7 border border-white/8 text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${b.color}12`, border: `1px solid ${b.color}25` }}
                >
                  <b.Icon className="w-5 h-5" style={{ color: b.color }} strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-[var(--text)] mb-2">{b.title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}
