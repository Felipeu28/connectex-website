import { NextRequest, NextResponse } from 'next/server'
import { runTriage } from '@/lib/ticket-triage'
import { requireAdmin } from '@/lib/auth-guard'

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 503 })
  }

  try {
    const { ticket_id } = await req.json()
    if (!ticket_id) {
      return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })
    }

    const result = await runTriage(ticket_id)

    if (result.error) {
      const status = result.error === 'Ticket not found' ? 404 : 502
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Triage route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
