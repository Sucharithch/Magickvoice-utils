import type { EmailTemplate } from '@/types'

const STORAGE_KEY = 'magickvoice.email_templates.v2'

export const TEMPLATE_VARIABLES: { key: string; label: string; description: string }[] = [
  { key: 'first_name', label: 'First name', description: 'First word of contact_name (fallback: "there")' },
  { key: 'full_name', label: 'Full name', description: 'Full contact_name' },
  { key: 'company', label: 'Company', description: 'company_name from contact list' },
  { key: 'role', label: 'Role', description: 'contact_role from contact list' },
  { key: 'sender', label: 'Sender', description: 'Sender name from Emails tab' },
  { key: 'registration_url', label: 'Registration URL', description: 'registration_url from contact list' },
]

export const PREVIEW_SAMPLE_VALUES: Record<string, string> = {
  first_name: 'Sucharith',
  full_name: 'Sucharith Cherukumalli',
  company: 'Bilvantis',
  role: 'Data Engineer',
  sender: 'Srinivas Poddutoori',
  registration_url:
    'https://www.thinkartha.com/events/future-ready-data-foundation-from-ai-pilot-to-production-value/',
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderTemplate(
  template: string,
  values: Record<string, string>,
  escape = true
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    const v = values[key] ?? ''
    return escape ? escapeHtml(v) : v
  })
}

export function buildEmailShell(bodyHtml: string): string {
  return `<html>
  <body style="font-family:Arial,sans-serif;color:#333;padding:30px;background:#f4f4f4;margin:0">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;padding:36px;border:1px solid #e5e7eb;line-height:1.6">
${bodyHtml}
    </div>
  </body>
</html>`
}

const SEED_POSITIVE_BODY = `<p>Hi {{first_name}},</p>
<p>Thank you for registering for <strong>"Future-Ready Data Foundation: From AI Pilot to Production Value."</strong> Your access is confirmed.</p>
<p>Watch on demand anytime until 31 May 2026: <a href="https://www.thinkartha.com/events/future-ready-data-foundation-from-ai-pilot-to-production-value/">Open the event page</a>.</p>
<p>In this session, you'll hear from Stewart Bond (IDC), Srinivas Poddutoori (Artha Solutions), Madhav Nalla and Sidney Drill (Qlik) on how to move AI from pilot to production with a trusted, AI-ready data foundation — plus a clear 90-day roadmap with a 9-month follow-up action plan.</p>
<p><strong>Exclusive for registrants:</strong> Claim our AI Data Readiness Assessment (worth $15,999) for just $1 — a real assessment backed by international frameworks and expert consultants.</p>
<p>Questions? Just reply to this email and we'll be happy to help.</p>
<p>Thanks again for joining us.</p>
<p>Best regards,<br><strong>{{sender}}</strong><br>Artha Solutions<br><a href="https://www.thinkartha.com">www.thinkartha.com</a></p>`

const SEED_NEUTRAL_BODY = `<p>Hi {{first_name}},</p>
<p>Thanks for your time today — we appreciate you considering <strong>"Future-Ready Data Foundation: From AI Pilot to Production Value."</strong></p>
<p>If you'd like to revisit the session on demand (available until 31 May 2026): <a href="https://www.thinkartha.com/events/future-ready-data-foundation-from-ai-pilot-to-production-value/">Open the event page</a>.</p>
<p>Happy to answer any questions — just reply to this email and we'll follow up.</p>
<p>Best regards,<br><strong>{{sender}}</strong><br>Artha Solutions<br><a href="https://www.thinkartha.com">www.thinkartha.com</a></p>`

export function defaultTemplates(): EmailTemplate[] {
  return [
    {
      id: 'seed-positive-webinar-v2',
      name: 'Positive — Webinar Confirmation',
      subject: 'Your Access is Confirmed – Future-Ready Data Foundation',
      body: SEED_POSITIVE_BODY,
    },
    {
      id: 'seed-neutral-followup-v2',
      name: 'Neutral — Soft Follow-up',
      subject: 'Thanks for your time, {{first_name}}',
      body: SEED_NEUTRAL_BODY,
    },
  ]
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function newTemplate(): EmailTemplate {
  return {
    id: makeId(),
    name: 'New Template',
    subject: 'Subject for {{first_name}}',
    body: `<p>Hi {{first_name}},</p><p>Write your message here.</p><p>Best regards,<br><strong>{{sender}}</strong></p>`,
  }
}

export function loadTemplates(): EmailTemplate[] {
  if (typeof window === 'undefined') return defaultTemplates()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = defaultTemplates()
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw) as EmailTemplate[]
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultTemplates()
    return parsed
  } catch {
    return defaultTemplates()
  }
}

export function saveTemplates(templates: EmailTemplate[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}
