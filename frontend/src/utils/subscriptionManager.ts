/**
 * Subscription Manager — localStorage persistence for tier & chat limits.
 */
import type { SubscriptionTier } from '../config/subscriptionConfig'
import { getChatLimitForTier } from '../config/subscriptionConfig'

const TIER_KEY = 'jyotishasutra_subscription_tier'
const CHAT_COUNT_PREFIX = 'jyotishasutra_chat_count_'

function getTodayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Get the current subscription tier from localStorage */
export function getCurrentTier(): SubscriptionTier {
  const stored = localStorage.getItem(TIER_KEY)
  if (stored === 'standard' || stored === 'pro') return stored
  return 'free'
}

/** Set the subscription tier in localStorage */
export function setCurrentTier(tier: SubscriptionTier): void {
  localStorage.setItem(TIER_KEY, tier)
}

/** Get today's chat message count */
export function getDailyChatCount(): number {
  const key = CHAT_COUNT_PREFIX + getTodayKey()
  const val = localStorage.getItem(key)
  return val ? parseInt(val, 10) : 0
}

/** Increment today's chat message count */
export function incrementChatCount(): void {
  const key = CHAT_COUNT_PREFIX + getTodayKey()
  const current = getDailyChatCount()
  localStorage.setItem(key, String(current + 1))
}

/** Check if the daily chat limit has been reached for the given tier */
export function isChatLimitReached(tier: SubscriptionTier): boolean {
  const limit = getChatLimitForTier(tier)
  if (!isFinite(limit)) return false
  return getDailyChatCount() >= limit
}

/** Get remaining chat messages for today */
export function getRemainingChats(tier: SubscriptionTier): number {
  const limit = getChatLimitForTier(tier)
  if (!isFinite(limit)) return Infinity
  return Math.max(0, limit - getDailyChatCount())
}

const RETAIL_BALANCE_KEY = 'jyotishasutra_retail_question_balance'

export function getRetailQuestionBalance(): number {
  const stored = localStorage.getItem(RETAIL_BALANCE_KEY)
  return stored ? parseInt(stored, 10) : 0
}

export function incrementRetailQuestionBalance(amount: number): void {
  const current = getRetailQuestionBalance()
  localStorage.setItem(RETAIL_BALANCE_KEY, String(current + amount))
}

export function decrementRetailQuestionBalance(): void {
  const current = getRetailQuestionBalance()
  localStorage.setItem(RETAIL_BALANCE_KEY, String(Math.max(0, current - 1)))
}

export function isTabChatLimitReached(tier: SubscriptionTier, tabUserMessagesCount: number): boolean {
  if (tier === 'pro' || tier === 'standard') return false
  if (getRetailQuestionBalance() > 0) return false
  return tabUserMessagesCount >= 1
}
