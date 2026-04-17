import { NextRequest, NextResponse } from 'next/server'
import {
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
} from '@/lib/google-calendar'
import { getAuthedClient } from '@/lib/google-tokens'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const auth = await getAuthedClient()
  if (!auth) {
    return NextResponse.json({ error: 'Google not connected' }, { status: 401 })
  }

  const body = await request.json()
  const { action, event_id, event } = body

  const supabase = await createSupabaseServer()

  try {
    if (action === 'create') {
      const googleId = await createGoogleEvent(
        {
          title: event.title,
          description: event.description,
          start_time: event.start_time,
          end_time: event.end_time,
          location: event.location,
        },
        auth
      )

      if (googleId && event_id) {
        await supabase
          .from('crm_events')
          .update({ google_event_id: googleId })
          .eq('id', event_id)
      }

      return NextResponse.json({ google_event_id: googleId })
    }

    if (action === 'update') {
      const { data: existing } = await supabase
        .from('crm_events')
        .select('google_event_id')
        .eq('id', event_id)
        .single()

      if (existing?.google_event_id) {
        await updateGoogleEvent(
          existing.google_event_id,
          {
            title: event.title,
            description: event.description,
            start_time: event.start_time,
            end_time: event.end_time,
            location: event.location,
          },
          auth
        )
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
        await deleteGoogleEvent(existing.google_event_id, auth)
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
