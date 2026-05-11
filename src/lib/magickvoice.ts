import type { CallSummary, CallDetail, ContactList } from '@/types'

const BASE_URL = 'https://staging.appi.magickvoice.com/proxy/calls'
const CONTACT_LIST_BASE_URL = 'https://staging.appi.magickvoice.com/contact-lists'

function apiHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'x-tenant-id': process.env.TENANT_ID!,
    'x-account-id': process.env.ACCOUNT_ID!,
  }
}

export async function fetchAllCalls(token: string): Promise<CallSummary[]> {
  const calls: CallSummary[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const res = await fetch(
      `${BASE_URL}?limit=${limit}&offset=${offset}`,
      { headers: apiHeaders(token) }
    )
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`MagickVoice API ${res.status}: ${text}`)
    }
    const data = await res.json()
    const batch: CallSummary[] = data.calls ?? []
    calls.push(...batch)
    if (calls.length >= (data.total ?? 0) || !batch.length) break
    offset += limit
  }

  return calls
}

export async function fetchCallDetail(token: string, callId: string): Promise<CallDetail> {
  const res = await fetch(`${BASE_URL}/${callId}`, { headers: apiHeaders(token) })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MagickVoice API ${res.status}: ${text}`)
  }
  return res.json()
}

export async function fetchContactList(
  token: string,
  contactListId: string
): Promise<ContactList> {
  const res = await fetch(`${CONTACT_LIST_BASE_URL}/${contactListId}`, {
    headers: apiHeaders(token),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MagickVoice contact-list ${res.status}: ${text}`)
  }
  return res.json()
}

export function normalizePhone(phone: string | undefined | null): string {
  return (phone ?? '').replace(/\D/g, '')
}

export async function fetchDetailsInBatches(
  token: string,
  calls: CallSummary[],
  batchSize = 5
): Promise<CallDetail[]> {
  const results: CallDetail[] = []
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize)
    const details = await Promise.all(
      batch.map(async call => {
        try {
          return await fetchCallDetail(token, call.call_id)
        } catch {
          return call as CallDetail
        }
      })
    )
    results.push(...details)
  }
  return results
}
