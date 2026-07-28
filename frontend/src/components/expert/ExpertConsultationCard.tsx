import { useState } from 'react'
import ExpertConsultationModal from './ExpertConsultationModal'

interface ExpertConsultationCardProps {
  tab?: string
  onOpenBooking?: (plan: 'single' | 'full') => void
}

export default function ExpertConsultationCard({
  tab = 'general',
  onOpenBooking,
}: ExpertConsultationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalPlan, setModalPlan] = useState<'single' | 'full'>('single')

  // Map tab name to default query label
  const tabCategoryMap: Record<string, string> = {
    marriage: 'Marriage & Relationships',
    career: 'Career & Profession',
    health: 'Health & Vitality',
    finance: 'Finance & Investments',
    overview: 'Comprehensive Life Guidance',
    remedies: 'Palmistry & Remedies',
  }

  const queryCategory = tabCategoryMap[tab] || 'Career & Profession'

  const handleOpenBooking = (plan: 'single' | 'full') => {
    if (onOpenBooking) {
      onOpenBooking(plan)
    } else {
      setModalPlan(plan)
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <div className="my-8 relative rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FFF8EE] to-[#FDF2E2] p-6 sm:p-8 text-on-background border-2 border-orange-400/50 shadow-xl overflow-hidden">
        {/* Decorative saffron aura glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Left: Expert Bio & Photo */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="relative shrink-0">
              <img
                src="https://issdelhi.org/wp-content/uploads/2025/04/Picsart_25-04-24_18-23-26-960-e1753593240470.webp"
                alt="Mr. Sanoj Kumar (Guruji)"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-orange-500 shadow-lg"
              />
              <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow-md flex items-center gap-1 border border-orange-200">
                <span className="material-symbols-outlined text-xs">verified</span>
                Expert
              </span>
            </div>

            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-orange-950 px-3 py-1 rounded-full text-[11px] font-extrabold border border-orange-400/40 shadow-xs">
                <span className="material-symbols-outlined text-sm text-orange-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                  military_tech
                </span>
                <span><strong className="text-orange-950 font-bold">DRDO Scientist</strong> • <strong className="text-amber-900 font-bold">10+ Years Experience</strong></span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-bold text-orange-950 leading-tight">
                Talk to Expert — Mr. Sanoj Kumar
              </h3>

              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
                Vedic Astrology & Palmistry Master with over <strong className="text-orange-700 font-bold">10+ years of clinical experience</strong> and <strong className="text-amber-800 font-bold">100s of satisfied seekers</strong> worldwide. Get personal, 1-on-1 direct guidance for your exact life queries.
              </p>
            </div>
          </div>

          {/* Right: 2 Consultation Option Cards */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3.5 shrink-0">
            {/* Plan 1: ₹251 */}
            <div className="bg-white/95 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 flex-1 flex flex-col justify-between hover:border-orange-400 shadow-sm transition-all">
              <div>
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-orange-900">Single Query</span>
                  <span className="font-mono text-2xl font-black text-orange-600">₹251</span>
                </div>
                <h4 className="text-sm font-bold text-on-surface mb-1">10–15 Mins Focused Call</h4>
                <p className="text-[11px] text-on-surface-variant leading-snug mb-4 font-medium">
                  Ideal for 1 specific query (<strong className="text-orange-900">{queryCategory}</strong>, etc.)
                </p>
              </div>

              <button
                onClick={() => handleOpenBooking('single')}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span>Book Appointment (₹251)</span>
              </button>
            </div>

            {/* Plan 2: ₹3001 */}
            <div className="bg-gradient-to-b from-orange-100/90 to-amber-200/60 border-2 border-orange-400/80 rounded-2xl p-4 sm:p-5 flex-1 flex flex-col justify-between hover:border-orange-500 shadow-md transition-all relative">
              <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                Most Popular
              </span>
              <div>
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-orange-950">Full Life Reading</span>
                  <span className="font-mono text-2xl font-black text-orange-800">₹3001</span>
                </div>
                <h4 className="text-sm font-bold text-on-surface mb-1">40 Mins – 1 Hour Consultation</h4>
                <p className="text-[11px] text-on-surface-variant leading-snug mb-4 font-medium">
                  Multi-domain queries + Palmistry & Remedies synthesis
                </p>
              </div>

              <button
                onClick={() => handleOpenBooking('full')}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">stars</span>
                <span>Book Full Reading (₹3001)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {!onOpenBooking && (
        <ExpertConsultationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialPlan={modalPlan}
          defaultQueryType={queryCategory}
        />
      )}
    </>
  )
}
