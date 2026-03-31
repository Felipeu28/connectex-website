'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Monitor, Shield, Cloud, Phone, Cpu, Globe, Server, Smartphone, type LucideIcon } from '@/components/ui/Icons'
import {
  motion,
  useReducedMotion,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion'

interface Segment {
  id: string
  label: string
  shortLabel: string
  href: string
  color: string
  description: string
  Icon: LucideIcon
}

const segments: Segment[] = [
  { id: 'managed-it', label: 'Managed IT', shortLabel: 'IT', href: '/solutions/managed-it', color: '#00D4AA', description: 'Full IT management & helpdesk', Icon: Monitor },
  { id: 'cybersecurity', label: 'Cybersecurity', shortLabel: 'Security', href: '/solutions/cybersecurity', color: '#FF6B6B', description: 'Threat detection & compliance', Icon: Shield },
  { id: 'cloud', label: 'Cloud & Collaboration', shortLabel: 'Cloud', href: '/solutions/cloud', color: '#60A5FA', description: 'Microsoft 365, Google Workspace & more', Icon: Cloud },
  { id: 'communications', label: 'Communications', shortLabel: 'UCaaS', href: '/solutions/communications', color: '#A78BFA', description: 'VoIP, UCaaS & business phone', Icon: Phone },
  { id: 'ai-automation', label: 'AI & Automation', shortLabel: 'AI', href: '/solutions/ai-automation', color: '#F59E0B', description: 'Workflow automation & AI tools', Icon: Cpu },
  { id: 'connectivity', label: 'Connectivity', shortLabel: 'Network', href: '/solutions', color: '#34D399', description: 'SD-WAN, fiber & business internet', Icon: Globe },
  { id: 'infrastructure', label: 'Infrastructure', shortLabel: 'Infra', href: '/solutions', color: '#FB923C', description: 'Servers, storage & hardware', Icon: Server },
  { id: 'devices', label: 'Devices & IoT', shortLabel: 'IoT', href: '/solutions', color: '#F472B6', description: 'Device management & IoT solutions', Icon: Smartphone },
]

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
}

export function TechWheel() {
  const [hovered, setHovered] = useState<string | null>(null)
  const shouldReduce = useReducedMotion()

  const cx = 200
  const cy = 200
  const outerR = 185
  const innerR = 68
  const n = segments.length
  const angleStep = 360 / n
  const gap = 2

  const activeSegment = hovered ? segments.find((s) => s.id === hovered) : null

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Wheel — desktop, with entrance animation */}
      <motion.div
        className="hidden md:block relative"
        style={{ width: 400, height: 400 }}
        initial={shouldReduce ? {} : { scale: 0.95, opacity: 0 }}
        whileInView={shouldReduce ? {} : { scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <svg width={400} height={400} viewBox="0 0 400 400" role="img" aria-label="ConnectEx technology solutions wheel">
          <defs>
            {segments.map((seg) => (
              <radialGradient key={seg.id} id={`grad-${seg.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={seg.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={seg.color} stopOpacity="0.08" />
              </radialGradient>
            ))}
            <radialGradient id="center-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1F4E78" />
              <stop offset="100%" stopColor="#0F1B2D" />
            </radialGradient>
          </defs>

          {segments.map((seg, i) => {
            const startAngle = i * angleStep + gap / 2
            const endAngle = (i + 1) * angleStep - gap / 2
            const isHovered = hovered === seg.id
            const labelAngle = i * angleStep + angleStep / 2
            const labelR = (outerR + innerR) / 2 + 4
            const labelPos = polarToCartesian(cx, cy, labelR, labelAngle)
            const iconR = labelR - 22
            const iconPos = polarToCartesian(cx, cy, iconR, labelAngle)

            return (
              <Link key={seg.id} href={seg.href} aria-label={seg.label}>
                <g
                  onMouseEnter={() => setHovered(seg.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={describeArc(cx, cy, outerR, startAngle, endAngle)}
                    fill={isHovered ? `url(#grad-${seg.id})` : 'rgba(255,255,255,0.03)'}
                    stroke={isHovered ? seg.color : 'rgba(255,255,255,0.08)'}
                    strokeWidth={isHovered ? 1.5 : 1}
                    style={{
                      transition: 'fill 0.2s, stroke 0.2s',
                      filter: isHovered ? `drop-shadow(0 0 8px ${seg.color}60)` : 'none',
                    }}
                  />
                  {/* Inner ring arc */}
                  <path
                    d={describeArc(cx, cy, innerR + 4, startAngle, endAngle)}
                    fill="none"
                    stroke={isHovered ? seg.color : 'transparent'}
                    strokeWidth={2}
                    style={{ transition: 'stroke 0.2s' }}
                  />
                  {/* Icon via foreignObject */}
                  <foreignObject
                    x={iconPos.x - 10}
                    y={iconPos.y - 10}
                    width={20}
                    height={20}
                    style={{ pointerEvents: 'none' }}
                  >
                    <seg.Icon
                      className="w-4 h-4"
                      style={{ color: isHovered ? seg.color : '#94A3B8' }}
                      strokeWidth={1.5}
                    />
                  </foreignObject>
                  {/* Label */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fontWeight={isHovered ? '600' : '400'}
                    fill={isHovered ? seg.color : '#94A3B8'}
                    style={{ transition: 'fill 0.2s, font-weight 0.2s', pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {seg.shortLabel}
                  </text>
                </g>
              </Link>
            )
          })}

          {/* Center circle */}
          <circle cx={cx} cy={cy} r={innerR - 2} fill="url(#center-grad)" stroke="rgba(0,212,170,0.2)" strokeWidth={1.5} />
          <circle cx={cx} cy={cy} r={innerR - 8} fill="none" stroke="rgba(0,212,170,0.08)" strokeWidth={1} />

          {/* Center content */}
          {activeSegment ? (
            <>
              <foreignObject x={cx - 12} y={cy - 20} width={24} height={24} style={{ pointerEvents: 'none' }}>
                <activeSegment.Icon className="w-5 h-5" style={{ color: activeSegment.color }} strokeWidth={1.5} />
              </foreignObject>
              <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fontWeight="600" fill={activeSegment.color} style={{ userSelect: 'none' }}>{activeSegment.label}</text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#00D4AA" style={{ userSelect: 'none' }}>Connect</text>
              <text x={cx} y={cy + 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF" style={{ userSelect: 'none' }}>Ex</text>
              <text x={cx} y={cy + 24} textAnchor="middle" fontSize="7.5" fill="#94A3B8" style={{ userSelect: 'none' }}>600+ Providers</text>
            </>
          )}
        </svg>

        {/* Tooltip */}
        {activeSegment && (
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 glass rounded-xl px-4 py-2 text-center pointer-events-none"
            style={{ minWidth: 180 }}
          >
            <p className="text-xs font-semibold" style={{ color: activeSegment.color }}>{activeSegment.label}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{activeSegment.description}</p>
          </div>
        )}
      </motion.div>

      {/* Mobile grid — with stagger animation */}
      <StaggerContainer className="md:hidden grid grid-cols-2 gap-3 w-full max-w-sm">
        {segments.map((seg) => (
          <StaggerItem key={seg.id}>
            <Link
              href={seg.href}
              className="glass rounded-2xl p-4 flex flex-col gap-2 hover:border-opacity-40 transition-all duration-150 group"
              style={{ borderColor: `${seg.color}20` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${seg.color}12`, border: `1px solid ${seg.color}25` }}
              >
                <seg.Icon className="w-5 h-5" style={{ color: seg.color }} strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold" style={{ color: seg.color }}>{seg.label}</span>
              <span className="text-xs text-[var(--text-muted)] leading-snug">{seg.description}</span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <p className="text-xs text-[var(--text-muted)] text-center max-w-xs">
        Hover any segment to explore · Click to see solutions
      </p>
    </div>
  )
}
