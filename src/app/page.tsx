'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import CallsTab from '@/components/CallsTab'
import EmailTab from '@/components/EmailTab'
import TemplatesTab from '@/components/TemplatesTab'
import { loadTemplates, saveTemplates } from '@/lib/templates'
import type {
  CallDetail,
  EmailResult,
  EmailTemplate,
  FetchCallsPayload,
  SentimentTemplateMap,
} from '@/types'

type Tab = 'calls' | 'emails' | 'templates'

export default function Home() {
  const [calls, setCalls] = useState<CallDetail[] | null>(null)
  const [fetchStats, setFetchStats] = useState<{
    total: number
    filtered: number
  } | null>(null)
  const [emailResults, setEmailResults] = useState<EmailResult[] | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('calls')
  const [loading, setLoading] = useState(false)
  const [emailing, setEmailing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [currentConfig, setCurrentConfig] = useState<FetchCallsPayload | null>(
    null
  )
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templatesReady, setTemplatesReady] = useState(false)

  useEffect(() => {
    setTemplates(loadTemplates())
    setTemplatesReady(true)
  }, [])

  const updateTemplates = (next: EmailTemplate[]) => {
    setTemplates(next)
    saveTemplates(next)
  }

  const handleRun = async (config: FetchCallsPayload) => {
    setLoading(true)
    setError(null)
    setCalls(null)
    setFetchStats(null)
    setEmailResults(null)
    setEmailError(null)
    setCurrentConfig(config)

    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch calls')
      setCalls(data.calls)
      setFetchStats({ total: data.total, filtered: data.filtered })
      setActiveTab('calls')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmails = async (
    senderName: string,
    sentimentTemplates: SentimentTemplateMap
  ) => {
    if (!calls || !currentConfig) return
    setEmailing(true)
    setEmailError(null)

    try {
      const res = await fetch('/api/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calls,
          timezone: currentConfig.timezone,
          senderName,
          token: currentConfig.token,
          contactListId: currentConfig.contactListId,
          sentimentTemplates,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send emails')
      setEmailResults(data.results)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setEmailing(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'calls', label: '📋 Fetched Call Details' },
    { id: 'emails', label: '📧 Email Results' },
    { id: 'templates', label: '✉️ Email Templates' },
  ]

  const hasRunData = !!(calls && currentConfig)
  const tabNavVisible = hasRunData || activeTab === 'templates' || templatesReady

  return (
    <div className="flex min-h-screen">
      <Sidebar onRun={handleRun} loading={loading} />

      <main className="flex-1 p-8 overflow-auto min-h-screen">
        {/* Idle state (only if templates tab not selected) */}
        {!calls && !loading && !error && activeTab !== 'templates' && (
          <>
            {/* Tab nav still shown so user can hop to Templates */}
            {tabNavVisible && (
              <div className="flex border-b border-gray-800 mb-6">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-400'
                        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="text-center">
                <p className="text-4xl mb-4">📞</p>
                <p className="text-gray-400 text-sm">
                  Configure the inputs in the sidebar and click{' '}
                  <strong className="text-white">Run</strong> to start.
                </p>
                <p className="text-gray-600 text-xs mt-3">
                  You can edit email templates anytime in the{' '}
                  <button
                    onClick={() => setActiveTab('templates')}
                    className="underline text-purple-400 hover:text-purple-300"
                  >
                    Templates tab
                  </button>
                  .
                </p>
              </div>
            </div>
          </>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center h-full min-h-[70vh]">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Fetching calls from API…</p>
              <p className="text-gray-600 text-xs mt-1">
                This may take a moment
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-5 py-4 mb-6 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* When we have data OR templates tab active: render tab bar + content */}
        {(hasRunData || activeTab === 'templates') && (
          <>
            {/* Stats bar */}
            {hasRunData && fetchStats && (
              <div className="flex items-center gap-4 mb-5 text-sm">
                <span className="text-gray-500">
                  Total in account:{' '}
                  <strong className="text-white">{fetchStats.total}</strong>
                </span>
                <span className="text-gray-700">•</span>
                <span className="text-gray-500">
                  In window:{' '}
                  <strong className="text-white">{fetchStats.filtered}</strong>
                </span>
              </div>
            )}

            {/* Tab navigation */}
            <div className="flex border-b border-gray-800 mb-6">
              {tabs.map(tab => {
                const requiresData = tab.id !== 'templates'
                const disabled = requiresData && !hasRunData
                return (
                  <button
                    key={tab.id}
                    onClick={() => !disabled && setActiveTab(tab.id)}
                    disabled={disabled}
                    className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-400'
                        : disabled
                        ? 'border-transparent text-gray-700 cursor-not-allowed'
                        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            {activeTab === 'calls' && hasRunData && currentConfig && (
              <CallsTab
                calls={calls!}
                timezone={currentConfig.timezone}
                total={fetchStats?.total ?? 0}
                filtered={fetchStats?.filtered ?? 0}
              />
            )}

            {activeTab === 'emails' && hasRunData && currentConfig && (
              <EmailTab
                calls={calls!}
                timezone={currentConfig.timezone}
                results={emailResults}
                loading={emailing}
                error={emailError}
                templates={templates}
                onSendEmails={handleSendEmails}
              />
            )}

            {activeTab === 'templates' && templatesReady && (
              <TemplatesTab
                templates={templates}
                onChange={updateTemplates}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
