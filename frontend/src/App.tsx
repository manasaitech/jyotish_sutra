import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import PricingPage from './pages/PricingPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import { AuthProvider, useAuth } from './context/AuthContext'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://kundli-gpt-clone-back.onrender.com')

// ─────────────────────────────────────────────
// Auth guard — redirects unauthenticated users to /login
// ─────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin shadow-md" />
        <p className="text-sm font-semibold text-on-surface-variant animate-pulse">
          Connecting to AstroSutra AI...
        </p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─────────────────────────────────────────────
import Footer from './components/layout/Footer'
import ExpertConsultationModal from './components/expert/ExpertConsultationModal'

// ─────────────────────────────────────────────
// Persistent public layout — shared header + footer
// ─────────────────────────────────────────────
function PublicLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false)

  // Scroll to top whenever the route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  const navLink = (label: string, to: string) => (
    <Link
      to={to}
      className={`font-medium hover:text-primary transition-colors text-xs tracking-[0.15em] uppercase ${
        location.pathname === to ? 'text-primary font-bold' : 'text-on-surface-variant'
      }`}
    >
      {label}
    </Link>
  )

  const handleSignIn = () => navigate('/login')
  const handleGoDashboard = () => navigate('/app')
  const handleSignOut = async () => {
    try {
      await logout()
      navigate('/')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

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
          <Link
            to={user ? '/app' : '/'}
            className="font-display text-2xl sm:text-3xl md:text-4xl text-primary font-bold italic tracking-tight cursor-pointer no-underline"
          >
            AstroSutra AI
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLink('Home', '/')}
            {user && navLink('Dashboard', '/app')}
            <a
              href="#features"
              onClick={(e) => {
                if (location.pathname !== '/') {
                  e.preventDefault()
                  navigate('/')
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
                if (location.pathname !== '/') {
                  e.preventDefault()
                  navigate('/')
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
            {navLink('Pricing', '/pricing')}
            {navLink('Contact', '/contact')}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Talk to Expert Button */}
            <button
              onClick={() => setIsExpertModalOpen(true)}
              className="flex items-center gap-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs tracking-wider uppercase shadow-md transition-all cursor-pointer border border-amber-300 shrink-0"
            >
              <span className="material-symbols-outlined text-sm sm:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                support_agent
              </span>
              <span className="hidden sm:inline">Talk to Expert</span>
              <span className="sm:hidden">Expert</span>
            </button>

            {user ? (
              <>
                <button
                  onClick={handleGoDashboard}
                  className="bg-primary text-white px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-wider uppercase hover:bg-primary-container transition-all cursor-pointer shadow-md flex items-center gap-1.5 rounded-xl"
                >
                  <span className="material-symbols-outlined text-sm sm:text-base">dashboard</span>
                  <span>Go to Dashboard</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-on-surface-variant hover:text-rose-600 border border-outline-variant hover:border-rose-300 px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium tracking-wider uppercase transition-all cursor-pointer bg-transparent rounded-xl"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="text-primary border border-primary/40 hover:bg-primary-fixed/30 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all cursor-pointer bg-transparent"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignIn}
                  className="bg-primary text-white px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-wider uppercase hover:bg-primary-container transition-all cursor-pointer shadow-md"
                  style={{ boxShadow: '2px 2px 0px rgba(137, 115, 101, 0.1)' }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Expert Consultation Modal */}
      <ExpertConsultationModal
        isOpen={isExpertModalOpen}
        onClose={() => setIsExpertModalOpen(false)}
      />

      {/* ══════════════ PAGE CONTENT ══════════════ */}
      <main className="flex-grow">{children}</main>

      {/* ══════════════ FOOTER ══════════════ */}
      <Footer />
    </div>
  )
}

// ─────────────────────────────────────────────
// Main app router
// ─────────────────────────────────────────────
function AppRoutes() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // After login, if on /login page, redirect to /app
  useEffect(() => {
    if (!loading && user && location.pathname === '/login') {
      navigate('/app', { replace: true })
    }
  }, [user, loading, location.pathname, navigate])

  // If user logs out while on /app, redirect to landing
  useEffect(() => {
    if (!loading && !user && location.pathname === '/app') {
      navigate('/', { replace: true })
    }
  }, [user, loading, location.pathname, navigate])

  // Auth loading spinner for /app and /login
  if (loading && (location.pathname === '/app' || location.pathname === '/login')) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin shadow-md" />
        <p className="text-sm font-semibold text-on-surface-variant animate-pulse">
          Connecting to AstroSutra AI...
        </p>
      </div>
    )
  }

  return (
    <Routes>
      {/* Authenticated dashboard — no public layout */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      {/* Login page — standalone, no public layout */}
      <Route
        path="/login"
        element={
          <LoginPage
            onClose={() => navigate('/')}
            onSuccess={() => navigate('/app')}
          />
        }
      />

      {/* Public pages — all share the PublicLayout (nav + footer) */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <LandingPage onGetStarted={() => navigate('/login')} />
          </PublicLayout>
        }
      />
      <Route
        path="/pricing"
        element={
          <PublicLayout>
            <PricingPage onNavigateBack={() => navigate('/')} />
          </PublicLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <PublicLayout>
            <ContactPage onNavigateBack={() => navigate('/')} apiBaseUrl={API_BASE_URL} />
          </PublicLayout>
        }
      />
      <Route
        path="/privacy"
        element={
          <PublicLayout>
            <PrivacyPage onNavigateBack={() => navigate('/')} />
          </PublicLayout>
        }
      />
      <Route
        path="/terms"
        element={
          <PublicLayout>
            <TermsPage onNavigateBack={() => navigate('/')} />
          </PublicLayout>
        }
      />

      {/* Catch-all: redirect unknown routes to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
