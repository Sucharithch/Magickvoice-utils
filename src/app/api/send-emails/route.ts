import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns-tz'
import { sendEmail } from '@/lib/email'
import { fetchContactList, normalizePhone } from '@/lib/magickvoice'
import { renderTemplate, buildEmailShell } from '@/lib/templates'
import type {
  SendEmailsPayload,
  EmailResult,
  ContactRow,
  SentimentLabel,
} from '@/types'

export const runtime = 'nodejs'

function localTime(raw: string | undefined, tz: string): string {
  if (!raw) return '—'
  try {
    return format(new Date(raw), 'yyyy-MM-dd HH:mm:ss', { timeZone: tz })
  } catch {
    return raw
  }
}

const KNOWN_SENTIMENTS: SentimentLabel[] = ['positive', 'neutral', 'negative']

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailsPayload = await request.json()
    const {
      calls,
      timezone,
      senderName,
      token,
      contactListId,
      sentimentTemplates,
    } = body

    if (!token) {
      return NextResponse.json({ error: 'Missing bearer token' }, { status: 400 })
    }
    if (!contactListId) {
      return NextResponse.json({ error: 'Missing contact list ID' }, { status: 400 })
    }
    if (!sentimentTemplates || Object.keys(sentimentTemplates).length === 0) {
      return NextResponse.json(
        { error: 'No sentiment templates selected' },
        { status: 400 }
      )
    }

    const contactList = await fetchContactList(token, contactListId)
    const contactByPhone = new Map<string, ContactRow>()
    for (const row of contactList.sample_rows ?? []) {
      const key = normalizePhone(row.phone)
      if (key) contactByPhone.set(key, row)
    }

    const results: EmailResult[] = []
    let sentCount = 0

    for (const call of calls) {
      const callId = call.call_id ?? 'N/A'
      const phone = call.recipient_phone ?? '—'
      const created = localTime(call.created_at, timezone)
      const analysis = call.call_analysis ?? {}
      const sentimentRaw = analysis.common?.overall_sentiment?.label ?? ''
      const sentiment = sentimentRaw.toLowerCase() as SentimentLabel
      const isKnown = KNOWN_SENTIMENTS.includes(sentiment)

      const contact = contactByPhone.get(normalizePhone(call.recipient_phone))
      const email = contact?.mail ?? ''
      const fullName = contact?.contact_name ?? call.recipient_name ?? ''
      const firstName = fullName.trim().split(/\s+/)[0] || 'there'

      const template = isKnown ? sentimentTemplates[sentiment] : undefined

      let status: EmailResult['status']
      let note: string

      if (!template) {
        status = 'skipped'
        note = `Sentiment '${sentimentRaw || 'N/A'}' not selected for sending`
      } else if (!email) {
        status = 'no-email'
        note = 'No matching contact in contact list for this phone'
      } else {
        try {
          const vars: Record<string, string> = {
            first_name: firstName,
            full_name: fullName || 'there',
            company: contact?.company_name ?? '',
            role: contact?.contact_role ?? '',
            sender: senderName,
            registration_url: contact?.registration_url ?? '',
          }
          const subject = renderTemplate(template.subject, vars, false)
          const renderedBody = renderTemplate(template.body, vars, true)
          const html = buildEmailShell(renderedBody)
          await sendEmail(email, subject, html)
          status = 'sent'
          note = `Delivered to ${email}`
          sentCount++
        } catch (err) {
          status = 'failed'
          note = err instanceof Error ? err.message : 'Send failed'
        }
      }

      results.push({
        call_id: callId,
        phone,
        created,
        sentiment: sentimentRaw || 'N/A',
        email: email || '—',
        status,
        note,
      })
    }

    return NextResponse.json({ results, sent: sentCount })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
