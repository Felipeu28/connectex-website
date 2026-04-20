'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { Mail, ArrowRight, Check, Headphones } from 'lucide-react'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createSupabaseBrowser()
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/portal/auth/callback`
        : '/portal/auth/callback'

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F1B2D]">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#8B2BE2]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#8B2BE2] to-[#00C9A7] flex items-center justify-center">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none text-left">
              <span className="text-lg font-bold tracking-tight text-white">CONNECTEX</span>
              <span className="text-[10px] font-semibold tracking-[0.2em] text-[#00C9A7]">
                SUPPORT PORTAL
              </span>
            </div>
          </div>
          <p className="text-sm text-[#94A3B8]">
            Sign in to view your tickets and device inventory
          </p>
        </div>

        <div className="glass rounded-2xl p-8" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#00C9A7]/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#00C9A7]" />
              </div>
              <h1 className="text-xl font-semibold text-white mb-2">Check your email</h1>
              <p className="text-[#94A3B8] text-sm leading-relaxed">
                We sent a sign-in link to{' '}
                <span className="text-white font-medium">{email}</span>.
                <br />
                Click it to access your portal — no password needed.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-xs text-[#94A3B8] hover:text-white transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white mb-1">Sign in</h1>
              <p className="text-[#94A3B8] text-sm mb-6">
                Enter your email and we&apos;ll send you a secure sign-in link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-[#FF6B6B] text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 bg-[#8B2BE2] hover:bg-[#7624c4] text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      Send Sign-In Link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Help link */}
        <p className="text-center text-[#4B5563] text-xs mt-6">
          Need help?{' '}
          <Link href="/ticketing" className="text-[#00C9A7] hover:underline">
            Submit a ticket without signing in
          </Link>
        </p>
      </div>
    </div>
  )
}
