import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const revalidate = 60

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('partners')
      .select('id, name, category, description, website, logo_url, color, featured, sort_order')
      .eq('visible', true)
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    if (error) {
      console.error('Partners public GET error:', error)
      return NextResponse.json([], { status: 200 })
    }
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('Partners public GET exception:', err)
    return NextResponse.json([], { status: 200 })
  }
}
