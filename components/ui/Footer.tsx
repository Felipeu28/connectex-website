import Link from 'next/link'
import { Phone, Mail, MapPin, ArrowRight } from '@/components/ui/Icons'

const solutions = [
  { href: '/solutions/managed-it', label: 'Managed IT' },
  { href: '/solutions/cybersecurity', label: 'Cybersecurity' },
  { href: '/solutions/cloud', label: 'Cloud & Collaboration' },
  { href: '/solutions/communications', label: 'Communications' },
  { href: '/solutions/ai-automation', label: 'AI & Automation' },
]

const company = [
  { href: '/about', label: 'About Mark' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/partners', label: 'Partners' },
  { href: '/resources', label: 'Resources' },
  { href: '/contact', label: 'Contact' },
]

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[#0a1520]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#1F4E78] flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-[var(--text)] text-lg tracking-tight">
                Connect<span className="text-[#00D4AA]">Ex</span>
              </span>
            </Link>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6">
              Austin&rsquo;s vendor-neutral technology advisor for small business. We shop 600+ providers so you don&rsquo;t have to.
            </p>
            <div className="space-y-2.5 text-sm text-[var(--text-muted)]">
              <a href="tel:+15129621199" className="flex items-center gap-2.5 hover:text-[#00D4AA] transition-colors">
                <Phone className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                (512) 962-1199
              </a>
              <a href="mailto:mark@connectex.net" className="flex items-center gap-2.5 hover:text-[#00D4AA] transition-colors">
                <Mail className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                mark@connectex.net
              </a>
              <p className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                Austin, TX — Serving Central Texas
              </p>
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wider mb-4">Solutions</h3>
            <ul className="space-y-2.5">
              {solutions.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[var(--text-muted)] hover:text-[#00D4AA] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5">
              {company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[var(--text-muted)] hover:text-[#00D4AA] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wider mb-4">Get Started</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Find out what a hacker can see when they look at your business — free, in under 24 hours.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-[#FF6B6B] hover:bg-[#ff5252] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-[#FF6B6B]/20"
            >
              Free Vulnerability Scan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} ConnectEx Solutions. All rights reserved. Austin, TX.
          </p>
          <div className="flex gap-4 text-xs text-[var(--text-muted)]">
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--text)] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
