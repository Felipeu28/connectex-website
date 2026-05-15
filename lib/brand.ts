/**
 * Connectex brand identity reference.
 *
 * This file is the single source of truth for brand metadata that needs to be
 * accessible from TS code (page metadata, schema.org payloads, AI prompts,
 * email signatures, share cards). For pure design tokens (colors, radii,
 * shadows) see `app/globals.css` — this file mirrors them as constants only
 * where code-level access is useful.
 */

export const brand = {
  name: 'Connectex',
  legalName: 'Connectex Solutions',
  tagline: 'Technology Advisory for Austin SMBs',
  positioning:
    'A sophisticated technology advisory practice helping Austin small and mid-sized businesses modernize infrastructure, secure operations, and unlock growth.',
  product: 'Connectex CRM',
  productTagline: 'A command center for Austin’s most technical advisory practice.',

  voice: {
    pillars: ['Confident', 'Calm', 'Specific', 'Earned'],
    avoid: ['Hype words', 'Generic SaaS phrases', 'Buzzword stacking'],
  },

  palette: {
    navy: '#0F1B2D',
    navyDeep: '#0a1218',
    navyCard: '#162030',
    navyBorder: '#1e2f45',
    primary: '#8B2BE2',     // brand purple
    secondary: '#4B6CF7',   // brand blue
    accent: '#00C9A7',      // brand teal — success / active
    cta: '#FF6B6B',         // CTA red — destructive / urgent
    warn: '#F59E0B',
    info: '#60A5FA',
  },

  gradients: {
    spectrum: 'linear-gradient(135deg, #8B2BE2 0%, #4B6CF7 50%, #00C9A7 100%)',
    aurora:   'linear-gradient(135deg, #8B2BE2 0%, #4B6CF7 100%)',
    deepwater:'linear-gradient(135deg, #0F1B2D 0%, #1a2742 50%, #0F1B2D 100%)',
    halo:     'radial-gradient(circle at 30% 20%, rgba(139,43,226,0.18), transparent 60%), radial-gradient(circle at 80% 60%, rgba(0,201,167,0.12), transparent 55%)',
  },

  typography: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
    display: { weight: 800, tracking: '-0.025em' },
    label:   { weight: 700, tracking: '0.18em', transform: 'uppercase' as const },
  },

  motion: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '220ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '420ms cubic-bezier(0.16, 1, 0.3, 1)',
  },

  contact: {
    supportEmail: 'support@connectex.net',
    advisorEmail: 'mark@connectex.net',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://connectex-website.vercel.app',
  },
} as const

export type Brand = typeof brand
