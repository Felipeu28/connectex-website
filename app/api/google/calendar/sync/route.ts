import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
} from '@/lib/google-calendar'
import { createSupabaseServer } from '@/lib/supabase-server'

async function getTokens() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('google_tokens')?.value
  if (!raw) return null
  return JSON.parse(raw) as { access_token: string; refresh_token: string }
}

export async function POST(request: NextRequest) {
  const tokens = await getTokens()
  if (!tokens) {
    return NextResponse.json({ error: 'Google not connected' }, { status: 401 })
  }

  const body = await request.json()
  const { action, event_id, event } = body

  const supabase = await createSupabaseServer()

  try {
    if (action === 'create') {
      const googleId = await createGoogleEvent(tokens, {
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
      })

      if (googleId && event_id) {
        await supabase
          .from('crm_events')
          .update({ google_event_id: googleId })
          .eq('id', event_id)
      }

      return NextResponse.json({ google_event_id: googleId })
    }

    if (action === 'update') {
      // Fetch the existing event to get google_event_id
      const { data: existing } = await supabase
        .from('crm_events')
        .select('google_event_id')
        .eq('id', event_id)
        .single()

      if (existing?.google_event_id) {
        await updateGoogleEvent(tokens, existing.google_event_id, {
          title: event.title,
          description: event.description,
          start_time: event.start_time,
          end_time: event.end_time,
          location: event.location,
        })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'delete') {
      const { data: existing } = await supabase
        .from('crm_events')
        .select('google_event_id')
        .eq('id', event_id)
        .single()

      if (existing?.google_event_id) {
        await deleteGoogleEvent(tokens, existing.google_event_id)
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Google Calendar sync error:', err)
    return NextResponse.json(
      { error: 'Failed to sync with Google Calendar' },
      { status: 500 }
    )
  }
}
