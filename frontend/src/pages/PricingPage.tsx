/**
 * PricingPage — Beautiful 3-tier subscription pricing page for AstroSutra AI.
 */
import { useState, useEffect } from 'react'
import { TIER_CONFIG, type SubscriptionTier } from '../config/subscriptionConfig'
import {
  getCurrentTier,
  setCurrentTier,
  getRetailQuestionBalance,
  incrementRetailQuestionBalance
} from '../utils/subscriptionManager'
import { authenticatedFetch } from '../utils/apiClient'
import { useAuth } from '../context/AuthContext'
import { LOGO_BASE64 } from '../assets/logoBase64'

interface PricingPageProps {
  onNavigateBack: () => void
  onContact?: () => void
  onSignIn?: () => void
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

export default function PricingPage({
  onNavigateBack,
}: PricingPageProps) {
  const [activeTier, setActiveTier] = useState<SubscriptionTier>(getCurrentTier())
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null)
  const [successTier, setSuccessTier] = useState<SubscriptionTier | null>(null)
  
  const [questionsCount, setQuestionsCount] = useState<number>(10)
  const [purchasingQuestions, setPurchasingQuestions] = useState<boolean>(false)
  const [purchaseSuccessCount, setPurchaseSuccessCount] = useState<number | null>(null)
  const [retailBalance, setRetailBalance] = useState<number>(0)

  const { user } = useAuth()

  useEffect(() => {
    setRetailBalance(getRetailQuestionBalance())
  }, [])

  const handlePurchaseQuestions = async () => {
    if (!user) {
      alert("Please sign in or register to purchase questions.")
      return
    }

    setPurchasingQuestions(true)

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://kundli-gpt-clone-back.onrender.com')

    try {
      const res = await authenticatedFetch(`${backendUrl}/api/billing/create-questions-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions_count: questionsCount }),
      })

      if (!res.ok) {
        throw new Error('Failed to create payment order')
      }

      const orderData = await res.json()

      if (orderData.gateway === 'mock') {
        // Handle mock payment simulation
        setTimeout(async () => {
          try {
            const verifyRes = await authenticatedFetch(`${backendUrl}/api/billing/verify-questions-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: orderData.order_id,
                razorpay_payment_id: 'mock_payment_' + Math.random().toString(36).substring(7),
                questions_count: questionsCount,
                user_id: user.uid,
              }),
            })

            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              incrementRetailQuestionBalance(questionsCount)
              setRetailBalance(getRetailQuestionBalance())
              setPurchaseSuccessCount(questionsCount)
              setPurchasingQuestions(false)
            } else {
              throw new Error('Verification failed')
            }
          } catch (err: any) {
            alert("Payment verification failed: " + err.message)
            setPurchasingQuestions(false)
          }
        }, 1500)
        return
      }

      // Real Razorpay integration
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        alert("Failed to load Razorpay SDK. Please check your internet connection.")
        setPurchasingQuestions(false)
        return
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AstroSutra AI",
        description: `Purchase ${questionsCount} Astro Questions`,
        image: LOGO_BASE64,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await authenticatedFetch(`${backendUrl}/api/billing/verify-questions-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                questions_count: questionsCount,
                user_id: user.uid,
              }),
            })

            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              incrementRetailQuestionBalance(questionsCount)
              setRetailBalance(getRetailQuestionBalance())
              setPurchaseSuccessCount(questionsCount)
              setPurchasingQuestions(false)
            }
          } catch (err) {
            console.error(err)
            alert("Payment verification failed.")
            setPurchasingQuestions(false)
          }
        },
        modal: {
          ondismiss: function () {
            setPurchasingQuestions(false)
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      alert("Error purchasing questions: " + err.message)
      setPurchasingQuestions(false)
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
        image: LOGO_BASE64,
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
    <div className="py-8">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-6 text-center">
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
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
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

          {/* Pay-Per-Question Cosmic Pack (4th Card) */}
          <div
            className="relative rounded-3xl p-[2px] transition-all duration-300 hover:scale-[1.01]"
            style={{
              background: '#E9DFC8',
            }}
          >
            <div
              className="h-full rounded-[22px] p-6 md:p-7 flex flex-col justify-between"
              style={{ background: 'var(--gradient-free)' }}
            >
              <div>
                {/* Tier Icon & Label */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                      style={{
                        background: '#C89B3C15',
                        color: '#C89B3C',
                      }}
                    >
                      <span className="material-symbols-outlined font-semibold">payments</span>
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-on-background leading-tight">
                        Cosmic Pack
                      </h3>
                      <span className="text-[10px] text-on-surface-variant font-semibold tracking-wider uppercase">
                        Retail / One-time
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-display font-black text-on-background">₹5.5</span>
                  <span className="text-xs text-on-surface-variant font-medium">/question</span>
                </div>

                {/* Description / Subtitle */}
                <p className="text-xs text-on-surface-variant mb-5 leading-relaxed">
                  Prefer query packs instead of monthly plans? Pay-per-question bypasses the free daily limit.
                </p>

                {/* Divider */}
                <div className="h-px bg-outline-variant/60 my-5" />

                {/* Custom Input for Questions */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-on-surface-variant">Questions (Max 500):</span>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={questionsCount || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        setQuestionsCount(isNaN(val) ? 0 : Math.min(500, Math.max(0, val)))
                      }}
                      className="w-20 px-2 py-1 border border-outline-variant rounded-lg text-xs bg-surface focus:outline-none focus:border-[#C89B3C] text-center font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Suggestions:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[10, 20, 50, 100].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setQuestionsCount(num)}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                            questionsCount === num
                              ? 'bg-[#C89B3C]/15 border-[#C89B3C] text-[#C89B3C] font-bold'
                              : 'border-outline-variant text-on-surface-variant hover:bg-surface-variant/20'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#C89B3C]/5 border border-[#C89B3C]/10 rounded-xl p-3 text-center">
                    <span className="text-[9px] uppercase font-bold text-on-surface-variant block tracking-wider mb-0.5">
                      Total Investment
                    </span>
                    <span className="text-xl font-display font-black text-[#C89B3C]">
                      ₹ {(questionsCount * 5.5).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer and Button */}
              <div className="space-y-4 mt-auto">
                <div className="text-[10px] text-center text-on-surface-variant font-medium">
                  Current balance: <strong className="text-[#C89B3C]">{retailBalance} Questions</strong>
                </div>

                <button
                  onClick={handlePurchaseQuestions}
                  disabled={purchasingQuestions || questionsCount <= 0}
                  className="w-full py-3 px-4 text-white font-bold text-xs rounded-2xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  style={{
                    background: 'linear-gradient(135deg, #C89B3C, #C89B3CCC)'
                  }}
                >
                  {purchasingQuestions ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xs">shopping_cart</span>
                      <span>Purchase Questions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
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

      {purchaseSuccessCount !== null && (
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
              Purchase Successful!
            </h3>
            <p className="text-on-surface-variant text-sm mb-6 max-w-xs mx-auto leading-relaxed">
              Your cosmic queries have been loaded. <strong>{purchaseSuccessCount} Questions</strong> have been successfully added to your balance!
            </p>

            <button
              onClick={() => {
                setPurchaseSuccessCount(null)
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
