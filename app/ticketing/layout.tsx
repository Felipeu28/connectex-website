import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'IT Support Portal',
  description:
    'Submit and track IT support tickets with ConnectEx Solutions. No login required.',
  robots: { index: false, follow: false },
}

export default function TicketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/*
        Hide the root layout Navbar and Footer on ticketing routes.
        The root layout wraps all pages with <Navbar /> and <Footer />,
        but the ticketing portal needs its own minimal chrome.
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body > header { display: none !important; }
            body > footer { display: none !important; }
          `,
        }}
      />
      <div className="min-h-screen flex flex-col">
        {/* Minimal header */}
        <header className="border-b border-white/10 bg-[var(--color-navy)]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link
              href="/ticketing"
              className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-light)] hover:text-[var(--color-accent)] transition-colors"
            >
              <Image
                src="/logos/logo-symbol.png"
                alt="ConnectEx"
                width={36}
                height={36}
                className="w-8 h-8"
              />
              <span className="font-bold tracking-tight">CONNECTEX</span>
              <span className="text-[var(--color-accent)] font-semibold">Support</span>
            </Link>
            <Link
              href="/"
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-light)] transition-colors"
            >
              Back to site
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
          {children}
        </main>

        {/* Minimal footer */}
        <footer className="border-t border-white/10 py-4">
          <p className="text-center text-xs text-[var(--color-text-muted)]">
            &copy; {new Date().getFullYear()} ConnectEx Solutions. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  )
}
