import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { breadcrumbSchema } from '@/lib/schema'
import { generateMetadata as genMeta } from '@/lib/seo'
import {
  Cloud, Globe, Smartphone, Phone, Headphones,
  Shield, Server, Monitor, Target, Users, FileText,
  type LucideIcon,
} from '@/components/ui/Icons'

export const metadata = genMeta({
  title: 'About Mark Polanco — Technology Advisor & Founder of Connectex Solutions',
  description:
    'Mark Polanco is a technology adviser with AppDirect and founder of Connectex Solutions. 20+ years across telecom, sales leadership, and technical operations — helping businesses nationwide make smarter technology decisions.',
  path: '/about',
})

const certifications = [
  { name: 'Verizon Partner', color: '#FF6B6B' },
  { name: 'AppDirect Advisor', color: '#00C9A7' },
  { name: 'Microsoft Partner', color: '#60A5FA' },
  { name: '20+ Years Experience', color: '#A78BFA' },
]

const pillars: { Icon: LucideIcon; name: string; description: string; color: string }[] = [
  {
    Icon: Cloud,
    name: 'Cloud & SaaS Solutions',
    description: 'Productivity, collaboration, and industry\u2011specific applications',
    color: '#60A5FA',
  },
  {
    Icon: Globe,
    name: 'Connectivity Services',
    description: 'Fiber, broadband, wireless backup, and advanced networking',
    color: '#34D399',
  },
  {
    Icon: Smartphone,
    name: 'Mobility & Wireless',
    description: 'Business wireless plans, devices, and IoT connectivity',
    color: '#F472B6',
  },
  {
    Icon: Phone,
    name: 'Unified Communications (UCaaS)',
    description: 'Cloud phone systems, messaging, and collaboration tools',
    color: '#A78BFA',
  },
  {
    Icon: Headphones,
    name: 'Contact Center (CCaaS)',
    description: 'Customer experience platforms that elevate service and analytics',
    color: '#F59E0B',
  },
  {
    Icon: Shield,
    name: 'Security & Cyber Defense',
    description: 'Identity, endpoint, email, and threat protection',
    color: '#FF6B6B',
  },
  {
    Icon: Server,
    name: 'Infrastructure & Hosting (IaaS)',
    description: 'Cloud infrastructure, storage, backup, and DR solutions',
    color: '#FB923C',
  },
  {
    Icon: Monitor,
    name: 'Managed Services',
    description: 'Outsourced IT support, monitoring, and ongoing technology management',
    color: '#00C9A7',
  },
]

const values: { Icon: LucideIcon; title: string; description: string; color: string }[] = [
  {
    Icon: Target,
    title: 'Vendor-neutral, always',
    description:
      "Connectex earns commissions from vendors \u2014 which means we only win when you adopt the right solution and stay happy. There\u2019s no incentive to oversell or lock you in.",
    color: '#00C9A7',
  },
  {
    Icon: Users,
    title: 'One trusted partner, nationwide reach',
    description:
      'Based in Austin with carrier-level partnerships spanning the entire country. You get someone invested in your outcome who can access the same solutions as any national firm.',
    color: '#60A5FA',
  },
  {
    Icon: FileText,
    title: 'Plain language, not tech jargon',
    description:
      "Mark translates complex technology decisions into business terms. The goal is always the same: what\u2019s the right solution for your business, at the right price?",
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
            <p className="text-[#00C9A7] text-sm font-semibold uppercase tracking-widest mb-4">About Connectex</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)] leading-tight mb-5">
              Mark Polanco &amp; Connectex Solutions
            </h1>
            <p className="text-[var(--text-muted)] text-lg leading-relaxed mb-8">
              Technology adviser with AppDirect and founder of Connectex Solutions. Helping businesses across the country cut through complexity and make smarter decisions about cloud, connectivity, and digital transformation.
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

          {/* Photo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-72 h-80 rounded-3xl glass border border-white/10 overflow-hidden relative">
                {/* Add mark-polanco.jpg to /public/ to display the photo */}
                <Image
                  src="/mark-polanco.jpg"
                  alt="Mark Polanco — Founder, Connectex Solutions"
                  fill
                  className="object-cover object-top"
                />
              </div>
              {/* Glow */}
              <div className="absolute -inset-4 bg-[#00C9A7]/5 rounded-[2rem] blur-2xl -z-10" />
              <div className="mt-4 text-center">
                <p className="text-[var(--text)] font-semibold">Mark Polanco</p>
                <p className="text-[var(--text-muted)] text-sm">Founder, Connectex Solutions &middot; Austin, TX</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <SectionWrapper className="py-20 px-4 sm:px-6 bg-[#0a1520]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-8">About Mark</h2>
          <div className="space-y-5 text-[var(--text-muted)] leading-relaxed">
            <p>
              As a technology adviser with AppDirect and founder of Connectex Solutions, I help businesses cut through complexity and make smarter decisions about cloud services, connectivity, and digital transformation. With more than two decades of experience across telecom, sales leadership, and technical operations, I&rsquo;ve built a reputation for solving problems that others can&rsquo;t &mdash; the messy, cross-functional challenges that sit at the intersection of people, process, and technology.
            </p>
            <p>
              My approach is simple: understand the real issue, design a practical solution, and deliver world-class service from start to finish. Whether it&rsquo;s optimizing communication platforms, improving customer experience, or guiding companies through AppDirect&rsquo;s marketplace and subscription commerce ecosystem, I bring a hands-on, analytical approach that turns obstacles into opportunities.
            </p>
            <p>
              I live in Central Texas with my wife, our three amazing kids, and our enthusiastic labradoodle who is convinced she&rsquo;s the fourth child. When I&rsquo;m not helping businesses build smarter, more connected operations, you&rsquo;ll find me enjoying family time, exploring the Hill Country, or diving into new ways technology can make life and work better.
            </p>
          </div>
        </div>
      </SectionWrapper>

      {/* 8 Pillars */}
      <SectionWrapper className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-4">Eight technology categories. One trusted adviser.</h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
              Through AppDirect&rsquo;s ecosystem, Connectex Solutions gives businesses access to eight essential technology pillars &mdash; with a single point of contact who can advise, source, and coordinate across all of them.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {pillars.map((p) => (
              <div key={p.name} className="glass rounded-2xl p-6 border border-white/8">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${p.color}12`, border: `1px solid ${p.color}25` }}
                >
                  <p.Icon className="w-5 h-5" style={{ color: p.color }} strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-[var(--text)] text-sm mb-1.5">{p.name}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Values */}
      <SectionWrapper className="py-20 px-4 sm:px-6 bg-[#0a1520]">
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
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-4">
            Ready to work with a vendor-neutral advisor?
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            We start with a free vulnerability scan of your domain. No commitment, no sales pitch &mdash; just data about where you stand.
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
