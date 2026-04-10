import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { PortalShell } from '@/components/portal/PortalShell'
import { PortalTicketForm } from '@/components/portal/PortalTicketForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewTicketPage() {
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/portal/login')
  }

  return (
    <PortalShell userEmail={session.user.email!}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/portal/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Submit a Support Ticket</h1>
          <p className="text-[#94A3B8] text-sm">
            Describe your issue and our AI will respond immediately. If it can&apos;t help,
            Mark will follow up personally.
          </p>
        </div>

        <div className="glass rounded-2xl p-8" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <PortalTicketForm
            userName={session.user.user_metadata?.full_name ?? ''}
            userEmail={session.user.email!}
            userId={session.user.id}
          />
        </div>
      </div>
    </PortalShell>
  )
}
