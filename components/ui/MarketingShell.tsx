'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { ScrollToTop } from './ScrollToTop'

const BARE_ROUTES = ['/crm', '/ticketing']

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isBare = BARE_ROUTES.some((r) => pathname.startsWith(r))

  if (isBare) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
      <ScrollToTop />
    </>
  )
}
