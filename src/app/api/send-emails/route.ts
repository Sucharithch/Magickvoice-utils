import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns-tz'
import { buildWebinarEmail, sendEmail } from '@/lib/email'
import { fetchContactList, normalizePhone } from '@/lib/magickvoice'
import type { SendEmailsPayload, EmailResult, ContactRow } from '@/types'

export const runtime = 'nodejs'

function localTime(raw: string | undefined, tz: string): string {
  if (!raw) return '—'
  try {
    return format(new Date(raw), 'yyyy-MM-dd HH:mm:ss', { timeZone: tz })
  } catch {
    return raw
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailsPayload = await request.json()
    const { calls, timezone, senderName, token, contactListId } = body

    if (!token) {
      return NextResponse.json({ error: 'Missing bearer token' }, { status: 400 })
    }
    if (!contactListId) {
      return NextResponse.json({ error: 'Missing contact list ID' }, { status: 400 })
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
      const sentiment = analysis.common?.overall_sentiment?.label ?? ''

      const contact = contactByPhone.get(normalizePhone(call.recipient_phone))
      const email = contact?.mail ?? ''
      const fullName =
        call.recipient_name ?? contact?.contact_name ?? ''
      const recipientFirstName = fullName.trim().split(/\s+/)[0] || 'there'

      let status: EmailResult['status']
      let note: string

      if (sentiment !== 'positive') {
        status = 'skipped'
        note = `Sentiment is '${sentiment || 'N/A'}' — not positive`
      } else if (!email) {
        status = 'no-email'
        note = 'No matching contact in contact list for this phone'
      } else {
        try {
          const html = buildWebinarEmail(recipientFirstName, senderName)
          const subject = 'Your Access is Confirmed – Future-Ready Data Foundation'
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
        sentiment: sentiment || 'N/A',
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
