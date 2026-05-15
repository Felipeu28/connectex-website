import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/supabase-server'
import { signOutAction } from '@/app/actions/auth'
import { CRMShellClient } from '@/components/crm/CRMShellClient'

export const metadata: Metadata = {
  title: 'CRM | Connectex Solutions',
  robots: { index: false, follow: false },
}

/**
 * CRM layout. Renders the sophisticated sidebar/topbar shell around every
 * authenticated /crm/* page.
 *
 * The proxy guard redirects unauthenticated requests for /crm/* to
 * /crm/login (the only public CRM surface), so when this layout runs:
 *   - user is present  → render shell + page content
 *   - user is null     → we're rendering /crm/login; pass through so it can
 *                        own the full viewport with its own design.
 */
export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) return <>{children}</>
  return (
    <CRMShellClient userEmail={user.email ?? null} signOut={signOutAction}>
      {children}
    </CRMShellClient>
  )
}
