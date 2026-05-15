import { getSupabaseAdmin } from '@/lib/ticket-triage'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Unsubscribe — Connectex',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ one_click?: string }>
}

async function unsubscribe(token: string) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('crm_contacts')
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('unsubscribe_token', token)
    .select('id, email, name')
    .maybeSingle()

  if (error || !data) return null

  await admin.from('email_events').insert({
    event_type: 'unsubscribed',
    email: data.email,
    contact_id: data.id,
  })

  return data
}

export default async function UnsubscribePage({ params }: PageProps) {
  const { token } = await params
  if (!token || token.length < 8) notFound()

  const result = await unsubscribe(token)

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0F1B2D] text-white">
      <div className="max-w-md w-full glass rounded-2xl p-8 text-center">
        {result ? (
          <>
            <h1 className="text-xl font-semibold mb-2">You&apos;ve been unsubscribed</h1>
            <p className="text-[var(--text-muted)] text-sm">
              {result.email} will no longer receive marketing emails from Connectex Solutions.
              You&apos;ll still receive transactional messages (e.g. support ticket updates) if
              you have an open ticket.
            </p>
            <p className="text-[var(--text-muted)] text-xs mt-6">
              Changed your mind? Email <a href="mailto:mark@connectex.net" className="text-[var(--color-accent)] underline">mark@connectex.net</a>.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-2">Unsubscribe link not recognized</h1>
            <p className="text-[var(--text-muted)] text-sm">
              This link is invalid or has expired. If you want to stop receiving emails, please
              email <a href="mailto:mark@connectex.net" className="text-[var(--color-accent)] underline">mark@connectex.net</a> directly.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// Handle the one-click POST that some mail clients (Gmail, Outlook) issue
// per RFC 8058. Returning the same page is fine — the side effect happened.
export async function generateStaticParams() {
  return []
}
