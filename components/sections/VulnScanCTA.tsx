'use client'

import Link from 'next/link'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Check, ArrowRight, ShieldCheck } from '@/components/ui/Icons'
import {
  motion,
  useReducedMotion,
  MotionReveal,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion'

const findings = [
  'Email authentication failures (DMARC, DKIM, SPF)',
  'Domain and subdomain exposure',
  'Blacklist and reputation status',
  'Open vulnerabilities visible to attackers',
  'SSL/TLS certificate issues',
  'Data breach history linked to your domain',
]

export function VulnScanCTA() {
  const shouldReduce = useReducedMotion()

  return (
    <SectionWrapper className="py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="relative glass rounded-3xl overflow-hidden border border-white/8">
          {/* Background glow — animated scale pulse */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B]/5 via-transparent to-[#8B2BE2]/10 pointer-events-none" />
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B6B]/8 rounded-full blur-3xl pointer-events-none"
            animate={shouldReduce ? {} : { scale: [1, 1.05, 1] }}
            transition={shouldReduce ? {} : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative z-10 p-10 md:p-14">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <MotionReveal>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FF6B6B]/12 border border-[#FF6B6B]/25 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-[#FF6B6B]" strokeWidth={1.5} />
                    </div>
                    <p className="text-[#FF6B6B] text-sm font-semibold uppercase tracking-widest">Free Vulnerability Scan</p>
                  </div>
                </MotionReveal>
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] leading-tight mb-4">
                  What can a hacker see when they look at your business?
                </h2>
                <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
                  We run a comprehensive report on your company domain — showing you exactly what attackers see before they target you.
                  No obligation. Results within 24 hours.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-semibold px-7 py-4 rounded-xl transition-all duration-150 shadow-xl shadow-[#FF6B6B]/25 hover:shadow-[#FF6B6B]/40 hover:-translate-y-0.5 animate-pulse-glow"
                >
                  Get My Free Report
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="text-xs text-[var(--text-muted)] mt-3">No sales pressure. Just data.</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[var(--text)] mb-4">Your report will cover:</p>
                <StaggerContainer>
                  <ul className="space-y-3">
                    {findings.map((finding, i) => (
                      <StaggerItem key={i}>
                        <li className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
                          <Check className="w-4 h-4 text-[#00C9A7] shrink-0 mt-0.5" strokeWidth={2.5} />
                          {finding}
                        </li>
                      </StaggerItem>
                    ))}
                  </ul>
                </StaggerContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
