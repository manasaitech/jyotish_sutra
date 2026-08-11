import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import Navbar from '../components/layout/Navbar'
import TabNavigation, { type TabType, ROUTE_TO_TAB_MAP } from '../components/dashboard/TabNavigation'
import TabPanel, { type TabCacheItem } from '../components/dashboard/TabPanel'
import OnboardingTour from '../components/dashboard/OnboardingTour'
import type { UserProfile } from '../types/profile'
import { formatSignWithHindi } from '../utils/hindiMapping'
import { authenticatedFetch } from '../utils/apiClient'
import { getCurrentTier } from '../utils/subscriptionManager'

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
}: DashboardPageProps) {
  const { tab } = useParams<{ tab: string }>()
  const activeTab: TabType = (tab ? ROUTE_TO_TAB_MAP[tab.toLowerCase()] : 'overview') || 'overview'

  const [isExporting, setIsExporting] = useState(false)

  // Granular persistent cache for tab readings, sub-tabs, and chat messages across switches
  const [tabCache, setTabCache] = useState<Record<string, TabCacheItem>>(() => {
    const key = `jyotishasutra_tab_cache_${activeProfileId || 'default'}`
    const saved = sessionStorage.getItem(key)
    return saved ? JSON.parse(saved) : {}
  })

  // Re-hydrate tabCache when switching profile
  useEffect(() => {
    const key = `jyotishasutra_tab_cache_${activeProfileId || 'default'}`
    const saved = sessionStorage.getItem(key)
    setTabCache(saved ? JSON.parse(saved) : {})
  }, [activeProfileId])

  const handleUpdateCacheByKey = (key: string, item: TabCacheItem) => {
    setTabCache((prev) => {
      const next = { ...prev, [key]: item }
      const storageKey = `jyotishasutra_tab_cache_${activeProfileId || 'default'}`
      sessionStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }

  const meta = {
    ascendant_sign: chartData?.metadata?.ascendant_sign || chartData?.ascendant_sign || 'Aries',
    moon_sign: chartData?.metadata?.moon_sign || chartData?.moon_sign || 'Cancer',
    nakshatra: chartData?.metadata?.nakshatra || chartData?.nakshatra || 'Pushya',
  }

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0]
  const displayName = birthData?.fullName || (birthData as any)?.name || activeProfile?.name || chartData?.name || 'Seeker'

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
      <TabNavigation activeTab={activeTab} />

      {/* Main Container */}
      <main className="max-w-[1200px] mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* User Greeting Banner */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 bg-surface p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-outline-variant/60 shadow-xs" data-tour="dashboard-overview">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="font-display text-lg sm:text-2xl md:text-3xl font-bold text-primary leading-snug">
                🙏 Welcome, {displayName}!
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
          {(() => {
            const currentTier = getCurrentTier()
            const isPremium = currentTier === 'standard' || currentTier === 'pro'

            const handleExport = async () => {
              if (!isPremium) {
                if (onOpenPricing) {
                  onOpenPricing()
                } else {
                  alert('Exporting data is a premium feature. Please upgrade to a Standard or Pro plan.')
                }
                return
              }

              setIsExporting(true)
              try {
                const url = activeProfileId
                  ? `${apiBaseUrl}/api/profile/astrology-data/pdf?profile_id=${activeProfileId}`
                  : `${apiBaseUrl}/api/profile/astrology-data/pdf`
                
                const response = await authenticatedFetch(url)
                if (!response.ok) {
                  const errJson = await response.json().catch(() => ({}))
                  throw new Error(errJson.detail || 'Failed to download astrology data PDF')
                }

                const blob = await response.blob()
                const downloadUrl = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = downloadUrl
                
                const safeName = displayName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '')
                a.download = `JyotishaSutra-Astrology-Data-${safeName}.pdf`
                
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(downloadUrl)
              } catch (err: any) {
                console.error('Error exporting PDF:', err)
                alert(err.message || 'An error occurred while preparing your astrology report. Please try again.')
              } finally {
                setIsExporting(false)
              }
            }

            return (
              <div className="flex flex-col items-end sm:items-center gap-1.5 self-end sm:self-center">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-fixed hover:bg-primary-fixed/80 text-primary font-semibold text-xs tracking-wider uppercase shadow-xs transition-all cursor-pointer border border-primary/20 shrink-0 disabled:opacity-50"
                  title={isPremium ? "Download complete astrology report PDF" : "Premium: Export your astrology data"}
                >
                  {isExporting ? (
                    <span className="material-symbols-outlined text-base animate-spin">autorenew</span>
                  ) : !isPremium ? (
                    <span className="material-symbols-outlined text-base">lock</span>
                  ) : (
                    <span className="material-symbols-outlined text-base">download</span>
                  )}
                  <span>{isExporting ? 'Preparing...' : 'Export Your Data'}</span>
                </button>
                {isExporting && (
                  <p className="text-[10px] text-primary font-medium animate-pulse text-right sm:text-center max-w-[200px] leading-tight">
                    🌌 Aligning celestial coordinates... Your download will begin automatically.
                  </p>
                )}
              </div>
            )
          })()}
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
      <OnboardingTour />
    </div>
  )
}
