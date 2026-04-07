import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    const { name, company, domain, challenge, timeline, email, phone, how_heard } = data

    if (!name || !company || !domain || !challenge || !timeline || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const body = `
New Connectex Lead

Name: ${name}
Company: ${company}
Domain to scan: ${domain}
Email: ${email}
Phone: ${phone || 'Not provided'}

Challenge: ${challenge}
Timeline: ${timeline}

How they heard: ${how_heard || 'Not provided'}

---
Sent from connectex.net contact form
    `.trim()

    // If Resend API key is configured, send the email
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Connectex Website <noreply@connectex.net>',
          to: ['mark@connectex.net'],
          subject: `New lead: ${name} — ${company} (${domain})`,
          text: body,
        }),
      })
      if (!res.ok) {
        console.error('Resend error:', await res.text())
      }
    } else {
      // Log to console if no email service configured (dev mode)
      console.log('CONTACT FORM SUBMISSION:', body)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
