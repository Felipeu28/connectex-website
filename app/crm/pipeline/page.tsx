'use client'

import { useEffect, useState } from 'react'
import { DealModal } from '@/components/crm/DealModal'
import { listDeals, listAllContacts, moveDeal as moveDealAction } from '@/app/actions/crm'
import { PIPELINE_STAGES, type Deal, type Contact, type PipelineStage } from '@/lib/crm-types'
import { Plus, GripVertical, Kanban, TrendingUp, Trophy, XCircle } from 'lucide-react'
import { clsx } from 'clsx'

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)
  const [addToStage, setAddToStage] = useState<PipelineStage | undefined>()
  const [dragDealId, setDragDealId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    const [deals, contacts] = await Promise.all([listDeals(), listAllContacts()])
    setDeals(deals)
    setContacts(contacts)
    setLoading(false)
  }

  async function moveDeal(dealId: string, newStage: PipelineStage) {
    const deal = deals.find((d) => d.id === dealId)
    if (!deal || deal.stage === newStage) return
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)))
    await moveDealAction(dealId, newStage)
  }

  const activeStages = PIPELINE_STAGES.filter((s) => s.key !== 'closed_won' && s.key !== 'closed_lost')
  const closedWon = PIPELINE_STAGES.find((s) => s.key === 'closed_won')
  const closedLost = PIPELINE_STAGES.find((s) => s.key === 'closed_lost')
  const stageDeals = (k: PipelineStage) => deals.filter((d) => d.stage === k)
  const stageTotal = (k: PipelineStage) => stageDeals(k).reduce((sum, d) => sum + Number(d.value), 0)
  const totalPipeline = deals.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost').reduce((sum, d) => sum + Number(d.value), 0)
  const wonTotal = stageTotal('closed_won')
  const lostTotal = stageTotal('closed_lost')

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
          <div className="space-y-2">
            <div className="eyebrow"><Kanban className="w-3 h-3" />Revenue Board</div>
            <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
            <p className="text-[13px] text-white/50">Drag any deal between stages to update it. Linked contacts are kept in sync.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="surface-1 rounded-lg px-4 py-2">
              <div className="text-[10.5px] tracking-[0.18em] uppercase text-white/40 font-semibold">Open Pipeline</div>
              <div className="text-[18px] font-bold font-mono text-aurora">${totalPipeline.toLocaleString()}</div>
            </div>
            <button onClick={() => { setEditDeal(null); setAddToStage(undefined); setModalOpen(true) }} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-r from-[#8B2BE2] to-[#4B6CF7] hover:shadow-[0_8px_28px_-8px_rgba(139,43,226,0.7)] text-white text-[13px] font-semibold transition-shadow">
              <Plus className="w-4 h-4" />New Deal
            </button>
          </div>
        </header>
        <div className="overflow-x-auto -mx-4 lg:-mx-8 px-4 lg:px-8">
          <div className="flex gap-4 min-w-max pb-4">
            {activeStages.map((stage) => {
              const columnDeals = stageDeals(stage.key)
              const total = stageTotal(stage.key)
              const isOver = dragOverStage === stage.key
              return (
                <div key={stage.key} className={clsx('w-[280px] flex-shrink-0 rounded-xl transition-colors', isOver && 'bg-white/[0.04]')}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverStage(stage.key) }}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOverStage(null); if (dragDealId) { void moveDeal(dragDealId, stage.key); setDragDealId(null) } }}>
                  <div className="px-2 py-2 mb-2 sticky top-0 z-10 bg-[#0a1218]/80 backdrop-blur-md rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: stage.color, boxShadow: `0 0 12px ${stage.color}` }} />
                        <span className="text-[12.5px] font-semibold text-white tracking-wide">{stage.label}</span>
                        <span className="text-[11px] text-white/40 font-mono">{columnDeals.length}</span>
                      </div>
                      <button onClick={() => { setEditDeal(null); setAddToStage(stage.key); setModalOpen(true) }} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white" aria-label={`Add deal to ${stage.label}`}>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {total > 0 && <div className="text-[11px] text-white/40 font-mono mt-0.5 pl-4">${total.toLocaleString()}</div>}
                    <div className="h-[2px] mt-2 rounded-full" style={{ background: `linear-gradient(90deg, ${stage.color}, transparent)` }} />
                  </div>
                  <div className="space-y-2 min-h-[120px] px-1">
                    {loading ? [...Array(2)].map((_, i) => <div key={i} className="h-20 rounded-xl shimmer" />)
                      : columnDeals.length === 0 ? <div className="text-[11.5px] text-white/30 text-center py-6 border border-dashed border-white/10 rounded-lg">Drop a deal here</div>
                      : columnDeals.map((deal) => (
                        <div key={deal.id} draggable onDragStart={() => setDragDealId(deal.id)} onDragEnd={() => setDragDealId(null)} onClick={() => { setEditDeal(deal); setAddToStage(undefined); setModalOpen(true) }} className={clsx('group surface-2 rounded-xl p-3 cursor-pointer hover:translate-y-[-1px] transition-transform', dragDealId === deal.id && 'opacity-40')}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-[13px] font-semibold text-white leading-snug">{deal.title}</div>
                            <GripVertical className="w-3.5 h-3.5 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                          </div>
                          {deal.contact && (
                            <div className="text-[11.5px] text-white/50 mt-1.5 truncate">
                              {(deal.contact as unknown as Contact).name}
                              {(deal.contact as unknown as Contact).company && <span className="text-white/30"> · {(deal.contact as unknown as Contact).company}</span>}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t hairline">
                            <span className="text-[12.5px] font-mono font-bold text-[#00C9A7]">${Number(deal.value).toLocaleString()}</span>
                            {deal.expected_close && <span className="text-[10.5px] text-white/40 font-mono">{new Date(deal.expected_close).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {closedWon && (
            <div className="surface-2 rounded-xl p-5 relative overflow-hidden">
              <div aria-hidden className="absolute -top-12 -right-8 w-40 h-40 rounded-full opacity-30" style={{ background: `radial-gradient(closest-side, ${closedWon.color}, transparent)` }} />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="eyebrow !text-[#00C9A7]"><Trophy className="w-3 h-3" />Closed Won</div>
                  <div className="text-2xl font-bold mt-2 font-mono">${wonTotal.toLocaleString()}</div>
                  <div className="text-[12px] text-white/50 mt-0.5">{stageDeals('closed_won').length} deal{stageDeals('closed_won').length === 1 ? '' : 's'} won</div>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00C9A7]/15 border border-[#00C9A7]/30"><TrendingUp className="w-4 h-4 text-[#00C9A7]" /></div>
              </div>
            </div>
          )}
          {closedLost && (
            <div className="surface-2 rounded-xl p-5 relative overflow-hidden">
              <div aria-hidden className="absolute -top-12 -right-8 w-40 h-40 rounded-full opacity-25" style={{ background: `radial-gradient(closest-side, ${closedLost.color}, transparent)` }} />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="eyebrow !text-[#FF6B6B]"><XCircle className="w-3 h-3" />Closed Lost</div>
                  <div className="text-2xl font-bold mt-2 font-mono">${lostTotal.toLocaleString()}</div>
                  <div className="text-[12px] text-white/50 mt-0.5">{stageDeals('closed_lost').length} deal{stageDeals('closed_lost').length === 1 ? '' : 's'} lost</div>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FF6B6B]/15 border border-[#FF6B6B]/30"><XCircle className="w-4 h-4 text-[#FF6B6B]" /></div>
              </div>
            </div>
          )}
        </section>
      </div>
      <DealModal deal={editDeal} contacts={contacts} defaultStage={addToStage} open={modalOpen} onClose={() => { setModalOpen(false); setEditDeal(null) }} onSaved={load} />
    </>
  )
}
