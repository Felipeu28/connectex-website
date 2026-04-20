'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Users,
  Kanban,
  Ticket,
  Mail,
  Calendar,
  LogOut,
  Menu,
  ChevronRight,
  Workflow,
  FileText,
  BookOpen,
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

const navItems = [
  { href: '/crm/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm/contacts', label: 'Contacts', icon: Users },
  { href: '/crm/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/crm/tickets', label: 'Tickets', icon: Ticket },
  { href: '/crm/campaigns', label: 'Campaigns', icon: Mail },
  { href: '/crm/sequences', label: 'Sequences', icon: Workflow },
  { href: '/crm/calendar', label: 'Calendar', icon: Calendar },
  { href: '/crm/blog', label: 'Blog', icon: FileText },
  { href: '/crm/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
]

export function CRMShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    window.location.href = '/crm/login'
  }

  const sidebar = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <Link href="/crm/dashboard" className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
        <Image
          src="/logos/logo-symbol.png"
          alt="Connectex"
          width={36}
          height={36}
          className="w-9 h-9"
        />
        <div className="flex flex-col leading-none">
          <span className="text-[14px] font-bold tracking-tight text-white">
            CONNECTEX
          </span>
          <span className="text-[8px] font-semibold tracking-[0.2em] text-[#00C9A7]">
            SOLUTIONS
          </span>
        </div>
        <span className="text-[10px] font-medium text-[var(--color-text-muted)] bg-white/8 px-1.5 py-0.5 rounded ml-auto uppercase tracking-wider">
          CRM
        </span>
      </Link>

      {/* Nav Links */}
      <div className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#00C9A7]/15 text-[#00C9A7]'
                  : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              {item.label}
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
            </Link>
          )
        })}
      </div>

      {/* Bottom actions */}
      <div className="p-3 border-t border-white/8">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--color-text-muted)] hover:text-white hover:bg-white/5 transition-colors mb-1"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Site
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#FF6B6B]/80 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </nav>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a1218]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-white/8 bg-[#0F1B2D]">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0F1B2D] border-r border-white/8 z-10">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 lg:px-6 h-14 border-b border-white/8 bg-[#0F1B2D]/80 backdrop-blur-md flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="text-sm text-[var(--color-text-muted)]">
            {navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'))?.label ?? 'CRM'}
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
