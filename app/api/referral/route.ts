import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    const {
      referrer_name,
      referrer_email,
      business_name,
      contact_name,
      contact_email,
      contact_phone,
      service_needed,
      notes,
    } = data

    if (!referrer_name || !business_name || !contact_name || !contact_email || !service_needed) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const body = `
New ConnectEx Referral

Referred by: ${referrer_name}${referrer_email ? ` <${referrer_email}>` : ''}

Business: ${business_name}
Contact: ${contact_name}
Email: ${contact_email}
Phone: ${contact_phone || 'Not provided'}
Service needed: ${service_needed}

Notes: ${notes || 'None'}

---
Sent from connectex.net/partners
    `.trim()

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ConnectEx Website <noreply@connectex.net>',
          to: ['mark@connectex.net'],
          subject: `New referral: ${business_name} — ${service_needed}`,
          text: body,
        }),
      })
    } else {
      console.log('REFERRAL SUBMISSION:', body)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Referral form error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
