'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown } from '@/components/ui/Icons'

interface AccordionItemProps {
  question: string
  answer: string
  defaultOpen?: boolean
}

export function AccordionItem({ question, answer, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const shouldReduce = useReducedMotion()

  return (
    <div className="glass rounded-2xl border border-white/8 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-7 py-5 text-left text-sm font-semibold text-[var(--text)] flex items-center justify-between cursor-pointer"
        aria-expanded={isOpen}
      >
        {question}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: shouldReduce ? 0 : 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-[var(--text-muted)] shrink-0 ml-3" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={shouldReduce ? {} : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={shouldReduce ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-7 pb-5 text-sm text-[var(--text-muted)] leading-relaxed border-t border-white/8 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
