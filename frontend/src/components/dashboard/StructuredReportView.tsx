/**
 * StructuredReportView — Enterprise React renderer for structured JSON reports.
 *
 * Maps the structured report JSON to premium, visually rich React components:
 *   header → Report Header Card
 *   executiveSummary → Summary Card
 *   sections[].summary → Section Summary Panel
 *   sections[].table → Data Table
 *   sections[].planetaryFactors → Planet Impact Cards
 *   sections[].keyObservations → Observation Badge List
 *   importantYogas → Yoga Cards
 *   doshas → Dosha Severity Table
 *   overallRecommendations → Checklist
 *   upcomingPeriods → Timeline
 *   disclaimer → Disclaimer Callout
 */

import { useState } from 'react'
import type {
  StructuredReport,
  ReportHeader,
  ReportSection,
  TableRow,
  PlanetaryFactor,
  Yoga,
  Dosha,
  UpcomingPeriod,
} from '../../types/structuredReport'

// ═══════════════════════════════════════════════════════════════
// Planet emoji mapping for visual flair
// ═══════════════════════════════════════════════════════════════

const PLANET_ICONS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mars: '♂',
  Mercury: '☿',
  Jupiter: '♃',
  Venus: '♀',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
}

const SEVERITY_COLORS: Record<string, string> = {
  negligible: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  low: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  moderate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  elevated: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  high: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  unknown: 'bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-300',
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface StructuredReportViewProps {
  report: StructuredReport
}

export default function StructuredReportView({ report }: StructuredReportViewProps) {
  const r = report?.report
  if (!r) return null

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      {r.header && <HeaderCard header={r.header} />}

      {/* Executive Summary */}
      {r.executiveSummary && <SummaryCard summary={r.executiveSummary} />}

      {/* Sections */}
      {r.sections?.map((section, i) => (
        <SectionPanel key={section.sectionId || i} section={section} />
      ))}

      {/* Important Yogas */}
      {r.importantYogas?.length > 0 && <YogaCards yogas={r.importantYogas} />}

      {/* Doshas */}
      {r.doshas?.length > 0 && <DoshaTable doshas={r.doshas} />}

      {/* Overall Recommendations */}
      {r.overallRecommendations?.length > 0 && (
        <RecommendationChecklist items={r.overallRecommendations} />
      )}

      {/* Upcoming Periods Timeline */}
      {r.upcomingPeriods?.length > 0 && <PeriodTimeline periods={r.upcomingPeriods} />}

      {/* Disclaimer */}
      {r.disclaimer && <DisclaimerCard text={r.disclaimer} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HEADER CARD
// ═══════════════════════════════════════════════════════════════

function HeaderCard({ header }: { header: ReportHeader }) {
  return (
    <div className="celestial-card rounded-2xl p-5 sm:p-6 border border-primary/20 bg-gradient-to-br from-primary-fixed/40 via-surface to-surface">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_awesome
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg sm:text-xl font-bold text-primary leading-tight">
            {header.title || 'Vedic Analysis Report'}
          </h2>
          {header.reportType && (
            <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
              {header.reportType}
            </span>
          )}
          {header.birthSummary && (
            <p className="mt-2 text-xs text-on-surface-variant leading-relaxed">
              {header.birthSummary}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// EXECUTIVE SUMMARY CARD
// ═══════════════════════════════════════════════════════════════

function SummaryCard({ summary }: { summary: string }) {
  return (
    <div className="celestial-card rounded-2xl p-5 sm:p-6 border border-outline-variant/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
          summarize
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Executive Summary
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-on-background">
        {summary}
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTION PANEL (Summary + Table + Planets + Observations)
// ═══════════════════════════════════════════════════════════════

function SectionPanel({ section }: { section: ReportSection }) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="celestial-card rounded-2xl border border-outline-variant/50 overflow-hidden">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 sm:p-6 cursor-pointer hover:bg-primary-fixed/10 transition-colors bg-transparent border-none text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            medical_information
          </span>
          <h3 className="font-display text-base sm:text-lg font-bold text-primary">
            {section.title}
          </h3>
        </div>
        <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Section Content */}
      <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-5">
          {/* Summary */}
          {section.summary && (
            <p className="text-sm leading-relaxed text-on-background bg-primary-fixed/10 rounded-xl p-4 border border-primary/10">
              {section.summary}
            </p>
          )}

          {/* Data Table */}
          {section.table?.length > 0 && <FindingsTable rows={section.table} />}

          {/* Planetary Factors */}
          {section.planetaryFactors?.length > 0 && (
            <PlanetFactorCards factors={section.planetaryFactors} />
          )}

          {/* Key Observations */}
          {section.keyObservations?.length > 0 && (
            <ObservationList items={section.keyObservations} />
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FINDINGS DATA TABLE
// ═══════════════════════════════════════════════════════════════

function FindingsTable({ rows }: { rows: TableRow[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-on-surface-variant text-sm">
          table_chart
        </span>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          Key Findings
        </h4>
      </div>

      {/* Mobile: Card layout */}
      <div className="space-y-3 lg:hidden">
        {rows.map((row, i) => (
          <div key={i} className="bg-surface rounded-xl p-4 border border-outline-variant/40 space-y-2.5">
            <h5 className="text-sm font-bold text-primary">
              {row.primaryFinding}
            </h5>
            <p className="text-xs text-on-background leading-relaxed">
              {row.details}
            </p>
            <div className="flex items-start gap-1.5">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xs mt-0.5 shrink-0">
                star
              </span>
              <p className="text-[11px] text-on-surface-variant italic leading-relaxed">
                {row.astrologicalReason}
              </p>
            </div>
            {row.recommendedActions?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {row.recommendedActions.map((action, j) => (
                  <span
                    key={j}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300 rounded-lg border border-emerald-200/60 dark:border-emerald-700/30"
                  >
                    <span className="material-symbols-outlined text-[10px]">
                      check_circle
                    </span>
                    {action}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: Actual table */}
      <div className="hidden lg:block rounded-xl border border-outline-variant/40 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface border-b border-outline-variant/40">
              <th className="text-left p-3 font-bold text-on-surface-variant uppercase tracking-wider text-[10px]">
                Finding
              </th>
              <th className="text-left p-3 font-bold text-on-surface-variant uppercase tracking-wider text-[10px]">
                Details
              </th>
              <th className="text-left p-3 font-bold text-on-surface-variant uppercase tracking-wider text-[10px]">
                Astrological Reason
              </th>
              <th className="text-left p-3 font-bold text-on-surface-variant uppercase tracking-wider text-[10px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-outline-variant/20 last:border-b-0 ${i % 2 === 0 ? '' : 'bg-surface/50'}`}
              >
                <td className="p-3 font-semibold text-primary align-top whitespace-nowrap">
                  {row.primaryFinding}
                </td>
                <td className="p-3 text-on-background leading-relaxed align-top max-w-[200px]">
                  {row.details}
                </td>
                <td className="p-3 text-on-surface-variant italic leading-relaxed align-top max-w-[200px]">
                  {row.astrologicalReason}
                </td>
                <td className="p-3 align-top">
                  <div className="flex flex-wrap gap-1">
                    {row.recommendedActions?.map((action, j) => (
                      <span
                        key={j}
                        className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300 rounded border border-emerald-200/60 dark:border-emerald-700/30"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PLANETARY FACTOR CARDS
// ═══════════════════════════════════════════════════════════════

function PlanetFactorCards({ factors }: { factors: PlanetaryFactor[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-on-surface-variant text-sm">
          public
        </span>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          Planetary Factors
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {factors.map((factor, i) => {
          const icon = PLANET_ICONS[factor.planet] || '🪐'
          return (
            <div
              key={i}
              className="flex gap-3 bg-surface rounded-xl p-3.5 border border-outline-variant/40 hover:border-primary/30 transition-colors"
            >
              <div className="w-9 h-9 bg-primary-fixed rounded-lg flex items-center justify-center text-primary font-bold text-lg shrink-0 shadow-xs">
                {icon}
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-primary">
                  {factor.planet}
                </h5>
                <p className="text-[11px] text-on-background leading-relaxed mt-0.5">
                  {factor.impact}
                </p>
                <p className="text-[10px] text-on-surface-variant italic mt-1 leading-relaxed">
                  {factor.reason}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// OBSERVATION BADGE LIST
// ═══════════════════════════════════════════════════════════════

function ObservationList({ items }: { items: string[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="material-symbols-outlined text-on-surface-variant text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          visibility
        </span>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          Key Observations
        </h4>
      </div>
      <div className="space-y-2">
        {items.map((obs, i) => (
          <div key={i} className="flex items-start gap-2.5 bg-surface/60 rounded-lg px-3.5 py-2.5 border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-sm mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              circle
            </span>
            <p className="text-xs text-on-background leading-relaxed">{obs}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// YOGA CARDS
// ═══════════════════════════════════════════════════════════════

function YogaCards({ yogas }: { yogas: Yoga[] }) {
  return (
    <div className="celestial-card rounded-2xl p-5 sm:p-6 border border-outline-variant/50">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
          self_improvement
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Important Yogas
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {yogas.map((yoga, i) => (
          <div
            key={i}
            className="bg-surface rounded-xl p-4 border border-outline-variant/40 hover:border-amber-400/40 transition-colors"
          >
            <h5 className="text-sm font-bold text-primary mb-1">
              {yoga.name}
            </h5>
            <p className="text-xs text-on-background leading-relaxed">
              {yoga.effect}
            </p>
            <p className="text-[10px] text-on-surface-variant italic mt-1.5 leading-relaxed">
              {yoga.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DOSHA TABLE
// ═══════════════════════════════════════════════════════════════

function DoshaTable({ doshas }: { doshas: Dosha[] }) {
  return (
    <div className="celestial-card rounded-2xl p-5 sm:p-6 border border-outline-variant/50">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-rose-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
          warning
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Dosha Analysis
        </h3>
      </div>
      <div className="space-y-3">
        {doshas.map((dosha, i) => (
          <div
            key={i}
            className="bg-surface rounded-xl p-4 border border-outline-variant/40 flex flex-col sm:flex-row sm:items-start gap-3"
          >
            <div className="flex items-center gap-2 sm:min-w-[140px]">
              <h5 className="text-sm font-bold text-on-background">
                {dosha.name}
              </h5>
              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${SEVERITY_COLORS[dosha.severity?.toLowerCase()] || SEVERITY_COLORS.unknown}`}>
                {dosha.severity || 'unknown'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-on-background leading-relaxed">
                {dosha.reason}
              </p>
              {dosha.recommendedRemedy && (
                <div className="flex items-start gap-1.5 mt-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 shrink-0">
                    spa
                  </span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    {dosha.recommendedRemedy}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATION CHECKLIST
// ═══════════════════════════════════════════════════════════════

function RecommendationChecklist({ items }: { items: string[] }) {
  return (
    <div className="celestial-card rounded-2xl p-5 sm:p-6 border border-outline-variant/50">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
          checklist
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Overall Recommendations
        </h3>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 bg-emerald-50/50 dark:bg-emerald-900/15 rounded-lg px-3.5 py-2.5 border border-emerald-200/40 dark:border-emerald-700/20"
          >
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <p className="text-xs text-on-background leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// UPCOMING PERIODS TIMELINE
// ═══════════════════════════════════════════════════════════════

function PeriodTimeline({ periods }: { periods: UpcomingPeriod[] }) {
  return (
    <div className="celestial-card rounded-2xl p-5 sm:p-6 border border-outline-variant/50">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
          timeline
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Upcoming Periods
        </h3>
      </div>
      <div className="relative space-y-0">
        {periods.map((period, i) => (
          <div key={i} className="flex gap-4">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-primary rounded-full shadow-sm shrink-0 z-10" />
              {i < periods.length - 1 && (
                <div className="w-0.5 flex-1 bg-primary/20 min-h-[40px]" />
              )}
            </div>
            {/* Content */}
            <div className="pb-5 -mt-0.5 min-w-0">
              <h5 className="text-xs font-bold text-primary">
                {period.period}
              </h5>
              <p className="text-xs text-on-background leading-relaxed mt-0.5">
                {period.effect}
              </p>
              {period.suggestion && (
                <p className="text-[10px] text-on-surface-variant italic mt-1 leading-relaxed">
                  💡 {period.suggestion}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DISCLAIMER CALLOUT
// ═══════════════════════════════════════════════════════════════

function DisclaimerCard({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl px-4 py-3 border border-amber-200/40 dark:border-amber-700/20">
      <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base mt-0.5 shrink-0">
        info
      </span>
      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed italic">
        {text}
      </p>
    </div>
  )
}
