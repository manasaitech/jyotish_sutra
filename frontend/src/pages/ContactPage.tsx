import { useState, useEffect } from 'react'

interface ContactPageProps {
  onNavigateBack: () => void
  onSignIn?: () => void
  onPricing?: () => void
  apiBaseUrl?: string
}

export default function ContactPage({
  onNavigateBack,
  apiBaseUrl = 'http://localhost:8000',
}: ContactPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profession, setProfession] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) {
      setStatusMsg({ type: 'error', text: 'Please fill in all required fields.' })
      return
    }

    setSubmitting(true)
    setStatusMsg(null)

    try {
      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, profession, message }),
      })

      const data = await response.json()
      if (response.ok) {
        setStatusMsg({ type: 'success', text: data.message || 'Thank you! Your query has been sent.' })
        setName('')
        setEmail('')
        setProfession('')
        setMessage('')
      } else {
        throw new Error(data.detail || 'Failed to submit.')
      }
    } catch (err: any) {
      console.error(err)
      setStatusMsg({ type: 'error', text: err.message || 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Decorative Motifs */}
      <div className="fixed top-20 left-10 w-64 h-64 opacity-[0.05] pointer-events-none hidden md:block">
        <svg className="text-primary" fill="none" stroke="currentColor" viewBox="0 0 100 100">
          <path d="M50 10 C 60 40, 90 50, 50 90 C 10 50, 40 40, 50 10" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="5" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Spacer to clear header */}
      <div className="h-6" />

      {/* ═══════════════════════════════════════════════ */}
      {/* BREADCRUMB BANNER (AstroSutra Theme)            */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="border-b border-outline-variant/60 py-12 sm:py-16 bg-primary-fixed/20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary mb-3">Contact Us</h2>
          <div className="flex items-center justify-center gap-2 text-on-surface-variant text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={onNavigateBack}>Home</span>
            <span className="text-primary text-xs">✶</span>
            <span className="text-on-surface-variant/80 font-bold">Contact</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* GET IN TOUCH & SEND MESSAGE FORM                */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
          
          {/* Left Column info */}
          <div className="space-y-6 sm:space-y-8">
            <span className="text-xs font-bold text-primary bg-primary-fixed px-3 py-1 rounded-full border border-primary/20">
              Get in Touch
            </span>
            <h3 className="font-display text-4xl sm:text-5xl font-bold text-on-background leading-tight">
              We'd love to hear from you.
            </h3>
            <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
              Have questions about your horoscope analysis, Dasha timings, or looking to collaborate? Reach out to us, and our team will assist you on your spiritual and astrological journey.
            </p>
            <div className="flex items-center gap-4 bg-surface p-5 rounded-2xl border border-outline-variant/60 shadow-xs max-w-sm">
              <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-2xl">call</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">Phone Helpline</p>
                <a href="tel:+919971029784" className="text-lg font-bold text-[#1A2232] hover:text-primary transition-colors">
                  +91 99710-29784
                </a>
              </div>
            </div>
          </div>

          {/* Right Column Form */}
          <div className="celestial-card p-6 sm:p-10 rounded-3xl bg-surface">
            <h4 className="font-display text-2xl sm:text-3xl font-bold text-primary mb-6">Send Us A Message</h4>
            
            {statusMsg && (
              <div className={`p-4 rounded-xl mb-6 text-xs sm:text-sm font-semibold border ${
                statusMsg.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#FAF8F3] border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all font-medium"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#FAF8F3] border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all font-medium"
                />
              </div>
              <div>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full bg-[#FAF8F3] border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer text-on-surface-variant font-medium"
                >
                  <option value="">-- Choose Your Profession --</option>
                  <option value="Student">Student</option>
                  <option value="Scholar">Scholar / Academician</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Astrologer">Astrologer</option>
                  <option value="Professional">Professional</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <textarea
                  placeholder="Your Message.."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full bg-[#FAF8F3] border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all resize-none font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary-container disabled:bg-primary/60 text-white font-bold text-xs sm:text-sm uppercase tracking-widest py-3 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {submitting ? 'Sending...' : 'Submit Now'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* CARDS GRID (EASY TO CONTACT WITH US)           */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 border-t border-outline-variant/60 bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <h3 className="font-display text-3xl sm:text-4xl font-bold text-[#1A2232] mb-3">Easy to Contact with Us</h3>
          <p className="text-on-surface-variant text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Connecting with us is simple! Reach out anytime for expert guidance, program details, or any inquiries—we're just a message away.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
          {/* Card 1 */}
          <div className="celestial-card bg-surface p-6 sm:p-8 rounded-3xl text-center space-y-3 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-primary-fixed rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">location_on</span>
            </div>
            <h4 className="font-display text-lg sm:text-xl font-bold text-primary">Address</h4>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-semibold">
              386, Sant Nagar, New Delhi - 110065
            </p>
          </div>

          {/* Card 2 */}
          <div className="celestial-card bg-surface p-6 sm:p-8 rounded-3xl text-center space-y-3 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-primary-fixed rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">mail</span>
            </div>
            <h4 className="font-display text-lg sm:text-xl font-bold text-primary">Email Us</h4>
            <div className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-semibold space-y-1">
              <p>contact@issdelhi.org</p>
              <p>info@issdelhi.org</p>
              <p className="text-primary font-bold">astrosutraai@gmail.com</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="celestial-card bg-surface p-6 sm:p-8 rounded-3xl text-center space-y-3 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-primary-fixed rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">chat</span>
            </div>
            <h4 className="font-display text-lg sm:text-xl font-bold text-primary">Chat with Us</h4>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-semibold">
              +91 9928026858
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* GOOGLE MAP SECTION                              */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="rounded-3xl overflow-hidden border border-outline-variant/80 shadow-md bg-white p-2">
          <iframe
            src="https://maps.google.com/maps?q=386,%20Sant%20Nagar,%20New%20Delhi%20-110065&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="ISS Delhi Location"
            className="w-full rounded-2xl"
          />
        </div>
      </section>

    </>
  )
}
