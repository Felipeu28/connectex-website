import { clsx } from 'clsx'
import type { TicketStatus, TicketPriority } from '@/lib/ticket-types'

const statusStyles: Record<TicketStatus, string> = {
  open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  waiting: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  closed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const statusLabels: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
}

const priorityStyles: Record<TicketPriority, string> = {
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const priorityLabels: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

interface StatusBadgeProps {
  status: TicketStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border',
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: TicketPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border',
        priorityStyles[priority],
        className
      )}
    >
      {priorityLabels[priority]}
    </span>
  )
}
