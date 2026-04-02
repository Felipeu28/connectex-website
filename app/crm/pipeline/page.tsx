'use client'

import { useEffect, useState } from 'react'
import { CRMShell } from '@/components/crm/CRMShell'
import { DealModal } from '@/components/crm/DealModal'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { PIPELINE_STAGES, type Deal, type Contact, type PipelineStage } from '@/lib/crm-types'
import { logActivity } from '@/lib/crm-activity'
import { Plus, DollarSign, GripVertical } from 'lucide-react'
import { clsx } from 'clsx'

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)
  const [addToStage, setAddToStage] = useState<PipelineStage | undefined>()
  const [dragDealId, setDragDealId] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowser()
      const [dealsRes, contactsRes] = await Promise.all([
        supabase.from('crm_deals').select('*, contact:crm_contacts(id,name,company)').order('created_at', { ascending: false }),
        supabase.from('crm_contacts').select('*').order('name'),
      ])
      setDeals(dealsRes.data ?? [])
      setContacts(contactsRes.data ?? [])
      setLoading(false)
    })()
  }, [])

  async function load() {
    const supabase = createSupabaseBrowser()
    const [dealsRes, contactsRes] = await Promise.all([
      supabase.from('crm_deals').select('*, contact:crm_contacts(id,name,company)').order('created_at', { ascending: false }),
      supabase.from('crm_contacts').select('*').order('name'),
    ])
    setDeals(dealsRes.data ?? [])
    setContacts(contactsRes.data ?? [])
    setLoading(false)
  }

  async function moveDeal(dealId: string, newStage: PipelineStage) {
    const supabase = createSupabaseBrowser()
    const deal = deals.find((d) => d.id === dealId)
    const oldStageLabel = PIPELINE_STAGES.find((s) => s.key === deal?.stage)?.label ?? deal?.stage
    const newStageLabel = PIPELINE_STAGES.find((s) => s.key === newStage)?.label ?? newStage

    setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, stage: newStage } : d))
    await supabase.from('crm_deals').update({ stage: newStage, updated_at: new Date().toISOString() }).eq('id', dealId)

    const isClosed = newStage === 'closed_won' || newStage === 'closed_lost'
    await logActivity({
      type: isClosed ? 'deal_closed' : 'deal_moved',
      description: isClosed
        ? `Deal "${deal?.title}" closed as ${newStageLabel}`
        : `Moved "${deal?.title}" from ${oldStageLabel} to ${newStageLabel}`,
      deal_id: dealId,
      contact_id: deal?.contact_id ?? undefined,
      metadata: { from: deal?.stage, to: newStage },
    })
  }

  function handleDragStart(dealId: string) {
    setDragDealId(dealId)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: React.DragEvent, stage: PipelineStage) {
    e.preventDefault()
    if (dragDealId) {
      moveDeal(dragDealId, stage)
      setDragDealId(null)
    }
  }

  // Only show active stages in kanban (not closed)
  const activeStages = PIPELINE_STAGES.filter((s) => s.key !== 'closed_won' && s.key !== 'closed_lost')
  const closedStages = PIPELINE_STAGES.filter((s) => s.key === 'closed_won' || s.key === 'closed_lost')

  function stageDeals(stageKey: PipelineStage) {
    return deals.filter((d) => d.stage === stageKey)
  }

  function stageTotal(stageKey: PipelineStage) {
    return stageDeals(stageKey).reduce((sum, d) => sum + Number(d.value), 0)
  }

  const totalPipeline = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + Number(d.value), 0)

  return (
    <CRMShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Pipeline</h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-0.5">
              {deals.length} deal{deals.length !== 1 ? 's' : ''} &middot; Total: ${totalPipeline.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => { setEditDeal(null); setAddToStage(undefined); setModalOpen(true) }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] font-semibold text-sm rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </button>
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6">
          <div className="flex gap-4 min-w-max pb-4">
            {activeStages.map((stage) => {
              const columnDeals = stageDeals(stage.key)
              const total = stageTotal(stage.key)
              return (
                <div
                  key={stage.key}
                  className="w-72 flex-shrink-0"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.key)}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-sm font-semibold text-white">{stage.label}</span>
                      <span className="text-xs text-[var(--color-text-faint)] bg-white/5 px-1.5 py-0.5 rounded">
                        {columnDeals.length}
                      </span>
                    </div>
                    <button
                      onClick={() => { setEditDeal(null); setAddToStage(stage.key); setModalOpen(true) }}
                      className="p-1 rounded hover:bg-white/10 text-[var(--color-text-faint)] hover:text-white transition-colors"
                      aria-label={`Add deal to ${stage.label}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {total > 0 && (
                    <p className="text-xs text-[var(--color-text-faint)] mb-2 px-1">
                      ${total.toLocaleString()}
                    </p>
                  )}

                  {/* Cards */}
                  <div className="space-y-2 min-h-[100px] bg-white/[0.02] rounded-xl p-2">
                    {loading ? (
                      [...Array(2)].map((_, i) => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-lg" />)
                    ) : columnDeals.length === 0 ? (
                      <p className="text-xs text-[var(--color-text-faint)] text-center py-6">No deals</p>
                    ) : (
                      columnDeals.map((deal) => (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={() => handleDragStart(deal.id)}
                          onClick={() => { setEditDeal(deal); setAddToStage(undefined); setModalOpen(true) }}
                          className={clsx(
                            'glass rounded-lg p-3 cursor-pointer hover:bg-white/[0.06] transition-all group',
                            dragDealId === deal.id && 'opacity-50'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium text-white leading-tight">{deal.title}</p>
                            <GripVertical className="w-3.5 h-3.5 text-[var(--color-text-faint)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                          </div>
                          {deal.contact && (
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                              {(deal.contact as unknown as Contact).name}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-medium text-[#00C9A7] flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {Number(deal.value).toLocaleString()}
                            </span>
                            {deal.expected_close && (
                              <span className="text-xs text-[var(--color-text-faint)]">
                                {new Date(deal.expected_close).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Closed Deals Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {closedStages.map((stage) => {
            const columnDeals = stageDeals(stage.key)
            const total = stageTotal(stage.key)
            return (
              <div key={stage.key} className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm font-semibold text-white">{stage.label}</span>
                  <span className="text-xs text-[var(--color-text-faint)] bg-white/5 px-1.5 py-0.5 rounded">{columnDeals.length}</span>
                </div>
                <p className="text-lg font-bold text-white">${total.toLocaleString()}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{columnDeals.length} deal{columnDeals.length !== 1 ? 's' : ''}</p>
              </div>
            )
          })}
        </div>
      </div>

      <DealModal
        deal={editDeal}
        contacts={contacts}
        defaultStage={addToStage}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditDeal(null) }}
        onSaved={load}
      />
    </CRMShell>
  )
}
