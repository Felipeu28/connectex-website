'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { Headphones, LayoutDashboard, Plus, LogOut, ChevronDown } from 'lucide-react'

interface PortalShellProps {
  children: React.ReactNode
  userEmail: string
}

export function PortalShell({ children, userEmail }: PortalShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/portal/login')
  }

  return (
    <div className="min-h-screen bg-[#0F1B2D]">
      {/* Top nav */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(15, 27, 45, 0.90)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/portal/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B2BE2] to-[#00C9A7] flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight hidden sm:block">
              Connectex Support
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <Link
              href="/portal/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                pathname === '/portal/dashboard'
                  ? 'bg-[#8B2BE2]/20 text-white'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <Link
              href="/portal/tickets/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Ticket
            </Link>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#94A3B8] hidden sm:block max-w-[180px] truncate">
              {userEmail}
            </span>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-all disabled:opacity-50"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t mt-16" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#4B5563]">
            © {new Date().getFullYear()} Connectex Solutions · Austin, TX
          </p>
          <div className="flex items-center gap-4 text-xs text-[#4B5563]">
            <a href="tel:+15125551234" className="hover:text-[#94A3B8] transition-colors">
              Call Support
            </a>
            <a href="mailto:support@connectex.net" className="hover:text-[#94A3B8] transition-colors">
              support@connectex.net
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
