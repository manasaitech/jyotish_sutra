import { useState, useEffect } from 'react'
import { authenticatedFetch } from '../../utils/apiClient'
import DoshaDashboard from '../dashboard/DoshaDashboard'
import TabChat, { type Message } from '../dashboard/TabChat'
import AstroLoader from '../layout/AstroLoader'

interface Props {
  sessionId: string
  userId?: string
  birthData?: any
  chartData?: any
  apiBaseUrl: string
  onOpenPricing?: () => void
}

export default function DoshasTimelineView({
  sessionId,
  userId,
  birthData,
  chartData,
  apiBaseUrl,
  onOpenPricing,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<any>(null)

  // Chat State
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingChat, setLoadingChat] = useState(false)

  const fetchDoshaTimeline = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await authenticatedFetch(`${apiBaseUrl}/api/dosha-timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          birth_details: birthData,
          chart_data: chartData,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || 'Failed to fetch Dosha timeline')
      }

      const result = await res.json()
      setReport(result)
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading Dosha timeline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoshaTimeline()
  }, [sessionId, userId, birthData, chartData])

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      role: 'user',
      content: text,
      text: text,
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoadingChat(true)

    try {
      const res = await authenticatedFetch(`${apiBaseUrl}/api/tab-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          message: text,
          tab: 'doshas',
          is_initial: false,
          birth_details: birthData,
          chart_data: chartData,
        }),
      })

      if (!res.ok) throw new Error('Failed to send message')
      const data = await res.json()

      const assistantMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: data.response,
      }

      setMessages([...updatedMessages, assistantMsg])
    } catch (err) {
      console.error('Chat error:', err)
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: '🙏 I apologize, but I encountered a network error while analyzing your question. Please try again.',
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoadingChat(false)
    }
  }

  if (loading) {
    return (
      <div className="py-12">
        <AstroLoader
          fullscreen={false}
          size="md"
          message="Consulting Vedic Ephemeris & Reading Planetary Alignments..."
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="celestial-card p-8 rounded-3xl text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-rose-500">error</span>
        <h3 className="font-display text-xl font-bold text-rose-500">Analysis Error</h3>
        <p className="text-sm text-on-surface-variant max-w-[400px] mx-auto">{error}</p>
        <button
          onClick={fetchDoshaTimeline}
          className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="celestial-card p-6 sm:p-8 rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-fixed rounded-2xl flex items-center justify-center text-primary font-bold shadow-xs shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-primary">
              Vedic Dosha Analysis
            </h3>
            <p className="text-xs text-on-surface-variant">Personalized Vedic Insights & Timeline</p>
          </div>
        </div>

        <DoshaDashboard report={report} />
      </div>

      {/* Tab Dedicated Chat Section */}
      <TabChat
        tab="doshas"
        tabName="Dosha"
        sessionId={sessionId}
        userId={userId}
        birthData={birthData}
        messages={messages}
        loading={loadingChat}
        onSendMessage={handleSendMessage}
        onOpenPricing={onOpenPricing}
      />
    </div>
  )
}
