import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { getSendConfig } from '@/lib/email-send'

export async function GET() {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  const config = getSendConfig()
  return NextResponse.json({
    ready: config.resend_key_set,
    sender: config.from_email,
    site_url: config.site_url,
    cron_secret_set: Boolean(process.env.CRON_SECRET),
    notes: config.resend_key_set
      ? `Emails send from "${config.from_email}". Ensure this domain is verified in Resend.`
      : 'RESEND_API_KEY is not set — campaigns and sequences will NOT send. Set it in Vercel project env vars.',
  })
}
