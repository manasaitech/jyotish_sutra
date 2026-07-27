import { useState, useEffect } from 'react'
import HeroKundliChart from '../components/landing/HeroKundliChart'
import GocharaOrbits from '../components/landing/GocharaOrbits'

interface LandingPageProps {
  onSignIn: () => void
  onGetStarted: () => void
  onPricing: () => void
  onContact: () => void
}

export default function LandingPage({ onSignIn, onGetStarted, onPricing, onContact }: LandingPageProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const testimonials = [
    {
      quote: "AstroSutra AI didn't just give me predictions; it gave me clarity on my purpose. It was like speaking to a guide who knew my soul's map before I even asked the first question.",
      name: "Ananya Sharma",
      role: "Creative Director & Yoga Practitioner",
      initial: "A"
    },
    {
      quote: "The marriage transit calculations were incredibly precise. Shivom's marriage timeline analysis helped clarify astrological timings, smoothing out paths toward a harmonious union.",
      name: "Shivom Gupta",
      role: "Marriage Compatibility & Relationship Seeker",
      initial: "S"
    },
    {
      quote: "My health evaluation mapped element distributions to absolute perfection. Through simple daily remedies, I synchronized my biological rhythm back with natural alignment.",
      name: "Manish Sharma",
      role: "Ayurvedic Lifestyle & Health Seeker",
      initial: "M"
    },
    {
      quote: "The professional career dashboard pinpointed the exact transition period of my Dasha. With this clarity, I moved dynamically into my calling as a founder without hesitation.",
      name: "Anmol Dixit",
      role: "Tech Entrepreneur & Career Seeker",
      initial: "A"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  return (
    <>
      {/* Decorative Motifs */}
      <div className="fixed top-20 left-10 w-64 h-64 opacity-[0.08] pointer-events-none hidden md:block">
        <svg className="text-primary" fill="none" stroke="currentColor" viewBox="0 0 100 100">
          <path d="M50 10 C 60 40, 90 50, 50 90 C 10 50, 40 40, 50 10" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="5" strokeWidth="0.5" />
        </svg>
      </div>
      <div className="fixed bottom-20 right-10 w-96 h-96 opacity-[0.08] pointer-events-none rotate-180 hidden md:block">
        <svg className="text-primary" fill="none" stroke="currentColor" viewBox="0 0 100 100">
          <path d="M50 0 L 100 50 L 50 100 L 0 50 Z" strokeWidth="0.2" />
          <path d="M25 25 L 75 75 M 75 25 L 25 75" strokeWidth="0.2" />
        </svg>
      </div>

      <main className="pt-6 sm:pt-10 relative">
        {/* ═══════════════════════════════════════════════ */}
        {/* HERO SECTION                                    */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="relative min-h-[70vh] sm:min-h-[85vh] flex items-center px-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center relative z-10 w-full">
            <div className="flex flex-col gap-5 sm:gap-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-outline-variant bg-white/50 w-fit"
                style={{ boxShadow: '2px 2px 0px rgba(137, 115, 101, 0.1)' }}
              >
                <span className="material-symbols-outlined text-primary text-base">palette</span>
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.15em] font-semibold text-on-surface-variant">
                  Handcrafted Vedic Intelligence
                </span>
              </div>

              {/* Title */}
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[64px] leading-[1.1] text-on-background italic font-bold">
                Ancient Wisdom, <br />
                <span
                  className="not-italic font-extrabold uppercase tracking-tighter"
                  style={{
                    background: 'linear-gradient(90deg, #E67E22 0%, #C89B3C 50%, #E67E22 100%)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'shimmer 6s linear infinite',
                  }}
                >
                  Reimagined
                </span>{' '}
                <br />
                for the Modern Soul.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed font-light">
                Experience the precision of Vedic Astrology , curated through an artisanal neural lens.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 mt-2 sm:mt-4">
                <button
                  onClick={onGetStarted}
                  className="bg-primary text-white px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base tracking-[0.12em] uppercase hover:bg-primary-container transition-all flex items-center justify-center gap-3 cursor-pointer font-semibold"
                  style={{ boxShadow: '0 10px 40px -10px rgba(230, 126, 34, 0.15)' }}
                >
                  Start Your Journey
                  <span className="material-symbols-outlined">auto_awesome</span>
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('features')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="bg-transparent border border-outline-variant text-on-background px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base tracking-[0.12em] uppercase hover:bg-primary-fixed/20 transition-all flex items-center justify-center gap-2 cursor-pointer font-semibold"
                >
                  Philosophy
                </button>
              </div>
            </div>

            {/* Animated Kundli Chart Visual */}
            <div className="hidden md:flex justify-center items-center relative">
              <HeroKundliChart />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* FEATURES BENTO GRID                             */}
        {/* ═══════════════════════════════════════════════ */}
        <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto relative">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] text-on-background mb-4 sm:mb-6 uppercase tracking-[0.08em] italic font-semibold leading-tight">
              The Pillars of Insight
            </h2>
            <div className="w-24 h-[1px] bg-primary mx-auto mb-4 sm:mb-6" />
            <p className="text-base sm:text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto font-light italic leading-relaxed">
              Bridging millenia-old tradition with state-of-the-art computational neural networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
            {[
              {
                icon: 'menu_book',
                title: 'Spiritual Lineage',
                desc: 'Our intelligence is trained on authorized translations of the Vedas, Puranas, and the Samhitas, ensuring every insight carries the weight of tradition.',
                tag: 'Discovery • 01',
              },
              {
                icon: 'architecture',
                title: 'Mathematical Precision',
                desc: 'Calculations based on precise ephemeris data. Every degree, minute, and second of planetary movement is analyzed with surgical accuracy.',
                tag: 'Precision • 02',
                offset: true,
              },
              {
                icon: 'history_edu',
                title: 'Modern Eloquence',
                desc: 'Insights delivered in a language that speaks to the modern soul. Complex astrological concepts translated into actionable, poetic advice.',
                tag: 'Guidance • 03',
              },
            ].map((feat, i) => (
              <div
                key={i}
                className={`p-6 sm:p-8 border border-outline-variant bg-white/60 relative group hover:bg-white transition-all duration-500 ${feat.offset ? 'md:translate-y-12' : ''
                  }`}
                style={{ boxShadow: '2px 2px 0px rgba(137, 115, 101, 0.1)' }}
              >
                <div className="absolute -top-3 -left-3 w-6 h-6 border-t border-l border-primary/30" />
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-fixed/30 flex items-center justify-center mb-5 sm:mb-8 border border-outline-variant"
                >
                  <span className="material-symbols-outlined text-primary text-2xl sm:text-[32px]">{feat.icon}</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl mb-3 sm:mb-4 tracking-wide uppercase font-semibold">{feat.title}</h3>
                <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed font-light">{feat.desc}</p>
                <div className="mt-5 sm:mt-8 flex justify-end">
                  <span className="text-[10px] tracking-[0.25em] uppercase text-primary opacity-50">{feat.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* TESTIMONIAL SECTION                             */}
        {/* ═══════════════════════════════════════════════ */}
        <section id="testimonials" className="py-16 sm:py-24 bg-surface-variant/40 mt-12 sm:mt-16 border-y border-outline-variant relative overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {/* Carousel Viewport (no outer white card container, clean transparent view) */}
            <div className="overflow-hidden p-4">
              <div
                className="flex transition-transform duration-[2000ms] ease-in-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {testimonials.map((t, idx) => (
                  <div key={idx} className="w-full shrink-0 px-2 sm:px-4">
                    {/* Separate individual testimonial card */}
                    <div
                      className="relative bg-white p-6 sm:p-10 text-center flex flex-col gap-5 sm:gap-6 mx-auto max-w-2xl rounded-2xl"
                      style={{ border: '1.5px solid #E9DFC8', boxShadow: '0 10px 30px -10px rgba(230, 126, 34, 0.12)' }}
                    >
                      {/* Quote Badge for each card */}
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary text-white flex items-center justify-center rounded-full shadow-sm">
                        <span className="material-symbols-outlined text-sm">format_quote</span>
                      </div>

                      <p className="font-display italic text-base sm:text-lg md:text-xl text-on-background leading-relaxed min-h-[120px] flex items-center justify-center pt-2">
                        "{t.quote}"
                      </p>

                      <div className="flex items-center justify-center gap-3 sm:gap-4 border-t border-outline-variant/60 pt-4 mt-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 border border-outline-variant p-0.5 bg-white overflow-hidden rounded-full">
                          <div className="w-full h-full bg-primary-fixed/40 flex items-center justify-center text-primary text-sm sm:text-base font-bold font-display rounded-full">{t.initial}</div>
                        </div>
                        <div className="text-left">
                          <p className="text-xs sm:text-sm text-on-background font-bold tracking-[0.12em] uppercase">{t.name}</p>
                          <p className="text-[10px] sm:text-xs text-on-surface-variant italic font-light">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${activeIndex === idx ? 'bg-primary w-4' : 'bg-outline-variant hover:bg-primary/50'
                    }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* CELESTIAL ALIGNMENT SECTION                     */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <GocharaOrbits />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* PRICING PREVIEW / FINAL CTA                     */}
        {/* ═══════════════════════════════════════════════ */}
        <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 mb-12 sm:mb-24">
          <div
            className="max-w-4xl mx-auto border border-outline-variant p-8 sm:p-12 md:p-16 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #fbf9f4 0%, #f5f3ee 100%)',
              boxShadow: '0 10px 40px -10px rgba(230, 126, 34, 0.15)',
            }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-container/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] mb-4 sm:mb-6 uppercase tracking-[0.15em] italic font-semibold relative z-10 leading-tight">
              Seek the Eternal
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-on-surface-variant mb-6 sm:mb-10 max-w-xl mx-auto font-light relative z-10 leading-relaxed">
              Join thousands of seekers who have found clarity through the union of ancient truth and handcrafted intelligence.
            </p>
            <div className="flex flex-col items-center gap-4 sm:gap-6 relative z-10">
              <button
                onClick={onGetStarted}
                className="bg-primary text-white px-8 sm:px-16 py-4 sm:py-6 text-base sm:text-lg tracking-[0.15em] uppercase hover:bg-primary-container transition-all w-full sm:w-auto cursor-pointer font-semibold"
                style={{ boxShadow: '0 10px 40px -10px rgba(230, 126, 34, 0.15)' }}
              >
                Create Your Profile
              </button>
              <p className="text-[11px] sm:text-xs tracking-[0.15em] uppercase text-on-surface-variant italic opacity-70">
                — No obligation. Purely spiritual growth —
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Shimmer Animation Keyframes */}
      <style>{`
        @keyframes shimmer {
          to { background-position: 200% center; }
        }
      `}</style>
    </>
  )
}
