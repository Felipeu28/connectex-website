export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
export type SenderType = 'client' | 'admin' | 'ai'

export interface Ticket {
  id: string
  token: string
  name: string
  email: string
  company: string | null
  subject: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  image_url: string | null
  ai_handled: boolean
  ai_confidence: number | null
  routed_to_mark: boolean
  human_took_over: boolean
  user_id: string | null
  created_at: string
  updated_at: string
}

export interface TicketMessage {
  id: string
  ticket_id: string
  sender_type: SenderType
  sender_name: string
  message: string
  created_at: string
}

export interface TicketWithMessages extends Ticket {
  ticket_messages: TicketMessage[]
}

export interface CreateTicketPayload {
  name: string
  email: string
  company?: string
  subject: string
  description: string
  priority: TicketPriority
  image_url?: string
}

export interface CreateMessagePayload {
  sender_type: SenderType
  sender_name: string
  message: string
}
