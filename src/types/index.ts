export interface CallSummary {
  call_id: string
  created_at?: string
  recipient_phone?: string
  recipient_name?: string | null
  duration_seconds?: number | string | null
  status?: string
  analysis_status?: string
  timestamps?: { queued_at?: string }
}

export interface Sentiment {
  label?: string
  score?: number | string
}

export interface CommonAnalysis {
  summary?: string
  key_topics?: string[]
  overall_sentiment?: Sentiment
}

export interface CustomAnalysis {
  email?: string
  interest_level?: string
  registration_outcome?: string
  right_contact?: boolean | string
  objection_raised?: boolean | string
  escalation_requested?: boolean | string
  [key: string]: unknown
}

export interface CallAnalysis {
  common?: CommonAnalysis
  custom?: CustomAnalysis
}

export interface ConversationTurn {
  role: string
  content: string
  timestamp?: string
}

export interface CallDetail extends CallSummary {
  call_analysis?: CallAnalysis
  conversation_log?: ConversationTurn[]
}

export interface FetchCallsPayload {
  token: string
  timezone: string
  date: string      // YYYY-MM-DD
  fromTime: string  // HH:mm
  toTime: string    // HH:mm
  contactListId: string
}

export interface ContactRow {
  mail?: string
  phone?: string
  contact_name?: string
  company_name?: string
  contact_role?: string
  website_url?: string
  registration_url?: string
  [key: string]: unknown
}

export interface ContactList {
  id: string
  name: string
  row_count: number
  columns: string[]
  sample_rows: ContactRow[]
}

export interface FetchCallsResponse {
  calls: CallDetail[]
  total: number
  filtered: number
}

export interface EmailResult {
  call_id: string
  phone: string
  created: string
  sentiment: string
  email: string
  status: 'sent' | 'skipped' | 'no-email' | 'failed'
  note: string
}

export type SentimentLabel = 'positive' | 'neutral' | 'negative'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
}

export type SentimentTemplateMap = Partial<
  Record<SentimentLabel, { subject: string; body: string }>
>

export interface SendEmailsPayload {
  calls: CallDetail[]
  timezone: string
  senderName: string
  token: string
  contactListId: string
  sentimentTemplates: SentimentTemplateMap
}

export interface SendEmailsResponse {
  results: EmailResult[]
  sent: number
}
