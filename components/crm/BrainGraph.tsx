'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Search, X, Loader2, RefreshCw, Maximize2, Minimize2,
  Users, Building2, DollarSign, Ticket as TicketIcon, Mail,
  Workflow, BookOpen, FileText, Sparkles, Handshake, ExternalLink, Layers,
} from 'lucide-react'
import { clsx } from 'clsx'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

type NodeType =
  | 'contact' | 'company' | 'deal' | 'ticket' | 'sequence'
  | 'campaign' | 'kb' | 'walkthrough' | 'blog' | 'partner'

interface GraphNode {
  id: string
  label: string
  type: NodeType
  val?: number
  meta?: Record<string, unknown>
  // Mutated by force-graph during simulation
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  rel: string
}

interface GraphPayload {
  nodes: GraphNode[]
  links: GraphLink[]
  generated_at: string
}

interface TypeConfig {
  label: string
  color: string
  icon: React.ComponentType<{ className?: string }>
}

const TYPE_CONFIG: Record<NodeType, TypeConfig> = {
  contact:     { label: 'Contacts',      color: '#00C9A7', icon: Users },
  company:     { label: 'Companies',     color: '#60A5FA', icon: Building2 },
  deal:        { label: 'Deals',         color: '#F59E0B', icon: DollarSign },
  ticket:      { label: 'Tickets',       color: '#FF6B6B', icon: TicketIcon },
  sequence:    { label: 'Sequences',     color: '#A78BFA', icon: Workflow },
  campaign:    { label: 'Campaigns',     color: '#EC4899', icon: Mail },
  kb:          { label: 'Knowledge',     color: '#22D3EE', icon: BookOpen },
  walkthrough: { label: 'Walkthroughs',  color: '#34D399', icon: Sparkles },
  blog:        { label: 'Blog posts',    color: '#FACC15', icon: FileText },
  partner:     { label: 'Partners',      color: '#F472B6', icon: Handshake },
}

const ALL_TYPES = Object.keys(TYPE_CONFIG) as NodeType[]

interface ForceGraphHandle {
  zoomToFit: (ms?: number, padding?: number) => void
  centerAt: (x?: number, y?: number, ms?: number) => void
  zoom: (k?: number, ms?: number) => void
}

export function BrainGraph() {
  const [data, setData] = useState<GraphPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [enabledTypes, setEnabledTypes] = useState<Set<NodeType>>(new Set(ALL_TYPES))
  const [selected, setSelected] = useState<GraphNode | null>(null)
  const [hovered, setHovered] = useState<GraphNode | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphHandle | null>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/crm/graph')
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? `Failed (${res.status})`)
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Track container size for the graph canvas
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const update = () => {
      const rect = el.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fullscreen])

  // Build a filtered view: nodes of enabled types + only their incident links
  const view = useMemo(() => {
    if (!data) return { nodes: [], links: [] } as { nodes: GraphNode[]; links: GraphLink[] }
    const allowed = enabledTypes
    const q = search.trim().toLowerCase()
    const matches = (n: GraphNode) => {
      if (!q) return true
      if (n.label.toLowerCase().includes(q)) return true
      const meta = n.meta as Record<string, unknown> | undefined
      if (meta?.email && String(meta.email).toLowerCase().includes(q)) return true
      if (meta?.category && String(meta.category).toLowerCase().includes(q)) return true
      return false
    }
    // First pass: nodes filtered by type
    const typeNodes = data.nodes.filter((n) => allowed.has(n.type))
    // Build the search-match set (filtered or all if empty)
    const matchIds = new Set(typeNodes.filter(matches).map((n) => n.id))
    // For search highlighting we keep all type-allowed nodes in the graph
    // but highlight only matchIds. If no search, every typeNode is in the set.
    const nodesById = new Map(typeNodes.map((n) => [n.id, n]))
    const filteredLinks = data.links.filter((l) => {
      const sId = typeof l.source === 'string' ? l.source : l.source.id
      const tId = typeof l.target === 'string' ? l.target : l.target.id
      return nodesById.has(sId) && nodesById.has(tId)
    })
    return { nodes: typeNodes, links: filteredLinks, matchIds }
  }, [data, enabledTypes, search])

  // Compute neighbors of the hovered/selected node to highlight
  const focus = selected ?? hovered
  const focusNeighbors = useMemo(() => {
    if (!focus || !data) return null
    const neighbors = new Set<string>()
    neighbors.add(focus.id)
    for (const l of data.links) {
      const sId = typeof l.source === 'string' ? l.source : l.source.id
      const tId = typeof l.target === 'string' ? l.target : l.target.id
      if (sId === focus.id) neighbors.add(tId)
      if (tId === focus.id) neighbors.add(sId)
    }
    return neighbors
  }, [focus, data])

  function toggleType(t: NodeType) {
    setEnabledTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  function focusNode(node: GraphNode) {
    setSelected(node)
    if (fgRef.current && typeof node.x === 'number' && typeof node.y === 'number') {
      fgRef.current.centerAt(node.x, node.y, 600)
      fgRef.current.zoom(3, 600)
    }
  }

  const matchIds = (view as { matchIds?: Set<string> }).matchIds ?? new Set<string>()

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative w-full bg-[#0a1018] rounded-2xl border border-white/8 overflow-hidden',
        fullscreen ? 'fixed inset-2 z-50 rounded-2xl' : 'h-[calc(100vh-12rem)] min-h-[600px]'
      )}
    >
      {/* Subtle dotted grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-start gap-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the graph..."
            className="w-56 bg-transparent text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-[var(--color-text-muted)] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1" />

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Reload"
            title="Reload graph data"
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            type="button"
            onClick={() => fgRef.current?.zoomToFit(600, 80)}
            className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors"
            aria-label="Zoom to fit"
            title="Zoom to fit"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle fullscreen"
            title="Toggle fullscreen"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Legend / filters bottom-left */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
        <div className="px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl max-w-sm">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Show / hide</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TYPES.map((t) => {
              const cfg = TYPE_CONFIG[t]
              const on = enabledTypes.has(t)
              const Icon = cfg.icon
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors',
                    on
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-transparent text-[var(--color-text-muted)] border-white/8 line-through opacity-50'
                  )}
                  style={on ? { boxShadow: `inset 0 0 0 1px ${cfg.color}40` } : undefined}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stats bottom-right */}
      {data && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
          <div className="px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-[var(--color-text-muted)]">
            <span className="text-white font-medium">{view.nodes.length}</span> nodes
            <span className="mx-2 opacity-50">·</span>
            <span className="text-white font-medium">{view.links.length}</span> links
            {search && (
              <>
                <span className="mx-2 opacity-50">·</span>
                <span className="text-[var(--color-accent)] font-medium">{matchIds.size}</span> matches
              </>
            )}
          </div>
        </div>
      )}

      {/* Graph canvas */}
      {loading && !data && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" /> Building graph...
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="px-4 py-3 rounded-xl bg-[var(--color-cta)]/10 border border-[var(--color-cta)]/30 text-sm text-[var(--color-cta)]">
            {error}
          </div>
        </div>
      )}
      {data && (
        <ForceGraph2D
          ref={fgRef as never}
          graphData={view as never}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          enableNodeDrag={true}
          cooldownTicks={120}
          warmupTicks={50}
          linkColor={(link) => {
            const l = link as GraphLink
            const sId = typeof l.source === 'string' ? l.source : l.source.id
            const tId = typeof l.target === 'string' ? l.target : l.target.id
            if (focusNeighbors && (!focusNeighbors.has(sId) || !focusNeighbors.has(tId))) {
              return 'rgba(255,255,255,0.04)'
            }
            return focus ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'
          }}
          linkWidth={(link) => {
            const l = link as GraphLink
            const sId = typeof l.source === 'string' ? l.source : l.source.id
            const tId = typeof l.target === 'string' ? l.target : l.target.id
            return focusNeighbors && focusNeighbors.has(sId) && focusNeighbors.has(tId) ? 1.5 : 0.5
          }}
          linkDirectionalParticles={focus ? 2 : 0}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleSpeed={0.005}
          nodeRelSize={4}
          nodeVal={(n) => Math.max(1, ((n as GraphNode).val ?? 1))}
          nodeLabel={(n) => `${(n as GraphNode).label} (${TYPE_CONFIG[(n as GraphNode).type].label})`}
          onNodeHover={(n) => setHovered((n as GraphNode | null) ?? null)}
          onNodeClick={(n) => focusNode(n as GraphNode)}
          onBackgroundClick={() => setSelected(null)}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GraphNode
            const cfg = TYPE_CONFIG[n.type]
            const size = Math.max(3, Math.sqrt((n.val ?? 1)) * 3.2)
            const isMatch = !search || matchIds.has(n.id)
            const dimmed = focusNeighbors ? !focusNeighbors.has(n.id) : !isMatch
            const alpha = dimmed ? 0.18 : 1

            // Outer glow when hovered or selected
            if (focus && focus.id === n.id) {
              ctx.beginPath()
              ctx.arc(n.x ?? 0, n.y ?? 0, size + 6, 0, 2 * Math.PI)
              ctx.fillStyle = cfg.color + '40'
              ctx.fill()
            }

            // Body
            ctx.beginPath()
            ctx.arc(n.x ?? 0, n.y ?? 0, size, 0, 2 * Math.PI)
            ctx.fillStyle = cfg.color + (dimmed ? '30' : 'ff')
            ctx.fill()

            // Stroke
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.35 * alpha})`
            ctx.lineWidth = 1
            ctx.stroke()

            // Label — only at zoom > 1.2 or for hubs (val >= 5)
            const showLabel = globalScale > 1.2 || (n.val ?? 0) >= 5 || (focus && focus.id === n.id)
            if (showLabel && !dimmed) {
              const fontSize = Math.max(10, 11 / Math.sqrt(globalScale))
              ctx.font = `${focus && focus.id === n.id ? '600' : '500'} ${fontSize}px ui-sans-serif, system-ui`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'top'
              ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * alpha})`
              // Background pill for contrast
              const label = n.label.length > 32 ? n.label.slice(0, 30) + '…' : n.label
              const metrics = ctx.measureText(label)
              const padX = 4
              const padY = 2
              ctx.fillStyle = `rgba(15, 27, 45, ${0.7 * alpha})`
              ctx.fillRect(
                (n.x ?? 0) - metrics.width / 2 - padX,
                (n.y ?? 0) + size + 3,
                metrics.width + padX * 2,
                fontSize + padY * 2
              )
              ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * alpha})`
              ctx.fillText(label, n.x ?? 0, (n.y ?? 0) + size + 3 + padY)
            }
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            const n = node as GraphNode
            const size = Math.max(6, Math.sqrt((n.val ?? 1)) * 3.2 + 3)
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(n.x ?? 0, n.y ?? 0, size, 0, 2 * Math.PI)
            ctx.fill()
          }}
        />
      )}

      {/* Detail panel */}
      {selected && (
        <div className="absolute top-20 right-4 z-10 w-80 max-w-[calc(100%-2rem)] pointer-events-auto">
          <div className="rounded-2xl bg-black/80 backdrop-blur-xl border border-white/12 shadow-2xl overflow-hidden">
            <div
              className="px-4 py-3 flex items-start justify-between gap-2"
              style={{
                background: `linear-gradient(135deg, ${TYPE_CONFIG[selected.type].color}30, transparent)`,
              }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      background: TYPE_CONFIG[selected.type].color + '20',
                      color: TYPE_CONFIG[selected.type].color,
                    }}
                  >
                    {TYPE_CONFIG[selected.type].label}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white leading-tight break-words">{selected.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="shrink-0 p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-4 py-3 space-y-2 text-xs">
              {selected.meta && Object.entries(selected.meta as Record<string, unknown>).map(([k, v]) => {
                if (!v || k === 'href') return null
                return (
                  <div key={k} className="flex items-baseline gap-2">
                    <span className="text-[var(--color-text-muted)] uppercase tracking-wide text-[10px] w-16 shrink-0">{k}</span>
                    <span className="text-white break-words">{String(v)}</span>
                  </div>
                )
              })}
              <div className="flex items-baseline gap-2">
                <span className="text-[var(--color-text-muted)] uppercase tracking-wide text-[10px] w-16 shrink-0">links</span>
                <span className="text-white">{(focusNeighbors?.size ?? 1) - 1} connections</span>
              </div>
            </div>

            {(selected.meta?.href as string | undefined) && (
              <div className="px-4 py-3 border-t border-white/8">
                <Link
                  href={selected.meta!.href as string}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline"
                >
                  Open in CRM <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Connected nodes preview */}
            {focusNeighbors && focusNeighbors.size > 1 && data && (
              <div className="px-4 py-3 border-t border-white/8 max-h-56 overflow-y-auto">
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Connected</p>
                <ul className="space-y-1">
                  {data.nodes
                    .filter((n) => focusNeighbors.has(n.id) && n.id !== selected.id)
                    .slice(0, 20)
                    .map((n) => {
                      const cfg = TYPE_CONFIG[n.type]
                      return (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => focusNode(n)}
                            className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-white/8 text-xs text-left"
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                            <span className="text-white truncate flex-1">{n.label}</span>
                            <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">{cfg.label}</span>
                          </button>
                        </li>
                      )
                    })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover tooltip when nothing selected */}
      {!selected && hovered && (
        <div className="absolute top-20 right-4 z-10 max-w-xs pointer-events-none">
          <div
            className="px-3 py-2 rounded-lg bg-black/80 backdrop-blur-md border text-xs text-white shadow-xl"
            style={{ borderColor: TYPE_CONFIG[hovered.type].color + '50' }}
          >
            <p className="font-semibold truncate">{hovered.label}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              {TYPE_CONFIG[hovered.type].label} · {(hovered.val ?? 1) - 1} connection{((hovered.val ?? 1) - 1) === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
