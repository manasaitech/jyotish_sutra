import { useState, useEffect } from 'react'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import PricingPage from './pages/PricingPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import { AuthProvider, useAuth } from './context/AuthContext'

type AppView = 'landing' | 'login' | 'pricing' | 'app' | 'contact' | 'privacy' | 'terms'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://kundli-gpt-clone-back.onrender.com')

// ─────────────────────────────────────────────
// Persistent public layout — shared header + footer
// ─────────────────────────────────────────────
interface PublicLayoutProps {
  view: AppView
  setView: (v: AppView) => void
  onSignIn: () => void
  children: React.ReactNode
}

function PublicLayout({ view, setView, onSignIn, children }: PublicLayoutProps) {
  // Scroll to top whenever the public view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [view])

  const navBtn = (label: string, target: AppView) => (
    <button
      onClick={() => setView(target)}
      className={`font-medium hover:text-primary transition-colors text-xs tracking-[0.15em] uppercase cursor-pointer bg-transparent border-none ${
        view === target ? 'text-primary font-bold' : 'text-on-surface-variant'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div
      className="min-h-screen font-sans text-on-background selection:bg-primary-fixed selection:text-primary overflow-x-hidden flex flex-col"
      style={{
        backgroundImage:
          'radial-gradient(circle at 2px 2px, rgba(137, 115, 101, 0.05) 1px, transparent 0)',
        backgroundSize: '24px 24px',
        backgroundColor: '#FAF8F3',
      }}
    >
      {/* ══════════════ TOP NAVIGATION BAR ══════════════ */}
      <nav className="sticky top-0 w-full z-50 backdrop-blur-md border-b border-outline-variant/60 bg-[#FAF8F3]/90">
        <div className="flex justify-between items-center px-4 sm:px-6 md:px-10 py-3.5 sm:py-5 max-w-7xl mx-auto">

          {/* Logo */}
          <div
            className="font-display text-2xl sm:text-3xl md:text-4xl text-primary font-bold italic tracking-tight cursor-pointer"
            onClick={() => setView('landing')}
          >
            AstroSutra AI
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navBtn('Home', 'landing')}
            <a
              href="#features"
              onClick={(e) => {
                if (view !== 'landing') {
                  e.preventDefault()
                  setView('landing')
                  setTimeout(
                    () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }),
                    100
                  )
                }
              }}
              className="text-on-surface-variant font-medium hover:text-primary transition-colors text-xs tracking-[0.15em] uppercase"
            >
              Features
            </a>
            <a
              href="#testimonials"
              onClick={(e) => {
                if (view !== 'landing') {
                  e.preventDefault()
                  setView('landing')
                  setTimeout(
                    () => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }),
                    100
                  )
                }
              }}
              className="text-on-surface-variant font-medium hover:text-primary transition-colors text-xs tracking-[0.15em] uppercase"
            >
              Testimonials
            </a>
            {navBtn('Pricing', 'pricing')}
            {navBtn('Contact', 'contact')}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onSignIn}
              className="text-primary border border-primary/40 hover:bg-primary-fixed/30 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all cursor-pointer bg-transparent"
            >
              Sign In
            </button>
            <button
              onClick={onSignIn}
              className="bg-primary text-white px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-wider uppercase hover:bg-primary-container transition-all cursor-pointer shadow-md"
              style={{ boxShadow: '2px 2px 0px rgba(137, 115, 101, 0.1)' }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════ PAGE CONTENT ══════════════ */}
      <main className="flex-grow">{children}</main>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="w-full py-10 sm:py-16 bg-surface-variant/40 border-t border-outline-variant">
        <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 md:px-10 gap-6 sm:gap-8 max-w-7xl mx-auto">

          {/* Brand + ISS */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div
              className="font-display text-2xl sm:text-3xl text-primary font-bold italic tracking-tight cursor-pointer"
              onClick={() => setView('landing')}
            >
              AstroSutra AI
            </div>
            <p className="text-[11px] sm:text-xs tracking-[0.12em] uppercase text-on-surface-variant">
              © 2026 AstroSutra AI. All Rights Reserved. Supported by{' '}
              <a
                href="https://manasai.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-bold"
              >
                manasai.tech
              </a>
            </p>
            <div className="mt-3 flex items-center gap-3 bg-primary-fixed/40 p-3 rounded-2xl border border-outline-variant/60 max-w-md">
              <img
                src="https://issdelhi.org/wp-content/uploads/2025/04/ISS-LOGO-White-2048x1974.webp"
                alt="ISS Delhi Logo"
                className="w-11 h-11 object-contain bg-[#1F2937] p-1 rounded-xl shrink-0 border border-white/10"
              />
              <div className="text-left">
                <p className="text-[10px] font-bold text-primary tracking-wide uppercase">In Collaboration With</p>
                <p className="text-[10px] text-on-surface-variant leading-relaxed font-medium">
                  <strong>ISS</strong> (Institute for Science and Spirituality Trust)<br />
                  An IKS Research Centre recognised by the IKS Division,<br />
                  Ministry of Education, Govt of India
                </p>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-5 sm:gap-8">
            <button
              onClick={() => setView('privacy')}
              className="text-on-surface-variant hover:text-primary transition-colors text-[11px] sm:text-xs tracking-[0.12em] uppercase cursor-pointer bg-transparent border-none font-sans"
            >
              Privacy
            </button>
            <button
              onClick={() => setView('terms')}
              className="text-on-surface-variant hover:text-primary transition-colors text-[11px] sm:text-xs tracking-[0.12em] uppercase cursor-pointer bg-transparent border-none font-sans"
            >
              Terms
            </button>
            <button
              onClick={() => setView('landing')}
              className="text-on-surface-variant hover:text-primary transition-colors text-[11px] sm:text-xs tracking-[0.12em] uppercase cursor-pointer bg-transparent border-none font-sans"
            >
              Home
            </button>
            <button
              onClick={() => setView('pricing')}
              className="text-on-surface-variant hover:text-primary transition-colors text-[11px] sm:text-xs tracking-[0.12em] uppercase cursor-pointer bg-transparent border-none font-sans"
            >
              Pricing
            </button>
            <button
              onClick={() => setView('contact')}
              className="text-on-surface-variant hover:text-primary transition-colors text-[11px] sm:text-xs tracking-[0.12em] uppercase cursor-pointer bg-transparent border-none font-sans"
            >
              Contact
            </button>
          </div>

          {/* Social icons */}
          <div className="flex gap-4 sm:gap-6">
            <button className="w-9 h-9 sm:w-10 sm:h-10 border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer">
              <span className="material-symbols-outlined text-sm">public</span>
            </button>
            <button className="w-9 h-9 sm:w-10 sm:h-10 border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer">
              <span className="material-symbols-outlined text-sm">mail</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main app router
// ─────────────────────────────────────────────
function AppContent() {
  const { user, loading } = useAuth()

  const [view, setView] = useState<AppView>(() => {
    const saved = sessionStorage.getItem('last_view') as AppView | null
    return saved === 'app' ? 'app' : 'landing'
  })

  const [hasClickedSign, setHasClickedSign] = useState(() => {
    return sessionStorage.getItem('last_view') === 'app'
  })

  useEffect(() => {
    sessionStorage.setItem('last_view', view)
  }, [view])

  useEffect(() => {
    if (hasClickedSign && !loading) {
      if (user) {
        setView('app')
      } else {
        if (view === 'app') {
          setView('landing')
          setHasClickedSign(false)
        } else {
          setView('login')
        }
      }
    }
  }, [hasClickedSign, loading, user, view])

  useEffect(() => {
    if (!user && view === 'app') {
      setView('landing')
      setHasClickedSign(false)
    }
  }, [user, view])

  // Loading spinner (auth in progress)
  if (hasClickedSign && loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin shadow-md" />
        <p className="text-sm font-semibold text-on-surface-variant animate-pulse">
          Connecting to AstroSutra AI...
        </p>
      </div>
    )
  }

  // Authenticated dashboard
  if (view === 'app' && user) return <ChatPage />

  // Login overlay
  if (view === 'login') {
    return (
      <LoginPage
        onClose={() => { setView('landing'); setHasClickedSign(false) }}
        onSuccess={() => setView('app')}
      />
    )
  }

  // Public pages — all share the persistent layout
  return (
    <PublicLayout view={view} setView={setView} onSignIn={() => setHasClickedSign(true)}>
      {view === 'landing' && (
        <LandingPage
          onGetStarted={() => setHasClickedSign(true)}
        />
      )}
      {view === 'pricing' && (
        <PricingPage
          onNavigateBack={() => setView('landing')}
          onContact={() => setView('contact')}
          onSignIn={() => setHasClickedSign(true)}
        />
      )}
      {view === 'contact' && (
        <ContactPage
          onNavigateBack={() => setView('landing')}
          onSignIn={() => setHasClickedSign(true)}
          onPricing={() => setView('pricing')}
          apiBaseUrl={API_BASE_URL}
        />
      )}
      {view === 'privacy' && (
        <PrivacyPage onNavigateBack={() => setView('landing')} />
      )}
      {view === 'terms' && (
        <TermsPage onNavigateBack={() => setView('landing')} />
      )}
    </PublicLayout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
