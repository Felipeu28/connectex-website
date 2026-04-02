import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('google_tokens')?.value
  return NextResponse.json({ connected: !!raw })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('google_tokens')
  return NextResponse.json({ connected: false })
}
