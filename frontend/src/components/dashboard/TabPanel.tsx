import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { authenticatedFetch } from '../../utils/apiClient'
import type { TabType } from './TabNavigation'
import { ALL_TABS } from './TabNavigation'
import SummaryCards from './SummaryCards'
import TabChat, { type Message } from './TabChat'
import PredictionFeedbackCard from '../chat/PredictionFeedbackCard'
import AnimatedKundliChart from './AnimatedKundliChart'
import PlanetaryTable from './PlanetaryTable'
import RelationshipTargetSelector, { type RelationshipTarget, RELATIONSHIP_TARGETS } from './RelationshipTargetSelector'
import RelationshipScoreCard from './RelationshipScoreCard'
import CareerSubTabNavigation, { type CareerSubTab } from './CareerSubTabNavigation'
import KalaVidyaDashboard from './KalaVidyaDashboard'
import PrashnaDashboardView from './PrashnaDashboardView'
import AstroLoader from '../layout/AstroLoader'
import PersonalityDashboard from './PersonalityDashboard'
import RemediesDashboard from './RemediesDashboard'
import DoshaDashboard from './DoshaDashboard'
import LockedTabOverlay from './LockedTabOverlay'
import KundliMatchingView from '../matching/KundliMatchingView'
import DashaTimelineView from '../dasha/DashaTimelineView'
import StructuredReportView from './StructuredReportView'
import DoshasTimelineView from '../doshas/DoshasTimelineView'
import type { StructuredReport } from '../../types/structuredReport'
import type { UserProfile } from '../../types/profile'
import { SCIENTIFIC_REFERENCE_LINKS } from '../../config/scientificreference'
import {
  isTabAllowedForTier,
  getRequiredTierForTab,
  isRelationshipTargetAllowed,
  isCareerSubTabAllowed,
} from '../../config/subscriptionConfig'
import { getCurrentTier } from '../../utils/subscriptionManager'

export interface TabCacheItem {
  initialReading: string
  messages: Message[]
  structuredData?: StructuredReport | null
}

interface TabPanelProps {
  tab: TabType
  chartData: any
  computed?: any
  birthData?: any
  sessionId: string
  userId?: string
  apiBaseUrl: string
  tabCacheMap?: Record<string, TabCacheItem>
  onUpdateCacheByKey?: (key: string, data: TabCacheItem) => void
  onOpenPricing?: () => void
  profiles?: UserProfile[]
}

export default function TabPanel({
  tab,
  chartData,
  computed,
  birthData,
  sessionId,
  userId,
  apiBaseUrl,
  tabCacheMap = {},
  onUpdateCacheByKey,
  onOpenPricing,
  profiles = [],
}: TabPanelProps) {
  const [relationshipTarget, setRelationshipTarget] = useState<RelationshipTarget>('spouse')
  const [careerSubTab, setCareerSubTab] = useState<CareerSubTab>('overview')

  const currentTier = getCurrentTier()
  const isTabAllowed = isTabAllowedForTier(tab, currentTier)
  const isTargetAllowed = tab !== 'marriage' || isRelationshipTargetAllowed(relationshipTarget, currentTier)
  const isSubTabAllowed = tab !== 'career' || isCareerSubTabAllowed(careerSubTab, currentTier)

  const isAllowed = isTabAllowed && isTargetAllowed && isSubTabAllowed

  // Auto-select first allowed relationship target if current choice is locked for user's tier
  useEffect(() => {
    if (tab === 'marriage' && !isRelationshipTargetAllowed(relationshipTarget, currentTier)) {
      const allowedTarget = RELATIONSHIP_TARGETS.find((t) => isRelationshipTargetAllowed(t.id, currentTier))
      if (allowedTarget) {
        setRelationshipTarget(allowedTarget.id)
      }
    }
  }, [tab, currentTier])

  const tabConfig = ALL_TABS.find((t) => t.id === tab) || { label: tab }

  // Compute unique key for granular per-profile caching (prevents profile data leaks)
  const getCacheKey = () => {
    const profilePrefix = userId ? `${userId}_` : ''
    if (tab === 'marriage') return `${profilePrefix}marriage_${relationshipTarget}`
    if (tab === 'career') return `${profilePrefix}career_${careerSubTab}`
    return `${profilePrefix}${tab}`
  }

  const cacheKey = getCacheKey()
  const cachedItem = tabCacheMap[cacheKey]

  const [messages, setMessages] = useState<Message[]>(cachedItem?.messages || [])
  const [initialReading, setInitialReading] = useState<string>(cachedItem?.initialReading || '')
  const [loadingInitial, setLoadingInitial] = useState<boolean>(!cachedItem?.initialReading)
  const [loadingChat, setLoadingChat] = useState<boolean>(false)
  const [structuredData, setStructuredData] = useState<StructuredReport | null>(cachedItem?.structuredData || null)

  // Sync state if cached item exists or cache key changes
  useEffect(() => {
    if (!isAllowed || tab === 'matching' || tab === 'doshas') return // Don't fetch standard text for matching or doshas

    let cancelled = false
    const currentKey = getCacheKey()
    const existing = tabCacheMap[currentKey]

    if (existing?.initialReading) {
      setInitialReading(existing.initialReading)
      setMessages(existing.messages || [])
      setStructuredData(existing.structuredData || null)
      setLoadingInitial(false)
      return
    }

    async function fetchTabReading() {
      setLoadingInitial(true)
      try {
        let queryMsg = `Provide a detailed ${tab} analysis for my horoscope.`
        if (tab === 'marriage') {
          queryMsg = `Provide a detailed ${relationshipTarget} relationship analysis for my horoscope.`
        } else if (tab === 'career' && careerSubTab === 'kala_vidya') {
          queryMsg = 'Provide a detailed 64 Kalas, Vidya & Academic Receptivity analysis for my horoscope.'
        }

        const res = await authenticatedFetch(`${apiBaseUrl}/api/tab-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            user_id: userId,
            message: queryMsg,
            tab: tab,
            is_initial: true,
            relationship_type: relationshipTarget,
            sub_tab: careerSubTab,
            birth_details: birthData,
            chart_data: chartData,
          }),
        })

        if (!res.ok) throw new Error('Failed to fetch initial reading')
        const data = await res.json()

        if (!cancelled) {
          const text = data.response || getFallbackReading(tab, chartData)
          setInitialReading(text)
          setMessages([])
          setLoadingInitial(false)

          // Extract structured JSON report if available
          let structDataObj: StructuredReport | null = null
          if (data.structured && data.structured.report) {
            structDataObj = data.structured as StructuredReport
          }
          setStructuredData(structDataObj)

          if (onUpdateCacheByKey) {
            onUpdateCacheByKey(currentKey, {
              initialReading: text,
              messages: [],
              structuredData: structDataObj
            })
          }
        }
      } catch (err) {
        console.error('Failed to load tab reading:', err)
        if (!cancelled) {
          const fallback = getFallbackReading(tab, chartData)
          setInitialReading(fallback)
          setMessages([])
          setLoadingInitial(false)
        }
      }
    }

    fetchTabReading()

    return () => {
      cancelled = true
    }
  }, [cacheKey, tab, relationshipTarget, careerSubTab, apiBaseUrl, sessionId, userId])

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
          tab: tab,
          is_initial: false,
          relationship_type: relationshipTarget,
          sub_tab: careerSubTab,
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

      const finalMessages = [...updatedMessages, assistantMsg]
      setMessages(finalMessages)

      if (onUpdateCacheByKey) {
        onUpdateCacheByKey(cacheKey, { initialReading, messages: finalMessages, structuredData })
      }
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

  // Render Main Locked Tab Overlay only if user's subscription tier does not allow the entire top-level tab
  if (!isTabAllowed) {
    return (
      <LockedTabOverlay
        requiredTier={getRequiredTierForTab(tab)}
        tabLabel={tabConfig.label}
        onUpgrade={() => {
          if (onOpenPricing) onOpenPricing()
        }}
      />
    )
  }

  const getDisplayTitle = () => {
    if (tab === 'marriage') {
      const targetObj = RELATIONSHIP_TARGETS.find((t) => t.id === relationshipTarget)
      return targetObj ? targetObj.label : 'Relationships'
    }
    if (tab === 'career' && careerSubTab === 'kala_vidya') {
      return '64 Kalas & Receptivity'
    }
    if (tab === 'doshas') {
      return 'Vedic Doshas'
    }
    return tab.charAt(0).toUpperCase() + tab.slice(1)
  }

  const displayTitle = getDisplayTitle()
  const scientificLink = tab !== 'marriage' ? SCIENTIFIC_REFERENCE_LINKS[tab] : null

  const renderMainContent = () => {
    if (tab === 'matching' || tab === 'doshas') return null

    if (!isTargetAllowed || !isSubTabAllowed) {
      return (
        <LockedTabOverlay
          requiredTier="pro"
          tabLabel={
            !isSubTabAllowed
              ? '64 Kalas & Receptivity'
              : `${relationshipTarget.charAt(0).toUpperCase() + relationshipTarget.slice(1)} Relationship Engine`
          }
          onUpgrade={() => {
            if (onOpenPricing) onOpenPricing()
          }}
        />
      )
    }

    return (
      <>
        {/* SummaryCards for every tab */}
        <SummaryCards tab={tab} chartData={chartData} computed={computed} birthData={birthData} structuredData={structuredData} />

        {/* Overview Tab Features */}
        {tab === 'overview' && (
          <>
            {chartData?.mode === 'prashna' ? (
              <PrashnaDashboardView chartData={chartData} />
            ) : (
              <div className="space-y-6 mb-6">
                <AnimatedKundliChart chartData={chartData} />
                <PlanetaryTable chartData={chartData} />
              </div>
            )}
          </>
        )}

        {/* Marriage Tab Score Card */}
        {tab === 'marriage' && (
          <RelationshipScoreCard
            target={relationshipTarget}
            chartData={chartData}
          />
        )}

        {/* Career Sub-Tab Dashboards */}
        {tab === 'career' && careerSubTab === 'kala_vidya' && (
          <KalaVidyaDashboard chartData={chartData} />
        )}

        {/* Personality Tab Temperaments Dashboard */}
        {tab === 'personality' && (
          <PersonalityDashboard chartData={chartData} computed={computed} />
        )}

        {/* Remedies Tab Dashboard */}
        {tab === 'remedies' && (
          <RemediesDashboard chartData={chartData} computed={computed} birthData={birthData} />
        )}

        {/* Tab AI Initial Reading Card */}
        <div className="celestial-card p-6 sm:p-8 rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-fixed rounded-2xl flex items-center justify-center text-primary font-bold shadow-xs shrink-0">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-primary">
                  {displayTitle} Horoscope Analysis
                </h3>
                <p className="text-xs text-on-surface-variant">Personalized Vedic Insights & Guidance</p>
              </div>
            </div>
            {scientificLink && (
              <a
                href={scientificLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary-container rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer self-start sm:self-auto border border-primary/25"
              >
                <span className="material-symbols-outlined text-base">science</span>
                <span>Scientific explanation for these predictions</span>
              </a>
            )}
          </div>

          {loadingInitial ? (
            <div className="py-8">
              <AstroLoader
                fullscreen={false}
                size="md"
                message="Consulting Vedic Ephemeris & Reading Planetary Alignments..."
              />
            </div>
          ) : (
            <>
              {/* Render structured report if available, otherwise fall back to markdown */}
              {structuredData ? (
                (tab as string) === 'doshas' ? (
                  <DoshaDashboard report={structuredData as any} />
                ) : (
                  <StructuredReportView report={structuredData} />
                )
              ) : (
                <div className="markdown-container text-sm leading-relaxed text-on-background">
                  <ReactMarkdown>{initialReading}</ReactMarkdown>
                </div>
              )}
              <PredictionFeedbackCard
                tab={tab}
                userPrompt={`Initial ${displayTitle} Horoscope Analysis`}
                aiResponse={initialReading}
                birthData={birthData}
                userId={userId}
                sessionId={sessionId}
              />
            </>
          )}
        </div>

        {/* Tab Dedicated Chat Section */}
        <TabChat
          tab={tab}
          tabName={displayTitle}
          sessionId={sessionId}
          userId={userId}
          birthData={birthData}
          messages={messages}
          loading={loadingChat}
          onSendMessage={handleSendMessage}
          onOpenPricing={onOpenPricing}
        />
      </>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Dasha Timeline Dedicated Tab View */}
      {tab === 'dasha_timeline' && (
        <DashaTimelineView
          sessionId={sessionId}
          userId={userId}
          birthData={birthData}
          chartData={chartData}
        />
      )}

      {/* Doshas Dedicated Tab View */}
      {tab === 'doshas' && isTabAllowed && (
        <DoshasTimelineView
          sessionId={sessionId}
          userId={userId}
          birthData={birthData}
          chartData={chartData}
          apiBaseUrl={apiBaseUrl}
          onOpenPricing={onOpenPricing}
        />
      )}

      {/* Kundli Matching (Gun Milan) Dedicated Tab View */}
      {tab === 'matching' && (
        <KundliMatchingView
          profiles={profiles}
          apiBaseUrl={apiBaseUrl}
          sessionId={sessionId}
        />
      )}

      {/* Marriage Tab Relationship Target Selector (Always rendered if Marriage tab is allowed) */}
      {tab === 'marriage' && isTabAllowed && (
        <RelationshipTargetSelector
          selectedTarget={relationshipTarget}
          onSelectTarget={setRelationshipTarget}
        />
      )}

      {/* Career Sub-Tab Navigation */}
      {tab === 'career' && isTabAllowed && (
        <CareerSubTabNavigation
          activeSubTab={careerSubTab}
          onSubTabChange={setCareerSubTab}
        />
      )}

      {/* Standard Tab View Content for Non-Matching Tabs */}
      {renderMainContent()}
    </div>
  )
}

function getFallbackReading(tab: string, chartData: any): string {
  const asc = chartData?.metadata?.ascendant_sign || 'Aries'
  const moon = chartData?.metadata?.moon_sign || 'Cancer'

  return `### 🌟 Vedic ${tab.toUpperCase()} Reading Overview

**Ascendant Sign:** ${asc}
**Moon Sign (Rashi):** ${moon}

Based on your planetary alignments, your chart shows significant Vedic activations in key house lords governing your **${tab}** area.

- **Primary Driver:** Your Ascendant lord in ${asc} shapes your core vital approach.
- **Mind & Emotions:** Moon in ${moon} governs your psychological receptivity and inner satisfaction.

*You can ask any specific follow-up question below to explore deeper insights!*`
}
