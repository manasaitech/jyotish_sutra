import { useState, useEffect } from 'react'
import { authenticatedFetch } from '../../utils/apiClient'

interface PlanetarySignature {
  dasha: string
  antardasha: string
  houses: number[]
  transits: string[]
  yogas: string[]
  score: number
  mapped_date?: string
}

interface PastEvent {
  id: string
  title: string
  category: string
  date: string
  age?: number
  importance: number // 1 to 5 stars
  outcome: 'Positive' | 'Negative' | 'Neutral'
  description?: string
  planetary_signature?: PlanetarySignature
}

interface Recurrence {
  past_event_id: string
  past_event_title: string
  category: string
  similarity_score: number
  matching_factors: string[]
  start_date: string
  end_date: string
  recommendations: string[]
  confidence: string
  time_range_desc?: string
  is_this_year?: boolean
  planetary_signature: {
    dasha: string
    antardasha: string
    transits: string[]
  }
}

interface LifePatternDashboardProps {
  chartData: any
  userId?: string
  apiBaseUrl: string
  onAskQuestion?: (question: string) => void
}

const CATEGORIES = [
  'Career',
  'Education',
  'Marriage',
  'Relationship',
  'Health',
  'Business',
  'Investment',
  'Accident',
  'Travel',
  'Property',
  'Finance',
  'Custom',
]

export default function LifePatternDashboard({
  chartData,
  userId,
  apiBaseUrl,
  onAskQuestion,
}: LifePatternDashboardProps) {
  const [events, setEvents] = useState<PastEvent[]>([])
  const [recurrences, setRecurrences] = useState<Recurrence[]>([])
  const [loading, setLoading] = useState(false)
  const [addingEvent, setAddingEvent] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null)
  
  // Temporary form state for adding/editing event
  const [tempTitle, setTempTitle] = useState('')
  const [tempCategory, setTempCategory] = useState('Career')
  const [tempDate, setTempDate] = useState('')
  const [tempAge, setTempAge] = useState<number | undefined>(undefined)
  const [tempImportance, setTempImportance] = useState(4)
  const [tempOutcome, setTempOutcome] = useState<'Positive' | 'Negative' | 'Neutral'>('Positive')
  const [tempDescription, setTempDescription] = useState('')

  // Load events on mount
  useEffect(() => {
    if (!userId) return
    async function loadData() {
      setLoading(true)
      try {
        const res = await authenticatedFetch(`${apiBaseUrl}/api/profile/${userId}/events`)
        const data = await res.json()
        if (data.past_events) {
          setEvents(data.past_events)
        }
        if (data.recurrences) {
          setRecurrences(data.recurrences)
        }
      } catch (err) {
        console.error('Failed to load past events:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [userId, apiBaseUrl])

  const handleAddEventSubmit = async () => {
    if (!tempTitle.trim()) return
    
    const newEvent: PastEvent = {
      id: crypto.randomUUID(),
      title: tempTitle,
      category: tempCategory,
      date: tempDate,
      age: tempAge,
      importance: tempImportance,
      outcome: tempOutcome,
      description: tempDescription,
    }

    const updatedEvents = [...events, newEvent]
    setEvents(updatedEvents)
    setAddingEvent(false)
    resetForm()

    // Save and extract signatures immediately
    await saveEventsToBackend(updatedEvents)
  }

  const handleDeleteEvent = async (id: string) => {
    const updated = events.filter((e) => e.id !== id)
    setEvents(updated)
    await saveEventsToBackend(updated)
  }

  const saveEventsToBackend = async (updatedList: PastEvent[]) => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await authenticatedFetch(`${apiBaseUrl}/api/profile/${userId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: updatedList }),
      })
      const data = await res.json()
      if (data.past_events) {
        setEvents(data.past_events)
      }
      if (data.recurrences) {
        setRecurrences(data.recurrences)
      }
    } catch (err) {
      console.error('Failed to sync events:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTempTitle('')
    setTempCategory('Career')
    setTempDate('')
    setTempAge(undefined)
    setTempImportance(4)
    setTempOutcome('Positive')
    setTempDescription('')
  }

  const handleFeedback = async (eventId: string, feedback: 'yes' | 'no') => {
    if (!userId) return
    try {
      const res = await authenticatedFetch(`${apiBaseUrl}/api/profile/${userId}/events/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, feedback }),
      })
      const data = await res.json()
      if (data.success) {
        setFeedbackSuccess(eventId)
        setTimeout(() => setFeedbackSuccess(null), 3000)
        // reload events to apply confidence modifier changes
        const rel = await authenticatedFetch(`${apiBaseUrl}/api/profile/${userId}/events`)
        const relData = await rel.json()
        if (relData.recurrences) {
          setRecurrences(relData.recurrences)
        }
      }
    } catch (err) {
      console.error('Feedback failed:', err)
    }
  }

  return (
    <div className="space-y-6 mb-6 animate-fade-in-up">
      {/* Banner */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-blue-500/30"
        style={{
          background:
            'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(59, 130, 246, 0.06) 50%, rgba(16, 185, 129, 0.04) 100%)',
        }}
      >
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              }}
            >
              <span className="material-symbols-outlined text-2xl text-white">insights</span>
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-primary">
                Life Pattern Intelligence
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                Vedic Signature Matcher · Recurrence Scanner · Adaptive Astrology
              </p>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl mt-3">
            Instead of general predictions, AstroSutra AI maps your actual life milestones (promotions, marriages, relocations) to their exact dasha, transit, and yoga signatures. We then search future alignments to predict exactly when similar conditions return.
          </p>
        </div>
      </div>

      {/* Onboarding View (Empty State) */}
      {events.length === 0 && !addingEvent && (
        <div className="rounded-3xl border border-dashed border-outline-variant/60 bg-surface/50 p-8 text-center max-w-xl mx-auto space-y-4">
          <span className="material-symbols-outlined text-4xl text-primary-fixed/80">
            analytics
          </span>
          <h3 className="font-display text-lg font-bold text-on-background">
            Tell us about important events in your life
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            The more events you provide, the better AstroSutra can identify your recurring planetary patterns and personalize future predictions.
          </p>
          <button
            onClick={() => setAddingEvent(true)}
            className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add First Event
          </button>
        </div>
      )}

      {/* Event Add Card Form */}
      {addingEvent && (
        <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-md max-w-xl mx-auto space-y-4 animate-fade-in-up">
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
            <h3 className="text-sm font-bold text-on-background">Create Event Card</h3>
            <button
              onClick={() => setAddingEvent(false)}
              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                placeholder="e.g. Cleared GATE / Got Job"
                className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-xs bg-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Category
              </label>
              <select
                value={tempCategory}
                onChange={(e) => setTempCategory(e.target.value)}
                className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-xs bg-surface focus:outline-none focus:border-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Date (e.g. March 2024 / 2024-03-18)
              </label>
              <input
                type="text"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                placeholder="March 2024 or 2024-03-18"
                className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-xs bg-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Or Age (Optional)
              </label>
              <input
                type="number"
                value={tempAge || ''}
                onChange={(e) => setTempAge(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g. 19"
                className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-xs bg-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Outcome
              </label>
              <div className="flex gap-2">
                {(['Positive', 'Negative', 'Neutral'] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setTempOutcome(o)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      tempOutcome === o
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-variant/20'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Importance Rating
              </label>
              <div className="flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setTempImportance(star)}
                    className="text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {star <= tempImportance ? 'star' : 'star_border'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Description / Notes
            </label>
            <textarea
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              placeholder="Describe what occurred, e.g. Selected for Google internship."
              rows={2}
              className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-xs bg-surface focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setAddingEvent(false)}
              className="px-4 py-2 rounded-full border border-outline text-xs font-semibold text-on-surface-variant hover:bg-surface-variant/20 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEventSubmit}
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-full shadow-md transition-all cursor-pointer"
            >
              Add Event
            </button>
          </div>
        </div>
      )}

      {/* Pattern Database (Milestones & Signatures) */}
      {events.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">hub</span>
              <h3 className="font-display text-base sm:text-lg font-bold text-on-background">
                Personal Planetary Pattern Database
              </h3>
            </div>
            {!addingEvent && (
              <button
                onClick={() => setAddingEvent(true)}
                className="px-4 py-1.5 rounded-full border border-primary text-primary hover:bg-primary-fixed/20 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                Add Event
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="relative rounded-2xl border border-outline-variant bg-surface p-4 hover:shadow-md transition-all group"
              >
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="absolute top-3 right-3 text-on-surface-variant/60 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>

                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background:
                        ev.outcome === 'Positive'
                          ? 'rgba(16, 185, 129, 0.1)'
                          : ev.outcome === 'Negative'
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(107, 114, 128, 0.1)',
                      color:
                        ev.outcome === 'Positive'
                          ? '#10b981'
                          : ev.outcome === 'Negative'
                          ? '#ef4444'
                          : '#6b7280',
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {ev.outcome === 'Positive'
                        ? 'trending_up'
                        : ev.outcome === 'Negative'
                        ? 'trending_down'
                        : 'trending_flat'}
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {ev.category}
                      </span>
                      <span className="text-[10px] font-medium text-on-surface-variant">
                        {ev.date || `Age ${ev.age}`}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-on-background truncate pr-5">
                      {ev.title}
                    </h4>

                    {ev.description && (
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        {ev.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1">
                      {Array.from({ length: ev.importance }).map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-xs text-amber-500">
                          star
                        </span>
                      ))}
                    </div>

                    {/* Mapped Signature Details */}
                    {ev.planetary_signature && (
                      <div className="pt-2 border-t border-outline-variant/60 mt-2 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant">
                          <span className="material-symbols-outlined text-xs shrink-0 text-indigo-500">
                            fingerprint
                          </span>
                          Planetary Fingerprint
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-medium">
                            Dasha: {ev.planetary_signature.dasha}-{ev.planetary_signature.antardasha}
                          </span>
                          {ev.planetary_signature.transits.map((tr) => (
                            <span
                              key={tr}
                              className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium"
                            >
                              {tr}
                            </span>
                          ))}
                          {ev.planetary_signature.yogas.slice(0, 2).map((yo) => (
                            <span
                              key={yo}
                              className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-medium"
                            >
                              {yo}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurrence Scan (Future Pattern Scans) */}
      {events.length > 0 && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">timeline</span>
            <h3 className="font-display text-base sm:text-lg font-bold text-on-background">
              Recurrence Timeline & Matching Signatures
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant">
            Below are matching windows detected over the next 50 years sharing similar planetary signatures to your past events.
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : recurrences.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant bg-surface-variant/10 p-5 text-center text-xs text-on-surface-variant font-medium">
              No major recurrences detected over the next 50 years. Although smaller supportive periods exist, none closely resemble the planetary configuration associated with your past milestones.
            </div>
          ) : (
            <div className="space-y-4">
              {recurrences.map((rec, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-outline bg-surface p-5 shadow-xs flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                        Similar Planetary Signature
                      </span>
                      <span className="text-xs text-on-surface-variant font-semibold">
                        Recurrence of: <strong className="text-on-background font-bold">"{rec.past_event_title}"</strong> ({rec.category})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-on-surface-variant">
                      <div className="flex flex-col gap-1">
                        <div>
                          Timeline Window:{' '}
                          <span className="text-primary font-bold">
                            {rec.start_date} – {rec.end_date}
                          </span>
                        </div>
                        {rec.time_range_desc && (
                          <div className="flex items-center gap-1 text-[10px] font-bold mt-0.5">
                            <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              rec.is_this_year
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                            }`}>
                              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {rec.is_this_year ? 'check_circle' : 'schedule'}
                              </span>
                              {rec.time_range_desc}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        Confidence:{' '}
                        <span
                          className={`font-bold ${
                            rec.confidence === 'High'
                              ? 'text-emerald-600'
                              : rec.confidence === 'Moderate'
                              ? 'text-amber-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {rec.confidence}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1.5 border-t border-outline-variant/60">
                      <div className="text-[10px] font-bold text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-emerald-500">task_alt</span>
                        Matching Factors:
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-medium text-on-surface-variant pl-4 list-disc">
                        {rec.matching_factors.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1 pt-1.5">
                      <div className="text-[10px] font-bold text-on-surface-variant">
                        Actionable Recommendations for this window:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.recommendations.map((re, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1.5 rounded-xl bg-surface-variant/30 text-on-surface text-[11px] font-medium"
                          >
                            • {re}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-between shrink-0 border-l border-outline-variant/60 pl-0 md:pl-5 pt-4 md:pt-0 gap-3">
                    <div className="text-center space-y-1">
                      <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        Similarity Score
                      </div>
                      <div className="text-3xl font-display font-black text-indigo-600">
                        {rec.similarity_score}%
                      </div>
                    </div>

                    {/* AI Learning Feedback Control */}
                    <div className="text-center space-y-1.5">
                      <div className="text-[10px] font-semibold text-on-surface-variant">
                        Did this period resonate?
                      </div>
                      <div className="flex justify-center gap-2">
                        {feedbackSuccess === rec.past_event_id ? (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs">done</span>
                            Confidence Adjusted
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleFeedback(rec.past_event_id, 'yes')}
                              className="w-8 h-8 rounded-full border border-outline hover:bg-emerald-500/10 hover:border-emerald-500 text-on-surface-variant hover:text-emerald-500 flex items-center justify-center transition-all cursor-pointer"
                              title="Yes, accurate pattern"
                            >
                              <span className="material-symbols-outlined text-base">thumb_up</span>
                            </button>
                            <button
                              onClick={() => handleFeedback(rec.past_event_id, 'no')}
                              className="w-8 h-8 rounded-full border border-outline hover:bg-red-500/10 hover:border-red-500 text-on-surface-variant hover:text-red-500 flex items-center justify-center transition-all cursor-pointer"
                              title="No, did not match"
                            >
                              <span className="material-symbols-outlined text-base">thumb_down</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
