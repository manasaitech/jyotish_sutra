import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface AntardashaItem {
  planet: string
  planet_name: string
  combination: string
  start_date: string
  end_date: string
  duration_years: number
  progress: number
  days_remaining: number
  remaining_formatted: string
  status: 'completed' | 'current' | 'upcoming'
  color: string
  icon: string
}

interface MahadashaItem {
  planet: string
  planet_name: string
  sanskrit_name: string
  start_date: string
  end_date: string
  duration_years: number
  total_mahadasha_years: number
  color: string
  bg: string
  border: string
  icon: string
  themes: string[]
  status: 'completed' | 'current' | 'upcoming'
  progress?: number
  days_remaining?: number
  remaining_formatted?: string
  antardashas: AntardashaItem[]
}

interface DashaPackage {
  current_mahadasha: {
    planet: string
    planet_name: string
    start_date: string
    end_date: string
    duration_years: number
    progress: number
    days_remaining: number
    remaining_formatted: string
    color: string
    icon: string
  }
  current_antardasha: AntardashaItem | null
  current_pratyantardasha?: {
    planet: string
    planet_name: string
    start_date: string
    end_date: string
    status: string
    color: string
  } | null
  next_mahadasha: {
    planet: string
    planet_name: string
    start_date: string
    end_date: string
    duration_years: number
    color: string
    icon: string
    themes: string[]
  }
  statistics: {
    completed_count: number
    current_mahadasha_name: string
    upcoming_count: number
    current_age: number
    years_remaining_current: number
  }
  timeline: MahadashaItem[]
  ai_interpretation?: {
    summary: string
    mahadasha_name: string
    antardasha_name: string
    focus_areas: {
      career: string
      relationships: string
      health: string
      spiritual: string
    }
    challenges: string[]
    opportunities: string[]
  }
  year_lookup?: {
    target_year: number
    mahadasha: {
      planet: string
      planet_name: string
      start_date: string
      end_date: string
      color: string
    }
    antardasha?: {
      planet: string
      planet_name: string
      combination: string
      start_date: string
      end_date: string
      color: string
    }
  } | null
}

interface Props {
  sessionId: string
  userId?: string
  birthData?: any
  chartData?: any
}

export default function DashaTimelineView({ sessionId, userId, birthData, chartData }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashaPackage | null>(null)

  // State for expanded Mahadasha card
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null)

  // State for Year Lookup
  const [lookupYear, setLookupYear] = useState<number>(new Date().getFullYear() + 5)
  const [yearLookupResult, setYearLookupResult] = useState<DashaPackage['year_lookup']>(null)
  const [searchingYear, setSearchingYear] = useState(false)

  const fetchDashaTimeline = async (searchYear?: number) => {
    try {
      if (!searchYear) setLoading(true)
      else setSearchingYear(true)
      setError(null)

      const backendUrl =
        import.meta.env.VITE_BACKEND_URL ||
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:8000'
          : 'https://kundli-gpt-clone-back.onrender.com')
      const res = await fetch(`${backendUrl}/api/dasha-timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          lookup_year: searchYear,
          birth_details: birthData,
          chart_data: chartData,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || 'Failed to fetch Dasha timeline')
      }

      const result: DashaPackage = await res.json()
      setData(result)

      if (result.current_mahadasha && !expandedPlanet) {
        setExpandedPlanet(result.current_mahadasha.planet)
      }

      if (result.year_lookup) {
        setYearLookupResult(result.year_lookup)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading Dasha timeline')
    } finally {
      setLoading(false)
      setSearchingYear(false)
    }
  }

  useEffect(() => {
    fetchDashaTimeline()
  }, [sessionId, userId, birthData, chartData])

  const handleYearSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (lookupYear && lookupYear >= 1900 && lookupYear <= 2150) {
      fetchDashaTimeline(lookupYear)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-3xl border border-outline-variant/60 shadow-sm my-6">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium text-base">Calculating 120-Year Vimshottari Dasha Sequence...</p>
        <p className="text-xs text-on-surface-variant/70 mt-1">Analyzing Moon Nakshatra progress & Antardashas</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-error-container/20 border border-error/30 text-error p-6 rounded-3xl my-6 text-center">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <h3 className="font-semibold text-lg">Unable to Calculate Dasha Timeline</h3>
        <p className="text-sm mt-1">{error || 'Please enter birth details first.'}</p>
        <button
          onClick={() => fetchDashaTimeline()}
          className="mt-4 px-5 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  const { current_mahadasha, current_antardasha, current_pratyantardasha, next_mahadasha, statistics, timeline, ai_interpretation } = data

  const totalCycleYears = timeline.reduce((acc, item) => acc + item.duration_years, 0)

  return (
    <div className="space-y-8 my-6">

      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#FFF8F0] via-[#FDF2E9] to-[#FFF6ED] border border-[#E9DFC8] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-3">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              Vimshottari Dasha Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface font-serif">
              📅 Dasha Timeline & Lifelong Timing
            </h2>
            <p className="text-on-surface-variant text-sm mt-1 max-w-2xl leading-relaxed">
              Explore your 120-year astronomical Dasha sequence. Track active Mahadashas, granular Antardashas, and forecast upcoming life themes.
            </p>
          </div>

          {/* QUICK SUMMARY BADGE */}
          <div className="flex items-center gap-3 bg-surface/80 backdrop-blur-md p-3.5 rounded-2xl border border-outline-variant/60 shadow-xs shrink-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: current_mahadasha.color }}
            >
              <span className="material-symbols-outlined text-2xl">{current_mahadasha.icon}</span>
            </div>
            <div>
              <div className="text-xs text-on-surface-variant/70 font-medium uppercase tracking-wider">Active Period</div>
              <div className="text-base font-bold text-on-surface">
                {current_mahadasha.planet_name} <span className="text-primary">/ {current_antardasha?.planet_name || 'Antardasha'}</span>
              </div>
              <div className="text-xs text-amber-700 font-semibold mt-0.5">
                {current_mahadasha.remaining_formatted} Remaining
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 8: TIMELINE STATISTICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-surface p-4 rounded-2xl border border-outline-variant/60 shadow-xs">
          <div className="text-xs text-on-surface-variant/70 font-medium">Completed Dashas</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{statistics.completed_count} Periods</div>
          <div className="text-[11px] text-on-surface-variant/60 mt-0.5">Past Life Phases</div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-amber-500/30 shadow-xs bg-amber-500/5">
          <div className="text-xs text-amber-800 font-medium">Active Mahadasha</div>
          <div className="text-xl font-bold text-amber-900 mt-1">{statistics.current_mahadasha_name}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">{statistics.years_remaining_current} Years Left</div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-outline-variant/60 shadow-xs">
          <div className="text-xs text-on-surface-variant/70 font-medium">Upcoming Dashas</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{statistics.upcoming_count} Periods</div>
          <div className="text-[11px] text-on-surface-variant/60 mt-0.5">Future Sequences</div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-outline-variant/60 shadow-xs">
          <div className="text-xs text-on-surface-variant/70 font-medium">Current Age</div>
          <div className="text-xl font-bold text-on-surface mt-1">{statistics.current_age} Years</div>
          <div className="text-[11px] text-on-surface-variant/60 mt-0.5">Present Lifecycle</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-surface p-4 rounded-2xl border border-outline-variant/60 shadow-xs">
          <div className="text-xs text-on-surface-variant/70 font-medium">Total Cycle</div>
          <div className="text-xl font-bold text-primary mt-1">{Math.round(totalCycleYears)} Years</div>
          <div className="text-[11px] text-on-surface-variant/60 mt-0.5">Full Vimshottari</div>
        </div>
      </div>

      {/* SECTION 1: CURRENT DASHA SUMMARY CARD */}
      <div className="bg-surface rounded-3xl border border-amber-500/40 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Currently Active Dasha</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: current_mahadasha.color }}
                >
                  <span className="material-symbols-outlined text-3xl">{current_mahadasha.icon}</span>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant font-medium">Mahadasha</div>
                  <div className="text-2xl font-bold text-on-surface">{current_mahadasha.planet_name}</div>
                </div>
              </div>

              <span className="text-2xl text-on-surface-variant/40 font-light">/</span>

              {current_antardasha && (
                <div>
                  <div className="text-xs text-on-surface-variant font-medium">Antardasha</div>
                  <div className="text-xl font-bold text-primary">{current_antardasha.planet_name}</div>
                </div>
              )}

              {current_pratyantardasha && (
                <>
                  <span className="text-2xl text-on-surface-variant/40 font-light">/</span>
                  <div>
                    <div className="text-xs text-on-surface-variant font-medium">Pratyantar</div>
                    <div className="text-lg font-semibold text-indigo-600">{current_pratyantardasha.planet_name}</div>
                  </div>
                </>
              )}
            </div>

            {/* DATES & REMAINING */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-sm">
              <div className="bg-surface-variant/30 px-3.5 py-2 rounded-xl border border-outline-variant/40">
                <span className="text-xs text-on-surface-variant/70 block">Started</span>
                <span className="font-semibold text-on-surface">{current_mahadasha.start_date}</span>
              </div>
              <div className="bg-surface-variant/30 px-3.5 py-2 rounded-xl border border-outline-variant/40">
                <span className="text-xs text-on-surface-variant/70 block">Ends</span>
                <span className="font-semibold text-on-surface">{current_mahadasha.end_date}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/20">
                <span className="text-xs text-amber-800 font-medium block">Time Remaining</span>
                <span className="font-bold text-amber-900">{current_mahadasha.remaining_formatted}</span>
              </div>
            </div>
          </div>

          {/* PROGRESS BAR DISPLAY */}
          <div className="w-full lg:w-72 bg-surface-variant/30 p-5 rounded-2xl border border-outline-variant/50 flex flex-col justify-center space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-on-surface-variant">Mahadasha Completion</span>
              <span className="text-primary font-bold">{Math.round(current_mahadasha.progress * 100)}%</span>
            </div>
            <div className="w-full h-3.5 bg-outline-variant/40 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-1000 shadow-sm"
                style={{
                  width: `${Math.max(5, current_mahadasha.progress * 100)}%`,
                  backgroundColor: current_mahadasha.color,
                }}
              />
            </div>
            <p className="text-[11px] text-on-surface-variant/70 text-center">
              {current_mahadasha.days_remaining.toLocaleString()} days remaining in this cycle
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: INTERACTIVE HORIZONTAL TIMELINE BAR */}
      <div className="bg-surface rounded-3xl border border-outline-variant/60 p-6 shadow-xs space-y-4" data-tour="dasha-timeline">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">timeline</span>
            <h3 className="font-bold text-lg text-on-surface font-serif">Interactive 120-Year Mahadasha Timeline</h3>
          </div>
          <span className="text-xs text-on-surface-variant/70">Click segment to inspect Antardashas</span>
        </div>

        {/* HORIZONTAL SEGMENTED BAR */}
        <div className="relative pt-2 pb-6">
          <div className="flex h-12 w-full rounded-2xl overflow-hidden shadow-inner border border-outline-variant/60 bg-surface-variant/20 p-1 gap-1">
            {timeline.map((item) => {
              const widthPct = (item.duration_years / totalCycleYears) * 100
              const isCurrent = item.status === 'current'
              const isSelected = expandedPlanet === item.planet

              return (
                <button
                  key={item.planet}
                  onClick={() => setExpandedPlanet(item.planet)}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: item.color,
                  }}
                  title={`${item.planet_name}: ${item.start_date.slice(0, 4)} – ${item.end_date.slice(0, 4)} (${item.duration_years} yrs)`}
                  className={`h-full rounded-xl transition-all relative flex items-center justify-center group cursor-pointer ${isCurrent
                    ? 'ring-2 ring-amber-400 ring-offset-2 scale-[1.02] z-20 shadow-md animate-pulse'
                    : isSelected
                      ? 'ring-2 ring-primary ring-offset-1 z-10 scale-[1.01]'
                      : item.status === 'completed'
                        ? 'opacity-65 hover:opacity-100'
                        : 'hover:opacity-90'
                    }`}
                >
                  <span className="material-symbols-outlined text-white text-base font-bold drop-shadow-sm">
                    {item.icon}
                  </span>

                  {/* HOVER TOOLTIP */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none whitespace-nowrap">
                    <div className="bg-on-surface text-surface text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.planet_name} Mahadasha</span>
                      </div>
                      <div className="text-[11px] text-surface/80">
                        {item.start_date.slice(0, 4)} → {item.end_date.slice(0, 4)} ({item.duration_years} yrs)
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-on-surface rotate-45 -mt-1" />
                  </div>
                </button>
              )
            })}
          </div>

          {/* PLANET NAME LABELS BELOW BAR */}
          <div className="flex justify-between text-[11px] text-on-surface-variant font-medium pt-2 px-1">
            {timeline.map((item) => (
              <span
                key={item.planet}
                onClick={() => setExpandedPlanet(item.planet)}
                className={`cursor-pointer hover:text-primary transition-colors ${item.status === 'current' ? 'font-bold text-primary underline' : ''
                  }`}
              >
                {item.planet_name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 9: SEARCH BY YEAR SEARCH BAR */}
      <div className="bg-surface rounded-3xl border border-outline-variant/60 p-6 shadow-xs">
        <form onSubmit={handleYearSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">manage_search</span>
              <h3 className="font-bold text-base text-on-surface">Search Active Dasha by Year</h3>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">Find which Mahadasha and Antardasha will be active in any year of your life.</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1900"
              max="2150"
              value={lookupYear}
              onChange={(e) => setLookupYear(parseInt(e.target.value) || 2030)}
              className="w-32 px-4 py-2.5 bg-surface-variant/40 border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface text-center focus:outline-none focus:border-primary"
              placeholder="e.g. 2036"
            />
            <button
              type="submit"
              disabled={searchingYear}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {searchingYear ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">search</span>
                  <span>Inspect</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* YEAR LOOKUP RESULT DISPLAY */}
        {yearLookupResult && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                style={{ backgroundColor: yearLookupResult.mahadasha.color }}
              >
                {yearLookupResult.mahadasha.planet_name.slice(0, 2)}
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
                  Active in Year {yearLookupResult.target_year}
                </span>
                <span className="text-base font-bold text-on-surface">
                  {yearLookupResult.mahadasha.planet_name} Mahadasha
                  {yearLookupResult.antardasha && (
                    <span className="text-primary"> — {yearLookupResult.antardasha.planet_name} Antardasha</span>
                  )}
                </span>
              </div>
            </div>

            <div className="text-xs text-on-surface-variant bg-surface/80 px-3.5 py-1.5 rounded-xl border border-outline-variant/50">
              Period: {yearLookupResult.mahadasha.start_date.slice(0, 4)} → {yearLookupResult.mahadasha.end_date.slice(0, 4)}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6 & SECTION 7: AI INTERPRETATION & UPCOMING DASHA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* AI INTERPRETATION CARD (2 Columns) */}
        {ai_interpretation && (
          <div className="lg:col-span-2 bg-gradient-to-br from-surface to-amber-500/5 rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-amber-600 text-2xl">auto_awesome</span>
              <div>
                <h3 className="font-bold text-xl text-on-surface font-serif">
                  AI Interpretation: {ai_interpretation.mahadasha_name} / {ai_interpretation.antardasha_name} Period
                </h3>
                <p className="text-xs text-on-surface-variant">Personalized Vedic energy synthesis for active timeline</p>
              </div>
            </div>

            <div className="markdown-container text-sm text-on-surface/90 leading-relaxed font-sans bg-surface/80 p-4 sm:p-5 rounded-2xl border border-outline-variant/40 space-y-2">
              <ReactMarkdown>{ai_interpretation.summary}</ReactMarkdown>
            </div>

            {/* FOCUS AREA PILLS */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-on-surface uppercase tracking-wider">Key Focus Areas & Impact</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-surface rounded-xl border border-outline-variant/50 space-y-1">
                  <span className="font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">work</span> Career & Finances
                  </span>
                  <p className="text-on-surface-variant">{ai_interpretation.focus_areas.career}</p>
                </div>

                <div className="p-3 bg-surface rounded-xl border border-outline-variant/50 space-y-1">
                  <span className="font-bold text-rose-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">favorite</span> Relationships & Family
                  </span>
                  <p className="text-on-surface-variant">{ai_interpretation.focus_areas.relationships}</p>
                </div>

                <div className="p-3 bg-surface rounded-xl border border-outline-variant/50 space-y-1">
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">medical_services</span> Health & Energy
                  </span>
                  <p className="text-on-surface-variant">{ai_interpretation.focus_areas.health}</p>
                </div>

                <div className="p-3 bg-surface rounded-xl border border-outline-variant/50 space-y-1">
                  <span className="font-bold text-indigo-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">self_improvement</span> Spiritual Growth
                  </span>
                  <p className="text-on-surface-variant">{ai_interpretation.focus_areas.spiritual}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: UPCOMING DASHA FOCUS CARD (1 Column) */}
        <div className="bg-surface rounded-3xl border border-outline-variant/60 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600 text-xl">update</span>
              <h3 className="font-bold text-lg text-on-surface font-serif">Next Mahadasha</h3>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: next_mahadasha.color }}
              >
                <span className="material-symbols-outlined text-2xl">{next_mahadasha.icon}</span>
              </div>
              <div>
                <div className="text-xl font-bold text-on-surface">{next_mahadasha.planet_name} Mahadasha</div>
                <div className="text-xs text-indigo-700 font-semibold">
                  Starts: {next_mahadasha.start_date} ({next_mahadasha.duration_years} Years)
                </div>
              </div>
            </div>

            {/* EXPECTED THEMES LIST */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Expected Life Themes</div>
              <div className="flex flex-wrap gap-1.5">
                {next_mahadasha.themes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-surface-variant/40 border border-outline-variant/50 text-on-surface text-xs font-medium rounded-full"
                  >
                    ✨ {theme}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-surface-variant/20 rounded-2xl border border-outline-variant/40 text-xs text-on-surface-variant text-center">
            Preparation phase: Cultivate alignment before start of {next_mahadasha.planet_name} Dasha.
          </div>
        </div>
      </div>

      {/* SECTION 2 & SECTION 4: COMPLETE CHRONOLOGICAL MAHADASHAS & EXPANDABLE DETAILS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl text-on-surface font-serif flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">view_list</span>
            Complete Mahadasha & Antardasha Sequence
          </h3>
          <span className="text-xs text-on-surface-variant">Click any Mahadasha card to expand Antardashas</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {timeline.map((item) => {
            const isCurrent = item.status === 'current'
            const isExpanded = expandedPlanet === item.planet

            return (
              <div
                key={item.planet}
                className={`bg-surface rounded-3xl border transition-all duration-300 overflow-hidden shadow-xs ${isCurrent
                  ? 'border-amber-500/50 ring-2 ring-amber-500/20 shadow-md'
                  : isExpanded
                    ? 'border-primary/50 shadow-md'
                    : 'border-outline-variant/60 hover:border-primary/30'
                  } ${item.status === 'completed' ? 'opacity-90' : ''}`}
              >
                {/* CARD HEADER / MAIN ROW */}
                <div
                  onClick={() => setExpandedPlanet(isExpanded ? null : item.planet)}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-surface-variant/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* PLANET ICON BADGE */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 relative"
                      style={{ backgroundColor: item.color }}
                    >
                      <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                      {isCurrent && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-ping" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-lg font-bold text-on-surface">{item.planet_name} Mahadasha</h4>
                        <span className="text-xs font-semibold text-on-surface-variant/70">({item.sanskrit_name})</span>

                        {/* STATUS BADGE */}
                        {isCurrent && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30 text-[11px] font-bold tracking-wider uppercase">
                            Active Current
                          </span>
                        )}
                        {item.status === 'completed' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-surface-variant/60 text-on-surface-variant text-[11px] font-semibold">
                            Completed
                          </span>
                        )}
                        {item.status === 'upcoming' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 text-[11px] font-semibold">
                            Upcoming
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-on-surface-variant mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Duration: <strong>{item.duration_years} Years</strong></span>
                        <span>Dates: <strong>{item.start_date} → {item.end_date}</strong></span>
                        {item.remaining_formatted && isCurrent && (
                          <span className="text-amber-800 font-bold">({item.remaining_formatted} Left)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* EXPAND ACTION BUTTON */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isExpanded
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface-variant/40 text-on-surface hover:bg-surface-variant/70'
                        }`}
                    >
                      <span>{isExpanded ? 'Hide Antardashas' : 'Inspect Antardashas'}</span>
                      <span className="material-symbols-outlined text-base">
                        {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* EXPANDED SECTION 5: ANTARDASHA TIMELINE & BREAKDOWN TABLE */}
                {isExpanded && (
                  <div className="border-t border-outline-variant/50 bg-surface-variant/15 p-5 sm:p-7 space-y-6 animate-fadeIn">

                    {/* ANTARDASHA HORIZONTAL BAR */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant">
                        <span>Antardasha Sequence Bar ({item.planet_name} Sub-Periods)</span>
                        <span>9 Sub-Dashas</span>
                      </div>

                      <div className="flex h-8 w-full rounded-xl overflow-hidden border border-outline-variant/60 bg-surface p-0.5 gap-0.5">
                        {item.antardashas.map((antar) => (
                          <div
                            key={antar.planet}
                            style={{
                              width: `${(antar.duration_years / item.duration_years) * 100}%`,
                              backgroundColor: antar.color,
                            }}
                            title={`${antar.combination}: ${antar.start_date.slice(0, 4)} - ${antar.end_date.slice(0, 4)}`}
                            className={`h-full rounded-lg transition-all relative ${antar.status === 'current'
                              ? 'ring-2 ring-amber-400 z-10 animate-pulse'
                              : antar.status === 'completed'
                                ? 'opacity-60'
                                : 'opacity-90'
                              }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* ANTARDASHA TABLE */}
                    <div className="overflow-x-auto rounded-2xl border border-outline-variant/60 bg-surface shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-variant/40 text-on-surface font-semibold border-b border-outline-variant/50">
                          <tr>
                            <th className="py-3 px-4">Sub-Period (Antardasha)</th>
                            <th className="py-3 px-4">Start Date</th>
                            <th className="py-3 px-4">End Date</th>
                            <th className="py-3 px-4">Duration</th>
                            <th className="py-3 px-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/30">
                          {item.antardashas.map((antar) => {
                            const isAntarCurrent = antar.status === 'current'

                            return (
                              <tr
                                key={antar.planet}
                                className={`transition-colors ${isAntarCurrent ? 'bg-amber-500/10 font-bold text-on-surface' : 'hover:bg-surface-variant/20'
                                  }`}
                              >
                                <td className="py-3 px-4 flex items-center gap-2.5">
                                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: antar.color }} />
                                  <span className="font-semibold text-on-surface">{antar.combination}</span>
                                </td>
                                <td className="py-3 px-4 text-on-surface-variant">{antar.start_date}</td>
                                <td className="py-3 px-4 text-on-surface-variant">{antar.end_date}</td>
                                <td className="py-3 px-4 text-on-surface-variant">{antar.duration_years} Years</td>
                                <td className="py-3 px-4 text-right">
                                  {isAntarCurrent && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 font-bold text-[10px] uppercase">
                                      Active Now
                                    </span>
                                  )}
                                  {antar.status === 'completed' && (
                                    <span className="text-on-surface-variant/60">Completed</span>
                                  )}
                                  {antar.status === 'upcoming' && (
                                    <span className="text-indigo-600 font-medium">Upcoming</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

