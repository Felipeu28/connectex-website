'use server'

/**
 * Backwards-compatible shim — existing client code calls `logActivity(...)`.
 * Forward to the server action implementation in `app/actions/crm.ts` so the
 * call runs against the cookie-aware Supabase server client.
 */

import { logActivity as logActivityAction } from '@/app/actions/crm'
import type { ActivityType } from './crm-types'

export async function logActivity(params: {
  type: ActivityType
  description: string
  contact_id?: string
  deal_id?: string
  metadata?: Record<string, unknown>
}) {
  await logActivityAction({
    type: params.type,
    description: params.description,
    contact_id: params.contact_id ?? null,
    deal_id: params.deal_id ?? null,
    metadata: params.metadata,
  })
}
