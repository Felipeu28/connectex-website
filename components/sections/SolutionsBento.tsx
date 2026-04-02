'use client'

import Link from 'next/link'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Monitor, Shield, Cloud, Phone, Cpu, Globe, ArrowRight, type LucideIcon } from '@/components/ui/Icons'
import {
  motion,
  useReducedMotion,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion'

interface Card {
  href: string
  title: string
  description: string
  color: string
  size: string
  stat: string
  Icon: LucideIcon
}

const cards: Card[] = [
  {
    href: '/solutions/managed-it',
    title: 'Managed IT',
    description: 'Your outsourced IT department. Proactive monitoring, helpdesk, and strategic planning — without the overhead.',
    color: '#00C9A7',
    size: 'large',
    stat: '24/7 monitoring',
    Icon: Monitor,
  },
  {
    href: '/solutions/cybersecurity',
    title: 'Cybersecurity',
    description: 'From email security to endpoint protection. We start with a free vulnerability scan of your domain.',
    color: '#FF6B6B',
    size: 'medium',
    stat: 'Free scan included',
    Icon: Shield,
  },
  {
    href: '/solutions/cloud',
    title: 'Cloud & Collaboration',
    description: 'Microsoft 365, Google Workspace, cloud migration, and secure remote access.',
    color: '#60A5FA',
    size: 'medium',
    stat: 'M365 & Google WS',
    Icon: Cloud,
  },
  {
    href: '/solutions/communications',
    title: 'UCaaS & Business Phone',
    description: 'Replace your legacy phone system with unified communications. Cut costs by up to 60%.',
    color: '#A78BFA',
    size: 'medium',
    stat: 'Up to 60% savings',
    Icon: Phone,
  },
  {
    href: '/solutions/ai-automation',
    title: 'AI & Automation',
    description: 'Workflow automation and AI tools that give your team enterprise-grade productivity.',
    color: '#F59E0B',
    size: 'small',
    stat: '4x productivity',
    Icon: Cpu,
  },
  {
    href: '/solutions',
    title: 'Connectivity & More',
    description: 'SD-WAN, fiber, hardware, IoT — every category of business technology, sourced and managed.',
    color: '#34D399',
    size: 'small',
    stat: '600+ providers',
    Icon: Globe,
  },
]

export function SolutionsBento() {
  const shouldReduce = useReducedMotion()

  return (
    <SectionWrapper className="py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[#00C9A7] text-sm font-semibold uppercase tracking-widest mb-3">Solutions</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)]">
              Every technology your business needs
            </h2>
          </div>
          <Link
            href="/solutions"
            className="text-sm font-medium text-[#00C9A7] hover:text-[var(--text)] transition-colors flex items-center gap-1 shrink-0"
          >
            View all solutions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Bento grid */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {cards.map((card) => (
            <StaggerItem
              key={card.href + card.title}
              className={card.size === 'large' ? 'sm:col-span-2 lg:col-span-1 lg:row-span-2' : ''}
            >
              <Link
                href={card.href}
                className={`
                  glass rounded-2xl p-7 border border-white/8 group
                  hover:border-opacity-60 transition-all duration-200
                  hover:shadow-lg hover:-translate-y-0.5
                  flex flex-col h-full
                `}
              >
                <div className="flex items-start justify-between mb-auto">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: `${card.color}12`, border: `1px solid ${card.color}25` }}
                  >
                    <card.Icon className="w-5 h-5" style={{ color: card.color }} strokeWidth={1.5} />
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: `${card.color}12`, color: card.color, border: `1px solid ${card.color}25` }}
                  >
                    {card.stat}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--text)] mb-2 group-hover:text-[var(--text)] transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4 flex-1">
                  {card.description}
                </p>
                <span
                  className="text-sm font-medium flex items-center gap-1.5 transition-colors"
                  style={{ color: card.color }}
                >
                  Learn more
                  <motion.span
                    className="inline-flex"
                    whileHover={shouldReduce ? {} : { x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-150" />
                  </motion.span>
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </SectionWrapper>
  )
}
