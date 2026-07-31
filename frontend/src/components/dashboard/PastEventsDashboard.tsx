/**
 * PastEventsDashboard — Premium dashboard component for the Past Events Discovery tab.
 *
 * Renders suggested event discovery questions, verdict explanations, and methodologies.
 * The actual AI investigation is rendered by TabPanel's standard markdown/structured report renderer.
 */

interface PastEventsDashboardProps {
  chartData: any
  onAskQuestion?: (question: string) => void
}

const EVENT_DISCOVERY_CATEGORIES = [
  {
    category: 'Career & Achievements',
    icon: 'work',
    color: '#3b82f6', // Blue
    questions: [
      'When did I most likely experience a major career change or promotion?',
      'Can you identify the period of my first major professional job?',
      'Did my chart indicate business start or entrepreneurship entry in the past?',
    ],
  },
  {
    category: 'Relationships & Marriage',
    icon: 'favorite',
    color: '#ef4444', // Red
    questions: [
      'Can you identify when I most likely got married or had a major relationship?',
      'Did my chart indicate a period of relationship testing or a major breakup?',
      'Which dasha activated relationship nodes in my early twenties?',
    ],
  },
  {
    category: 'Relocation & Travel',
    icon: 'flight_takeoff',
    color: '#8b5cf6', // Purple
    questions: [
      'Can you identify periods of foreign travel or relocation in my chart?',
      'When did I most likely have a major residential change or move cities?',
      'Which planetary periods triggered long-distance journeys?',
    ],
  },
  {
    category: 'Education & Intellect',
    icon: 'school',
    color: '#f59e0b', // Amber
    questions: [
      'What major education milestones or graduation windows occurred?',
      'Did I experience an academic transition or competitive success?',
      'Which house activation supported higher studies or research?',
    ],
  },
  {
    category: 'Property & Wealth',
    icon: 'account_balance',
    color: '#10b981', // Emerald
    questions: [
      'When was I most likely to have purchased property or a vehicle?',
      'What major financial gains or sudden windfalls does my chart show?',
      'Did my chart indicate any major financial investment or loss periods?',
    ],
  },
]

export default function PastEventsDashboard({
  chartData,
  onAskQuestion,
}: PastEventsDashboardProps) {
  const mode = chartData?.mode || 'exact'

  return (
    <div className="space-y-6 mb-6 animate-fade-in-up">
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-blue-500/30"
        style={{
          background:
            'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.06) 50%, rgba(16, 185, 129, 0.04) 100%)',
        }}
      >
        {/* Decorative elements */}
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
            transform: 'translate(-20%, 30%)',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              }}
            >
              <span
                className="material-symbols-outlined text-2xl text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                history
              </span>
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-primary">
                Vedic Event Discovery Engine
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                Vimshottari Dasha Analysis · House Signatures · Probabilistic Life History Reconstruction
              </p>
            </div>
          </div>

          <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl mt-3">
            Analyze your past astrological timeline to reconstruct major life events. The engine scans your
            complete chart to identify concrete event signatures (graduations, promotions, relationships, relocations, property acquisitions)
            and calculates likelihood scores based on house lord activations and yoga triggers.
          </p>

          {mode !== 'exact' && (
            <div className="mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 font-medium">
              <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
              Event discovery relies heavily on precise dasha timing. Since your birth time is {mode === 'prashna' ? 'Prashna Horary' : 'Estimated Horoscope'}, past dasha dates are approximations.
            </div>
          )}
        </div>
      </div>

      {/* Suggested Discovery Prompts */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span
            className="material-symbols-outlined text-lg text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            find_in_page
          </span>
          <h3 className="font-display text-base sm:text-lg font-bold text-primary">
            Select a Discovery Area
          </h3>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">
          Pick a predefined question to run the investigator engine on your chart. The engine will evaluate the relevant houses and dashas, and rank candidates by likelihood.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EVENT_DISCOVERY_CATEGORIES.map((cat) => (
            <div
              key={cat.category}
              className="rounded-2xl border border-outline-variant/60 bg-surface p-4 hover:shadow-md transition-all"
              style={{
                borderTop: `3px solid ${cat.color}20`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: cat.color, fontVariationSettings: "'FILL' 1" }}
                >
                  {cat.icon}
                </span>
                <h4 className="text-sm font-bold text-on-background">{cat.category}</h4>
              </div>

              <div className="space-y-2">
                {cat.questions.map((q) => (
                  <button
                    key={q}
                    onClick={() => onAskQuestion?.(q)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-surface-variant/30 hover:bg-primary-fixed/40 hover:border-primary/20 border border-transparent text-xs text-on-surface-variant hover:text-primary font-medium transition-all cursor-pointer leading-relaxed group"
                  >
                    <span className="material-symbols-outlined text-xs mr-1.5 opacity-50 group-hover:opacity-100 align-middle transition-opacity">
                      search
                    </span>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology Explainer */}
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-variant/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="material-symbols-outlined text-lg text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            troubleshoot
          </span>
          <h4 className="text-sm font-bold text-primary">
            Investigative Framework & Scoring
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              title: 'House Signatures',
              desc: 'Identifies which houses (e.g., 7th for marriage, 10th/11th for career gains, 12th for foreign travel) were activated by the dasha lords.',
              icon: 'gite',
            },
            {
              title: 'Double Transit Confirmation',
              desc: 'Correlates major past transits (like Saturn and Jupiter) over natal positions with dasha timelines to pinpoint event windows.',
              icon: 'swap_horiz',
            },
            {
              title: 'Likelihood Scoring (0-100)',
              desc: 'Calculates a likelihood score based on dignity, aspects, and yoga triggers. Only high-confidence events are shown.',
              icon: 'fact_check',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-3.5 rounded-xl bg-background/60 border border-outline-variant/30 flex gap-3"
            >
              <span
                className="material-symbols-outlined text-xl text-primary shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {item.icon}
              </span>
              <div>
                <h5 className="text-xs font-bold text-primary mb-1">{item.title}</h5>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-on-surface-variant mt-3 leading-relaxed">
          The event discovery system uses a purely scientific, rules-based methodology. It acts as a probabilistic history guide and never asserts predictions as absolute certainties.
        </p>
      </div>
    </div>
  )
}
