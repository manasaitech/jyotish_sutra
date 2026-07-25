/**
 * PricingPage — Beautiful 3-tier subscription pricing page for AstroSutra AI.
 */
import { useState } from 'react'
import { TIER_CONFIG, type SubscriptionTier } from '../config/subscriptionConfig'
import { getCurrentTier, setCurrentTier } from '../utils/subscriptionManager'
import { authenticatedFetch } from '../utils/apiClient'
import { useAuth } from '../context/AuthContext'

interface PricingPageProps {
  onNavigateBack: () => void
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function PricingPage({ onNavigateBack }: PricingPageProps) {
  const [activeTier, setActiveTier] = useState<SubscriptionTier>(getCurrentTier())
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null)
  const [successTier, setSuccessTier] = useState<SubscriptionTier | null>(null)
  const { user } = useAuth()

  const handleSelectTier = async (tier: SubscriptionTier) => {
    if (tier === 'free') {
      setCurrentTier('free')
      setActiveTier('free')
      alert("Downgraded to Free tier successfully.")
      onNavigateBack()
      return
    }

    if (!user) {
      alert("Please sign in or register to purchase a subscription.")
      return
    }

    setLoadingTier(tier)

    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      alert("Failed to load Razorpay SDK. Please check your internet connection.")
      setLoadingTier(null)
      return
    }

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://kundli-gpt-clone-back.onrender.com')

    try {
      const res = await authenticatedFetch(`${backendUrl}/api/billing/create-order`, {
        method: 'POST',
        body: JSON.stringify({ tier }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to create payment order')
      }

      const orderData = await res.json()
      
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AstroSutra AI",
        description: `Upgrade to ${tier === 'pro' ? 'Pro' : 'Standard'} Plan`,
        order_id: orderData.order_id,
        modal: {
          ondismiss: function () {
            setLoadingTier(null)
          }
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await authenticatedFetch(`${backendUrl}/api/billing/verify-payment`, {
              method: 'POST',
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            if (!verifyRes.ok) {
              const errVerify = await verifyRes.json().catch(() => ({}))
              throw new Error(errVerify.detail || 'Payment verification failed')
            }

            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              setCurrentTier(verifyData.tier)
              setActiveTier(verifyData.tier)
              setSuccessTier(verifyData.tier)
            }
          } catch (verifyErr: any) {
            console.error("Verification error:", verifyErr)
            alert(`Verification failed: ${verifyErr.message}`)
          } finally {
            setLoadingTier(null)
          }
        },
        prefill: {
          name: orderData.user.name,
          email: orderData.user.email,
          contact: orderData.user.phone,
        },
        theme: {
          color: tier === 'pro' ? '#C89B3C' : '#E67E22',
        },
      }
      
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
      
    } catch (err: any) {
      console.error("Order creation error:", err)
      alert(`Order creation failed: ${err.message}`)
      setLoadingTier(null)
    }
  }

  const tiers = Object.values(TIER_CONFIG)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="glass border-b border-outline-variant/50 h-[72px] sticky top-0 z-50 flex items-center justify-between px-4 md:px-10">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary shadow-xs">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
          <h1 className="font-display text-[28px] leading-tight font-semibold text-primary">
            AstroSutra AI
          </h1>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 pt-12 pb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-fixed text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-5 border border-primary/20">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            workspace_premium
          </span>
          Choose Your Cosmic Plan
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-on-background mb-4 leading-tight">
          Unlock Your Full<br />
          <span className="text-primary">Astrological Potential</span>
        </h2>
        <p className="text-on-surface-variant text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          From basic chart insights to deep D2 Hora wealth analysis, Prashna Kundli, and unlimited AI guidance — choose the plan that matches your spiritual journey.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier) => {
            const isCurrent = activeTier === tier.id
            const isHighlighted = tier.highlighted

            return (
              <div
                key={tier.id}
                className={`relative rounded-3xl p-[2px] transition-all duration-300 ${
                  isHighlighted
                    ? 'scale-[1.03] md:scale-105 z-10'
                    : 'hover:scale-[1.01]'
                }`}
                style={{
                  background: isHighlighted
                    ? `linear-gradient(135deg, ${tier.color}, ${tier.color}80, ${tier.color})`
                    : tier.borderColor,
                }}
              >
                {/* Most Popular Badge */}
                {isHighlighted && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-white text-xs font-bold shadow-lg z-20 whitespace-nowrap"
                    style={{ backgroundColor: tier.color }}
                  >
                    ✨ Most Popular
                  </div>
                )}

                <div
                  className="h-full rounded-[22px] p-6 md:p-7 flex flex-col"
                  style={{ background: tier.bgGradient }}
                >
                  {/* Tier Icon & Label */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                      style={{
                        background: `${tier.color}15`,
                        border: `1.5px solid ${tier.color}30`,
                      }}
                    >
                      <span
                        className="material-symbols-outlined text-2xl"
                        style={{ color: tier.color, fontVariationSettings: "'FILL' 1" }}
                      >
                        {tier.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-on-background">
                        {tier.label}
                      </h3>
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tier.color }}>
                          Current Plan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <span className="font-display text-4xl font-bold text-on-background">
                      {tier.price}
                    </span>
                    <span className="text-sm text-on-surface-variant ml-1">
                      {tier.priceSubtext}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {tier.features.map((feature, i) => {
                      const isHeader = feature.includes('plus:')
                      return (
                        <li key={i} className={`flex items-start gap-2.5 text-sm ${isHeader ? 'font-semibold text-on-surface-variant pt-1' : 'text-on-surface'}`}>
                          {!isHeader && (
                            <span
                              className="material-symbols-outlined text-base mt-0.5 shrink-0"
                              style={{ color: tier.color, fontVariationSettings: "'FILL' 1" }}
                            >
                              check_circle
                            </span>
                          )}
                          <span>{feature}</span>
                        </li>
                      )
                    })}
                  </ul>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <div
                      className="w-full py-3 px-6 rounded-2xl text-center text-sm font-bold border-2"
                      style={{
                        borderColor: tier.color + '40',
                        color: tier.color,
                        backgroundColor: tier.color + '10',
                      }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                        Active Plan
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectTier(tier.id)}
                      disabled={loadingTier !== null}
                      className="w-full py-3 px-6 rounded-2xl text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{
                        background: `linear-gradient(135deg, ${tier.color}, ${tier.color}CC)`,
                      }}
                    >
                      {loadingTier === tier.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>{tier.id === 'free' ? 'Downgrade to Free' : `Upgrade to ${tier.label}`}</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-10">
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-lg mx-auto">
            🔒 Secure payments powered by Razorpay · Cancel anytime · All plans include core birth chart computation
          </p>
        </div>
      </div>
      {successTier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] px-4">
          <div className="bg-surface rounded-3xl p-8 max-w-md w-full border border-primary/30 text-center relative overflow-hidden shadow-2xl animate-scale-in">
            {/* Background elements */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
            
            {/* Animated Checkmark */}
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-primary/20">
              <span className="material-symbols-outlined text-4xl text-primary font-bold animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>

            <h3 className="font-display text-2xl font-bold text-primary mb-2">
              Upgrade Successful!
            </h3>
            <p className="text-on-surface-variant text-sm mb-6 max-w-xs mx-auto leading-relaxed">
              Your consciousness has ascended. You are now subscribed to the <strong>{successTier.toUpperCase()} Plan</strong>!
            </p>

            {/* Receipt Summary Table */}
            <div className="bg-surface-variant/30 rounded-2xl p-4 mb-6 text-left border border-outline-variant/30">
              <div className="flex justify-between py-1.5 border-b border-outline-variant/30 text-xs">
                <span className="text-on-surface-variant font-medium">Cosmic Tier</span>
                <span className="text-primary font-bold">{successTier.charAt(0).toUpperCase() + successTier.slice(1)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-outline-variant/30 text-xs">
                <span className="text-on-surface-variant font-medium">Billing Cycle</span>
                <span className="text-on-surface font-semibold">Monthly</span>
              </div>
              <div className="flex justify-between py-1.5 text-xs">
                <span className="text-on-surface-variant font-medium">Status</span>
                <span className="text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold text-[10px]">Active</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessTier(null)
                onNavigateBack()
                window.location.reload()
              }}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Go to Dashboard</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
