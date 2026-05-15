import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { getSupabaseAdmin } from '@/lib/ticket-triage'
import { WALKTHROUGHS } from '@/lib/knowledge/walkthroughs'

export const runtime = 'nodejs'

export type GraphNodeType =
  | 'contact'
  | 'company'
  | 'deal'
  | 'ticket'
  | 'sequence'
  | 'campaign'
  | 'kb'
  | 'walkthrough'
  | 'blog'
  | 'partner'

export interface GraphNode {
  id: string
  label: string
  type: GraphNodeType
  // Optional metadata surfaced in the detail panel
  meta?: {
    stage?: string
    status?: string
    email?: string
    value?: number
    href?: string
    summary?: string
    category?: string
  }
  /** Degree precomputed for sizing on the client */
  val?: number
}

export interface GraphLink {
  source: string
  target: string
  /** Edge type so the UI can color/label it */
  rel: string
}

export interface GraphPayload {
  nodes: GraphNode[]
  links: GraphLink[]
  generated_at: string
}

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET() {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  try {
    const admin = getSupabaseAdmin()

    // Run all reads in parallel — pull only the columns we render
    const [
      contactsRes,
      dealsRes,
      ticketsRes,
      sequencesRes,
      campaignsRes,
      enrollmentsRes,
      kbRes,
      blogRes,
      partnersRes,
    ] = await Promise.all([
      admin.from('crm_contacts').select('id, name, email, company, stage, deal_value').limit(2000),
      admin.from('crm_deals').select('id, title, value, stage, contact_id').limit(2000),
      admin.from('tickets').select('id, subject, status, contact_id, email, token').limit(2000),
      admin.from('crm_sequences').select('id, name, status').neq('status', 'archived').limit(500),
      admin.from('crm_campaigns').select('id, name, status, sent_count').limit(500),
      admin.from('crm_sequence_enrollments').select('sequence_id, contact_id, status').limit(5000),
      admin.from('kb_documents').select('id, title, category').limit(500),
      admin.from('crm_blog_posts').select('id, slug, title, category').eq('status', 'published').limit(500),
      admin.from('partners').select('id, name, category, color').eq('visible', true).limit(500),
    ])

    const nodes: GraphNode[] = []
    const links: GraphLink[] = []
    const seenIds = new Set<string>()

    function addNode(n: GraphNode) {
      if (seenIds.has(n.id)) return
      seenIds.add(n.id)
      nodes.push(n)
    }

    function addLink(source: string, target: string, rel: string) {
      if (!seenIds.has(source) || !seenIds.has(target)) return
      if (source === target) return
      links.push({ source, target, rel })
    }

    // ── Contacts + companies ────────────────────────────────────────────────
    const companyMap = new Map<string, string>() // slug -> display name
    for (const c of contactsRes.data ?? []) {
      const id = `contact:${c.id}`
      addNode({
        id,
        label: c.name ?? c.email ?? 'Unnamed',
        type: 'contact',
        meta: {
          stage: c.stage,
          email: c.email,
          value: c.deal_value,
          href: `/crm/contacts/${c.id}`,
        },
      })
      if (c.company?.trim()) {
        const companySlug = `company:${slug(c.company)}`
        if (!companyMap.has(companySlug)) {
          companyMap.set(companySlug, c.company.trim())
          addNode({ id: companySlug, label: c.company.trim(), type: 'company' })
        }
        addLink(id, companySlug, 'works_at')
      }
    }

    // ── Deals ───────────────────────────────────────────────────────────────
    for (const d of dealsRes.data ?? []) {
      const id = `deal:${d.id}`
      addNode({
        id,
        label: d.title,
        type: 'deal',
        meta: { stage: d.stage, value: d.value },
      })
      if (d.contact_id) addLink(id, `contact:${d.contact_id}`, 'deal_for')
    }

    // ── Tickets ─────────────────────────────────────────────────────────────
    const contactsByEmail = new Map<string, string>() // email -> contact:id
    for (const c of contactsRes.data ?? []) {
      if (c.email) contactsByEmail.set(c.email.toLowerCase(), `contact:${c.id}`)
    }
    for (const t of ticketsRes.data ?? []) {
      const id = `ticket:${t.id}`
      addNode({
        id,
        label: t.subject,
        type: 'ticket',
        meta: { status: t.status, href: `/crm/tickets/${t.token}` },
      })
      let contactNode: string | null = t.contact_id ? `contact:${t.contact_id}` : null
      if (!contactNode && t.email) {
        contactNode = contactsByEmail.get(t.email.toLowerCase()) ?? null
      }
      if (contactNode) addLink(id, contactNode, 'ticket_for')
    }

    // ── Sequences + enrollments ─────────────────────────────────────────────
    for (const s of sequencesRes.data ?? []) {
      addNode({
        id: `sequence:${s.id}`,
        label: s.name,
        type: 'sequence',
        meta: { status: s.status, href: `/crm/sequences` },
      })
    }
    for (const e of enrollmentsRes.data ?? []) {
      if (e.status === 'unsubscribed' || e.status === 'bounced') continue
      addLink(`sequence:${e.sequence_id}`, `contact:${e.contact_id}`, 'enrolled')
    }

    // ── Campaigns (no per-contact links — recipients_filter is too coarse) ─
    for (const c of campaignsRes.data ?? []) {
      addNode({
        id: `campaign:${c.id}`,
        label: c.name,
        type: 'campaign',
        meta: { status: c.status, value: c.sent_count, href: `/crm/campaigns` },
      })
    }

    // ── Knowledge base + walkthroughs (linked by category) ──────────────────
    const categoryHubs = new Map<string, string>() // category -> hub node id
    function ensureCategoryHub(category: string) {
      const key = `category:${slug(category)}`
      if (!categoryHubs.has(category)) {
        categoryHubs.set(category, key)
        addNode({ id: key, label: category, type: 'kb', meta: { category } })
      }
      return key
    }

    for (const d of kbRes.data ?? []) {
      const id = `kb:${d.id}`
      addNode({
        id,
        label: d.title,
        type: 'kb',
        meta: { category: d.category, href: `/crm/knowledge-base` },
      })
      const hub = ensureCategoryHub(d.category)
      addLink(id, hub, 'in_category')
    }
    for (const w of WALKTHROUGHS) {
      const id = `walkthrough:${w.slug}`
      addNode({
        id,
        label: w.title,
        type: 'walkthrough',
        meta: { category: w.category, summary: w.summary, href: `/ticketing` },
      })
      const hub = ensureCategoryHub(w.category)
      addLink(id, hub, 'in_category')
    }

    // ── Blog posts ──────────────────────────────────────────────────────────
    for (const b of blogRes.data ?? []) {
      const id = `blog:${b.id}`
      addNode({
        id,
        label: b.title,
        type: 'blog',
        meta: { category: b.category, href: `/crm/blog/${b.id}` },
      })
      if (b.category) {
        const hub = ensureCategoryHub(b.category)
        addLink(id, hub, 'in_category')
      }
    }

    // ── Partners — linked to their category hub ─────────────────────────────
    for (const p of partnersRes.data ?? []) {
      const id = `partner:${p.id}`
      addNode({
        id,
        label: p.name,
        type: 'partner',
        meta: { category: p.category, href: `/crm/partners` },
      })
      if (p.category) {
        const hub = ensureCategoryHub(p.category)
        addLink(id, hub, 'in_category')
      }
    }

    // ── Precompute degree for sizing ────────────────────────────────────────
    const degree = new Map<string, number>()
    for (const link of links) {
      degree.set(link.source, (degree.get(link.source) ?? 0) + 1)
      degree.set(link.target, (degree.get(link.target) ?? 0) + 1)
    }
    for (const n of nodes) {
      n.val = (degree.get(n.id) ?? 0) + 1
    }

    const payload: GraphPayload = {
      nodes,
      links,
      generated_at: new Date().toISOString(),
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    })
  } catch (err) {
    console.error('Graph GET error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
