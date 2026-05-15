// lib/dev-bypass.ts
// Dev/preview-only auth bypass. NEVER honored in production, even if the
// env var is set — VERCEL_ENV is set by Vercel to 'production' on the live
// deployment, and is 'preview' or undefined elsewhere.

export const DEV_BYPASS_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'dev-bypass@connectex.local',
}

export function isAuthBypassed(): boolean {
  if (process.env.VERCEL_ENV === 'production') return false
  return process.env.DEV_BYPASS_AUTH === '1'
}
