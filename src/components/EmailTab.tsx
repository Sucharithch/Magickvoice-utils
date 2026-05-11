'use client'

import { useState } from 'react'
import type { CallDetail, EmailResult } from '@/types'

interface EmailTabProps {
  calls: CallDetail[]
  timezone: string
  results: EmailResult[] | null
  loading: boolean
  error: string | null
  onSendEmails: (senderName: string) => void
}

const STATUS_LABEL: Record<EmailResult['status'], string> = {
  sent: '✅ Sent',
  skipped: '⏭️ Skipped',
  'no-email': '⚠️ No Email',
  failed: '❌ Failed',
}

const STATUS_COLOR: Record<EmailResult['status'], string> = {
  sent: 'text-green-400',
  skipped: 'text-gray-400',
  'no-email': 'text-yellow-400',
  failed: 'text-red-400',
}

const SENTIMENT_COLOR: Record<string, string> = {
  positive: 'text-green-400',
  negative: 'text-red-400',
  neutral: 'text-yellow-400',
}

const SENDER_OPTIONS = [
  'Srinivas Poddutoori',
  'Artha Solutions Team',
]

export default function EmailTab({
  calls,
  results,
  loading,
  error,
  onSendEmails,
}: EmailTabProps) {
  const [senderName, setSenderName] = useState('')
  const [customName, setCustomName] = useState('')

  const activeSenderName = senderName === '__custom__' ? customName.trim() : senderName
  const canSend = !loading && calls.length > 0 && activeSenderName.length > 0

  const sentCount = results?.filter(r => r.status === 'sent').length ?? 0
  const positiveCount =
    results?.filter(r => r.sentiment === 'positive').length ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Email Processing</h2>
      </div>

      {!results && (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-5 mb-6">
          <p className="text-sm text-gray-400 mb-4">
            Choose your name for the <span className="text-white font-medium">Best regards</span> signature,
            then send the webinar confirmation email to all positive-sentiment calls with a captured address.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                Sender Name
              </label>
              <select
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                className="w-full bg-[#111] border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">— Select your name —</option>
                {SENDER_OPTIONS.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="__custom__">Other (type below)…</option>
              </select>
            </div>

            {senderName === '__custom__' && (
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                  Your Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full bg-[#111] border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600"
                />
              </div>
            )}

            <button
              onClick={() => onSendEmails(activeSenderName)}
              disabled={!canSend}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded transition-colors whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Sending…
                </span>
              ) : (
                '📧 Send Emails'
              )}
            </button>
          </div>
        </div>
      )}


      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-5 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-gray-400 text-sm mt-4">
          <span className="animate-spin inline-block w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
          Sending emails…
        </div>
      )}

      {results && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              ['Total in Window', calls.length],
              ['Positive Sentiment', positiveCount],
              ['Emails Sent', sentCount],
              ['Skipped / Failed', calls.length - sentCount],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center"
              >
                <p className="text-2xl font-bold text-white mb-1">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <hr className="border-gray-800 mb-5" />

          {/* Results Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#222]">
                <tr>
                  {[
                    'Call ID',
                    'Phone',
                    'Created',
                    'Sentiment',
                    'Email',
                    'Status',
                    'Note',
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
                {results.map((row, i) => (
                  <tr
                    key={row.call_id ?? i}
                    className="border-t border-gray-800 hover:bg-[#1e1e1e] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-gray-300 text-xs">
                      {row.call_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-gray-300">{row.phone}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {row.created}
                    </td>
                    <td
                      className={`px-4 py-3 capitalize font-medium ${SENTIMENT_COLOR[row.sentiment] ?? 'text-gray-400'}`}
                    >
                      {row.sentiment}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{row.email}</td>
                    <td
                      className={`px-4 py-3 font-medium ${STATUS_COLOR[row.status]}`}
                    >
                      {STATUS_LABEL[row.status]}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
