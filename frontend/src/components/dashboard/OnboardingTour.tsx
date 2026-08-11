import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FEATURE_FLAGS } from '../../config/featureFlags'

interface OnboardingStep {
  title: string
  description: string
  selector: string
  route: string
}

const TOUR_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to JyotishaSutra AI',
    description: 'Your personalized Vedic astrology space. Explore your Kundli, understand different areas of your life, and discover your planetary timelines — all in one place.',
    selector: '[data-tour="dashboard-overview"]',
    route: '/dashboard',
  },
  {
    title: 'Explore Your Life Areas',
    description: 'Your Kundli is organized into different areas of life. Select any tab to explore. You can navigate through Career, Health, Finance, Relationships, Dashas, and Vedic Doshas.',
    selector: '[data-tour="tab-navigation"]',
    route: '/dashboard',
  },
  {
    title: "Know What's Active & What's Next",
    description: "Explore your planetary timelines to see what has already passed (completed), what's active now, and what may come next (upcoming).",
    selector: '[data-tour="dasha-timeline"]',
    route: '/dashboard/dasha',
  },
  {
    title: 'Ask JyotishaSutra AI',
    description: 'Have a question about your Kundli? Ask JyotishaSutra for a personalized explanation based on your chart. (e.g. "Why is technology suitable for me?")',
    selector: '[data-tour="ask-astrosutra"]',
    route: '/dashboard',
  },
  {
    title: 'Your Profile & Astrology Data',
    description: FEATURE_FLAGS.enableDownloadPdf
      ? 'Manage your birth details, view your saved charts, and export your calculated astrology data PDF whenever you need it.'
      : 'Manage your birth details and view your saved charts whenever you need it.',
    selector: '[data-tour="profile-trigger"]',
    route: '/dashboard',
  },
]

export default function OnboardingTour() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const saved = sessionStorage.getItem('jyotishasutra_onboarding_step')
    return saved ? parseInt(saved, 10) : 0
  })
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [showCompletion, setShowCompletion] = useState(false)

  const nextButtonRef = useRef<HTMLButtonElement>(null)

  // Sync currentStep to sessionStorage to survive navigation unmounts
  useEffect(() => {
    sessionStorage.setItem('jyotishasutra_onboarding_step', String(currentStep))
  }, [currentStep])

  // 1. Initial mounting check: Start tour if not completed before
  useEffect(() => {
    if (!user?.uid) return

    const isCompleted = localStorage.getItem(`jyotishasutra_onboarding_completed_${user.uid}`) === 'true'
    if (!isCompleted) {
      setIsOpen(true)
    }

    // Listener for manually restarting the tour from settings
    const handleRestart = () => {
      sessionStorage.setItem('jyotishasutra_onboarding_step', '0')
      setIsOpen(true)
      setCurrentStep(0)
      setShowCompletion(false)
      navigate('/dashboard')
    }

    window.addEventListener('jyotishasutra_restart_tour', handleRestart)
    return () => {
      window.removeEventListener('jyotishasutra_restart_tour', handleRestart)
    }
  }, [user, navigate])

  // 2. Auto-route navigation based on current step target
  useEffect(() => {
    if (!isOpen || showCompletion) return

    const targetStep = TOUR_STEPS[currentStep]
    if (targetStep && location.pathname !== targetStep.route) {
      navigate(targetStep.route)
    }
  }, [currentStep, isOpen, navigate, location.pathname, showCompletion])

  // 3. Track spotlight coordinates and position tooltip responsively
  useEffect(() => {
    if (!isOpen || showCompletion) return

    const updatePosition = () => {
      const stepConfig = TOUR_STEPS[currentStep]
      if (!stepConfig) return

      const el = document.querySelector(stepConfig.selector)
      if (el) {
        const rect = el.getBoundingClientRect()
        const padding = 8
        const top = rect.top + window.scrollY - padding
        const left = rect.left + window.scrollX - padding
        const width = rect.width + padding * 2
        const height = rect.height + padding * 2

        setCoords({ top, left, width, height })

        // Intelligently calculate tooltip positions
        const viewportWidth = window.innerWidth
        const isMobile = viewportWidth < 640

        if (isMobile) {
          // Bottom drawer/fixed style for mobile screens to avoid view truncation
          setTooltipStyle({
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            right: '16px',
            width: 'calc(100% - 32px)',
            zIndex: 10000,
          })
        } else {
          // Desktop positioning
          let tooltipTop = top + height + 12
          let tooltipLeft = left + (width / 2) - 175 // center horizontally

          // Avoid horizontal clipping
          if (tooltipLeft < 20) tooltipLeft = 20
          if (tooltipLeft + 350 > viewportWidth - 20) {
            tooltipLeft = viewportWidth - 370
          }

          // If spotlight element is in the bottom half, display tooltip above it
          const elementCenterY = rect.top + (rect.height / 2)
          if (elementCenterY > window.innerHeight / 2) {
            tooltipTop = top - 180 // approximate height
            if (tooltipTop < window.scrollY + 20) {
              tooltipTop = top + height + 12 // fallback below if clipped above
            }
          }

          setTooltipStyle({
            position: 'absolute',
            top: `${tooltipTop}px`,
            left: `${tooltipLeft}px`,
            width: '350px',
            zIndex: 10000,
          })
        }

        // Keep highlighted element visible by scrolling it into view
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      } else {
        setCoords(null)
      }
    }

    updatePosition()
    const interval = setInterval(updatePosition, 100) // fast polling for rendering mounts
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, { passive: true })

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [currentStep, isOpen, showCompletion])

  // 4. Focus management
  useEffect(() => {
    if (isOpen && nextButtonRef.current) {
      nextButtonRef.current.focus()
    }
  }, [currentStep, isOpen, showCompletion])

  // 5. Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        handleSkip()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setShowCompletion(true)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    if (user?.uid) {
      localStorage.setItem(`jyotishasutra_onboarding_completed_${user.uid}`, 'true')
    }
    sessionStorage.removeItem('jyotishasutra_onboarding_step')
    setIsOpen(false)
    setShowCompletion(false)
    navigate('/dashboard')
  }

  const handleFinish = () => {
    if (user?.uid) {
      localStorage.setItem(`jyotishasutra_onboarding_completed_${user.uid}`, 'true')
    }
    sessionStorage.removeItem('jyotishasutra_onboarding_step')
    setIsOpen(false)
    setShowCompletion(false)
    navigate('/dashboard')
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[9999]" style={{ minHeight: '100vh' }}>
      {/* 1. Backdrop Overlay with dynamic CSS shadow mask spotlight */}
      {coords && !showCompletion && (
        <div
          className="fixed rounded-2xl transition-all duration-300 pointer-events-auto shadow-[0_0_0_9999px_rgba(45,42,38,0.7)]"
          style={{
            top: `${coords.top - window.scrollY}px`,
            left: `${coords.left - window.scrollX}px`,
            width: `${coords.width}px`,
            height: `${coords.height}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
            border: '2px solid var(--color-primary, #E67E22)',
            zIndex: 9998,
          }}
        />
      )}

      {/* 2. Tooltip Card */}
      {!showCompletion && (
        <div
          className="bg-surface border border-outline-variant/70 text-on-surface rounded-3xl p-5 sm:p-6 shadow-2xl pointer-events-auto flex flex-col space-y-4 animate-fade-in"
          style={tooltipStyle}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-display text-base sm:text-lg font-bold text-primary">
              {TOUR_STEPS[currentStep].title}
            </h4>
            <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant bg-surface-variant/40 px-2 py-0.5 rounded-full border border-outline-variant/30">
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {TOUR_STEPS[currentStep].description}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                className="px-3.5 py-1.5 rounded-xl border border-outline-variant/60 hover:bg-surface-variant/30 text-on-surface-variant text-xs font-bold transition-all cursor-pointer"
              >
                Back
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="px-3.5 py-1.5 rounded-xl text-on-surface-variant/70 hover:text-red-500 text-xs font-semibold transition-all cursor-pointer"
              >
                Skip Tour
              </button>
            )}
            <div className="flex gap-2">
              {currentStep < TOUR_STEPS.length - 1 ? (
                <>
                  {currentStep > 0 && (
                    <button
                      onClick={handleSkip}
                      className="px-3 py-1.5 rounded-xl text-on-surface-variant/70 hover:text-red-500 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Skip
                    </button>
                  )}
                  <button
                    ref={nextButtonRef}
                    onClick={handleNext}
                    className="px-4.5 py-1.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </>
              ) : (
                <button
                  ref={nextButtonRef}
                  onClick={handleNext}
                  className="px-4.5 py-1.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Final Completion Screen */}
      {showCompletion && (
        <div className="fixed inset-0 bg-black/60 pointer-events-auto flex items-center justify-center p-4 z-[10001] animate-fade-in">
          <div className="bg-surface border border-outline-variant/60 text-on-surface rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-5 animate-scale-up">
            <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                task_alt
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="font-display text-2xl font-bold text-primary">
                You're All Set!
              </h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Your JyotishaSutra journey starts here. Explore your Kundli and discover what your chart reveals.
              </p>
            </div>
            <button
              onClick={handleFinish}
              className="w-full py-3 bg-primary hover:bg-primary-container text-white text-sm font-bold rounded-2xl shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              Start Exploring
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
