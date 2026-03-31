import type { Metadata } from 'next'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProblemSection } from '@/components/sections/ProblemSection'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { TechWheel } from '@/components/sections/TechWheel'
import { SolutionsBento } from '@/components/sections/SolutionsBento'
import { SocialProof } from '@/components/sections/SocialProof'
import { VulnScanCTA } from '@/components/sections/VulnScanCTA'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: "ConnectEx Solutions | Austin's Vendor-Neutral Technology Advisor",
  description:
    "Austin's vendor-neutral technology advisor for small business. We source IT, cybersecurity, cloud, and communications from 600+ providers — no vendor bias, no wasted budget.",
  openGraph: {
    title: "ConnectEx Solutions | Austin's Vendor-Neutral Technology Advisor",
    description:
      "We source IT, cybersecurity, cloud, and communications from 600+ providers so Austin SMBs don't have to.",
    url: 'https://connectex.net',
  },
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([{ name: 'Home', url: '/' }])
          ),
        }}
      />

      <HeroSection />
      <ProblemSection />
      <HowItWorks />

      {/* Tech Wheel Section */}
      <SectionWrapper className="py-24 px-4 sm:px-6 bg-[#0a1520]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#00D4AA] text-sm font-semibold uppercase tracking-widest mb-3">
              The Technology Wheel
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Every category of business technology, sourced for you
            </h2>
            <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
              One advisor. 600+ providers. Every solution category your business will ever need.
            </p>
          </div>
          <div className="flex justify-center">
            <TechWheel />
          </div>
        </div>
      </SectionWrapper>

      <SolutionsBento />
      <SocialProof />
      <VulnScanCTA />
    </>
  )
}
