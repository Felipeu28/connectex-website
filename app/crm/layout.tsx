import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CRM | Connectex Solutions',
  robots: { index: false, follow: false },
}

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {children}
    </div>
  )
}
