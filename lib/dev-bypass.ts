// lib/dev-bypass.ts
// Auth bypass controlled solely by the DEV_BYPASS_AUTH env var.
// Set DEV_BYPASS_AUTH=1 in Vercel (any environment) to disable auth.
// Unset it to re-enable auth across the board.

export const DEV_BYPASS_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'dev-bypass@connectex.local',
}

export function isAuthBypassed(): boolean {
  return process.env.DEV_BYPASS_AUTH === '1'
}
