import { createSupabaseBrowser } from './supabase-browser'
import type { ActivityType } from './crm-types'

export async function logActivity(params: {
  type: ActivityType
  description: string
  contact_id?: string
  deal_id?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = createSupabaseBrowser()
  await supabase.from('crm_activity').insert({
    type: params.type,
    description: params.description,
    contact_id: params.contact_id ?? null,
    deal_id: params.deal_id ?? null,
    metadata: params.metadata ?? null,
  })
}
