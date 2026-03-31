'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { clsx } from 'clsx'

interface SectionWrapperProps {
  children: React.ReactNode
  className?: string
  id?: string
  animate?: boolean
  as?: 'section' | 'div' | 'article'
}

export function SectionWrapper({
  children,
  className,
  id,
  animate = true,
  as: Tag = 'section',
}: SectionWrapperProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.08 })
  const shouldReduce = useReducedMotion()

  const MotionTag = Tag === 'article' ? motion.article : Tag === 'div' ? motion.div : motion.section

  if (!animate || shouldReduce) {
    return (
      <MotionTag ref={ref} id={id} className={className}>
        {children}
      </MotionTag>
    )
  }

  return (
    <MotionTag
      ref={ref}
      id={id}
      className={clsx(className)}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </MotionTag>
  )
}
