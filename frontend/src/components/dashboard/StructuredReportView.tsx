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
} from '../../types/structuredReport'

// ═══════════════════════════════════════════════════════════════
// TEXT HIGHLIGHTING HELPER
// ═══════════════════════════════════════════════════════════════

function renderHighlightedText(text: string | null | undefined) {
  if (!text) return null
  const parts = text.split('**')
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-primary font-extrabold bg-primary/5 px-1 rounded-xs">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  )
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

      {/* Sections */}
      {r.sections?.map((section, i) => (
        <SectionPanel key={section.sectionId || i} section={section} />
      ))}

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
// SECTION PANEL (Summary + Table)
// ═══════════════════════════════════════════════════════════════

function SectionPanel({ section }: { section: ReportSection }) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  const getHeaderIcon = (id: string) => {
    switch (id) {
      case 'food': return 'restaurant'
      case 'remedies': return 'spa'
      case 'career': return 'work'
      case 'finance': return 'payments'
      case 'personality': return 'psychology'
      case 'spiritual': return 'self_improvement'
      case 'overview': return 'visibility'
      case 'wounds_trauma': return 'healing'
      case 'gifts_talents': return 'diamond'
      case 'soul_growth': return 'route'
      default: return 'medical_information'
    }
  }

  const headerIcon = getHeaderIcon(section.sectionId)

  return (
    <div className="celestial-card rounded-2xl border border-outline-variant/50 overflow-hidden">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 sm:p-6 cursor-pointer hover:bg-primary-fixed/10 transition-colors bg-transparent border-none text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {headerIcon}
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
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
          {/* Summary */}
          {section.summary && (
            <p className="text-xs leading-relaxed text-on-surface-variant bg-surface/60 rounded-xl p-3.5 border border-outline-variant/30">
              {renderHighlightedText(section.summary)}
            </p>
          )}

          {/* Data Table */}
          {section.table?.length > 0 && <FindingsTable rows={section.table} sectionId={section.sectionId} />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FINDINGS DATA TABLE
// ═══════════════════════════════════════════════════════════════

interface FindingsTableProps {
  rows: TableRow[]
  sectionId?: string
}

function FindingsTable({ rows, sectionId }: FindingsTableProps) {
  const getBadgeIcon = (id?: string) => {
    switch (id) {
      case 'food': return 'restaurant'
      case 'remedies': return 'healing'
      case 'career': return 'work'
      case 'finance': return 'monetization_on'
      case 'personality': return 'psychology'
      case 'spiritual': return 'self_improvement'
      case 'overview': return 'visibility'
      default: return 'health_and_safety'
    }
  }

  const badgeIcon = getBadgeIcon(sectionId)

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
            <div className="flex">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-primary/10 text-primary rounded-lg border border-primary/20">
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {badgeIcon}
                </span>
                {renderHighlightedText(row.primaryFinding)}
              </span>
            </div>
            <p className="text-xs text-on-background leading-relaxed">
              {renderHighlightedText(row.details)}
            </p>
            <div className="flex items-start gap-1.5">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xs mt-0.5 shrink-0">
                star
              </span>
              <p className="text-[11px] text-on-surface-variant italic leading-relaxed">
                {renderHighlightedText(row.astrologicalReason)}
              </p>
            </div>
            {row.recommendedActions?.length > 0 && (
              <div className="flex flex-col items-start gap-1.5 pt-1">
                {row.recommendedActions.map((action, j) => (
                  <span
                    key={j}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-950 dark:bg-emerald-900/25 dark:text-emerald-100 rounded-lg border border-emerald-200/60 dark:border-emerald-700/30 text-left"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full shrink-0 animate-pulse" />
                    {renderHighlightedText(action)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: Actual table */}
      <div className="hidden lg:block rounded-xl border border-outline-variant/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-outline-variant/40">
              <th className="text-left p-3 font-bold text-on-surface-variant uppercase tracking-wider text-[11px] w-[18%] min-w-[140px]">
                Finding
              </th>
              <th className="text-left p-3 font-bold text-on-surface-variant uppercase tracking-wider text-[11px] w-[30%] min-w-[240px]">
                Details
              </th>
              <th className="text-left p-3 font-bold text-on-surface-variant uppercase tracking-wider text-[11px] w-[32%] min-w-[260px]">
                Astrological Reason
              </th>
              <th className="text-left p-3 font-bold text-on-surface-variant uppercase tracking-wider text-[11px] w-[20%] min-w-[160px]">
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
                <td className="p-3 align-top w-[18%] min-w-[140px] whitespace-normal">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-primary/10 text-primary rounded-lg border border-primary/20 shadow-2xs">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {badgeIcon}
                    </span>
                    {renderHighlightedText(row.primaryFinding)}
                  </span>
                </td>
                <td className="p-3 text-on-background leading-relaxed align-top w-[30%] min-w-[240px]">
                  {renderHighlightedText(row.details)}
                </td>
                <td className="p-3 text-on-surface-variant italic leading-relaxed align-top w-[32%] min-w-[260px]">
                  {renderHighlightedText(row.astrologicalReason)}
                </td>
                <td className="p-3 align-top w-[20%] min-w-[160px]">
                  <div className="flex flex-col items-start gap-1.5">
                    {row.recommendedActions?.map((action, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-950 dark:bg-emerald-900/25 dark:text-emerald-100 rounded-lg border border-emerald-200/60 dark:border-emerald-700/30 whitespace-normal text-left"
                      >
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full shrink-0 animate-pulse" />
                        {renderHighlightedText(action)}
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
