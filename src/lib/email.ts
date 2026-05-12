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
