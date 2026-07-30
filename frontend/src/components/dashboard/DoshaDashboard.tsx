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
  positive_traits: string[]
  challenges: string[]
  protective_factors: string[]
  aggravating_factors: string[]
  timeline: TimelineData
  remedies: RemediesData
}

export interface SummaryData {
  significant_doshas: number
  currently_active: number
  well_mitigated: number
  priority_area: string
  strongest_protection: string[]
}

export interface StrategicMappingItem {
  life_area: string
  dosha: string
  formation_strength: number
  status: string
  shield: string // Weak, Moderate, Strong
  practical_impact: string
}

export interface DeterministicDoshaReport {
  report?: {
    summary?: SummaryData
    strategic_mapping?: StrategicMappingItem[]
    doshas?: DoshaItem[]
    disclaimer?: string
  }
}

interface DoshaDashboardProps {
  report: DeterministicDoshaReport
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE BADGE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string
}

function StatusBadge({ label }: BadgeProps) {
  const getStyle = (val: string) => {
    switch (val.toLowerCase()) {
      case 'peak':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
      case 'active':
        return 'bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold'
      case 'reduced':
        return 'bg-teal-500/10 text-teal-500 border border-teal-500/20'
      case 'latent':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
      case 'dormant':
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
    }
  }
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${getStyle(label)}`}>{label}</span>
}

function ImpactBadge({ label }: BadgeProps) {
  const getStyle = (val: string) => {
    switch (val.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold'
      case 'moderate':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
      case 'minimal':
      default:
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
    }
  }
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStyle(label)}`}>{label} Impact</span>
}

function ConfidenceBadge({ label }: BadgeProps) {
  const getStyle = (val: string) => {
    switch (val.toLowerCase()) {
      case 'high':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
      case 'moderate':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
      case 'low':
      default:
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
    }
  }
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStyle(label)}`}>Confidence: {label}</span>
}

function ShieldBadge({ label }: BadgeProps) {
  const getStyle = (val: string) => {
    switch (val.toLowerCase()) {
      case 'strong':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
      case 'moderate':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
      case 'weak':
      default:
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
    }
  }
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStyle(label)}`}>{label} Shield</span>
}

// Helper to render stars
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
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Summary Cards
function SummaryCards({ summary }: { summary: SummaryData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-surface/60 border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Significant Doshas</span>
        <span className="text-3xl font-display font-extrabold text-primary mt-1">
          {summary.significant_doshas}
        </span>
        <span className="text-[10px] text-on-surface-variant/80 block mt-2">Formation strength ≥ 3★</span>
      </div>

      <div className="bg-surface/60 border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Currently Active</span>
        <span className="text-3xl font-display font-extrabold text-rose-500 mt-1">
          {summary.currently_active}
        </span>
        <span className="text-[10px] text-on-surface-variant/80 block mt-2">Running Dasha activation</span>
      </div>

      <div className="bg-surface/60 border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Well Mitigated</span>
        <span className="text-3xl font-display font-extrabold text-emerald-500 mt-1">
          {summary.well_mitigated}
        </span>
        <span className="text-[10px] text-on-surface-variant/80 block mt-2">Benefic planetary shield</span>
      </div>

      <div className="bg-surface/60 border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Priority Area</span>
        <span className="text-lg font-bold text-primary truncate mt-1.5" title={summary.priority_area}>
          {summary.priority_area}
        </span>
        <span className="text-[10px] text-on-surface-variant/80 block mt-2">Requires active awareness</span>
      </div>
    </div>
  )
}

// 2. Strategic Mapping (Domain breadcrumb flow chart)
function StrategicMapping({ mapping, onSelectDosha }: { mapping: StrategicMappingItem[], onSelectDosha: (name: string) => void }) {
  return (
    <div className="celestial-card p-5 rounded-2xl border border-outline-variant/40 space-y-3.5">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-xl">flowsheet</span>
        <h4 className="font-display text-sm font-bold text-primary">Strategic Affliction Mapping Flow</h4>
      </div>

      <div className="space-y-2">
        {mapping.map((m, index) => (
          <div 
            key={index} 
            onClick={() => onSelectDosha(m.dosha)}
            className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-3 bg-surface/40 hover:bg-primary-fixed/5 border border-outline-variant/20 rounded-xl cursor-pointer select-none transition-colors text-xs font-semibold"
          >
            {/* Domain */}
            <span className="text-primary bg-primary/5 px-2.5 py-0.5 rounded-md">{m.life_area}</span>
            <span className="text-on-surface-variant/40 text-sm">→</span>
            
            {/* Name */}
            <span className="text-on-background font-bold">{m.dosha}</span>
            <span className="text-on-surface-variant/40 text-sm">→</span>
            
            {/* Severity Rating */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] uppercase font-bold text-on-surface-variant">Formation:</span>
              <StarRating rating={m.formation_strength} />
            </div>
            <span className="text-on-surface-variant/40 text-sm">→</span>
            
            {/* Status */}
            <StatusBadge label={m.status} />
            <span className="text-on-surface-variant/40 text-sm">→</span>
            
            {/* Shield */}
            <ShieldBadge label={m.shield} />
            <span className="text-on-surface-variant/40 text-sm">→</span>
            
            {/* Impact */}
            <ImpactBadge label={m.practical_impact} />
          </div>
        ))}
      </div>
    </div>
  )
}

// 3. Timeline Component
function TimelineComponent({ timeline }: { timeline: TimelineData }) {
  const isDormant = timeline.current.toLowerCase() === 'dormant'
  return (
    <div className="space-y-2 bg-surface/50 border border-outline-variant/30 p-4 rounded-xl">
      <h5 className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">route</span>
        Visual Timeline Path
      </h5>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4 sm:gap-6 pt-2">
        {/* Step 1: Current */}
        <div className="flex flex-col items-start sm:items-center gap-1">
          <span className="text-[9px] uppercase font-bold text-on-surface-variant">Current</span>
          <StatusBadge label={timeline.current} />
        </div>

        {/* Arrow 1 */}
        <span className="material-symbols-outlined text-outline-variant rotate-90 sm:rotate-0 self-center sm:self-auto text-lg">
          arrow_forward
        </span>

        {/* Step 2: Next Activation */}
        <div className="flex flex-col items-start sm:items-center gap-1">
          <span className="text-[9px] uppercase font-bold text-on-surface-variant">Estimated Period</span>
          <span className="text-xs font-semibold text-primary">{timeline.estimated_period}</span>
        </div>

        {/* Arrow 2 */}
        <span className="material-symbols-outlined text-outline-variant rotate-90 sm:rotate-0 self-center sm:self-auto text-lg">
          arrow_forward
        </span>

        {/* Step 3: Trigger */}
        <div className="flex flex-col items-start sm:items-center gap-1">
          <span className="text-[9px] uppercase font-bold text-on-surface-variant">Activation Trigger</span>
          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
            isDormant 
              ? 'bg-blue-500/5 text-blue-600 dark:text-blue-300 border-blue-500/10' 
              : 'bg-rose-500/5 text-rose-600 dark:text-rose-300 border-rose-500/10 font-bold'
          }`}>
            {timeline.next_activation}
          </span>
        </div>
      </div>
    </div>
  )
}

// 4. Protection Panel
function ProtectionPanel({ protectionList }: { protectionList: string[] }) {
  return (
    <div className="celestial-card p-5 rounded-2xl border border-outline-variant/40 space-y-3.5">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-emerald-500 text-xl">verified_user</span>
        <h4 className="font-display text-sm font-bold text-primary">Strongest Protective Shields</h4>
      </div>
      <ul className="space-y-2 text-xs">
        {protectionList.map((prot, idx) => (
          <li key={idx} className="flex items-start gap-2 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 text-on-background">
            <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5 shrink-0">check_circle</span>
            <span>{prot}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// 5. Remedies Panel (Expandable remedies)
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

// 6. Feedback Component
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
            className="px-3 py-1 border border-outline-variant/60 rounded-md hover:bg-primary/5 cursor-pointer text-[10px] font-bold uppercase tracking-wider"
          >
            Yes
          </button>
          <button 
            onClick={() => setRated(true)}
            className="px-3 py-1 border border-outline-variant/60 rounded-md hover:bg-primary/5 cursor-pointer text-[10px] font-bold uppercase tracking-wider"
          >
            No
          </button>
        </div>
      )}
    </div>
  )
}

// 7. Individual Dosha Card
interface DoshaCardProps {
  dosha: DoshaItem
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
            <StatusBadge label={dosha.status} />
            <ImpactBadge label={dosha.practical_impact} />
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
              <span className="text-[9px] uppercase font-bold text-on-surface-variant block">Current Status</span>
              <div className="mt-1"><StatusBadge label={dosha.status} /></div>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-on-surface-variant block">Practical Impact</span>
              <div className="mt-1"><ImpactBadge label={dosha.practical_impact} /></div>
            </div>
          </div>

          {/* Why this exists */}
          <div className="bg-surface/50 border border-outline-variant/30 p-4 rounded-xl space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">info</span>
              Why this exists
            </h5>
            <ul className="space-y-1 text-xs text-on-background">
              {dosha.why_exists.map((e, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Positive Traits vs Challenges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                Positive Traits
              </h5>
              <ul className="space-y-1 text-xs text-on-background">
                {dosha.positive_traits.map((str, idx) => (
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
                {dosha.challenges.map((chal, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-400 text-sm mt-0.5 shrink-0">warning</span>
                    <span>{chal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Protective Factors vs Aggravating Factors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface/50 border border-outline-variant/30 p-4 rounded-xl space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">shield</span>
                Protective Factors
              </h5>
              <ul className="space-y-1 text-xs text-on-background">
                {dosha.protective_factors.length > 0 ? (
                  dosha.protective_factors.map((p, idx) => (
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

            <div className="bg-surface/50 border border-outline-variant/30 p-4 rounded-xl space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">warning</span>
                Aggravating Factors
              </h5>
              <ul className="space-y-1 text-xs text-on-background">
                {dosha.aggravating_factors.length > 0 ? (
                  dosha.aggravating_factors.map((a, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-rose-400 text-sm mt-0.5 shrink-0">arrow_forward</span>
                      <span>{a}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-on-surface-variant italic">No major planetary factors are aggravating this placement.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Timeline Component */}
          <TimelineComponent timeline={dosha.timeline} />

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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD PANEL RENDERER
// ─────────────────────────────────────────────────────────────────────────────

export default function DoshaDashboard({ report }: DoshaDashboardProps) {
  const r = report?.report
  const summary = r?.summary
  const mapping = r?.strategic_mapping || []
  const doshas = r?.doshas || []
  const disclaimer = r?.disclaimer

  const [expandedDosha, setExpandedDosha] = useState<string | null>(null)

  const toggleExpand = (name: string) => {
    setExpandedDosha((prev) => (prev === name ? null : name))
  }

  const handleSelectDosha = (name: string) => {
    // Find matching dosha in the list
    const found = doshas.find((d) => d.name.toLowerCase().includes(name.toLowerCase()))
    if (found) {
      setExpandedDosha(found.name)
      // Scroll to the card
      const element = document.getElementById(`dosha-card-${found.name}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
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

      {/* 2. Strategic Mapping Flow chart */}
      {mapping.length > 0 && (
        <StrategicMapping mapping={mapping} onSelectDosha={handleSelectDosha} />
      )}

      {/* 3. Dosha Details expandable list */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">layers</span>
          <h3 className="font-display text-lg font-bold text-primary">Detailed Vedic Analysis</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {doshas.map((d, index) => (
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

      {/* 4. Protection Panel */}
      {summary.strongest_protection?.length > 0 && (
        <ProtectionPanel protectionList={summary.strongest_protection} />
      )}

      {/* 5. Feedback Component */}
      <FeedbackComponent />

      {/* 6. Disclaimer Callout */}
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
