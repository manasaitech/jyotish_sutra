import { useState } from 'react'
import type { UserProfile } from '../../types/profile'
import { getCurrentTier } from '../../utils/subscriptionManager'
import { TIER_CONFIG } from '../../config/subscriptionConfig'
import ExpertConsultationModal from '../expert/ExpertConsultationModal'

interface NavbarProps {
  profiles?: UserProfile[]
  activeProfileId?: string
  onOpenProfile?: () => void
  onOpenPricing?: () => void
}

export default function Navbar({
  profiles = [],
  activeProfileId,
  onOpenProfile,
  onOpenPricing,
}: NavbarProps) {
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false)
  const currentTier = getCurrentTier()
  const tierConfig = TIER_CONFIG[currentTier]

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0]

  return (
    <>
      <nav className="glass border-b border-outline-variant/50 min-h-[64px] py-2 sticky top-0 z-50 flex items-center justify-between px-2.5 sm:px-6 md:px-10 gap-1.5">
        {/* Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo.png" alt="AstroSutra AI Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-xl shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="font-display text-[16px] sm:text-[22px] md:text-[26px] leading-tight font-bold text-primary truncate">
                AstroSutra AI
              </h1>
              {/* Subscription Tier Badge */}
              <button
                onClick={onOpenPricing}
                title="Click to view subscription plans"
                className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full text-white shadow-xs transition-all hover:scale-105 cursor-pointer shrink-0"
                style={{ backgroundColor: tierConfig.color }}
              >
                {tierConfig.label}
              </button>
            </div>
            <p className="text-[10px] sm:text-[12px] leading-none font-semibold text-on-surface-variant hidden sm:block">
              Modular AI Astrology Platform
            </p>
          </div>
        </div>

        {/* Navigation & Profile Section Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Talk to Expert Button */}
          <button
            onClick={() => setIsExpertModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] sm:text-xs shadow-md transition-all cursor-pointer shrink-0 border border-amber-300"
          >
            <span className="material-symbols-outlined text-sm sm:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              support_agent
            </span>
            <span className="hidden sm:inline">Talk to Expert (₹251)</span>
            <span className="sm:hidden">Expert</span>
          </button>

          {/* Upgrade / Pricing Button */}
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-[11px] sm:text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-sm sm:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
            <span className="hidden sm:inline">Pricing & Plans</span>
            <span className="sm:hidden">Plans</span>
          </button>

          {/* Profile Section Trigger Button */}
          {activeProfile ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 bg-surface border border-outline-variant hover:border-primary/50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-xs transition-all cursor-pointer hover:bg-surface-variant/30 shrink-0"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-primary-fixed rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {activeProfile.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-on-surface leading-tight truncate max-w-[100px]">
                  {activeProfile.name}
                </p>
                <p className="text-[10px] text-primary font-semibold leading-none">
                  {activeProfile.relationship || 'Self'}
                </p>
              </div>
            </button>
          ) : null}
        </div>
      </nav>

      {/* Expert Consultation Booking Modal */}
      <ExpertConsultationModal
        isOpen={isExpertModalOpen}
        onClose={() => setIsExpertModalOpen(false)}
      />
    </>
  )
}
