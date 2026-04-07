'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { motion, AnimatePresence, useScroll, useReducedMotion } from 'framer-motion'
import { ThemeToggle } from './ThemeToggle'
import { Button } from './Button'

const navLinks = [
  { href: '/solutions', label: 'Solutions' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/resources', label: 'Resources' },
  { href: '/about', label: 'About' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { scrollYProgress } = useScroll()
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    requestAnimationFrame(() => setMobileOpen(false))
  }, [pathname])

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass-strong shadow-xl shadow-black/10'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Connectex home">
          <Image
            src="/logos/logo-symbol.png"
            alt=""
            width={44}
            height={44}
            className="h-9 w-auto"
            priority
          />
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-white [.light_&]:text-gray-900">
              CONNECTEX
            </span>
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#00C9A7]">
              SOLUTIONS
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                pathname.startsWith(link.href)
                  ? 'text-[#00C9A7] bg-[#00C9A7]/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button variant="cta" size="sm" href="/contact">
            Free Vulnerability Scan
          </Button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Scroll progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00C9A7] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={shouldReduce ? {} : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={shouldReduce ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
            className="md:hidden glass-strong border-t border-white/8 px-4 py-4 space-y-1 overflow-hidden"
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={shouldReduce ? {} : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: shouldReduce ? 0 : i * 0.05 + 0.1 }}
              >
                <Link
                  href={link.href}
                  className={clsx(
                    'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    pathname.startsWith(link.href)
                      ? 'text-[#00C9A7] bg-[#00C9A7]/10'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              className="pt-2"
              initial={shouldReduce ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: shouldReduce ? 0 : 0.3 }}
            >
              <Button variant="cta" size="md" href="/contact" className="w-full justify-center">
                Free Vulnerability Scan
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
