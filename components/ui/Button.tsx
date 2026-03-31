'use client'

import { forwardRef } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'cta'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  href?: string
  external?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[#1F4E78] hover:bg-[#1a4366] text-white border border-[#1F4E78] hover:border-[#1a4366]',
  secondary:
    'bg-transparent hover:bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/50 hover:border-[#00D4AA]',
  ghost:
    'bg-transparent hover:bg-white/5 text-[var(--text-muted)] hover:text-white border border-transparent',
  cta: 'bg-[#FF6B6B] hover:bg-[#ff5252] text-white border border-[#FF6B6B] hover:border-[#ff5252] shadow-lg shadow-[#FF6B6B]/20 hover:shadow-[#FF6B6B]/40',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm gap-1.5',
  md: 'px-6 py-3 text-base gap-2',
  lg: 'px-8 py-4 text-lg gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      href,
      external,
      loading,
      icon,
      iconPosition = 'left',
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1B2D] disabled:opacity-50 disabled:pointer-events-none select-none'

    const classes = clsx(base, variants[variant], sizes[size], className)

    const content = (
      <>
        {loading && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </>
    )

    if (href) {
      const linkProps = external
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {}
      return (
        <Link href={href} className={classes} {...linkProps}>
          {content}
        </Link>
      )
    }

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {content}
      </button>
    )
  }
)

Button.displayName = 'Button'
