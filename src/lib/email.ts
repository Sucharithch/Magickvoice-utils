import type { CallDetail } from '@/types'

export function buildEmailBody(
  call: CallDetail,
  custom: Record<string, unknown>
): string {
  const callId = call.call_id ?? 'N/A'
  const date = call.created_at ?? 'N/A'
  const duration = call.duration_seconds ?? 'N/A'
  const analysis = call.call_analysis ?? {}
  const summary = analysis.common?.summary ?? 'No summary available.'
  const sentiment = analysis.common?.overall_sentiment?.label ?? 'N/A'

  const customRows = Object.entries(custom)
    .map(
      ([k, v]) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#aaa">
            ${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#fff;font-weight:bold">${v}</td>
        </tr>`
    )
    .join('')

  return `
  <html>
  <body style="background:#0f0f0f;font-family:Arial,sans-serif;color:#fff;padding:30px">
    <div style="max-width:600px;margin:auto;background:#1a1a1a;border-radius:12px;padding:30px">
      <h2 style="color:#a78bfa;margin-top:0">&#128222; Call Summary</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr><td style="color:#aaa;padding:6px 0">Call ID</td><td style="color:#fff">${callId}</td></tr>
        <tr><td style="color:#aaa;padding:6px 0">Date</td><td style="color:#fff">${date}</td></tr>
        <tr><td style="color:#aaa;padding:6px 0">Duration</td><td style="color:#fff">${duration}s</td></tr>
        <tr><td style="color:#aaa;padding:6px 0">Sentiment</td><td style="color:#4ade80">${sentiment}</td></tr>
      </table>
      <h3 style="color:#a78bfa">&#128221; Summary</h3>
      <p style="color:#ccc;line-height:1.6">${summary}</p>
      <h3 style="color:#a78bfa">&#128202; Custom Details</h3>
      <table style="width:100%;border-collapse:collapse;background:#111;border-radius:8px;overflow:hidden">
        <tr style="background:#2a2a2a">
          <th style="padding:10px 12px;text-align:left;color:#aaa">Field</th>
          <th style="padding:10px 12px;text-align:left;color:#aaa">Value</th>
        </tr>
        ${customRows}
      </table>
      <p style="color:#555;font-size:12px;margin-top:30px">
        Sent automatically by MagickVoice Post-Call Processor
      </p>
    </div>
  </body>
  </html>`
}

export function buildWebinarEmail(
  recipientFirstName: string,
  senderName: string
): string {
  return `
  <html>
  <body style="font-family:Arial,sans-serif;color:#333;padding:30px;background:#f4f4f4">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;padding:36px;border:1px solid #e5e7eb">
      <p style="margin-bottom:16px;font-size:15px">Hi ${recipientFirstName},</p>
      <p style="line-height:1.7;margin-bottom:16px">
        Thank you for registering for <strong>"Future-Ready Data Foundation: From AI Pilot to Production Value."</strong>
        Your access is confirmed.
      </p>
      <p style="line-height:1.7;margin-bottom:16px">
        Watch on demand anytime until 31 May 2026:<br/>
        <a href="https://www.thinkartha.com/events/future-ready-data-foundation-from-ai-pilot-to-production-value/"
           style="color:#7c3aed;word-break:break-all">
          https://www.thinkartha.com/events/future-ready-data-foundation-from-ai-pilot-to-production-value/
        </a>
      </p>
      <p style="line-height:1.7;margin-bottom:16px">
        In this session, you'll hear from Stewart Bond (IDC), Srinivas Poddutoori (Artha Solutions), Madhav Nalla and
        Sidney Drill (Qlik) on how to move AI from pilot to production with a trusted, AI-ready data foundation —
        plus a clear 90-day roadmap with a 9-month follow-up action plan.
      </p>
      <div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:14px 18px;border-radius:4px;margin-bottom:20px">
        <p style="margin:0;line-height:1.7">
          <strong>Exclusive for registrants:</strong> Claim our AI Data Readiness Assessment (worth $15,999) for just $1 —
          a real assessment backed by international frameworks and expert consultants.
        </p>
      </div>
      <p style="line-height:1.7;margin-bottom:16px">
        Questions? Just reply to this email and we'll be happy to help.
      </p>
      <p style="line-height:1.7;margin-bottom:24px">Thanks again for joining us.</p>
      <p style="line-height:1.8;margin:0">
        Best regards,<br/>
        <strong>${senderName}</strong><br/>
        Artha Solutions<br/>
        <a href="https://www.thinkartha.com" style="color:#7c3aed">www.thinkartha.com</a>
      </p>
    </div>
  </body>
  </html>`
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const webhookUrl = process.env.PIPEDREAM_EMAIL_WEBHOOK_URL
  if (!webhookUrl) {
    throw new Error('PIPEDREAM_EMAIL_WEBHOOK_URL is not configured')
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Pipedream webhook failed: ${res.status} ${detail}`.trim())
  }
}
