import { Link } from 'react-router-dom'
import { isTabEnabled } from '../../config/featureFlags'
import { isTabAllowedForTier, getRequiredTierForTab, TIER_CONFIG } from '../../config/subscriptionConfig'
import { getCurrentTier } from '../../utils/subscriptionManager'

export type TabType =
  | 'overview'
  | 'career'
  | 'dasha_timeline'
  | 'marriage'
  | 'matching'
  | 'health'
  | 'food'
  | 'remedies'
  | 'finance'
  | 'personality'
  | 'spiritual'
  | 'doshas'
  | 'strategic_insights'
  | 'past_events'
  | 'wounds_trauma'
  | 'gifts_talents'
  | 'soul_growth'

export const ROUTE_TO_TAB_MAP: Record<string, TabType> = {
  '': 'overview',
  'overview': 'overview',
  'career': 'career',
  'dasha': 'dasha_timeline',
  'dasha-timeline': 'dasha_timeline',
  'dasha_timeline': 'dasha_timeline',
  'relationships': 'marriage',
  'marriage': 'marriage',
  'matching': 'matching',
  'health': 'health',
  'food': 'food',
  'remedies': 'remedies',
  'finance': 'finance',
  'personality': 'personality',
  'spiritual': 'spiritual',
  'doshas': 'doshas',
  'strategic-insights': 'strategic_insights',
  'strategic_insights': 'strategic_insights',
  'past-events': 'past_events',
  'past_events': 'past_events',
  'wounds-trauma': 'wounds_trauma',
  'wounds_trauma': 'wounds_trauma',
  'gifts-talents': 'gifts_talents',
  'gifts_talents': 'gifts_talents',
  'soul-growth': 'soul_growth',
  'soul_growth': 'soul_growth',
}

export const TAB_TO_ROUTE_MAP: Record<TabType, string> = {
  'overview': '',
  'career': 'career',
  'dasha_timeline': 'dasha',
  'marriage': 'relationships',
  'matching': 'matching',
  'health': 'health',
  'food': 'food',
  'remedies': 'remedies',
  'finance': 'finance',
  'personality': 'personality',
  'spiritual': 'spiritual',
  'doshas': 'doshas',
  'strategic_insights': 'strategic-insights',
  'past_events': 'past-events',
  'wounds_trauma': 'wounds-trauma',
  'gifts_talents': 'gifts-talents',
  'soul_growth': 'soul-growth',
}

export interface TabConfig {
  id: TabType
  label: string
  icon: string
  description: string
}

export const ALL_TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: 'grid_view', description: 'Complete Horoscope Summary' },
  { id: 'career', label: 'Career', icon: 'work', description: 'Profession, Business & Growth' },
  { id: 'dasha_timeline', label: 'Dasha Timeline', icon: 'calendar_month', description: '120-Year Vimshottari Timeline & Antardashas' },
  { id: 'marriage', label: 'Relationships', icon: 'favorite', description: 'Compatibility & Relationships' },
  { id: 'matching', label: 'Kundli Matching', icon: 'diversity_2', description: '36 Gunas, Manglik & Compatibility' },
  { id: 'health', label: 'Health', icon: 'medical_services', description: 'Body Systems & Wellness' },
  { id: 'food', label: 'Food & Diet', icon: 'restaurant', description: 'Ayurvedic Prakriti & Nutrition' },
  { id: 'remedies', label: 'Remedies', icon: 'self_improvement', description: 'Mantras, Gemstones & Charity' },
  { id: 'finance', label: 'Finance', icon: 'payments', description: 'Wealth, Savings & Yogas' },
  { id: 'personality', label: 'Personality', icon: 'psychology', description: 'Mind, Traits & Strengths' },
  { id: 'spiritual', label: 'Spiritual Growth', icon: 'auto_awesome', description: 'Dharma, Meditation & Gita' },
  { id: 'doshas', label: 'Doshas', icon: 'shield', description: 'Vedic Afflictions & Remedies' },
  { id: 'strategic_insights', label: 'Life Pattern Intelligence', icon: 'insights', description: 'AI Astrological Signature Matcher & Recurrence Scan' },
  { id: 'past_events', label: 'Past Events', icon: 'history', description: 'AI Event Discovery & Life Timeline Analysis' },
  { id: 'wounds_trauma', label: 'Wounds & Trauma', icon: 'healing', description: 'Past-Life Wounds & Family Karma' },
  { id: 'gifts_talents', label: 'Gifts & Talents', icon: 'diamond', description: 'Innate Abilities & Past-Life Gifts' },
  { id: 'soul_growth', label: 'Soul Growth', icon: 'route', description: 'Karmic Lessons & Dharmic Purpose' },
]

export const TABS: TabConfig[] = ALL_TABS.filter((tab) => isTabEnabled(tab.id))

interface TabNavigationProps {
  activeTab: TabType
  onTabChange?: (tab: TabType) => void
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const visibleTabs = TABS
  const currentTier = getCurrentTier()

  return (
    <div className="bg-surface border-b border-outline-variant/60 sticky top-[64px] z-40 shadow-xs">
      <div className="max-w-[1200px] mx-auto px-2 sm:px-4">
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto custom-scrollbar py-1.5 sm:py-2 no-scrollbar" data-tour="tab-navigation">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id
            const isAllowed = isTabAllowedForTier(tab.id, currentTier)
            const requiredTier = getRequiredTierForTab(tab.id)
            const tierInfo = TIER_CONFIG[requiredTier]
            const route = TAB_TO_ROUTE_MAP[tab.id]
            const to = route ? `/dashboard/${route}` : '/dashboard'

            return (
              <Link
                key={tab.id}
                to={to}
                onClick={() => {
                  if (onTabChange) onTabChange(tab.id)
                }}
                title={!isAllowed ? `Requires ${tierInfo.label} Plan` : tab.description}
                className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl whitespace-nowrap transition-all text-xs sm:text-sm font-medium cursor-pointer shrink-0 relative no-underline ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                    : !isAllowed
                    ? 'text-on-surface-variant/70 bg-surface-variant/20 hover:bg-surface-variant/50'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/40'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-base sm:text-lg ${isActive ? 'text-white' : !isAllowed ? 'text-on-surface-variant/60' : 'text-primary'}`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-[11px]">{tab.label.length > 8 ? tab.label.substring(0, 7) + '…' : tab.label}</span>

                {/* Lock Badge if Tab Requires Higher Subscription Tier */}
                {!isAllowed && (
                  <span
                    className="material-symbols-outlined text-xs ml-0.5"
                    style={{ color: tierInfo.color, fontVariationSettings: "'FILL' 1" }}
                  >
                    lock
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
