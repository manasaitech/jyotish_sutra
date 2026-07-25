import { useState } from 'react'

import Navbar from '../components/layout/Navbar'
import TabNavigation, { type TabType } from '../components/dashboard/TabNavigation'
import TabPanel, { type TabCacheItem } from '../components/dashboard/TabPanel'
import type { UserProfile } from '../types/profile'
import { formatSignWithHindi } from '../utils/hindiMapping'

interface DashboardPageProps {
  chartData: any
  computed?: any
  birthData: any
  sessionId: string
  userId: string
  apiBaseUrl: string
  profiles?: UserProfile[]
  activeProfileId?: string
  onOpenProfile?: () => void
  onOpenPricing?: () => void
  onResetProfile: () => void
}

export default function DashboardPage({
  chartData,
  computed,
  birthData,
  sessionId,
  userId,
  apiBaseUrl,
  profiles = [],
  activeProfileId,
  onOpenProfile,
  onOpenPricing,
  onResetProfile,
}: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Granular persistent cache for tab readings, sub-tabs, and chat messages across switches
  const [tabCache, setTabCache] = useState<Record<string, TabCacheItem>>({})

  const handleUpdateCacheByKey = (key: string, item: TabCacheItem) => {
    setTabCache((prev) => ({ ...prev, [key]: item }))
  }

  const meta = {
    ascendant_sign: chartData?.metadata?.ascendant_sign || chartData?.ascendant_sign || 'Aries',
    moon_sign: chartData?.metadata?.moon_sign || chartData?.moon_sign || 'Cancer',
    nakshatra: chartData?.metadata?.nakshatra || chartData?.nakshatra || 'Pushya',
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar with Profile Section Trigger & Subscription Pricing Link */}
      <Navbar
        profiles={profiles}
        activeProfileId={activeProfileId}
        onOpenProfile={onOpenProfile}
        onOpenPricing={onOpenPricing}
      />

      {/* Tab Navigation Sticky Bar */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Container */}
      <main className="max-w-[1200px] mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* User Greeting Banner */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-4 bg-surface p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-outline-variant/60 shadow-xs">
          <div className="min-w-0 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="font-display text-lg sm:text-2xl md:text-3xl font-bold text-primary leading-snug">
                🙏 Welcome, {birthData?.fullName || 'Seeker'}!
              </h1>
              <span className="text-[10px] sm:text-xs font-semibold text-primary bg-primary-fixed px-2 py-0.5 rounded-full border border-primary/20 whitespace-nowrap">
                {chartData?.mode === 'prashna'
                  ? '🔮 Prashna Horary'
                  : chartData?.mode === 'partial'
                  ? '🪐 Estimated Horoscope'
                  : birthData?.relationship || 'Janma Kundli'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-on-surface-variant mt-1 font-medium leading-relaxed break-words">
              {chartData?.mode === 'prashna' ? (
                <>Prashna Lagna: <strong className="text-primary">{formatSignWithHindi(chartData?.prashna_lagna?.sign || 'Aries')}</strong> · Moon Sign: <strong className="text-primary">{formatSignWithHindi(chartData?.planets?.moon?.sign || 'Cancer')}</strong> · Nakshatra: <strong className="text-primary">{chartData?.panchanga?.nakshatra}</strong></>
              ) : chartData?.mode === 'partial' ? (
                <>Moon Sign (Rashi): <strong className="text-primary">{formatSignWithHindi(chartData?.moon_sign || 'Cancer')}</strong> · Nakshatra: <strong className="text-primary">{chartData?.nakshatra}</strong> · Lagna: <strong className="text-amber-800">Excluded (No Birth Time)</strong></>
              ) : (
                <>Ascendant (Lagna): <strong className="text-primary">{formatSignWithHindi(meta.ascendant_sign)}</strong> · Moon Sign (Rashi): <strong className="text-primary">{formatSignWithHindi(meta.moon_sign)}</strong> · Nakshatra: <strong className="text-primary">{meta.nakshatra}</strong></>
              )}
            </p>
          </div>

          <button
            onClick={onResetProfile}
            className="text-xs text-on-surface-variant hover:text-primary transition-colors underline underline-offset-4 decoration-outline-variant hover:decoration-primary cursor-pointer shrink-0"
          >
            Edit Details
          </button>
        </div>

        {/* Tab Panel View */}
        <TabPanel
          key={`${activeProfileId}-${activeTab}`}
          tab={activeTab}
          chartData={chartData}
          computed={computed || chartData?.computed}
          birthData={birthData}
          sessionId={`${sessionId}_${userId}`}
          userId={userId}
          apiBaseUrl={apiBaseUrl}
          tabCacheMap={tabCache}
          onUpdateCacheByKey={handleUpdateCacheByKey}
          onOpenPricing={onOpenPricing}
          profiles={profiles}
        />
      </main>
    </div>
  )
}
