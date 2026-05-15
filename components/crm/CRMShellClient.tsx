'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Kanban,
  Ticket,
  Mail,
  Calendar,
  LogOut,
  Menu,
  Workflow,
  FileText,
  BookOpen,
  Inbox,
  BarChart3,
  Settings,
  Search,
  Bell,
  Plus,
  Sparkles,
  ChevronDown,
  ArrowUpRight,
  Handshake,
} from 'lucide-react'

type NavSection = {
  label: string
  items: { href: string; label: string; icon: typeof LayoutDashboard }[]
}

const navSections: NavSection[] = [
  {
    label: 'Operate',
    items: [
      { href: '/crm/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/crm/inbox', label: 'Inbox', icon: Inbox },
      { href: '/crm/tickets', label: 'Tickets', icon: Ticket },
      { href: '/crm/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    label: 'Grow',
    items: [
      { href: '/crm/contacts', label: 'Contacts', icon: Users },
      { href: '/crm/pipeline', label: 'Pipeline', icon: Kanban },
      { href: '/crm/campaigns', label: 'Campaigns', icon: Mail },
      { href: '/crm/sequences', label: 'Sequences', icon: Workflow },
      { href: '/crm/partners', label: 'Partners', icon: Handshake },
      { href: '/crm/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Library',
    items: [
      { href: '/crm/templates', label: 'Email Templates', icon: Mail },
      { href: '/crm/blog', label: 'Blog', icon: FileText },
      { href: '/crm/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
    ],
  },
  {
    label: 'Workspace',
    items: [{ href: '/crm/settings', label: 'Settings', icon: Settings }],
  },
]

const allItems = navSections.flatMap((s) => s.items)

export function CRMShellClient({
  children,
  userEmail,
  signOut,
}: {
  children: React.ReactNode
  userEmail: string | null
  signOut: () => Promise<void>
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const active = allItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )
  const initial = (userEmail?.[0] ?? 'C').toUpperCase()

  const sidebar = (
    <nav className="flex flex-col h-full">
      <Link href="/crm/dashboard" className="flex items-center gap-3 px-5 py-5 border-b hairline">
        <div className="relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#8B2BE2]/20 via-[#4B6CF7]/15 to-[#00C9A7]/20 border border-white/10">
          <Image src="/logos/logo-symbol.png" alt="Connectex" width={28} height={28} className="w-7 h-7" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-bold tracking-tight text-white">CONNECTEX</span>
          <span className="text-[9px] font-semibold tracking-[0.22em] text-[#00C9A7]">CRM · CONTROL ROOM</span>
        </div>
      </Link>
      <div className="px-4 pt-4">
        <Link href="/crm/contacts" className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#8B2BE2] to-[#4B6CF7] text-white text-[13px] font-semibold shadow-[0_8px_24px_-8px_rgba(139,43,226,0.6)] hover:shadow-[0_12px_28px_-8px_rgba(139,43,226,0.8)] transition-shadow">
          <span className="flex items-center gap-2"><Plus className="w-4 h-4" />New</span>
          <span className="kbd !bg-white/15 !border-white/20 !text-white/90">⌘ N</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="px-2 pb-2 text-[10px] font-bold tracking-[0.22em] uppercase text-white/30">{section.label}</div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} data-active={isActive} className="crm-nav-item">
                    <Icon className="w-4 h-4 flex-shrink-0 opacity-90" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t hairline">
        <div className="surface-1 rounded-xl p-3 mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B2BE2] to-[#00C9A7] flex items-center justify-center text-white text-[11px] font-bold">{initial}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-white truncate">{userEmail ?? 'Signed in'}</div>
            <div className="text-[10px] text-white/40 tracking-wider uppercase">Advisor · Connectex</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/" className="flex-1 text-[11px] text-white/50 hover:text-white px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors flex items-center gap-1.5">
            <ArrowUpRight className="w-3 h-3" />Site
          </Link>
          <form action={signOut} className="flex-1">
            <button type="submit" className="w-full text-[11px] text-[#FF6B6B]/80 hover:text-[#FF6B6B] px-2 py-1.5 rounded-md hover:bg-[#FF6B6B]/10 transition-colors flex items-center gap-1.5">
              <LogOut className="w-3 h-3" />Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  )

  return (
    <div className="crm-shell flex h-screen overflow-hidden text-white">
      <aside className="hidden lg:flex w-64 flex-col border-r hairline relative z-10">{sidebar}</aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0a1218] border-r hairline z-10">{sidebar}</aside>
        </div>
      )}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 lg:px-6 h-16 border-b hairline relative z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5" aria-label="Open navigation">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-white/50">
            <span className="text-white/30">Workspace</span>
            <span className="text-white/20">/</span>
            <span className="text-white font-medium">{active?.label ?? 'CRM'}</span>
          </div>
          <div className="flex-1 flex justify-center">
            <button type="button" className="group flex items-center gap-2 px-3 h-9 w-full max-w-md rounded-lg surface-1 hover:bg-white/5 text-left transition-colors">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[12px] text-white/40 flex-1">Search contacts, deals, tickets…</span>
              <span className="kbd">⌘ K</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href="/crm/inbox" className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors relative" aria-label="Inbox">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#00C9A7]" />
            </Link>
            <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-lg hover:bg-white/5 text-[12px] text-white/80">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#8B2BE2] to-[#00C9A7] flex items-center justify-center text-[11px] font-bold">{initial}</div>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>
            {menuOpen && (
              <div className="absolute right-4 top-14 w-56 surface-2 rounded-xl p-1 z-30">
                <div className="px-3 py-2 text-[11px] text-white/50 truncate">{userEmail ?? 'Signed in'}</div>
                <Link href="/crm/settings" className="block px-3 py-1.5 rounded-md text-[12px] text-white/80 hover:bg-white/5" onClick={() => setMenuOpen(false)}>Settings</Link>
                <form action={signOut}>
                  <button type="submit" className="w-full text-left px-3 py-1.5 rounded-md text-[12px] text-[#FF6B6B] hover:bg-[#FF6B6B]/10">Sign out</button>
                </form>
              </div>
            )}
          </div>
        </header>
        <div aria-hidden className="absolute pointer-events-none top-16 left-64 right-0 h-72 -z-0 opacity-90" style={{ background: 'radial-gradient(600px 280px at 30% 0%, rgba(139,43,226,0.18), transparent 70%), radial-gradient(500px 240px at 80% 0%, rgba(0,201,167,0.10), transparent 65%)' }} />
        <div className="flex-1 overflow-y-auto relative">
          <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1500px] mx-auto">{children}</div>
        </div>
      </main>
      <span className="sr-only"><Sparkles className="w-3 h-3" /></span>
    </div>
  )
}
