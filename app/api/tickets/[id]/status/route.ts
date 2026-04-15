import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyClientStatusChange } from '@/lib/ticket-notifications'
import { requireAdmin } from '@/lib/auth-guard'

const VALID_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'] as const

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  try {
    const { id } = await context.params
    const { status } = await req.json()

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = getAdmin()

    const { data: ticket, error } = await supabase
      .from('tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, token, name, email, subject, status')
      .single()

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Email client about status change (fire-and-forget)
    notifyClientStatusChange(
      { clientName: ticket.name, clientEmail: ticket.email, subject: ticket.subject, token: ticket.token },
      status
    ).catch(() => {})

    return NextResponse.json({ status: ticket.status })
  } catch (err) {
    console.error('Status update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
