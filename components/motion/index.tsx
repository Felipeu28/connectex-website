'use client'

import { useRef } from 'react'
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  useReducedMotion,
  animate,
  AnimatePresence,
  type Variants,
} from 'framer-motion'

export { motion, AnimatePresence, useReducedMotion }

// ─── Fade-up variants ─────────────────────────────────────────
const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

// ─── Stagger container ────────────────────────────────────────
interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  stagger?: number
  delay?: number
}

export function StaggerContainer({
  children,
  className,
  stagger = 0.1,
  delay = 0,
}: StaggerContainerProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.08 })
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: shouldReduce ? 0 : stagger,
            delayChildren: shouldReduce ? 0 : delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// ─── Stagger item ─────────────────────────────────────────────
interface StaggerItemProps {
  children: React.ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={shouldReduce ? {} : fadeUpVariants}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ─── Animated counter ─────────────────────────────────────────
interface AnimatedCounterProps {
  from?: number
  to: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  prefix = '',
  suffix = '',
  className,
}: AnimatedCounterProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const shouldReduce = useReducedMotion()
  const motionValue = useMotionValue(from)
  const rounded = useTransform(motionValue, (v) => Math.round(v))
  const displayRef = useRef<HTMLSpanElement>(null)

  // Animate when in view
  if (isInView && motionValue.get() === from) {
    if (shouldReduce) {
      motionValue.set(to)
    } else {
      animate(motionValue, to, {
        duration,
        ease: [0.25, 0.4, 0.25, 1],
      })
    }
  }

  // Subscribe to rounded value changes
  rounded.on('change', (v) => {
    if (displayRef.current) {
      displayRef.current.textContent = `${prefix}${v.toLocaleString()}${suffix}`
    }
  })

  return (
    <span ref={ref} className={className}>
      <span ref={displayRef}>
        {prefix}{from}{suffix}
      </span>
    </span>
  )
}

// ─── Kinetic text (word-by-word reveal) ───────────────────────
interface KineticTextProps {
  text: string
  className?: string
  stagger?: number
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  children?: React.ReactNode
}

export function KineticText({
  text,
  className,
  stagger = 0.04,
  as: Tag = 'h1',
}: KineticTextProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const shouldReduce = useReducedMotion()

  if (shouldReduce) {
    return <Tag className={className}>{text}</Tag>
  }

  // Split by lines first (look for <br/> markers), then by words
  const lines = text.split('\n')

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx}>
          {lineIdx > 0 && <br />}
          {line.split(' ').map((word, wordIdx) => {
            // Calculate total word index for stagger
            const prevWords = lines.slice(0, lineIdx).reduce((sum, l) => sum + l.split(' ').length, 0)
            const globalIdx = prevWords + wordIdx

            return (
              <motion.span
                key={`${lineIdx}-${wordIdx}`}
                className="inline-block"
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.4,
                  delay: globalIdx * stagger,
                  ease: [0.25, 0.4, 0.25, 1],
                }}
              >
                {word}{wordIdx < line.split(' ').length - 1 ? '\u00A0' : ''}
              </motion.span>
            )
          })}
        </span>
      ))}
    </Tag>
  )
}

// ─── Hover card ───────────────────────────────────────────────
interface HoverCardProps {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'article'
}

export function HoverCard({ children, className, as = 'div' }: HoverCardProps) {
  const shouldReduce = useReducedMotion()
  const Component = as === 'article' ? motion.article : motion.div

  return (
    <Component
      className={className}
      whileHover={shouldReduce ? {} : {
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
    >
      {children}
    </Component>
  )
}

// ─── Motion div with whileInView ──────────────────────────────
interface MotionRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function MotionReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
}: MotionRevealProps) {
  const shouldReduce = useReducedMotion()

  const directionMap = {
    up: { y: 24, x: 0 },
    down: { y: -24, x: 0 },
    left: { x: 24, y: 0 },
    right: { x: -24, y: 0 },
  }

  const offset = directionMap[direction]

  return (
    <motion.div
      className={className}
      initial={shouldReduce ? {} : { opacity: 0, ...offset }}
      whileInView={shouldReduce ? {} : { opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.6,
        delay: shouldReduce ? 0 : delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
