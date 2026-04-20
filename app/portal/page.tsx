import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'

export default async function PortalRootPage() {
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/portal/dashboard')
  } else {
    redirect('/portal/login')
  }
}
