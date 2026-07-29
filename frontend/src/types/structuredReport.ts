/**
 * Structured Report Types — TypeScript interfaces mirroring the master JSON schema.
 *
 * These types define the contract between the backend structured analysis engine
 * and the frontend React renderer components.
 */

// ─── Top-Level Report ───

export interface StructuredReport {
  report: Report
}

export interface Report {
  header: ReportHeader
  executiveSummary: string
  sections: ReportSection[]
  overallRecommendations: string[]
  importantYogas: Yoga[]
  doshas: Dosha[]
  upcomingPeriods: UpcomingPeriod[]
  disclaimer: string
}

// ─── Header ───

export interface ReportHeader {
  title: string
  reportType: string
  generatedDate: string
  birthSummary: string
}

// ─── Section ───

export interface ReportSection {
  sectionId: string
  title: string
  summary: string
  table: TableRow[]
  planetaryFactors: PlanetaryFactor[]
  keyObservations: string[]
}

// ─── Table Row ───

export interface TableRow {
  primaryFinding: string
  details: string
  astrologicalReason: string
  recommendedActions: string[]
}

// ─── Planetary Factor ───

export interface PlanetaryFactor {
  planet: string
  impact: string
  reason: string
}

// ─── Yoga ───

export interface Yoga {
  name: string
  effect: string
  reason: string
}

// ─── Dosha ───

export interface Dosha {
  name: string
  severity: string
  reason: string
  recommendedRemedy: string
}

// ─── Upcoming Period ───

export interface UpcomingPeriod {
  period: string
  effect: string
  suggestion: string
}
