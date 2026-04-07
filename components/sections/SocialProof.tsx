'use client'

import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Star } from '@/components/ui/Icons'
import {
  motion,
  useReducedMotion,
  AnimatedCounter,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion'

const testimonials = [
  {
    quote:
      "Before Connectex, we were managing five different vendors for IT, phones, and security. Now I make one call. Mark found us solutions we didn't even know existed and saved us over $800 a month.",
    name: 'Business Owner',
    title: 'Owner',
    company: 'Austin Professional Services',
    initials: 'AP',
    color: '#00C9A7',
  },
  {
    quote:
      "Mark ran a free scan on our domain and found three critical vulnerabilities our IT company had never mentioned. He connected us with a cybersecurity vendor that fixed everything in two weeks. Game changer.",
    name: 'CEO',
    title: 'CEO',
    company: 'Austin Healthcare Practice',
    initials: 'AH',
    color: '#60A5FA',
  },
  {
    quote:
      "We were overpaying for Microsoft 365 licenses and didn't even know it. Connectex audited our setup, rightsized our plan, and saved us $400 a month. That's real money for a small business.",
    name: 'Operations Manager',
    title: 'Operations Manager',
    company: 'Austin SMB',
    initials: 'AM',
    color: '#A78BFA',
  },
]

const stats = [
  { from: 0, to: 600, suffix: '+', label: 'Vetted technology providers' },
  { from: 0, to: 20, suffix: '+', label: 'Years of industry expertise' },
  { from: 0, to: 1, suffix: '', label: 'Relationship manages it all' },
  { prefix: '$', from: 0, to: 0, suffix: '', label: 'Cost to get your free scan', static: '$0' },
]

export function SocialProof() {
  const shouldReduce = useReducedMotion()

  return (
    <SectionWrapper className="py-24 px-4 sm:px-6 bg-[#0a1520]">
      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, i) => (
            <StaggerItem key={i}>
              <div className="text-center">
                {stat.static ? (
                  <p className="text-4xl sm:text-5xl font-bold gradient-text mb-2">{stat.static}</p>
                ) : (
                  <AnimatedCounter
                    from={stat.from}
                    to={stat.to}
                    prefix={stat.prefix || ''}
                    suffix={stat.suffix}
                    className="text-4xl sm:text-5xl font-bold gradient-text mb-2 block"
                  />
                )}
                <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <p className="text-[#00C9A7] text-sm font-semibold uppercase tracking-widest mb-3">Client Results</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)]">
            What Austin businesses say
          </h2>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" stagger={0.15}>
          {testimonials.map((t, i) => (
            <StaggerItem key={i}>
              <motion.div
                className="glass rounded-2xl p-7 border border-white/8 flex flex-col h-full"
                whileHover={shouldReduce ? {} : { y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                  ))}
                </div>

                <blockquote className="text-[var(--text-muted)] text-sm leading-relaxed italic flex-1 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `${t.color}25`, border: `1px solid ${t.color}40` }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">{t.title}, {t.company}</p>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>


      </div>
    </SectionWrapper>
  )
}
