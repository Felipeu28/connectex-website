'use client'

import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Layers, AlertTriangle, DollarSign } from '@/components/ui/Icons'
import type { LucideIcon } from '@/components/ui/Icons'
import {
  motion,
  useReducedMotion,
  MotionReveal,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion'

const problems: { Icon: LucideIcon; heading: string; body: string; color: string }[] = [
  {
    Icon: Layers,
    heading: 'Too many vendors, too many bills',
    body: 'The average SMB manages 5-8 separate technology vendors with different contracts, renewal dates, and support numbers. When something breaks, nobody owns the problem.',
    color: '#FF6B6B',
  },
  {
    Icon: AlertTriangle,
    heading: 'Your IT person doesn\'t know cybersecurity',
    body: 'General IT support and cybersecurity are different disciplines. 46% of all breaches hit companies under 1,000 employees — and most had IT support already.',
    color: '#F59E0B',
  },
  {
    Icon: DollarSign,
    heading: 'Wasted budget on the wrong solutions',
    body: 'Vendors sell you what they have, not what you need. Without a vendor-neutral advisor, most SMBs overpay 20-30% and still end up with gaps in their tech stack.',
    color: '#A78BFA',
  },
]

export function ProblemSection() {
  const shouldReduce = useReducedMotion()

  return (
    <SectionWrapper className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <MotionReveal>
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4">
            The problem with how most businesses buy technology
          </h2>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
            Every vendor has an agenda. Without someone in your corner, you end up with a patchwork stack that costs more than it should.
          </p>
        </div>
      </MotionReveal>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {problems.map((problem, i) => (
          <StaggerItem key={i}>
            <div
              className="glass rounded-2xl p-7 border border-white/8 group hover:border-[#00D4AA]/20 transition-all duration-200"
            >
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${problem.color}10`, border: `1px solid ${problem.color}20` }}
                whileHover={shouldReduce ? {} : { rotate: 3, scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <problem.Icon className="w-5 h-5" style={{ color: problem.color }} strokeWidth={1.5} />
              </motion.div>
              <h3 className="font-semibold text-[var(--text)] text-lg mb-3">{problem.heading}</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">{problem.body}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </SectionWrapper>
  )
}
