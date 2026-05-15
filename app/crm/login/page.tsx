'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { Mail, Lock, ArrowRight } from 'lucide-react'

export default function CRMLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createSupabaseBrowser()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/crm/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F1B2D]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <Image
              src="/logos/logo-symbol.png"
              alt="Connectex"
              width={52}
              height={52}
              className="w-13 h-13"
              priority
            />
            <div className="flex flex-col leading-none text-left">
              <span className="text-xl font-bold tracking-tight text-white">
                CONNECTEX
              </span>
              <span className="text-[11px] font-semibold tracking-[0.2em] text-[#00C9A7]">
                SOLUTIONS
              </span>
              <span className="text-[10px] font-medium text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">
                CRM Platform
              </span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-8">
          <h1 className="text-xl font-semibold text-white mb-1">Sign in to CRM</h1>
          <p className="text-[var(--color-text-muted)] text-sm mb-6">
            Enter your email and password to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mark@connectex.net"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-[#FF6B6B] text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 bg-[#00C9A7] hover:bg-[#00b394] text-[#0F1B2D] font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[var(--color-text-faint)] text-xs mt-6">
          Admin access only. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  )
}
