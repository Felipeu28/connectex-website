export interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  title: string | null
  source: 'manual' | 'website' | 'referral' | 'networking' | 'cold'
  stage: PipelineStage
  notes: string | null
  tags: string[]
  deal_value: number
  created_at: string
  updated_at: string
}

export type PipelineStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'lead', label: 'Lead', color: '#94A3B8' },
  { key: 'qualified', label: 'Qualified', color: '#60A5FA' },
  { key: 'proposal', label: 'Proposal', color: '#A78BFA' },
  { key: 'negotiation', label: 'Negotiation', color: '#F59E0B' },
  { key: 'closed_won', label: 'Closed Won', color: '#00C9A7' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#FF6B6B' },
]

export interface Deal {
  id: string
  contact_id: string | null
  title: string
  value: number
  stage: PipelineStage
  probability: number
  expected_close: string | null
  notes: string | null
  created_at: string
  updated_at: string
  contact?: Contact | null
}

export interface Campaign {
  id: string
  name: string
  subject: string
  body: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  recipients_filter: Record<string, unknown>
  scheduled_at: string | null
  sent_at: string | null
  sent_count: number
  open_count: number
  click_count: number
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  location: string | null
  type: 'meeting' | 'call' | 'follow_up' | 'task' | 'other'
  contact_id: string | null
  google_event_id: string | null
  created_at: string
  updated_at: string
  contact?: Contact | null
}

export type ActivityType =
  | 'note'
  | 'email'
  | 'call'
  | 'meeting'
  | 'document'
  | 'deal_created'
  | 'deal_moved'
  | 'deal_closed'
  | 'contact_created'
  | 'contact_updated'
  | 'ticket_created'
  | 'ticket_resolved'
  | 'campaign_sent'
  | 'deal_update'
  | 'stage_change'
  | 'ticket'

export interface Activity {
  id: string
  type: ActivityType
  contact_id: string | null
  deal_id: string | null
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface Ticket {
  id: string
  token: string
  name: string
  email: string
  company: string | null
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
  image_url: string | null
  created_at: string
  updated_at: string
}

export const TICKET_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: '#00C9A7' },
  in_progress: { label: 'In Progress', color: '#60A5FA' },
  waiting: { label: 'Waiting', color: '#F59E0B' },
  resolved: { label: 'Resolved', color: '#A78BFA' },
  closed: { label: 'Closed', color: '#94A3B8' },
}

export const TICKET_PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: '#94A3B8' },
  medium: { label: 'Medium', color: '#60A5FA' },
  high: { label: 'High', color: '#F59E0B' },
  urgent: { label: 'Urgent', color: '#FF6B6B' },
}

export const CAMPAIGN_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#94A3B8' },
  scheduled: { label: 'Scheduled', color: '#F59E0B' },
  sending: { label: 'Sending', color: '#60A5FA' },
  sent: { label: 'Sent', color: '#00C9A7' },
  paused: { label: 'Paused', color: '#A78BFA' },
}
