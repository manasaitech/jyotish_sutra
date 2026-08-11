import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { LOGO_BASE64 } from '../../assets/logoBase64'

interface ExpertConsultationModalProps {
  isOpen: boolean
  onClose: () => void
  initialPlan?: 'single' | 'full'
  defaultQueryType?: string
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

export default function ExpertConsultationModal({
  isOpen,
  onClose,
  initialPlan = 'single',
  defaultQueryType = 'Career & Profession',
}: ExpertConsultationModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'full'>(initialPlan)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [queryType, setQueryType] = useState(defaultQueryType)
  const [date, setDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 1:00 PM')
  const [question, setQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState<{ bookingId: string; paymentId: string } | null>(null)

  useEffect(() => {
    if (initialPlan) {
      setSelectedPlan(initialPlan)
    }
  }, [initialPlan, isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const price = selectedPlan === 'single' ? 251 : 3001
  const durationText = selectedPlan === 'single' ? '10 - 15 Minutes' : '40 Mins - 1 Hour'

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      alert('Please enter your Name and WhatsApp / Phone number.')
      return
    }

    setIsSubmitting(true)

    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        alert('Failed to load Razorpay SDK. Please check your internet connection.')
        setIsSubmitting(false)
        return
      }

      const backendUrl =
        import.meta.env.VITE_BACKEND_URL ||
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:8000'
          : 'https://kundli-gpt-clone-back.onrender.com')

      // 1. Create Razorpay order on backend
      const orderRes = await fetch(`${backendUrl}/api/billing/create-consultation-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      })

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to create payment order')
      }

      const orderData = await orderRes.json()

      // 2. Configure Razorpay Checkout Options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'JyotishaSutra AI',
        description: `1-on-1 Expert Consultation (${selectedPlan === 'single' ? '₹251' : '₹3001'})`,
        image: LOGO_BASE64,
        order_id: orderData.order_id,
        prefill: {
          name: name.trim(),
          contact: phone.trim(),
          email: email.trim(),
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false)
          },
        },
        handler: async function (response: any) {
          try {
            // 3. Verify Payment and Dispatch Emails on backend
            const verifyRes = await fetch(`${backendUrl}/api/billing/verify-consultation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan,
                name: name.trim(),
                phone: phone.trim(),
                email: email.trim() || undefined,
                topic: queryType,
                date: date || 'As per availability',
                time_slot: timeSlot,
                question: question.trim(),
              }),
            })

            if (!verifyRes.ok) {
              const verifyErr = await verifyRes.json().catch(() => ({}))
              throw new Error(verifyErr.detail || 'Payment verification failed.')
            }

            const verifyData = await verifyRes.json()
            setBookingSuccess({
              bookingId: verifyData.booking_id,
              paymentId: response.razorpay_payment_id,
            })
          } catch (verifyError: any) {
            console.error('Verification error:', verifyError)
            alert(`Payment verification issue: ${verifyError.message}`)
          } finally {
            setIsSubmitting(false)
          }
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      console.error('Booking submission error:', err)
      alert(`Booking failed: ${err.message}`)
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#FFFDF9] border border-amber-300 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Header — Vibrant Website Saffron & Orange Palette */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-5 sm:p-6 relative shrink-0 shadow-md">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          <div className="flex items-center gap-3.5">
            <img
              src="https://issdelhi.org/wp-content/uploads/2025/04/Picsart_25-04-24_18-23-26-960-e1753593240470.webp"
              alt="Mr. Sanoj Kumar (Guruji)"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-300/90 shadow-md shrink-0"
            />
            <div>
              <div className="inline-flex items-center gap-1 bg-amber-400/25 text-amber-100 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-300/40 mb-1">
                <span>DRDO Scientist • 10+ Yrs Exp</span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-white leading-tight">
                1-on-1 Consultation with Mr. Sanoj Kumar
              </h3>
              <p className="text-xs text-amber-100/90 font-medium">Vedic Astrology & Palmistry Expert</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-grow">
          {bookingSuccess ? (
            <div className="text-center py-6 space-y-4 animate-fade-in-up">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <h4 className="font-display text-2xl font-bold text-slate-800">
                Appointment Requested!
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Your booking request <strong className="text-orange-950 font-mono font-bold">{bookingSuccess.bookingId}</strong> for ₹{price} ({durationText}) has been verified & recorded!
              </p>
              <div className="p-4 bg-amber-50 rounded-2xl border border-orange-200 text-left text-xs space-y-1.5 text-amber-950 font-medium max-w-md mx-auto">
                <p>👤 <strong>Expert:</strong> Mr. Sanoj Kumar (Guruji)</p>
                <p>📋 <strong>Plan:</strong> ₹{price} ({selectedPlan === 'single' ? 'Single Focused Query' : 'Comprehensive Life Guidance'})</p>
                <p>💳 <strong>Razorpay Payment ID:</strong> <span className="font-mono text-orange-900 font-bold">{bookingSuccess.paymentId}</span></p>
                <p>🎯 <strong>Category:</strong> {queryType}</p>
                <p>📞 <strong>Your Contact:</strong> {phone}</p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`https://wa.me/919999999999?text=Namaste%20Guruji,%20I%20have%20booked%20an%20expert%20consultation%20(Ref:%20${bookingSuccess.bookingId},%20Payment:%20${bookingSuccess.paymentId})%20for%20₹${price}.%20My%20Name:%20${encodeURIComponent(name)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl text-xs shadow-md transition-all no-underline"
                >
                  <span className="material-symbols-outlined text-base">chat</span>
                  <span>Connect on WhatsApp</span>
                </a>
                <button
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBooking} className="space-y-4">
              {/* Plan Selection Toggle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Select Consultation Plan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: ₹251 */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('single')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedPlan === 'single'
                        ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/30'
                        : 'bg-slate-50 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-slate-800">Single Query</span>
                      <span className="font-mono font-extrabold text-orange-600 text-base">₹251</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-snug">
                      10–15 Mins • 1 Specific Topic (Career, Marriage, Health, etc.)
                    </p>
                  </button>

                  {/* Option 2: ₹2001 */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('full')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      selectedPlan === 'full'
                        ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/30'
                        : 'bg-slate-50 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase">
                      Popular
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-slate-800">Full Life Reading</span>
                      <span className="font-mono font-extrabold text-orange-600 text-base">₹3001</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-snug">
                      40 Mins – 1 Hour • Multi-Domain + Palmistry & Remedies
                    </p>
                  </button>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">WhatsApp / Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Email Address (For Instant Email Receipt)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul.sharma@example.com (optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Primary Topic</label>
                  <select
                    value={queryType}
                    onChange={(e) => setQueryType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="Career & Profession">Career & Profession</option>
                    <option value="Marriage & Relationships">Marriage & Relationships</option>
                    <option value="Health & Vitality">Health & Vitality</option>
                    <option value="Finance & Investments">Finance & Investments</option>
                    <option value="Palmistry & Remedies">Palmistry & Remedies</option>
                    <option value="Comprehensive Life Guidance">Comprehensive Multi-Query</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Preferred Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Preferred Time Slot</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['10:00 AM - 1:00 PM', '2:00 PM - 5:00 PM', '6:00 PM - 9:00 PM'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                        timeSlot === slot
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-orange-500 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Key Question for Guruji (Optional)</label>
                <textarea
                  rows={2}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Mention any specific concern or birth detail notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold py-3.5 rounded-2xl text-sm shadow-md shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">payment</span>
                    <span>Proceed to Payment (₹{price})</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
