import { localTime } from '@/lib/time'
import type { CallDetail } from '@/types'
import CallCard from './CallCard'

interface CallsTabProps {
  calls: CallDetail[]
  timezone: string
  total: number
  filtered: number
}

const SENTIMENT_COLOR: Record<string, string> = {
  positive: 'text-green-400',
  negative: 'text-red-400',
  neutral: 'text-yellow-400',
}

export default function CallsTab({
  calls,
  timezone,
  total,
  filtered,
}: CallsTabProps) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="text-xl font-semibold text-white">
          All {filtered} Calls in Window
        </h2>
        <span className="text-sm text-gray-500">of {total} total</span>
      </div>

      {/* Summary Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800 mb-8">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#222]">
            <tr>
              {[
                'Call ID',
                'Phone',
                'Name',
                'Created',
                'Duration',
                'Status',
                'Analysis',
                'Sentiment',
                'Score',
                'Email',
                'Interest',
                'Registration',
                'Right Contact',
                'Objection',
                'Escalation',
              ].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calls.map((call, i) => {
              const analysis = call.call_analysis ?? {}
              const sentiment = analysis.common?.overall_sentiment ?? {}
              const custom = analysis.custom ?? {}
              const sentLabel = sentiment.label ?? '—'
              const sentColor =
                SENTIMENT_COLOR[sentLabel] ?? 'text-gray-400'

              return (
                <tr
                  key={call.call_id ?? i}
                  className="border-t border-gray-800 hover:bg-[#1e1e1e] transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-gray-300 text-xs">
                    {(call.call_id ?? 'N/A').slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    {call.recipient_phone ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    {call.recipient_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                    {localTime(call.created_at, timezone)}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {call.duration_seconds ?? '—'}s
                  </td>
                  <td className="px-4 py-3 text-gray-300 capitalize">
                    {call.status ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-300 capitalize">
                    {call.analysis_status ?? '—'}
                  </td>
                  <td className={`px-4 py-3 capitalize font-medium ${sentColor}`}>
                    {sentLabel}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {String(sentiment.score ?? '—')}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {(custom.email as string) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {(custom.interest_level as string) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {(custom.registration_outcome as string) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {String(custom.right_contact ?? '—')}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {String(custom.objection_raised ?? '—')}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {String(custom.escalation_requested ?? '—')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detailed Cards */}
      <h3 className="text-lg font-semibold text-white mb-4">Detailed View</h3>
      <div className="space-y-3">
        {calls.map((call, i) => (
          <CallCard key={call.call_id ?? i} call={call} timezone={timezone} />
        ))}
      </div>
    </div>
  )
}
