import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import AssistantMessage from '../chat/AssistantMessage'
import SuggestionChips from '../chat/SuggestionChips'
import PredictionFeedbackCard from '../chat/PredictionFeedbackCard'
import type { TabType } from './TabNavigation'
import { getCurrentTier, isChatLimitReached, getRemainingChats, incrementChatCount } from '../../utils/subscriptionManager'
import { getChatLimitForTier } from '../../config/subscriptionConfig'

export interface Message {
  id?: string
  sender?: 'user' | 'assistant'
  role?: 'user' | 'assistant'
  text?: string
  content?: string
}

interface TabChatProps {
  tab?: TabType
  tabName?: string
  sessionId?: string
  userId?: string
  birthData?: any
  messages: Message[]
  onSendMessage: (text: string) => void
  loading: boolean
  onOpenPricing?: () => void
}

const TAB_SUGGESTIONS: Record<string, string[]> = {
  overview: [
    '🔮 When will the luckiest phase of my life begin?',
    '👑 What is my single biggest planetary superpower?',
    '⚡ Which major Dasha shift will transform my life next?',
    '🪐 Explain my Ascendant & Moon sign dynamic',
  ],
  career: [
    '🚀 When will I get my big career promotion or major job breakthrough?',
    '💼 Should I choose a Corporate Career or start my own Business venture?',
    '🎓 Which of the 64 Classical Kalas is my natural soul talent & study strength?',
    '🌍 Will I get an international job posting or work opportunities abroad?',
  ],
  dasha_timeline: [
    '📅 When does my next major Mahadasha start and what transformation will it bring?',
    '🔮 How will my current Antardasha planet affect my career and wealth window?',
    '⚡ What are the key karmic lessons and opportunities during my active Dasha?',
    '🚀 Which exact year will bring my biggest life breakthrough according to my Dasha timeline?',
  ],
  kala_vidya: [
    '🎓 Which of the 64 Classical Kalas is my natural soul talent?',
    '🧠 How to double my memory retention (Smriti Shakti) based on 5th lord?',
    '📚 What is my optimal study & exam focus technique?',
    '🌟 Which competitive fields suit my cognitive absorption speed?',
  ],
  marriage: [
    '💖 When will I meet my soulmate and where will we cross paths?',
    '💍 Will I have a Love or Arranged marriage?',
    '🔮 What will be my spouse\'s personality, profession & looks?',
    '⚠️ Is my Manglik or Bhakoot/Nadi dosha active and how to cancel it?',
  ],
  spouse: [
    '💖 When will I meet my soulmate and where will we cross paths?',
    '💍 Will I have a Love or Arranged marriage?',
    '🔮 What will be my spouse\'s personality, profession & looks?',
    '⚠️ Is my Manglik or Bhakoot/Nadi dosha active and how to cancel it?',
  ],
  father: [
    '👑 How does my 9th house & Sun affect my relationship with my Father?',
    '🌟 What karmic blessings or ancestral heritage do I receive from my Father?',
    '🤝 How can I resolve communication gaps with my Father?',
    '🌿 What remedies strengthen my Pitr (Father) connection & luck?',
  ],
  mother: [
    '🤍 How is my emotional bond & psychological connection with my Mother?',
    '🏡 How does my 4th house & Moon influence my Mother\'s peace & health?',
    '✨ What hidden talents or emotional warmth did I inherit from my Mother?',
    '🌊 Which remedies balance my Moon for motherly harmony?',
  ],
  siblings: [
    '🤝 Will my brothers & sisters support me in times of financial need?',
    '⚔️ How does Mars & 3rd house shape sibling rivalry vs co-operation?',
    '🌟 Which of my siblings is karmically closest to me?',
    '🛡️ How to heal friction and build lifelong bonds with siblings?',
  ],
  children: [
    '👶 When will I be blessed with children (Santana Yoga)?',
    '🌟 What will be the intelligence & achievements of my future children?',
    '🧠 How to guide my children based on my 5th house Buddhi lord?',
    '🌿 Which remedies enhance fertility & child prosperity?',
  ],
  friends: [
    '🤝 Who among my friends are true loyal allies vs secret rivals?',
    '👥 How does my 11th house shape my social circle & network gains?',
    '⚠️ Which zodiac signs make the most compatible friends for me?',
    '🌟 How to attract high-value, supportive friendships?',
  ],
  boss: [
    '👔 How do senior authorities & bosses perceive my work ethic?',
    '📈 When will my boss recognize my efforts and approve my promotion?',
    '⚡ How to navigate power struggles with a dominant boss?',
    '☀️ Which remedies enhance my workplace authority (Sun/10th Lord)?',
  ],
  mentors: [
    '🎓 Who is my ideal spiritual or career Guru according to Jupiter & 9th house?',
    '📚 How will a mentor accelerate my life success?',
    '🔮 When will I find a guide who unlocks my true potential?',
    '🌟 How to build a deep, respectful bond with my teachers?',
  ],
  inlaws: [
    '🏠 How will my relationship with my In-Laws be after marriage?',
    '🤝 Will my In-Laws support my career & financial freedom?',
    '⚠️ How to avoid early friction with in-laws based on 8th house?',
    '🌿 Remedies for harmony and respect with family-in-law',
  ],
  health: [
    '🩺 What are my primary physical & organ vulnerabilities under Vedic Medical Astrology?',
    '🌿 What is my dominant Ayurvedic Tridosha (Vata-Pitta-Kapha) balance and Prakriti?',
    '🌱 Which Ayurvedic herbs and natural remedies align with my planetary chart?',
    '⚡ Which active Dasha requires targeted health and immunity remedies?',
  ],
  food: [
    '🍲 Which exact foods & spices balance my planetary Ayurvedic Prakriti?',
    '🚫 What dietary habits should I avoid to maintain optimal Agni (digestive fire)?',
    '🥛 Which weekday fasting or Sattvic diet boosts my metabolic vitality?',
    '🌿 What is my best daily eating schedule based on my Ayurvedic chart?',
  ],
  remedies: [
    '💎 Which gemstone (Ratna) is 100% safe and auspicious for my Lagna?',
    '🌱 How can I use Ayurvedic daily routines (Dinacharya) as planetary remedies?',
    '🪐 Which planet needs urgent pacification (Dan/Pooja) right now?',
    '⚡ How to perform simple home remedies to clear active Rahu/Saturn afflictions?',
  ],
  finance: [
    '💰 When will my biggest wealth accumulation phase manifest?',
    '📈 Should I invest in Real Estate, Stocks, or Business according to D2 Hora?',
    '🔮 Do I have Dhana Yogas for sudden monetary windfalls?',
    '🛡️ How to eliminate debt & plug financial leakages in my chart?',
  ],
  personality: [
    '🔮 What is my single most attractive, hidden personality trait?',
    '👁️ How do people secretly perceive my vibe when I enter a room?',
    '🧠 What is my subconscious emotional trigger & how to master it?',
    '⚡ How does my Sun, Moon & Lagna combo shape my decision style?',
  ],
  spiritual: [
    '🕉️ What is my soul\'s ultimate purpose (Atmakaraka path) in this incarnation?',
    '🧘 Which meditation style & deity (Ishta Devata) connects me to higher consciousness?',
    '📖 Which Bhagavad Gita verse holds the secret key to my current life challenge?',
    '🌊 How to clear karmic debts (Prarabdha Karma) & achieve inner peace?',
  ],
}

export default function TabChat({
  tab = 'overview',
  tabName,
  sessionId,
  userId,
  birthData,
  messages,
  onSendMessage,
  loading,
  onOpenPricing,
}: TabChatProps) {
  const [input, setInput] = useState('')

  const currentTier = getCurrentTier()
  const limitReached = isChatLimitReached(currentTier)
  const remaining = getRemainingChats(currentTier)
  const totalLimit = getChatLimitForTier(currentTier)

  const activeTabName = tabName || (tab.charAt(0).toUpperCase() + tab.slice(1))

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  const handleSend = () => {
    if (!input.trim() || loading || limitReached) return
    incrementChatCount()
    onSendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionSelect = (text: string) => {
    if (limitReached) return
    incrementChatCount()
    onSendMessage(text)
  }

  const getSuggestions = () => {
    const lowerName = (tabName || '').toLowerCase()
    const lowerTab = (tab || 'overview').toLowerCase()

    // Sub-target keys to check first against tabName (displayTitle)
    const specificKeys = [
      'mother', 'siblings', 'boss', 'father', 'spouse', 'children',
      'friends', 'mentors', 'inlaws', 'kala_vidya'
    ]

    for (const key of specificKeys) {
      if (lowerName.includes(key) && TAB_SUGGESTIONS[key]) {
        return TAB_SUGGESTIONS[key]
      }
    }

    // Direct tab key match
    if (TAB_SUGGESTIONS[lowerTab]) {
      return TAB_SUGGESTIONS[lowerTab]
    }

    return TAB_SUGGESTIONS.overview
  }

  const suggestions = getSuggestions()

  return (
    <div className="mt-5 sm:mt-8 border-t border-outline-variant/40 pt-4 sm:pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
        <h3 className="font-display text-lg sm:text-2xl font-bold text-primary flex items-center gap-1.5 sm:gap-2">
          <span className="material-symbols-outlined text-primary text-base sm:text-xl">forum</span>
          Ask {activeTabName} Guidance
        </h3>

        {/* Daily Chat Usage Badge */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-variant/50 border border-outline-variant/60">
          <span className="material-symbols-outlined text-xs sm:text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            chat
          </span>
          <span className="text-on-surface-variant">
            {isFinite(totalLimit) ? `${remaining}/${totalLimit} remaining` : 'Unlimited ✨'}
          </span>
        </div>
      </div>

      {/* Message History (Scrollable Panel) */}
      {messages.length > 0 && (
        <div className="space-y-4 mb-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar border border-outline-variant/15 p-3 rounded-2xl bg-surface-variant/5">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user' || msg.role === 'user'
            const textContent = msg.text || msg.content || ''
            const prevUserMsg = !isUser && idx > 0 ? (messages[idx - 1]?.text || messages[idx - 1]?.content || '') : ''

            return !isUser ? (
              <AssistantMessage key={idx} icon="auto_awesome">
                <div className="font-body text-sm leading-relaxed text-on-surface markdown-container">
                  <ReactMarkdown>{textContent}</ReactMarkdown>
                </div>
                <PredictionFeedbackCard
                  tab={tab || 'general'}
                  userPrompt={prevUserMsg}
                  aiResponse={textContent}
                  birthData={birthData}
                  userId={userId}
                  sessionId={sessionId}
                />
              </AssistantMessage>
            ) : (
              <div key={idx} className="flex justify-end animate-fade-in-up">
                <div className="max-w-[90%] sm:max-w-[85%] bg-primary-fixed border border-primary/20 text-on-primary-fixed rounded-2xl rounded-tr-none px-3 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed shadow-xs font-medium break-words">
                  {textContent}
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="flex gap-3 items-center pl-4 py-3 opacity-70">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
              <span className="text-xs text-on-surface-variant italic ml-1">Consulting Jyotish charts...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Loading state when list is empty */}
      {messages.length === 0 && loading && (
        <div className="flex gap-3 items-center pl-4 py-3 opacity-70 mb-6">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
          <span className="text-xs text-on-surface-variant italic ml-1">Consulting Jyotish charts...</span>
        </div>
      )}

      {/* Chat Limit Reached Warning Banner */}
      {limitReached ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center mb-4 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 text-amber-700 font-bold text-sm mb-1">
            <span className="material-symbols-outlined text-base">warning</span>
            Daily Chat Limit Reached ({totalLimit}/{totalLimit} Messages)
          </div>
          <p className="text-xs text-on-surface-variant mb-3">
            You've reached your free daily AI chat limit for today. Upgrade your subscription for higher or unlimited daily chat limits!
          </p>
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-primary-container transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
              Upgrade Subscription Plan
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Highlighted Input Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-500/[0.04] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 border-amber-500 shadow-md shadow-amber-500/10 focus-within:border-amber-600 focus-within:ring-4 focus-within:ring-amber-500/20 focus-within:shadow-lg focus-within:shadow-amber-500/15 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${activeTabName.toLowerCase()}...`}
              disabled={loading}
              className="flex-1 bg-transparent px-2 sm:px-3 py-2.5 sm:py-2 text-base sm:text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant/60 min-w-0"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-10 h-10 sm:w-10 sm:h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-container disabled:opacity-40 transition-all cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">send</span>
            </button>
          </div>

          {/* Suggestion Chips (Moved Below Chatbox) */}
          {!loading && (
            <div className="mt-4">
              <SuggestionChips suggestions={suggestions} onSelect={handleSuggestionSelect} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
