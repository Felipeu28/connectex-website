import { CRMShell } from '@/components/crm/CRMShell'
import { BrainGraph } from '@/components/crm/BrainGraph'

export const metadata = {
  title: 'Brain Graph — Connectex CRM',
  robots: { index: false, follow: false },
}

export default function GraphPage() {
  return (
    <CRMShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Brain Graph</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Everything Connectex touches, in one network. Click a node to focus it; drag to reposition; scroll to zoom.
          </p>
        </div>
        <BrainGraph />
      </div>
    </CRMShell>
  )
}
