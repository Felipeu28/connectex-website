'use client'

import { Suspense, useActionState, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { signInAction, type AuthResult } from '@/app/actions/auth'
import { Mail, Lock, ArrowRight, Sparkles, ShieldCheck, Eye, EyeOff } from 'lucide-react'

function LoginInner() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/crm/dashboard'
  const queryError = params.get('error')
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(signInAction, null)
  const [showPassword, setShowPassword] = useState(false)
  const error = state && !state.ok ? state.error : queryError

  return (
    <div className="min-h-screen flex items-center justify-center p-4 crm-shell relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(800px 500px at 30% 20%, rgba(139,43,226,0.18), transparent 60%), radial-gradient(700px 400px at 80% 80%, rgba(0,201,167,0.12), transparent 60%)' }} />
      <div className="absolute inset-0 crm-grid opacity-40 pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#8B2BE2]/25 via-[#4B6CF7]/20 to-[#00C9A7]/25 border border-white/10">
              <Image src="/logos/logo-symbol.png" alt="Connectex" width={32} height={32} className="w-8 h-8" priority />
            </div>
            <div className="flex flex-col leading-none text-left">
              <span className="text-[15px] font-bold tracking-tight text-white">CONNECTEX</span>
              <span className="text-[9px] font-semibold tracking-[0.22em] text-[#00C9A7] mt-1">CRM · CONTROL ROOM</span>
            </div>
          </div>
        </div>
        <div className="surface-2 rounded-2xl p-7">
          <div className="eyebrow mb-2"><Sparkles className="w-3 h-3" />Welcome back</div>
          <h1 className="text-[20px] font-bold tracking-tight text-white mb-1">Welcome back, <span className="text-aurora">advisor.</span></h1>
          <p className="text-[12.5px] text-white/55 mb-6">Sign in to your Connectex CRM workspace.</p>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label htmlFor="email" className="block text-[11px] font-semibold tracking-[0.16em] uppercase text-white/50 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input id="email" name="email" type="email" placeholder="mark@connectex.net" required autoFocus autoComplete="email" className="w-full pl-9 pr-4 h-11 rounded-lg surface-1 text-[13.5px] text-white placeholder:text-white/30 focus:outline-none focus:ring-brand transition-all" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-[11px] font-semibold tracking-[0.16em] uppercase text-white/50 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required autoComplete="current-password" className="w-full pl-9 pr-11 h-11 rounded-lg surface-1 text-[13.5px] text-white placeholder:text-white/30 focus:outline-none focus:ring-brand transition-all" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {error && <div className="rounded-lg border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 px-3 py-2 text-[12.5px] text-[#FF6B6B]">{error}</div>}
            <button type="submit" disabled={pending} className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-gradient-to-r from-[#8B2BE2] to-[#4B6CF7] text-white text-[13.5px] font-semibold shadow-[0_8px_28px_-8px_rgba(139,43,226,0.7)] hover:shadow-[0_12px_32px_-8px_rgba(139,43,226,0.9)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed">
              {pending ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (<>Sign In<ArrowRight className="w-3.5 h-3.5" /></>)}
            </button>
          </form>
        </div>
        <p className="flex items-center justify-center gap-1.5 text-center text-white/30 text-[11px] mt-6">
          <ShieldCheck className="w-3 h-3" />Authorized advisors only. Sessions are end-to-end encrypted.
        </p>
      </div>
    </div>
  )
}

export default function CRMLoginPage() {
  return <Suspense fallback={null}><LoginInner /></Suspense>
}
