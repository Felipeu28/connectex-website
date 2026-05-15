'use client'

import { useState } from 'react'
import { BookOpen, MessageSquare, Ticket, Headset, Clock, Shield } from 'lucide-react'
import { clsx } from 'clsx'
import { TicketForm } from '@/components/ticketing/TicketForm'
import { HelpBrowse } from '@/components/ticketing/HelpBrowse'
import { AiChat } from '@/components/ticketing/AiChat'

type Tab = 'browse' | 'chat' | 'ticket'

export function TicketingPortal() {
  const [tab, setTab] = useState<Tab>('browse')
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined)
  const [chatResetKey, setChatResetKey] = useState(0)

  function openChatWith(prompt?: string) {
    setChatPrompt(prompt)
    setChatResetKey((k) => k + 1)
    setTab('chat')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-light)]">
          IT Support Portal
        </h1>
        <p className="text-[var(--color-text-muted)] max-w-lg mx-auto">
          Browse self-serve walkthroughs, ask our AI assistant, or open a ticket — Mark personally
          replies to anything our AI can&apos;t solve.
        </p>
      </div>

      {/* Trust indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Headset, title: 'Expert Support', desc: '20+ years of technology experience' },
          { icon: Clock, title: 'Fast Response', desc: 'AI replies instantly. Mark within 24h.' },
          { icon: Shield, title: 'Secure & Private', desc: 'Token-based access, no login required' },
        ].map((item) => (
          <div key={item.title} className="glass rounded-xl p-4 flex items-start gap-3">
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

      {/* Tabs */}
      <div className="glass rounded-2xl p-1.5 flex gap-1.5">
        {([
          { key: 'browse' as Tab, label: 'Browse help', icon: BookOpen },
          { key: 'chat' as Tab, label: 'Ask the AI', icon: MessageSquare },
          { key: 'ticket' as Tab, label: 'Open a ticket', icon: Ticket },
        ]).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-[var(--color-accent)] text-black'
                : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/8'
            )}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="glass rounded-2xl p-6 sm:p-8" id={tab === 'ticket' ? 'new-ticket' : undefined}>
        {tab === 'browse' && <HelpBrowse onAskAi={(p) => openChatWith(p)} />}
        {tab === 'chat' && <AiChat initialPrompt={chatPrompt} resetKey={chatResetKey} />}
        {tab === 'ticket' && <TicketForm />}
      </div>

      {/* Quick links between tabs when on browse */}
      {tab === 'browse' && (
        <div className="text-center text-sm text-[var(--color-text-muted)]">
          Didn&apos;t find what you needed?{' '}
          <button
            type="button"
            onClick={() => openChatWith()}
            className="text-[var(--color-accent)] hover:underline"
          >
            Ask the AI
          </button>{' '}
          or{' '}
          <button
            type="button"
            onClick={() => setTab('ticket')}
            className="text-[var(--color-accent)] hover:underline"
          >
            open a ticket
          </button>
          .
        </div>
      )}
    </div>
  )
}
