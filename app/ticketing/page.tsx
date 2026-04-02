import { Headset, Clock, Shield } from 'lucide-react'
import { TicketForm } from '@/components/ticketing/TicketForm'

export default function TicketingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-light)]">
          IT Support Portal
        </h1>
        <p className="text-[var(--color-text-muted)] max-w-lg mx-auto">
          Describe your issue below and our team will get back to you. No account needed — you will
          receive a private link to track your ticket.
        </p>
      </div>

      {/* Trust indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Headset,
            title: 'Expert Support',
            desc: '20+ years of technology experience',
          },
          {
            icon: Clock,
            title: 'Fast Response',
            desc: 'Most tickets answered within 24h',
          },
          {
            icon: Shield,
            title: 'Secure & Private',
            desc: 'Token-based access, no login required',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="glass rounded-xl p-4 flex items-start gap-3"
          >
            <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
              <item.icon className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-light)]">{item.title}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <TicketForm />
      </div>
    </div>
  )
}
