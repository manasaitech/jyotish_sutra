/**
 * Feature Flags Configuration
 * Controls feature availability and tab visibility across Kundli GPT / AstroSutra AI.
 */

export interface FeatureFlags {
  enableOverviewTab: boolean
  enableCareerTab: boolean
  enableDashaTimelineTab: boolean
  enableMarriageTab: boolean
  enableMatchingTab: boolean
  enableHealthTab: boolean
  enableFoodTab: boolean
  enableRemediesTab: boolean
  enableFinanceTab: boolean
  enablePersonalityTab: boolean
  enableSpiritualTab: boolean
  enableDoshasTab: boolean
  enableStrategicInsightsTab: boolean
  enablePastEventsTab: boolean
  enableWoundsTraumaTab: boolean
  enableGiftsTalentsTab: boolean
  enableSoulGrowthTab: boolean
}

export const FEATURE_FLAGS: FeatureFlags = {
  enableOverviewTab: true,
  enableCareerTab: true,
  enableDashaTimelineTab: true, // ✅ Enabled Vimshottari Dasha Timeline tab
  enableMarriageTab: true,
  enableMatchingTab: true,    // ✅ Enabled Kundli Matching (Gun Milan) tab
  enableHealthTab: true,
  enableFoodTab: true,
  enableRemediesTab: true,    // ✅ Enabled Remedies tab
  enableFinanceTab: true,
  enablePersonalityTab: true, // ✅ Enabled Personality tab
  enableSpiritualTab: false,   // ❌ Disabled via feature flag per request
  enableDoshasTab: true,       // ✅ Enabled Dosha Analysis tab
  enableStrategicInsightsTab: true, // ✅ Enabled Strategic Insights tab
  enablePastEventsTab: false,        // ❌ Disabled Past Events Discovery tab
  enableWoundsTraumaTab: true,      // ✅ Enabled Wounds & Trauma tab
  enableGiftsTalentsTab: true,      // ✅ Enabled Gifts & Talents tab
  enableSoulGrowthTab: true,        // ✅ Enabled Soul Growth tab
}


/** Check if a specific tab ID is enabled by feature flags */
export function isTabEnabled(tabId: string): boolean {
  switch (tabId) {
    case 'overview':
      return FEATURE_FLAGS.enableOverviewTab
    case 'career':
      return FEATURE_FLAGS.enableCareerTab
    case 'dasha_timeline':
      return FEATURE_FLAGS.enableDashaTimelineTab
    case 'marriage':
      return FEATURE_FLAGS.enableMarriageTab
    case 'matching':
      return FEATURE_FLAGS.enableMatchingTab
    case 'health':
      return FEATURE_FLAGS.enableHealthTab
    case 'food':
      return FEATURE_FLAGS.enableFoodTab
    case 'remedies':
      return FEATURE_FLAGS.enableRemediesTab
    case 'finance':
      return FEATURE_FLAGS.enableFinanceTab
    case 'personality':
      return FEATURE_FLAGS.enablePersonalityTab
    case 'spiritual':
      return FEATURE_FLAGS.enableSpiritualTab
    case 'doshas':
      return FEATURE_FLAGS.enableDoshasTab
    case 'strategic_insights':
      return FEATURE_FLAGS.enableStrategicInsightsTab
    case 'past_events':
      return FEATURE_FLAGS.enablePastEventsTab
    case 'wounds_trauma':
      return FEATURE_FLAGS.enableWoundsTraumaTab
    case 'gifts_talents':
      return FEATURE_FLAGS.enableGiftsTalentsTab
    case 'soul_growth':
      return FEATURE_FLAGS.enableSoulGrowthTab
    default:
      return true
  }
}
