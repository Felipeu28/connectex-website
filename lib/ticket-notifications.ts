const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://connectex-website.vercel.app').trim()
const RESEND_KEY = process.env.RESEND_API_KEY
const FROM = 'Connectex Support <support@connectex.net>'

interface TicketEmailData {
  clientName: string
  clientEmail: string
  subject: string
  token: string
  ticketId?: string
}

async function sendEmail(to: string, emailSubject: string, html: string) {
  if (!RESEND_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: FROM, to: [to], subject: emailSubject, html }),
  }).catch((err) => console.error('Email send failed:', err))
}

function baseTemplate(content: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#0F1B2D;color:#E8EAED;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#8B2BE2,#4B6CF7,#00C9A7);padding:20px 24px;">
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.1em;">Connectex Solutions</p>
        <h1 style="margin:4px 0 0;font-size:20px;color:#fff;">Support Ticket Update</h1>
      </div>
      <div style="padding:24px;">
        ${content}
        <p style="margin:24px 0 0;font-size:12px;color:#64748B;">
          You are receiving this because you submitted a support ticket with Connectex Solutions.
          Reply directly in your ticket portal — do not reply to this email.
        </p>
      </div>
    </div>
  `
}

/** Notify client that Mark (or AI) has replied to their ticket */
export async function notifyClientNewReply(
  ticket: TicketEmailData,
  replyMessage: string,
  senderName: string
) {
  const ticketUrl = `${SITE_URL}/ticketing/${ticket.token}`
  const isAI = senderName === 'Connectex AI Support'

  const content = `
    <p style="margin:0 0 12px;">Hi ${ticket.clientName},</p>
    <p style="margin:0 0 16px;color:#94A3B8;">
      ${isAI ? 'Our AI support assistant has' : `<strong style="color:#E8EAED;">${senderName}</strong> has`} responded to your ticket:
    </p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-left:3px solid #00C9A7;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:12px;color:#64748B;">Re: ${ticket.subject}</p>
      <p style="margin:0;font-size:14px;white-space:pre-wrap;">${replyMessage}</p>
    </div>
    <a href="${ticketUrl}" style="display:inline-block;background:#00C9A7;color:#0F1B2D;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
      View Full Conversation →
    </a>
  `
  await sendEmail(
    ticket.clientEmail,
    `Re: ${ticket.subject}`,
    baseTemplate(content)
  )
}

/** Notify client when ticket status changes */
export async function notifyClientStatusChange(
  ticket: TicketEmailData,
  newStatus: string
) {
  const ticketUrl = `${SITE_URL}/ticketing/${ticket.token}`

  const statusMessages: Record<string, { label: string; color: string; message: string }> = {
    in_progress: {
      label: 'In Progress',
      color: '#60A5FA',
      message: "We're actively working on your issue.",
    },
    waiting: {
      label: 'Waiting for Info',
      color: '#F59E0B',
      message: 'We need a bit more information from you. Please check the ticket for details.',
    },
    resolved: {
      label: 'Resolved',
      color: '#00C9A7',
      message: 'Great news — your issue has been resolved! If you need further help, reply in the ticket portal.',
    },
    closed: {
      label: 'Closed',
      color: '#94A3B8',
      message: 'This ticket has been closed. Submit a new ticket any time at connectex.net/ticketing.',
    },
  }

  const config = statusMessages[newStatus]
  if (!config) return // don't email on 'open' or unknown statuses

  const content = `
    <p style="margin:0 0 12px;">Hi ${ticket.clientName},</p>
    <p style="margin:0 0 16px;color:#94A3B8;">Your support ticket status has been updated:</p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:13px;color:#94A3B8;">${ticket.subject}</p>
      <span style="display:inline-block;background:${config.color}20;color:${config.color};padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;">
        ${config.label}
      </span>
      <p style="margin:12px 0 0;font-size:14px;color:#E8EAED;">${config.message}</p>
    </div>
    <a href="${ticketUrl}" style="display:inline-block;background:#00C9A7;color:#0F1B2D;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
      View Ticket →
    </a>
  `
  await sendEmail(
    ticket.clientEmail,
    `Ticket Update: ${ticket.subject} — ${config.label}`,
    baseTemplate(content)
  )
}

/** Notify client when ticket is first created (confirmation) */
export async function notifyClientTicketCreated(ticket: TicketEmailData) {
  const ticketUrl = `${SITE_URL}/ticketing/${ticket.token}`

  const content = `
    <p style="margin:0 0 12px;">Hi ${ticket.clientName},</p>
    <p style="margin:0 0 16px;color:#94A3B8;">
      We received your support request and our team is on it. Here's your ticket:
    </p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0;font-size:15px;font-weight:600;">${ticket.subject}</p>
    </div>
    <p style="margin:0 0 16px;color:#94A3B8;font-size:14px;">
      Use the link below to track your ticket and reply — no login needed:
    </p>
    <a href="${ticketUrl}" style="display:inline-block;background:#00C9A7;color:#0F1B2D;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
      View Your Ticket →
    </a>
    <p style="margin:16px 0 0;font-size:12px;color:#64748B;">
      Save this link — it's your permanent access to this ticket.
    </p>
  `
  await sendEmail(
    ticket.clientEmail,
    `Ticket Received: ${ticket.subject}`,
    baseTemplate(content)
  )
}
