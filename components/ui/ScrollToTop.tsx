'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown } from '@/components/ui/Icons'

export function ScrollToTop() {
  const [show, setShow] = useState(false)
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: shouldReduce ? 'auto' : 'smooth' })
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-[#00D4AA]/20 border border-[#00D4AA]/30 backdrop-blur-sm flex items-center justify-center text-[#00D4AA] hover:bg-[#00D4AA]/30 transition-colors"
        >
          <ChevronDown className="w-4 h-4 rotate-180" strokeWidth={2} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
