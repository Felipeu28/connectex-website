'use client'

import { useEffect, useState } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { PIPELINE_STAGES, type Deal, type Activity } from '@/lib/crm-types'
import {
  Users,
  DollarSign,
  Ticket as TicketIcon,
  TrendingUp,
  ArrowRight,
  UserPlus,
  Check,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  PlusCircle,
  Pencil,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalContacts: number
  openTickets: number
  pipelineValue: number
  activeDeals: number
}

const ACTIVITY_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  contact_created: { icon: UserPlus, color: '#60A5FA' },
  contact_updated: { icon: Pencil, color: '#94A3B8' },
  deal_created: { icon: PlusCircle, color: '#A78BFA' },
  deal_moved: { icon: ArrowRight, color: '#F59E0B' },
  deal_closed: { icon: Check, color: '#00C9A7' },
  deal_update: { icon: Pencil, color: '#A78BFA' },
  stage_change: { icon: ArrowRight, color: '#F59E0B' },
  email: { icon: Mail, color: '#60A5FA' },
  campaign_sent: { icon: Mail, color: '#8B2BE2' },
  note: { icon: MessageSquare, color: '#94A3B8' },
  call: { icon: Phone, color: '#00C9A7' },
  meeting: { icon: Calendar, color: '#F59E0B' },
  ticket: { icon: TicketIcon, color: '#FF6B6B' },
  ticket_created: { icon: AlertCircle, color: '#FF6B6B' },
  ticket_resolved: { icon: Check, color: '#00C9A7' },
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then

  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    openTickets: 0,
    pipelineValue: 0,
    activeDeals: 0,
  })
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [recentDeals, setRecentDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowser()

      const [contactsRes, ticketsRes, allOpenDealsRes, recentDealsRes, activityRes] = await Promise.all([
        supabase.from('crm_contacts').select('id', { count: 'exact', head: true }),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'waiting']),
        supabase.from('crm_deals').select('value').not('stage', 'in', '("closed_won","closed_lost")'),
        supabase.from('crm_deals').select('*').not('stage', 'in', '("closed_won","closed_lost")').order('created_at', { ascending: false }).limit(5),
        supabase.from('crm_activity').select('*').order('created_at', { ascending: false }).limit(10),
      ])

      const openDeals = allOpenDealsRes.data ?? []
      const pipelineValue = openDeals.reduce((sum, d) => sum + Number(d.value), 0)

      setStats({
        totalContacts: contactsRes.count ?? 0,
        openTickets: ticketsRes.count ?? 0,
        pipelineValue,
        activeDeals: openDeals.length,
      })
      setRecentDeals(recentDealsRes.data ?? [])
      setRecentActivity(activityRes.data ?? [])
      setLoading(false)
    })()
  }, [])

  const statCards = [
    { label: 'Total Contacts', value: stats.totalContacts, icon: Users, color: '#60A5FA', href: '/crm/contacts' },
    { label: 'Pipeline Value', value: `$${stats.pipelineValue.toLocaleString()}`, icon: DollarSign, color: '#00C9A7', href: '/crm/pipeline' },
    { label: 'Open Tickets', value: stats.openTickets, icon: TicketIcon, color: '#F59E0B', href: '/crm/tickets' },
    { label: 'Active Deals', value: stats.activeDeals, icon: TrendingUp, color: '#A78BFA', href: '/crm/pipeline' },
  ]

  return (
    <CRMShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Business overview at a glance.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="glass rounded-xl p-5 hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-text-faint)] group-hover:text-[var(--color-text-muted)] transition-colors" />
              </div>
              <p className="text-2xl font-bold text-white">
                {loading ? <span className="inline-block w-16 h-7 bg-white/10 animate-pulse rounded" /> : card.value}
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{card.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Deals */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Active Deals</h2>
              <Link href="/crm/pipeline" className="text-sm text-[#00C9A7] hover:underline">View all</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-white/5 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : recentDeals.length === 0 ? (
              <p className="text-[var(--color-text-muted)] text-sm py-4">No active deals yet. Create one from the Pipeline.</p>
            ) : (
              <div className="space-y-2">
                {recentDeals.map((deal) => {
                  const stage = PIPELINE_STAGES.find((s) => s.key === deal.stage)
                  return (
                    <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                      <div>
                        <p className="text-sm font-medium text-white">{deal.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          ${Number(deal.value).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ backgroundColor: `${stage?.color ?? '#94A3B8'}20`, color: stage?.color ?? '#94A3B8' }}
                      >
                        {stage?.label ?? deal.stage}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-white/5 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-[var(--color-text-muted)] text-sm py-4">No activity yet. Start by adding contacts or creating deals.</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity) => {
                  const config = ACTIVITY_CONFIG[activity.type] ?? { icon: MessageSquare, color: '#94A3B8' }
                  const Icon = config.icon
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03]">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${config.color}15`, color: config.color }}
                          >
                            {activity.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-[var(--color-text-faint)]">
                            {relativeTime(activity.created_at)}
                          </span>
                        </div>
                        {activity.contact_id && (
                          <Link
                            href={`/crm/contacts/${activity.contact_id}`}
                            className="text-xs text-[#00C9A7] hover:underline mt-1 inline-block"
                          >
                            View contact
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </CRMShell>
  )
}
