/**
 * Subscription Tier Configuration
 * Defines Free / Standard / Pro tiers with tab access, limits, sub-feature rules, and pricing.
 */
import type { TabType } from '../components/dashboard/TabNavigation'
import type { RelationshipTarget } from '../components/dashboard/RelationshipTargetSelector'

export type SubscriptionTier = 'free' | 'standard' | 'pro'

export interface TierConfig {
  id: SubscriptionTier
  label: string
  icon: string
  price: string
  priceSubtext: string
  color: string
  bgGradient: string
  borderColor: string
  allowedTabs: TabType[]
  dailyChatLimit: number
  maxProfiles: number
  allowPrashna: boolean
  allowBTR: boolean
  features: string[]
  highlighted?: boolean
}

export const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    label: 'Free',
    icon: 'star_border',
    price: '₹0',
    priceSubtext: 'Forever free',
    color: '#6E6558',
    bgGradient: 'var(--gradient-free)',
    borderColor: '#E9DFC8',
    allowedTabs: ['overview', 'career'],
    dailyChatLimit: 5,
    maxProfiles: 2,
    allowPrashna: false,
    allowBTR: false,
    features: [
      'Overview Tab — Full Chart Summary',
      'Career Tab — Profession & Growth Overview',
      '5 AI Chat Messages / Day',
      '2 Saved Profiles',
    ],
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    icon: 'star_half',
    price: '₹399',
    priceSubtext: '/month',
    color: '#E67E22',
    bgGradient: 'var(--gradient-standard)',
    borderColor: '#E67E22',
    allowedTabs: ['overview', 'career', 'dasha_timeline', 'personality', 'health', 'marriage', 'matching', 'food', 'doshas', 'past_events'],
    dailyChatLimit: 25,
    maxProfiles: 3,
    allowPrashna: false,
    allowBTR: true,
    features: [
      'Everything in Free, plus:',
      '📅 Dasha Timeline — 120-Year Vimshottari & Antardashas',
      '🔍 Past Events — AI Event Discovery & Life Timeline',
      'Kundli Matching (36 Gunas, Manglik & AI Report)',
      'Personality Tab — Mind, Traits & Temperaments',
      'Health Tab — Body Systems & Wellness',
      '🛡️ Doshas Tab — Vedic Afflictions & Remedies',
      'Relationships (Mother, Siblings, Boss & Office)',
      'Food & Diet Tab — Ayurvedic Nutrition',
      'Birth Time Rectification',
      '25 AI Chat Messages / Day',
      '3 Saved Profiles',
    ],
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    icon: 'auto_awesome',
    price: '₹799',
    priceSubtext: '/month',
    color: '#C89B3C',
    bgGradient: 'var(--gradient-pro)',
    borderColor: '#C89B3C',
    allowedTabs: ['overview', 'career', 'dasha_timeline', 'personality', 'health', 'remedies', 'food', 'finance', 'marriage', 'matching', 'spiritual', 'doshas', 'strategic_insights', 'past_events'],
    dailyChatLimit: Infinity,
    maxProfiles: 5,
    allowPrashna: true,
    allowBTR: true,
    highlighted: true,
    features: [
      'Everything in Standard, plus:',
      '🎓 Kala, Vidya & Student Receptivity (64 Kalas)',
      'Remedies Tab — Mantras & Gemstones',
      'All 9 Relationship Engines (Including Spouse, Father, In-Laws)',
      'Finance Tab — D2 Hora Wealth Analysis',
      'Spiritual Growth Tab — Dharma & Gita',
      'Prashna Kundli (Horary)',
      '🎯 Strategic Insights — AI Decision Intelligence',
      'Unlimited AI Chat Messages',
      '5 Saved Profiles',
    ],
  },
}

/** Standard Tier allowed relationship targets */
export const STANDARD_RELATIONSHIP_TARGETS: RelationshipTarget[] = ['mother', 'siblings', 'boss']

/** Check if a specific relationship target is allowed for the user's tier */
export function isRelationshipTargetAllowed(target: RelationshipTarget, tier: SubscriptionTier): boolean {
  if (tier === 'pro') return true
  if (tier === 'standard') return STANDARD_RELATIONSHIP_TARGETS.includes(target)
  return false
}

/** Check if Career sub-tab (kala_vidya) is allowed for the user's tier */
export function isCareerSubTabAllowed(subTab: string, tier: SubscriptionTier): boolean {
  if (subTab === 'kala_vidya') return tier === 'pro'
  return true
}

/** Check if a specific tab is allowed for the given tier */
export function isTabAllowedForTier(tab: TabType, tier: SubscriptionTier): boolean {
  return TIER_CONFIG[tier].allowedTabs.includes(tab)
}

/** Get the minimum tier required to access a tab */
export function getRequiredTierForTab(tab: TabType): SubscriptionTier {
  if (TIER_CONFIG.free.allowedTabs.includes(tab)) return 'free'
  if (TIER_CONFIG.standard.allowedTabs.includes(tab)) return 'standard'
  return 'pro'
}

/** Get daily chat limit for a tier */
export function getChatLimitForTier(tier: SubscriptionTier): number {
  return TIER_CONFIG[tier].dailyChatLimit
}

/** Get max profiles for a tier */
export function getMaxProfilesForTier(tier: SubscriptionTier): number {
  return TIER_CONFIG[tier].maxProfiles
}
