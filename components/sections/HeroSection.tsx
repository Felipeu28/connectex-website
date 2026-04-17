'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowRight } from '@/components/ui/Icons'
import { HeroDashboard } from './HeroDashboard'
import {
  MotionReveal,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion'

const trustItems = [
  'Verizon Partner',
  '600+ Vendors',
  '20 Yrs Experience',
  'Austin, TX',
]


export function HeroSection() {
  const [domain, setDomain] = useState('')

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[var(--bg)]" />
      <div className="absolute inset-0 grid-bg opacity-60" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-[#00C9A7]/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] bg-[#8B2BE2]/12 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6B6B]/3 rounded-full blur-[140px] pointer-events-none" />


      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-20 w-full">
        <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-8 xl:gap-12 items-start">
        <div>
          {/* Eyebrow */}
          <MotionReveal direction="left" delay={0}>
            <div className="flex items-center gap-3 mb-8">
              <Badge variant="accent" size="md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7] mr-2 animate-pulse" />
                Nationwide Technology Advisor
              </Badge>
            </div>
          </MotionReveal>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.08] tracking-tight mb-7">
            <MotionReveal delay={0.1}>
              <span className="gradient-text">Vendor-Neutral</span>
            </MotionReveal>
            <br />
            <MotionReveal delay={0.15}>
              <span className="text-[var(--text)]">Technology Advisor</span>
            </MotionReveal>
            <br />
            <MotionReveal delay={0.2}>
              <span className="text-[var(--text-muted)] font-medium">for Small Business, Nationwide</span>
            </MotionReveal>
          </h1>

          {/* Subheadline */}
          <MotionReveal delay={0.3}>
            <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed max-w-xl mb-10">
              We source IT, cybersecurity, cloud, and communications from{' '}
              <span className="text-[var(--text)] font-medium">600+ vetted providers</span> &mdash; then manage the relationship for you.
              No vendor bias. No wasted budget.
            </p>
          </MotionReveal>

          {/* Domain scan input */}
          <MotionReveal delay={0.4}>
            <div className="glass rounded-2xl p-1.5 flex gap-2 max-w-lg mb-3">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourbusiness.com"
                aria-label="Enter your company domain"
                className="flex-1 bg-transparent px-5 py-3.5 text-[var(--text)] placeholder-[var(--text-muted)] text-sm focus:outline-none"
              />
              <Button
                variant="cta"
                size="md"
                href={`/contact?domain=${encodeURIComponent(domain)}`}
                className="whitespace-nowrap"
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Free Scan
              </Button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-12 pl-1">
              See what hackers see when they look at your business &mdash; free, within 24 hours.
            </p>
          </MotionReveal>

          {/* Secondary CTAs */}
          <MotionReveal delay={0.5}>
            <div className="flex flex-wrap gap-3 mb-16">
              <Button variant="secondary" size="lg" href="/marketplace">
                Explore the Marketplace
              </Button>
              <Button variant="ghost" size="lg" href="/about">
                Meet the Advisor
              </Button>
            </div>
          </MotionReveal>
        </div>

        {/* Dashboard visualization */}
        <div className="hidden lg:block pt-8">
          <HeroDashboard />
        </div>
        </div>

        {/* Trust bar */}
        <div className="pt-10 border-t border-[var(--border)]">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6 font-medium">
            Trusted by businesses nationwide
          </p>
          <StaggerContainer className="flex flex-wrap gap-x-10 gap-y-4 items-center">
            {trustItems.map((item) => (
              <StaggerItem key={item}>
                <div className="flex items-center gap-2.5 text-sm text-[var(--text-muted)] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7]" />
                  {item}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none" />
    </section>
  )
}
