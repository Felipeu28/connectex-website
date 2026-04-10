import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Client Portal — Connectex Support',
  description: 'Manage your support tickets and view your IT inventory.',
  robots: { index: false, follow: false },
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F1B2D]">
      {children}
    </div>
  )
}
