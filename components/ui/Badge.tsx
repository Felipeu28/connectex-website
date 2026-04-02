import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'accent' | 'primary' | 'cta' | 'muted' | 'outline'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  accent: 'bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/20',
  primary: 'bg-[#8B2BE2]/20 text-[#60A5FA] border border-[#8B2BE2]/30',
  cta: 'bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20',
  muted: 'bg-white/5 text-[#94A3B8] border border-white/10',
  outline: 'bg-transparent text-[#94A3B8] border border-white/20',
}

const sizes = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
}

export function Badge({ children, variant = 'accent', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
