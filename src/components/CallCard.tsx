'use client'

import { useState } from 'react'
import { localTime } from '@/lib/time'
import type { CallDetail } from '@/types'

interface CallCardProps {
  call: CallDetail
  timezone: string
}

export default function CallCard({ call, timezone }: CallCardProps) {
  const [open, setOpen] = useState(false)

  const analysis = call.call_analysis ?? {}
  const common = analysis.common ?? {}
  const custom = analysis.custom ?? {}
  const sentiment = common.overall_sentiment ?? {}
  const sentLabel = sentiment.label ?? '—'
  const badge =
    sentLabel === 'positive' ? '🟢' : sentLabel === 'negative' ? '🔴' : '🟡'
  const callId = call.call_id ?? 'N/A'
  const phone = call.recipient_phone ?? '—'
  const time = localTime(call.created_at, timezone)

  const capitalize = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#222] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm text-gray-200">
          {badge}{' '}
          <span className="font-mono text-gray-300">{callId.slice(0, 8)}…</span>
          <span className="text-gray-600 mx-2">|</span>
          <span className="text-gray-300">{phone}</span>
          <span className="text-gray-600 mx-2">|</span>
          <span className="text-gray-500">{time}</span>
        </span>
        <span className="text-gray-600 text-xs ml-4">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-800 p-5">
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              ['Duration', `${call.duration_seconds ?? '—'}s`],
              ['Sentiment', sentLabel !== '—' ? capitalize(sentLabel) : '—'],
              ['Score', String(sentiment.score ?? '—')],
              ['Status', call.status ? capitalize(call.status) : '—'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-[#111] border border-gray-800 rounded-lg p-3 text-center"
              >
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>

          <hr className="border-gray-800 mb-5" />

          {/* Summary + Custom Details */}
          <div className="grid grid-cols-2 gap-6 mb-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2">
                📝 AI Summary
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {common.summary || 'No summary available.'}
              </p>

              <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 mt-4 mb-2">
                🏷️ Key Topics
              </h3>
              <p className="text-gray-300 text-sm">
                {common.key_topics?.length
                  ? common.key_topics.join(' • ')
                  : '—'}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2">
                📊 Custom Details
              </h3>
              {Object.keys(custom).length > 0 ? (
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(custom).map(([k, v]) => (
                      <tr key={k}>
                        <td className="text-gray-400 py-1 pr-3 text-xs">
                          {k
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, c => c.toUpperCase())}
                        </td>
                        <td className="text-white font-medium text-xs">
                          {String(v ?? '—')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-sm">No custom details.</p>
              )}
            </div>
          </div>

          {/* Conversation Log */}
          {call.conversation_log?.length ? (
            <>
              <hr className="border-gray-800 mb-4" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-3">
                💬 Conversation Log
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {call.conversation_log.map((turn, i) => (
                  <div
                    key={i}
                    className={`flex ${turn.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                        turn.role === 'assistant'
                          ? 'bg-[#2a2a2a] text-gray-200'
                          : 'bg-purple-900/40 text-purple-100'
                      }`}
                    >
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        {turn.role === 'assistant' ? 'AI' : 'User'}
                      </p>
                      <p className="leading-relaxed">{turn.content}</p>
                      {turn.timestamp && (
                        <p className="text-xs text-gray-600 mt-1">
                          {localTime(turn.timestamp, timezone)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
