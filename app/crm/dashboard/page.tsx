/**
 * Dashboard — server component. Loads stats + recent deals + recent activity
 * via the cookie-aware Supabase client (RLS-restricted to the signed-in user).
 */

import { createSupabaseServer } from '@/lib/supabase-server'
import { PIPELINE_STAGES, type Deal, type Activity } from '@/lib/crm-types'
import {
  Users, DollarSign, Ticket as TicketIcon, TrendingUp, TrendingDown,
  ArrowRight, UserPlus, Check, Mail, MessageSquare, Phone, Calendar,
  PlusCircle, Pencil, AlertCircle, Sparkles, Activity as ActivityIcon,
  Kanban, type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'

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
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [contactsRes, ticketsRes, allOpenDealsRes, recentDealsRes, activityRes, contactSeriesRes] =
    await Promise.all([
      supabase.from('crm_contacts').select('id', { count: 'exact', head: true }),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'waiting']),
      supabase.from('crm_deals').select('value').not('stage', 'in', '("closed_won","closed_lost")'),
      supabase.from('crm_deals').select('*').not('stage', 'in', '("closed_won","closed_lost")').order('created_at', { ascending: false }).limit(5),
      supabase.from('crm_activity').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('crm_contacts').select('created_at').gte('created_at', sevenDaysAgo.toISOString()).order('created_at', { ascending: true }).limit(2000),
    ])

  const openDeals = allOpenDealsRes.data ?? []
  const pipelineValue = openDeals.reduce((sum, d) => sum + Number(d.value), 0)
  const buckets = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    buckets.set(d.toISOString().slice(0, 10), 0)
  }
  for (const r of contactSeriesRes.data ?? []) {
    const k = (r.created_at as string).slice(0, 10)
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) || 0) + 1)
  }
  const contactSeries = Array.from(buckets.values())
  const newContactsThisWeek = contactSeries.reduce((a, b) => a + b, 0)

  const stats = {
    totalContacts: contactsRes.count ?? 0,
    openTickets: ticketsRes.count ?? 0,
    pipelineValue,
    activeDeals: openDeals.length,
  }
  const recentDeals: Deal[] = recentDealsRes.data ?? []
  const recentActivity: Activity[] = activityRes.data ?? []

  const statCards = [
    { label: 'Total Contacts', value: stats.totalContacts, delta: newContactsThisWeek > 0 ? `+${newContactsThisWeek} this week` : 'No new this week', deltaUp: newContactsThisWeek > 0, icon: Users, color: '#60A5FA', href: '/crm/contacts', spark: contactSeries },
    { label: 'Pipeline Value', value: `$${stats.pipelineValue.toLocaleString()}`, delta: `${stats.activeDeals} open deal${stats.activeDeals === 1 ? '' : 's'}`, deltaUp: stats.activeDeals > 0, icon: DollarSign, color: '#00C9A7', href: '/crm/pipeline' },
    { label: 'Open Tickets', value: stats.openTickets, delta: stats.openTickets > 0 ? 'Awaiting response' : 'Inbox is clear', deltaUp: stats.openTickets === 0, icon: TicketIcon, color: '#F59E0B', href: '/crm/tickets' },
    { label: 'Active Deals', value: stats.activeDeals, delta: 'Across pipeline', deltaUp: stats.activeDeals > 0, icon: TrendingUp, color: '#A78BFA', href: '/crm/pipeline' },
  ]

  return (
    <div className="space-y-8 relative">
      <header className="relative overflow-hidden rounded-2xl surface-2 crm-grid p-6 lg:p-8">
        <div aria-hidden className="absolute -top-32 -right-24 w-96 h-96 rounded-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(139,43,226,0.55), transparent 70%)' }} />
        <div aria-hidden className="absolute -bottom-32 -left-12 w-96 h-96 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(0,201,167,0.55), transparent 70%)' }} />
        <div className="relative flex flex-col lg:flex-row lg:items-end gap-6 justify-between">
          <div className="space-y-3 max-w-xl">
            <div className="eyebrow"><Sparkles className="w-3 h-3" />Control Room</div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">{greeting()}, <span className="text-aurora">advisor.</span></h1>
            <p className="text-[14px] text-white/60 leading-relaxed">
              {stats.openTickets > 0 ? (
                <>You have <span className="text-white font-semibold">{stats.openTickets} open ticket{stats.openTickets === 1 ? '' : 's'}</span> and <span className="text-white font-semibold">${stats.pipelineValue.toLocaleString()}</span> in pipeline. Let&rsquo;s ship.</>
              ) : (
                <>Your inbox is clear and <span className="text-white font-semibold">${stats.pipelineValue.toLocaleString()}</span> is moving through pipeline.</>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/crm/contacts" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white text-[#0F1B2D] text-[13px] font-semibold hover:bg-white/90 transition-colors"><UserPlus className="w-4 h-4" />New Contact</Link>
            <Link href="/crm/campaigns" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg surface-1 hover:bg-white/10 text-[13px] font-medium text-white transition-colors"><Mail className="w-4 h-4" />Compose Campaign</Link>
            <Link href="/crm/calendar" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg surface-1 hover:bg-white/10 text-[13px] font-medium text-white transition-colors"><Calendar className="w-4 h-4" />Schedule</Link>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const Trend = card.deltaUp ? TrendingUp : TrendingDown
          return (
            <Link key={card.label} href={card.href} className="group relative overflow-hidden rounded-xl surface-2 p-5 hover:translate-y-[-1px] transition-transform">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${card.color}30, ${card.color}10)`, border: `1px solid ${card.color}30` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: card.color }} />
                </div>
                <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors" />
              </div>
              <div className="mt-5">
                <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/40">{card.label}</div>
                <div className="mt-1 text-2xl lg:text-[26px] font-bold tracking-tight">{card.value}</div>
                <div className={`mt-1 inline-flex items-center gap-1 text-[11px] ${card.deltaUp ? 'trend-up' : 'trend-flat'}`}>
                  <Trend className="w-3 h-3" />{card.delta}
                </div>
              </div>
              {card.spark && card.spark.length > 0 && <div className="mt-3 -mx-1"><Sparkline data={card.spark} color={card.color} height={36} /></div>}
            </Link>
          )
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 surface-2 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="eyebrow"><Kanban className="w-3 h-3" />Pipeline</div>
              <h2 className="text-lg font-semibold mt-1">Active Deals</h2>
            </div>
            <Link href="/crm/pipeline" className="text-[12px] text-[#00C9A7] hover:underline inline-flex items-center gap-1">Open board <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {recentDeals.length === 0 ? (
            <EmptyState icon={Kanban} title="No active deals yet" hint="Create one from the Pipeline to start tracking revenue." cta={{ label: 'Open Pipeline', href: '/crm/pipeline' }} />
          ) : (
            <div className="divide-y divide-white/5 -mx-2">
              {recentDeals.map((deal) => {
                const stage = PIPELINE_STAGES.find((s) => s.key === deal.stage)
                return (
                  <Link key={deal.id} href="/crm/pipeline" className="flex items-center justify-between gap-4 px-2 py-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-white truncate">{deal.title}</div>
                      <div className="text-[11.5px] text-white/40 mt-0.5 font-mono">${Number(deal.value).toLocaleString()}</div>
                    </div>
                    <span className="pill" style={{ backgroundColor: `${stage?.color ?? '#94A3B8'}18`, color: stage?.color ?? '#94A3B8', borderColor: `${stage?.color ?? '#94A3B8'}33` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage?.color ?? '#94A3B8' }} />
                      {stage?.label ?? deal.stage}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
        <div className="surface-2 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="eyebrow"><ActivityIcon className="w-3 h-3" />Live</div>
              <h2 className="text-lg font-semibold mt-1">Recent Activity</h2>
            </div>
          </div>
          {recentActivity.length === 0 ? (
            <EmptyState icon={ActivityIcon} title="No activity yet" hint="Add contacts or move deals — events show up here in real time." />
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-1 bottom-1 w-px bg-white/5" />
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const config = ACTIVITY_CONFIG[activity.type] ?? { icon: MessageSquare, color: '#94A3B8' }
                  const Icon = config.icon
                  return (
                    <div key={activity.id} className="relative pl-9">
                      <div className="absolute left-0 top-0.5 w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-[#0a1218]" style={{ background: `linear-gradient(135deg, ${config.color}30, ${config.color}10)`, border: `1px solid ${config.color}40` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                      </div>
                      <div className="text-[13px] text-white/90 leading-snug">{activity.description}</div>
                      <div className="text-[11px] text-white/40 mt-0.5 font-mono">{relativeTime(activity.created_at)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Sparkline({ data, color, height = 36 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null
  const width = 200
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 6) - 3}`).join(' ')
  const areaPoints = `0,${height} ${points} ${width},${height}`
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EmptyState({ icon: Icon, title, hint, cta }: { icon: LucideIcon; title: string; hint: string; cta?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <div className="w-10 h-10 rounded-lg surface-1 flex items-center justify-center mb-3"><Icon className="w-4 h-4 text-white/50" /></div>
      <div className="text-[13px] font-medium text-white/80">{title}</div>
      <div className="text-[12px] text-white/40 mt-1 max-w-xs">{hint}</div>
      {cta && <Link href={cta.href} className="mt-4 inline-flex items-center gap-1.5 px-3 h-8 rounded-lg surface-1 hover:bg-white/10 text-[12px] text-white/80 transition-colors">{cta.label}<ArrowRight className="w-3 h-3" /></Link>}
    </div>
  )
}
