'use client'

import { useRef } from 'react'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { FileSearch, Target, Headphones } from '@/components/ui/Icons'
import type { LucideIcon } from '@/components/ui/Icons'
import {
  motion,
  useReducedMotion,
  MotionReveal,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion'
import { useInView } from 'framer-motion'

const steps: { number: string; color: string; title: string; description: string; detail: string; Icon: LucideIcon }[] = [
  {
    number: '01',
    color: '#00C9A7',
    title: 'Discover',
    description:
      'We run a free vulnerability and technology assessment on your business — showing you exactly where your gaps are, in plain language.',
    detail: 'Domain scan · Email security report · Tech stack audit',
    Icon: FileSearch,
  },
  {
    number: '02',
    color: '#60A5FA',
    title: 'Match',
    description:
      'We source the right solutions from 600+ vetted providers across IT, cybersecurity, cloud, and communications — with no upsell agenda.',
    detail: 'Vendor comparison · Pricing negotiation · Fit scoring',
    Icon: Target,
  },
  {
    number: '03',
    color: '#FF6B6B',
    title: 'Manage',
    description:
      'One relationship, one portal. We handle the vendors, the contracts, and the escalations — so you can focus on your business.',
    detail: 'Single point of contact · Ongoing advisory · Performance tracking',
    Icon: Headphones,
  },
]

export function HowItWorks() {
  const shouldReduce = useReducedMotion()
  const lineRef = useRef(null)
  const lineInView = useInView(lineRef, { once: true, amount: 0.3 })

  return (
    <SectionWrapper className="py-24 px-4 sm:px-6 bg-[#0a1520]">
      <div className="max-w-7xl mx-auto">
        <MotionReveal>
          <div className="text-center mb-14">
            <p className="text-[#00C9A7] text-sm font-semibold uppercase tracking-widest mb-3">How Connectex Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4">
              Simple process. Serious results.
            </h2>
            <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
              Most technology engagements fail because advice and delivery are mixed. We keep them separate.
            </p>
          </div>
        </MotionReveal>

        <div className="relative">
          {/* Connector line — desktop, animated with SVG pathLength */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px" ref={lineRef}>
            <svg width="100%" height="2" className="overflow-visible">
              <defs>
                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00C9A7" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <motion.line
                x1="0"
                y1="1"
                x2="100%"
                y2="1"
                stroke="url(#line-gradient)"
                strokeWidth="1"
                initial={shouldReduce ? {} : { pathLength: 0 }}
                animate={lineInView && !shouldReduce ? { pathLength: 1 } : shouldReduce ? {} : { pathLength: 0 }}
                transition={{ duration: 1.2, ease: [0.25, 0.4, 0.25, 1], delay: 0.3 }}
              />
            </svg>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8" stagger={0.2}>
            {steps.map((step, i) => (
              <StaggerItem key={i}>
                <div className="flex flex-col items-center text-center group">
                  {/* Step icon */}
                  <motion.div
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6 z-10"
                    style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}
                    whileHover={shouldReduce ? {} : {
                      boxShadow: `0 0 24px ${step.color}50`,
                      scale: 1.05,
                    }}
                    transition={{ duration: 0.25 }}
                  >
                    <step.Icon className="w-6 h-6" style={{ color: step.color }} strokeWidth={1.5} />
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ boxShadow: `0 0 20px ${step.color}30` }}
                    />
                    {/* Step number badge */}
                    <span
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: step.color }}
                    >
                      {step.number}
                    </span>
                  </motion.div>

                  <h3 className="text-xl font-bold text-[var(--text)] mb-3">{step.title}</h3>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">{step.description}</p>
                  <p className="text-xs font-medium" style={{ color: step.color }}>
                    {step.detail}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </SectionWrapper>
  )
}
