import { NextResponse } from 'next/server'
import { getStoredTokens, clearTokens } from '@/lib/google-tokens'

export async function GET() {
  const tokens = await getStoredTokens()
  return NextResponse.json({
    connected: !!tokens,
    email: tokens?.email ?? null,
  })
}

export async function DELETE() {
  await clearTokens()
  return NextResponse.json({ connected: false })
}
