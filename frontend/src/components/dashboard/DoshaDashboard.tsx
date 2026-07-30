import { useState } from 'react'

// Types for the deterministic JSON structure
export interface TimelineData {
  current: string
  next_activation: string
  estimated_period: string
}

export interface RemediesData {
  spiritual: string[]
  lifestyle: string[]
  practical: string[]
}

export interface DoshaItem {
  name: string
  formation_strength: number // 1-5 stars
  confidence: string // Low, Moderate, High
  status: string // Dormant, Active, Peak, Latent, Reduced
  practical_impact: string // Minimal, Low, Moderate, High, Critical
  why_exists: string[]
  why_active?: string
  is_permanent?: boolean
  positive_traits: string[]
  challenges: string[]
  protective_factors: string[]
  aggravating_factors: string[]
  timeline: TimelineData
  remedies: RemediesData
  detailed_timeline?: any[]
  started?: string
  expected_end?: string
  expected_start?: string
  active_period?: string
  severity?: string
}

export interface SummaryData {
  total_detected: number
  ongoing: number
  completed: number
  upcoming: number
}

export interface DeterministicDoshaReport {
  report?: {
    summary?: SummaryData
    completed?: any[]
    ongoing?: any[]
    upcoming?: any[]
    disclaimer?: string
  }
}

interface DoshaDashboardProps {
  report: DeterministicDoshaReport
}

interface EducationalExplanation {
  definition: string
  formation: string
}

const DOSHA_EXPLANATIONS: Record<string, EducationalExplanation> = {
  'manglik': {
    definition: 'An astrological configuration associated with Mars (Mangal) representing fiery drive, high energy, assertiveness, and potential relationship friction.',
    formation: 'Formed when Mars is placed in the 1st, 2nd, 4th, 7th, 8th, or 12th house from the Ascendant (Lagna).'
  },
  'partial manglik': {
    definition: 'A milder expression of Manglik checked from the Moon Lagna (Chandra Lagna), representing emotional drive and inner family friction.',
    formation: 'Formed when Mars is placed in the 1st, 2nd, 4th, 7th, 8th, or 12th house relative to the natal Moon.'
  },
  'kaal sarp': {
    definition: 'A planetary configuration where all seven traditional planets are positioned on one side of the lunar nodes, signifying intense life cycles, sudden transformations, and eventual late-stage success.',
    formation: 'Formed when all traditional natal planets are hemmed between the Rahu (North Node) and Ketu (South Node) axis.'
  },
  'pitra': {
    definition: 'Karmic debt or lineage obligations reflecting as ancestral blocks, delays in progress, or lack of support from elders.',
    formation: 'Formed when the Sun (representing Father) or the 9th house (representing Dharma and ancestors) is conjunct or aspected by Rahu, Ketu, or Saturn.'
  },
  'shrapit': {
    definition: 'A karmic configuration indicating severe delays, structured learning curves, and persistent roadblocks requiring discipline to overcome.',
    formation: 'Formed when Saturn and Rahu (or Saturn and Ketu) are closely conjunct in any house of the horoscope.'
  },
  'surya grahan': {
    definition: 'Solar Eclipse alignment affecting individual identity, self-worth, relations with government/authority, and father figures.',
    formation: 'Formed when the natal Sun is conjunct Rahu or Ketu.'
  },
  'chandra grahan': {
    definition: 'Lunar Eclipse alignment causing emotional volatility, sensitive mental structure, and potential blocks to peace of mind.',
    formation: 'Formed when the natal Moon is conjunct Rahu or Ketu.'
  },
  'guru chandal': {
    definition: 'An alignment affecting belief structures, relationship with spiritual guides, and generating rebellious or highly unconventional thinking.',
    formation: 'Formed when Jupiter is conjunct Rahu or Ketu.'
  },
  'kemadruma': {
    definition: 'A classical configuration representing deep self-reliance, feelings of emotional isolation, and potential delays in wealth accumulation.',
    formation: 'Formed when there are no planets (excluding Sun, Rahu, and Ketu) in both the 2nd and 12th houses from the Moon.'
  },
  'chandra': {
    definition: 'Affliction to the Moon representing fluctuations in mood, sleep issues, anxiety, and high sensitivity to the emotional environment.',
    formation: 'Formed when the Moon is placed in a Dusthana house (6th, 8th, or 12th), is debilitated, combust, or aspected by Saturn.'
  },
  'daridra': {
    definition: 'An affliction affecting monetary accumulation, causing sudden overheads, or obstructing immediate financial gain.',
    formation: 'Formed when the lords of the 2nd house (wealth) or 11th house (gains) occupy Dusthana houses (6th, 8th, or 12th).'
  },
  'sarpa influence': {
    definition: 'Node-based affliction impacting cognitive focus, children (Sutapa), and analytical clarity.',
    formation: 'Formed when Rahu or Ketu occupies the 5th house of intellect and progeny.'
  },
  'afflicted sixth house': {
    definition: 'Affliction to the house of health, debt, and enemies, representing daily energy drains or physical vulnerabilities.',
    formation: 'Formed when the 6th house lord is debilitated, combust, or placed in the 8th or 12th houses.'
  },
  'afflicted eighth house': {
    definition: 'Affliction affecting transformation cycles, longevity, joint resources, and sudden changes.',
    formation: 'Formed when the 8th house lord is debilitated, combust, or placed in the 6th or 12th houses.'
  },
  'guru affliction': {
    definition: 'Obstructions to expansive wisdom, mentorship blessings, and general luck cycles.',
    formation: 'Formed when Jupiter is placed in a Dusthana house, is debilitated, combust, or aspected by Saturn.'
  },
  'ninth house affliction': {
    definition: 'Obstruction to the house of fortune (Bhagya), higher education, and spiritual guides.',
    formation: 'Formed when the 9th house lord is debilitated, combust, or placed in a Dusthana house.'
  },
  'sade sati': {
    definition: 'A significant transit phase of Saturn that tests resilience, structures maturity, and promotes long-term discipline through intense lessons.',
    formation: 'Formed when transiting Saturn passes through the 12th house (first phase), 1st house (peak phase), and 2nd house (third phase) relative to the natal Moon.'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE BADGE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string | null | undefined
}

function ActivationBadge({ isPermanent }: { isPermanent?: boolean }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0 ${
      isPermanent
        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
    }`}>
      {isPermanent ? 'Permanent' : 'Temporary'}
    </span>
  )
}

function SeverityBadge({ label }: BadgeProps) {
  const getStyle = (val: string | null | undefined) => {
    const safeVal = (val || 'Minimal').toLowerCase()
    switch (safeVal) {
      case 'significant':
      case 'high':
      case 'critical':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold'
      case 'moderate':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
      case 'low':
      case 'minimal':
      default:
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
    }
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${getStyle(label)}`}>
      {label || 'Minimal'} Impact
    </span>
  )
}

function ConfidenceBadge({ label }: BadgeProps) {
  const getStyle = (val: string | null | undefined) => {
    const safeVal = (val || 'Moderate').toLowerCase()
    switch (safeVal) {
      case 'high':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
      case 'moderate':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
      case 'low':
      default:
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
    }
  }
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStyle(label)}`}>Confidence: {label || 'Moderate'}</span>
}

function StarRating({ rating }: { rating: number }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span 
        key={i} 
        className={`material-symbols-outlined text-base ${
          i <= rating ? 'text-amber-500 fill-current' : 'text-outline-variant'
        }`}
      >
        star
      </span>
    )
  }
  return <div className="flex items-center gap-0.5">{stars}</div>
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE COMPONENT GRAPHS
// ─────────────────────────────────────────────────────────────────────────────

interface TimelineProps {
  completed: any[]
  ongoing: any[]
  upcoming: any[]
  activeDoshaName: string | null
  onSelectDosha: (name: string) => void
}

function DoshaTimeline({ completed, ongoing, upcoming, activeDoshaName, onSelectDosha }: TimelineProps) {
  return (
    <div className="celestial-card p-5 sm:p-6 rounded-2xl border border-outline-variant/60 bg-surface/40 space-y-6">
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
        <span className="material-symbols-outlined text-primary text-xl">route</span>
        <h4 className="font-display text-base font-bold text-primary">Vedic Dosha Timeline</h4>
      </div>

      <div className="relative border-l border-outline-variant/50 ml-3 pl-6 space-y-8">
        {/* Ongoing Section */}
        <div className="relative">
          <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-rose-500/20 border-4 border-rose-500 animate-pulse flex items-center justify-center" />
          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block">Ongoing (Active)</span>
            <OngoingTimeline items={ongoing} activeDoshaName={activeDoshaName} onSelectDosha={onSelectDosha} />
          </div>
        </div>

        {/* Upcoming Section */}
        <div className="relative">
          <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center" />
          <div className="space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block">Upcoming (Future)</span>
            <UpcomingTimeline items={upcoming} activeDoshaName={activeDoshaName} onSelectDosha={onSelectDosha} />
          </div>
        </div>

        {/* Completed Section */}
        <div className="relative">
          <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center" />
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Completed (Past)</span>
            <CompletedTimeline items={completed} activeDoshaName={activeDoshaName} onSelectDosha={onSelectDosha} />
          </div>
        </div>
      </div>
    </div>
  )
}

function CompletedTimeline({ items, activeDoshaName, onSelectDosha }: { items: any[], activeDoshaName: string | null, onSelectDosha: (name: string) => void }) {
  if (items.length === 0) {
    return <p className="text-xs text-on-surface-variant italic">No completed activations detected.</p>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item, idx) => {
        const isActive = activeDoshaName === item.name
        return (
          <button
            key={idx}
            onClick={() => onSelectDosha(item.name)}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
              isActive
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'bg-surface/50 border-outline-variant/30 hover:border-emerald-500/40 text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-emerald-500 text-base font-bold shrink-0">check_circle</span>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{item.name}</p>
              <p className="text-[10px] text-on-surface-variant truncate">Active: {item.active_period}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function OngoingTimeline({ items, activeDoshaName, onSelectDosha }: { items: any[], activeDoshaName: string | null, onSelectDosha: (name: string) => void }) {
  if (items.length === 0) {
    return <p className="text-xs text-on-surface-variant italic">No ongoing activations detected.</p>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item, idx) => {
        const isActive = activeDoshaName === item.name
        return (
          <button
            key={idx}
            onClick={() => onSelectDosha(item.name)}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
              isActive
                ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300'
                : 'bg-surface/50 border-outline-variant/30 hover:border-rose-500/40 text-on-surface'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping inline-block" style={{ margin: '4px' }} />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{item.name}</p>
              <p className="text-[10px] text-on-surface-variant truncate">{item.activation_reason} (Ends: {item.expected_end})</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function UpcomingTimeline({ items, activeDoshaName, onSelectDosha }: { items: any[], activeDoshaName: string | null, onSelectDosha: (name: string) => void }) {
  if (items.length === 0) {
    return <p className="text-xs text-on-surface-variant italic">No upcoming activations detected.</p>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item, idx) => {
        const isActive = activeDoshaName === item.name
        return (
          <button
            key={idx}
            onClick={() => onSelectDosha(item.name)}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
              isActive
                ? 'bg-primary/10 border-primary text-primary-700 dark:text-primary-300'
                : 'bg-surface/50 border-outline-variant/30 hover:border-primary/40 text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-primary text-base shrink-0">hourglass_empty</span>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{item.name}</p>
              <p className="text-[10px] text-on-surface-variant truncate">Expected: {item.expected_start}–{item.expected_end}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function TimelineProgress({ timeline }: { timeline: any[] }) {
  if (!timeline || timeline.length === 0) return null
  return (
    <div className="bg-surface/50 border border-outline-variant/30 p-4 rounded-xl space-y-3">
      <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm">timeline</span>
        Vimshottari Activation Timeline
      </h5>
      <div className="relative border-l border-outline-variant/40 ml-2 pl-4 space-y-3.5">
        {timeline.map((block, idx) => {
          const isHigh = block.influence.toLowerCase().includes('high')
          const isMod = block.influence.toLowerCase().includes('moderate')
          return (
            <div key={idx} className="relative">
              <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border ${
                isHigh ? 'bg-rose-500 border-rose-500' : isMod ? 'bg-amber-500 border-amber-500' : 'bg-slate-400 border-slate-400'
              }`} />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-on-surface">{block.period}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                    isHigh ? 'bg-rose-500/10 text-rose-500' : isMod ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {block.influence}
                  </span>
                  {block.reason && <span className="text-[10px] text-on-surface-variant font-medium">({block.reason})</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCards({ summary }: { summary: any }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-surface/60 border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Significant Doshas</span>
        <span className="text-3xl font-display font-extrabold text-primary mt-1">
          {summary.total_detected ?? 0}
        </span>
        <span className="text-[10px] text-on-surface-variant/80 block mt-2">Total identified in chart</span>
      </div>

      <div className="bg-surface/60 border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Currently Active</span>
        <span className="text-3xl font-display font-extrabold text-rose-500 mt-1">
          {summary.ongoing ?? 0}
        </span>
        <span className="text-[10px] text-on-surface-variant/80 block mt-2">Ongoing dasha/transit</span>
      </div>

      <div className="bg-surface/60 border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Completed (Past)</span>
        <span className="text-3xl font-display font-extrabold text-emerald-500 mt-1">
          {summary.completed ?? 0}
        </span>
        <span className="text-[10px] text-on-surface-variant/80 block mt-2">Dasha periods elapsed</span>
      </div>

      <div className="bg-surface/60 border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Upcoming (Future)</span>
        <span className="text-3xl font-display font-extrabold text-primary mt-1">
          {summary.upcoming ?? 0}
        </span>
        <span className="text-[10px] text-on-surface-variant/80 block mt-2">Future dasha triggers</span>
      </div>
    </div>
  )
}

function RemediesPanel({ remedies, remedyTab, onSelectTab }: { remedies: RemediesData, remedyTab: 'spiritual' | 'lifestyle' | 'practical', onSelectTab: (tab: 'spiritual' | 'lifestyle' | 'practical') => void }) {
  return (
    <div className="space-y-3 bg-surface/60 border border-outline-variant/30 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 flex-col sm:flex-row gap-3">
        <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 self-start">
          <span className="material-symbols-outlined text-sm">spa</span>
          Mitigating Planetary Remedies
        </h5>
        <div className="flex gap-1 bg-surface-variant/40 rounded-lg p-0.5 shrink-0 self-end sm:self-auto">
          {(['spiritual', 'lifestyle', 'practical'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                remedyTab === tab 
                  ? 'bg-primary text-white shadow-xs' 
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 animate-fade-in">
        {remedies[remedyTab]?.length > 0 ? (
          <ul className="space-y-2 text-xs">
            {remedies[remedyTab].map((rem, r_idx) => {
              const remedyIcon = remedyTab === 'spiritual' ? 'self_improvement' 
                               : remedyTab === 'lifestyle' ? 'accessibility_new' : 'handyman';
              return (
                <li key={r_idx} className="flex items-start gap-2.5 text-on-background">
                  <span className="material-symbols-outlined text-primary text-base mt-0.5 shrink-0">
                    {remedyIcon}
                  </span>
                  <span>{rem}</span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-xs text-on-surface-variant italic">No specific remedies registered in this category.</p>
        )}
      </div>
    </div>
  )
}

interface DoshaCardProps {
  dosha: any
  isExpanded: boolean
  onToggle: () => void
}

function DoshaCard({ dosha, isExpanded, onToggle }: DoshaCardProps) {
  const [remedyTab, setRemedyTab] = useState<'spiritual' | 'lifestyle' | 'practical'>('spiritual')

  return (
    <div className="celestial-card rounded-2xl border border-outline-variant/40 overflow-hidden transition-all duration-300 hover:border-primary/20">
      {/* Clickable Header */}
      <div 
        onClick={onToggle}
        className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-primary-fixed/5 transition-colors select-none"
      >
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h4 className="font-display text-base sm:text-lg font-bold text-primary">{dosha.name}</h4>
            <div className="flex items-center gap-1.5 bg-surface/80 border border-outline-variant/30 px-2 py-0.5 rounded-full">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold">Formation:</span>
              <StarRating rating={dosha.formation_strength} />
            </div>
            <ActivationBadge isPermanent={dosha.is_permanent} />
            <SeverityBadge label={dosha.severity || dosha.practical_impact} />
          </div>
          <p className="text-xs text-on-surface-variant line-clamp-1 italic">
            Why this exists: {dosha.why_exists[0] || 'Astrological configuration'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="border-t border-outline-variant/20 bg-surface/30 p-5 sm:p-6 space-y-6 animate-fade-in">
          
          {/* Metrics Overview Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface/40 p-4 rounded-xl border border-outline-variant/20 text-xs">
            <div>
              <span className="text-[9px] uppercase font-bold text-on-surface-variant block">Formation Strength</span>
              <div className="mt-1"><StarRating rating={dosha.formation_strength} /></div>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-on-surface-variant block">Confidence Rating</span>
              <div className="mt-1"><ConfidenceBadge label={dosha.confidence} /></div>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-on-surface-variant block">Formation Style</span>
              <div className="mt-1"><ActivationBadge isPermanent={dosha.is_permanent} /></div>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-on-surface-variant block">Practical Impact</span>
              <div className="mt-1"><SeverityBadge label={dosha.severity || dosha.practical_impact} /></div>
            </div>
          </div>

          {/* Why this exists */}
          <div className="bg-surface/50 border border-outline-variant/30 p-4 rounded-xl space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">info</span>
              Why this exists
            </h5>
            <ul className="space-y-1 text-xs text-on-background">
              {dosha.why_exists.map((e: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Why it became active */}
          {dosha.why_active && (
            <div className="bg-surface/50 border border-outline-variant/30 p-4 rounded-xl space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Why it became active
              </h5>
              <p className="text-xs text-on-background leading-relaxed">
                {dosha.why_active}
              </p>
            </div>
          )}

          {/* Static Educational Explanation */}
          {(() => {
            const normalized = dosha.name.toLowerCase().replace(" dosha", "").trim();
            const explanation = DOSHA_EXPLANATIONS[normalized] || DOSHA_EXPLANATIONS[Object.keys(DOSHA_EXPLANATIONS).find(k => normalized.includes(k)) || ''];
            if (!explanation) return null;
            return (
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">school</span>
                  Vedic Context & Formation
                </h5>
                <div className="text-xs space-y-1.5 text-on-background leading-relaxed">
                  <p><strong>What it is:</strong> {explanation.definition}</p>
                  <p><strong>How it is formed:</strong> {explanation.formation}</p>
                </div>
              </div>
            );
          })()}

          {/* Positive Traits vs Challenges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                Positive Traits
              </h5>
              <ul className="space-y-1 text-xs text-on-background">
                {(dosha.positive_traits || []).map((str: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5 shrink-0">check_circle</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">trending_down</span>
                Challenges
              </h5>
              <ul className="space-y-1 text-xs text-on-background">
                {(dosha.challenges || []).map((chal: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-400 text-sm mt-0.5 shrink-0">warning</span>
                    <span>{chal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Protective Factors */}
          <div className="bg-surface/50 border border-outline-variant/30 p-4 rounded-xl space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">shield</span>
              Protective Factors
            </h5>
            <ul className="space-y-1 text-xs text-on-background">
              {dosha.protective_factors && dosha.protective_factors.length > 0 ? (
                dosha.protective_factors.map((p: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5 shrink-0">check</span>
                    <span>{p}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-on-surface-variant italic">No major protective/cancellation factors observed.</li>
              )}
            </ul>
          </div>

          {/* Timeline Progress Graph */}
          {dosha.detailed_timeline && <TimelineProgress timeline={dosha.detailed_timeline} />}

          {/* Remedies Tabbed Component */}
          <RemediesPanel 
            remedies={dosha.remedies} 
            remedyTab={remedyTab} 
            onSelectTab={setRemedyTab} 
          />

        </div>
      )}
    </div>
  )
}

function FeedbackComponent() {
  const [rated, setRated] = useState(false)
  return (
    <div className="celestial-card p-4 rounded-xl border border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <span className="text-on-surface-variant font-medium">Was this deterministic assessment helpful for you?</span>
      {rated ? (
        <span className="text-emerald-500 font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">check</span> Thank you for your feedback!
        </span>
      ) : (
        <div className="flex gap-2">
          <button 
            onClick={() => setRated(true)}
            className="px-3 py-1 border border-outline-variant/60 rounded-md hover:bg-primary/5 cursor-pointer text-[10px] font-bold uppercase tracking-wider animate-none"
          >
            Yes
          </button>
          <button 
            onClick={() => setRated(true)}
            className="px-3 py-1 border border-outline-variant/60 rounded-md hover:bg-primary/5 cursor-pointer text-[10px] font-bold uppercase tracking-wider animate-none"
          >
            No
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD PANEL RENDERER
// ─────────────────────────────────────────────────────────────────────────────

export default function DoshaDashboard({ report }: DoshaDashboardProps) {
  const r = report?.report
  const summary = r?.summary
  const completed = r?.completed || []
  const ongoing = r?.ongoing || []
  const upcoming = r?.upcoming || []
  const disclaimer = r?.disclaimer

  // Combine all doshas for details cards list
  const allDoshas = [...ongoing, ...upcoming, ...completed]

  const [expandedDosha, setExpandedDosha] = useState<string | null>(null)

  const toggleExpand = (name: string) => {
    setExpandedDosha((prev) => (prev === name ? null : name))
  }

  const handleSelectDosha = (name: string) => {
    const found = allDoshas.find((d) => d.name.toLowerCase().includes(name.toLowerCase()))
    if (found) {
      setExpandedDosha(found.name)
      setTimeout(() => {
        const element = document.getElementById(`dosha-card-${found.name}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }

  if (!summary) {
    return (
      <div className="celestial-card p-8 rounded-3xl text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-primary animate-pulse">shield</span>
        <h3 className="font-display text-xl font-bold text-primary">Precomputing Vedic Alignments</h3>
        <p className="text-sm text-on-surface-variant max-w-[400px] mx-auto">
          We are analyzing the planetary coordinates for your birth chart. Please wait...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Summary Cards */}
      <SummaryCards summary={summary} />

      {/* 2. Reusable Timeline Components */}
      <DoshaTimeline 
        completed={completed} 
        ongoing={ongoing} 
        upcoming={upcoming} 
        activeDoshaName={expandedDosha}
        onSelectDosha={handleSelectDosha}
      />

      {/* 3. Detailed Cards expandable list */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-outline-variant/25 pb-2">
          <span className="material-symbols-outlined text-primary text-xl">layers</span>
          <h3 className="font-display text-base font-bold text-primary">Detailed Vedic Analysis</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {allDoshas.map((d, index) => (
            <div id={`dosha-card-${d.name}`} key={index}>
              <DoshaCard 
                dosha={d} 
                isExpanded={expandedDosha === d.name} 
                onToggle={() => toggleExpand(d.name)} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Feedback Component */}
      <FeedbackComponent />

      {/* 5. Disclaimer Callout */}
      {disclaimer && (
        <div className="flex items-start gap-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl px-4 py-3 border border-amber-200/40 dark:border-amber-700/20">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base mt-0.5 shrink-0">
            info
          </span>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed italic">
            {disclaimer}
          </p>
        </div>
      )}

    </div>
  )
}
