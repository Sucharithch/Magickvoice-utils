import { NextRequest, NextResponse } from 'next/server'
import { fromZonedTime } from 'date-fns-tz'
import { fetchAllCalls, fetchDetailsInBatches } from '@/lib/magickvoice'
import type { FetchCallsPayload, CallSummary } from '@/types'

export const runtime = 'nodejs'

function filterByWindow(
  calls: CallSummary[],
  timezone: string,
  date: string,
  fromTime: string,
  toTime: string
): CallSummary[] {
  const startUtc = fromZonedTime(`${date}T${fromTime}:00`, timezone)
  const endUtc = fromZonedTime(`${date}T${toTime}:00`, timezone)

  return calls.filter(call => {
    const raw = call.created_at ?? call.timestamps?.queued_at ?? ''
    if (!raw) return false
    const callDate = new Date(raw)
    return callDate >= startUtc && callDate <= endUtc
  })
}

export async function POST(request: NextRequest) {
  try {
    const body: FetchCallsPayload = await request.json()
    const { token, timezone, date, fromTime, toTime } = body

    if (!token) {
      return NextResponse.json({ error: 'Bearer token is required' }, { status: 400 })
    }

    const allCalls = await fetchAllCalls(token)
    const filtered = filterByWindow(allCalls, timezone, date, fromTime, toTime)
    const detailed = await fetchDetailsInBatches(token, filtered)

    return NextResponse.json({
      calls: detailed,
      total: allCalls.length,
      filtered: filtered.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
