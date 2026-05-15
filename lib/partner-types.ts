export interface Partner {
  id: string
  name: string
  category: string
  description: string | null
  website: string | null
  contact_email: string | null
  contact_phone: string | null
  logo_url: string | null
  color: string
  featured: boolean
  visible: boolean
  sort_order: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type PartnerInput = Partial<Omit<Partner, 'id' | 'created_at' | 'updated_at'>> & {
  name: string
  category: string
}

export const PARTNER_CATEGORIES = [
  'IT & Managed Services',
  'Cybersecurity',
  'Cloud',
  'Connectivity & ISP',
  'Voice & Communications',
  'AI & Automation',
  'Hardware',
  'Software',
  'Other',
] as const
