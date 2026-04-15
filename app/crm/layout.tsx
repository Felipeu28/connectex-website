import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'CRM | Connectex Solutions',
  robots: { index: false, follow: false },
}

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  // Defense-in-depth: verify session at layout level (middleware is primary guard)
  if (pathname !== '/crm/login') {
    const supabase = await createSupabaseServer()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      redirect('/crm/login')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {children}
    </div>
  )
}
