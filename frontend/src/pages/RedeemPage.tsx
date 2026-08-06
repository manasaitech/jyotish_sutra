import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AstroLoader from '../components/layout/AstroLoader'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://kundli-gpt-clone-back.onrender.com')

export default function RedeemPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()

  const [checking, setChecking] = useState(true)
  const [redeeming, setRedeeming] = useState(false)
  const [success, setSuccess] = useState(false)
  const [campaignInfo, setCampaignInfo] = useState<{
    campaign_name: string
    plan: string
    duration_hours: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Expiration timestamp returned by backend
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00')

  // 1. Fetch token validity details
  useEffect(() => {
    if (!token) return

    const verifyTokenStatus = async () => {
      try {
        setChecking(true)
        setError(null)
        const res = await fetch(`${API_BASE_URL}/api/campaigns/check-token/${token}`)
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.detail || 'This campaign link is invalid or expired.')
        }
        const data = await res.json()
        setCampaignInfo({
          campaign_name: data.campaign_name,
          plan: data.plan,
          duration_hours: data.duration_hours,
        })
        
        if (!data.is_valid) {
          throw new Error(`This campaign is currently inactive (Status: ${data.status}).`)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to check campaign code.')
      } finally {
        setChecking(false)
      }
    }

    verifyTokenStatus()
  }, [token])

  // 2. Perform redirection / auto-redemption once checking is complete
  useEffect(() => {
    if (checking || authLoading || error || success || redeeming) return

    // If user is not logged in, redirect them to login first
    if (!user) {
      const returnPath = encodeURIComponent(`${location.pathname}${location.search}`)
      navigate(`/login?redirect=${returnPath}`, { replace: true })
      return
    }

    // Automatically redeem if logged in and token is verified
    const redeemCampaign = async () => {
      try {
        setRedeeming(true)
        setError(null)
        
        const res = await fetch(`${API_BASE_URL}/api/campaigns/redeem/${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.detail || 'Redemption failed. Please try again.')
        }

        const data = await res.json()
        setExpiresAt(new Date(data.access_expires_at))
        setSuccess(true)

        // Set local storage item to signify user received a campaign trial, which can trigger downgrade popups on expiry
        localStorage.setItem('astro_had_pro_trial', 'true')
        
        // Force refresh user subscription tier in local state
        // (will be updated on next App load or dashboard refresh)
        localStorage.setItem('astrosutra_subscription_tier', data.plan)
      } catch (err: any) {
        setError(err.message || 'Failed to activate promotional trial access.')
      } finally {
        setRedeeming(false)
      }
    }

    redeemCampaign()
  }, [checking, authLoading, user, token, error, success, redeeming, navigate, location])

  // 3. Countdown timer logic on success
  useEffect(() => {
    if (!success || !expiresAt) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = expiresAt.getTime() - now

      if (distance < 0) {
        setTimeLeft('00:00:00')
        return
      }

      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      const formattedHours = String(hours).padStart(2, '0')
      const formattedMins = String(minutes).padStart(2, '0')
      const formattedSecs = String(seconds).padStart(2, '0')

      setTimeLeft(`${formattedHours}:${formattedMins}:${formattedSecs}`)
    }

    updateTimer()
    const timerId = setInterval(updateTimer, 1000)
    return () => clearInterval(timerId)
  }, [success, expiresAt])

  if (checking || authLoading || (redeeming && !success)) {
    return (
      <AstroLoader 
        message={
          checking 
            ? "Verifying celestial campaign token..." 
            : "Activating premium access subscription..."
        } 
      />
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-x-hidden font-sans">
      {/* Background radial celestial blurs */}
      <div className="absolute top-20 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface/90 sm:backdrop-blur-xl border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xl relative z-10 text-center space-y-6">
        
        {/* Success State */}
        {success && campaignInfo ? (
          <div className="space-y-6 animate-fade-in">
            {/* Crown/Star Animated Icon */}
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 mx-auto flex items-center justify-center text-amber-500 relative">
              <span className="material-symbols-outlined text-4xl animate-pulse">auto_awesome</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-on-surface">
                🎉 Welcome to AstroSutra {campaignInfo.plan.toUpperCase() === 'PRO' ? 'Pro' : 'Standard'}
              </h2>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                Your trial access via campaign <strong>"{campaignInfo.campaign_name}"</strong> has been successfully activated.
              </p>
            </div>

            {/* Countdown Box */}
            <div className="bg-surface-variant/20 border border-outline-variant/40 rounded-2xl p-4 space-y-2.5">
              <div className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                Access Remaining Time
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-500 tracking-wider">
                {timeLeft}
              </div>
            </div>

            <button
              onClick={() => {
                // Refresh window during redirect to ensure new tier is parsed by application context
                window.location.href = '/app'
              }}
              className="w-full py-3.5 bg-primary hover:bg-primary-container text-white font-bold text-sm rounded-2xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Dashboard</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        ) : (
          /* Error State */
          <div className="space-y-6 animate-fade-in">
            {/* Error Icon */}
            <div className="w-16 h-16 rounded-full bg-error-container/20 border border-error/30 mx-auto flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-serif">
                Access Activation Failed
              </h2>
              <p className="text-xs sm:text-sm text-error/90 max-w-xs mx-auto leading-relaxed">
                {error || 'Unable to redeem promotional access at this time.'}
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 border border-outline-variant hover:border-primary/50 text-on-surface hover:text-primary font-semibold text-sm rounded-2xl transition-all cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
