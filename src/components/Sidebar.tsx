'use client'

import { useState, useEffect } from 'react'
import type { FetchCallsPayload } from '@/types'

interface SidebarProps {
  onRun: (config: FetchCallsPayload) => void
  loading: boolean
}

function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export default function Sidebar({ onRun, loading }: SidebarProps) {
  const [token, setToken] = useState('')
  const [contactListId, setContactListId] = useState('')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [date, setDate] = useState(todayDate())
  const [fromTime, setFromTime] = useState('00:00')
  const [toTime, setToTime] = useState('23:59')
  const [timezones, setTimezones] = useState<string[]>([])

  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tzList = (Intl as any).supportedValuesOf('timeZone') as string[]
      setTimezones([...tzList].sort())
    } catch {
      setTimezones([
        'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Dubai',
        'Europe/London', 'Europe/Paris', 'America/New_York',
        'America/Chicago', 'America/Los_Angeles', 'UTC',
      ])
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRun({ token, timezone, date, fromTime, toTime, contactListId })
  }

  const inputCls =
    'w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors'

  return (
    <aside className="w-72 shrink-0 bg-[#1a1a1a] h-screen sticky top-0 overflow-y-auto flex flex-col p-5 border-r border-gray-800">
      <div className="mb-5">
        <h1 className="text-base font-bold text-purple-400">📞 MagickVoice</h1>
        <p className="text-xs text-gray-500 mt-0.5">Post-Call Email Processor</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
        {/* Configuration */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            ⚙️ Configuration
          </p>
          <label className="block text-sm text-gray-400 mb-1">Bearer Token</label>
          <input
            type="password"
            placeholder="Paste your JWT token…"
            value={token}
            onChange={e => setToken(e.target.value)}
            className={`${inputCls} mb-3`}
            required
          />

          <label className="block text-sm text-gray-400 mb-1">Contact List ID</label>
          <input
            type="text"
            placeholder="e.g. 545e68f8-e03a-4ac1-…"
            value={contactListId}
            onChange={e => setContactListId(e.target.value)}
            className={inputCls}
            required
          />
        </section>

        <hr className="border-gray-800" />

        {/* Filter Window */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            🕐 Filter Window
          </p>

          <label className="block text-sm text-gray-400 mb-1">Timezone</label>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className={`${inputCls} mb-3`}
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>

          <label className="block text-sm text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={`${inputCls} mb-3`}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-gray-400 mb-1">From</label>
              <input
                type="time"
                value={fromTime}
                onChange={e => setFromTime(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">To</label>
              <input
                type="time"
                value={toTime}
                onChange={e => setToTime(e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>
        </section>

        <hr className="border-gray-800" />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Loading…
            </span>
          ) : (
            '🚀 Run'
          )}
        </button>
      </form>
    </aside>
  )
}
