'use client'

import {
  motion,
  useReducedMotion,
} from '@/components/motion'
import { Shield, Cloud, Monitor, Phone, Cpu, Globe } from '@/components/ui/Icons'

/* ── Sparkline SVG (fake mini chart) ── */
function Sparkline({ color, d }: { color: string; d: string }) {
  const shouldReduce = useReducedMotion()
  return (
    <svg viewBox="0 0 80 24" className="w-full h-6" fill="none">
      <motion.path
        d={d}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={shouldReduce ? {} : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: 'easeOut', delay: 0.8 }}
      />
      <path d={d} stroke={color} strokeWidth={0} fill="none" />
    </svg>
  )
}

/* ── Animated progress bar ── */
function ProgressBar({ value, color, delay }: { value: number; color: string; delay: number }) {
  const shouldReduce = useReducedMotion()
  return (
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={shouldReduce ? { width: `${value}%` } : { width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.2, ease: 'easeOut', delay }}
      />
    </div>
  )
}

/* ── Dashboard card shell ── */
function DashCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const shouldReduce = useReducedMotion()
  return (
    <motion.div
      className={`rounded-2xl border border-white/[0.08] backdrop-blur-xl bg-white/[0.03] shadow-2xl shadow-black/20 ${className}`}
      initial={shouldReduce ? {} : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

/* ── Stat row in deployment card ── */
function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-semibold" style={{ color }}>{value}</span>
    </div>
  )
}

/* ── Main export ── */
export function HeroDashboard() {
  const shouldReduce = useReducedMotion()

  const techStack = [
    { Icon: Shield, label: 'Security', color: '#FF6B6B', status: 'Active' },
    { Icon: Cloud, label: 'Cloud', color: '#60A5FA', status: 'Active' },
    { Icon: Monitor, label: 'IT Mgmt', color: '#00D4AA', status: 'Active' },
    { Icon: Phone, label: 'UCaaS', color: '#A78BFA', status: 'Onboarding' },
    { Icon: Cpu, label: 'AI/ML', color: '#F59E0B', status: 'Review' },
    { Icon: Globe, label: 'Network', color: '#34D399', status: 'Active' },
  ]

  return (
    <div className="relative w-full max-w-lg mx-auto" aria-hidden="true">
      {/* Background glow */}
      <div className="absolute -inset-8 bg-[#00D4AA]/[0.04] rounded-[3rem] blur-3xl pointer-events-none" />

      {/* ─── Main dashboard card ─── */}
      <DashCard className="p-5 relative z-10" delay={0.4}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00D4AA] animate-pulse" />
            <span className="text-xs font-semibold text-[var(--text)]">ConnectEx Dashboard</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] px-2 py-0.5 rounded-full bg-white/5">Live</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Vendors', value: '47', change: '+3', color: '#00D4AA' },
            { label: 'Savings', value: '$24K', change: '↑18%', color: '#60A5FA' },
            { label: 'Uptime', value: '99.8%', change: 'Stable', color: '#34D399' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <p className="text-[10px] text-[var(--text-muted)] mb-1">{stat.label}</p>
              <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px]" style={{ color: stat.color }}>{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Vendor Performance</span>
            <span className="text-[10px] text-[#00D4AA] font-medium">Last 30 days</span>
          </div>
          <Sparkline
            color="#00D4AA"
            d="M0 18 C8 18 12 12 20 14 C28 16 32 6 40 8 C48 10 52 4 60 3 C68 2 72 6 80 2"
          />
        </div>

        {/* Tech stack grid */}
        <div className="grid grid-cols-3 gap-2">
          {techStack.map(({ Icon, label, color, status }, i) => (
            <motion.div
              key={label}
              className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.06] px-2.5 py-2"
              initial={shouldReduce ? {} : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 1 + i * 0.08 }}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} strokeWidth={1.5} />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-[var(--text)] truncate">{label}</p>
                <p className="text-[8px]" style={{ color: status === 'Active' ? '#00D4AA' : status === 'Onboarding' ? '#F59E0B' : '#94A3B8' }}>
                  {status}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </DashCard>

      {/* ─── Floating side card: Threat Detection ─── */}
      <DashCard className="absolute right-0 -top-4 p-3 w-44 z-20" delay={0.7}>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-3.5 h-3.5 text-[#FF6B6B]" strokeWidth={1.5} />
          <span className="text-[10px] font-semibold text-[var(--text)]">Threat Detection</span>
        </div>
        <div className="space-y-2">
          <StatRow label="Blocked" value="2,847" color="#FF6B6B" />
          <StatRow label="Scanned" value="128K" color="#60A5FA" />
          <ProgressBar value={92} color="#FF6B6B" delay={1.2} />
          <p className="text-[8px] text-[var(--text-muted)]">Protection score: 92%</p>
        </div>
      </DashCard>

      {/* ─── Floating side card: Cost Optimization ─── */}
      <DashCard className="absolute left-0 -bottom-4 p-3 w-40 z-20" delay={0.9}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold text-[var(--text)]">Cost Savings</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-[#00D4AA]">$24K</span>
            <span className="text-[10px] text-[#00D4AA]">/yr</span>
          </div>
          <Sparkline
            color="#60A5FA"
            d="M0 20 C10 18 15 16 25 12 C35 8 40 10 50 6 C60 4 70 5 80 2"
          />
          <p className="text-[8px] text-[var(--text-muted)]">vs. previous vendor stack</p>
        </div>
      </DashCard>
    </div>
  )
}
