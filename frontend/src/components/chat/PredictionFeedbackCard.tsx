import { useState } from 'react'

interface PredictionFeedbackCardProps {
  tab?: string
  userPrompt?: string
  aiResponse?: string
  birthData?: any
  userId?: string
  sessionId?: string
  apiBaseUrl?: string
}

export default function PredictionFeedbackCard({
  tab = 'general',
  userPrompt = '',
  aiResponse = '',
  birthData,
  userId,
  sessionId,
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
}: PredictionFeedbackCardProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleRate = async (stars: number) => {
    if (submitted || submitting) return
    setRating(stars)
    setSubmitting(true)

    try {
      const payload = {
        birth_details: birthData || null,
        tab: tab || 'general',
        user_prompt: userPrompt || '',
        ai_response: aiResponse || '',
        rating: stars,
        user_id: userId || 'anonymous',
        session_id: sessionId || 'session',
      }

      await fetch(`${apiBaseUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      setSubmitted(true)
    } catch (err) {
      console.error('Failed to submit prediction feedback:', err)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const activeRating = hoverRating || rating || 0

  return (
    <div className="mt-3.5 pt-3 border-t border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-primary-fixed/20 p-2.5 sm:p-3 rounded-xl text-xs">
      <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
        <span className="material-symbols-outlined text-amber-500 text-sm sm:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
        <span>How accurate was this prediction? Rate to help us fine-tune:</span>
      </div>

      {submitted ? (
        <div className="flex items-center gap-1 text-emerald-950 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-fade-in-up">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>Thank you! Saved {rating} ⭐</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={submitting}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => handleRate(star)}
              className="p-0.5 hover:scale-125 transition-transform cursor-pointer border-none bg-transparent"
              title={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <span
                className={`material-symbols-outlined text-base sm:text-lg ${
                  star <= activeRating ? 'text-amber-500' : 'text-slate-300'
                }`}
                style={star <= activeRating ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                star
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
