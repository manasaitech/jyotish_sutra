import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import PricingPage from './pages/PricingPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import { AuthProvider, useAuth } from './context/AuthContext'
import RedeemPage from './pages/RedeemPage'
import AdminCampaignsPage from './pages/AdminCampaignsPage'
import RedeemMonitorDemoPage from './pages/RedeemMonitorDemoPage'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://kundli-gpt-clone-back.onrender.com')

import AstroLoader from './components/layout/AstroLoader'
import NotFoundPage from './pages/NotFoundPage'

// ─────────────────────────────────────────────
// Auth guard — redirects unauthenticated users to /login
// ─────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <AstroLoader message="Connecting to AstroSutra AI..." />
  }

  if (!user) return <NotFoundPage />
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
      className={`font-semibold hover:text-primary transition-colors text-[10px] xl:text-xs tracking-[0.12em] xl:tracking-[0.15em] uppercase ${
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
        backgroundColor: 'var(--color-background)',
      }}
    >
      {/* ══════════════ TOP NAVIGATION BAR ══════════════ */}
      <nav className="sticky top-0 w-full z-50 backdrop-blur-md border-b border-outline-variant/60 bg-background/90">
        <div className="flex justify-between items-center px-2.5 sm:px-6 md:px-10 py-2.5 sm:py-3.5 max-w-7xl mx-auto">

          {/* Logo */}
          <Link
            to={user ? '/app' : '/'}
            className="flex items-center gap-2 font-display text-base sm:text-xl md:text-2xl text-primary font-bold italic tracking-tight cursor-pointer no-underline whitespace-nowrap shrink-0 mr-1 sm:mr-0"
          >
            <img src="/logo.png" alt="AstroSutra AI Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-xl shrink-0 animate-fade-in" />
            <span>AstroSutra AI</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-6 shrink-0">
            {navLink('Home', '/')}
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
              className="text-on-surface-variant font-semibold hover:text-primary transition-colors text-[11px] xl:text-xs tracking-[0.12em] xl:tracking-[0.15em] uppercase"
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
              className="text-on-surface-variant font-semibold hover:text-primary transition-colors text-[11px] xl:text-xs tracking-[0.12em] xl:tracking-[0.15em] uppercase"
            >
              Testimonials
            </a>
            {navLink('Pricing', '/pricing')}
            {navLink('Contact', '/contact')}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-1.5 lg:gap-2.5 shrink-0">
            {/* Talk to Expert Button */}
            <button
              onClick={() => setIsExpertModalOpen(true)}
              className="flex items-center justify-center gap-1 px-2.5 lg:px-3.5 py-1.5 lg:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] lg:text-xs tracking-wider uppercase shadow-md transition-all cursor-pointer border border-amber-300 shrink-0"
              title="Talk to Expert"
            >
              <span className="material-symbols-outlined text-sm sm:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                support_agent
              </span>
              <span className="hidden sm:inline">Talk to Expert</span>
            </button>

            {user ? (
              <>
                {user.email === 'anmol dixit091@gmail.com' && (
                  <button
                    onClick={() => navigate('/admin/campaigns')}
                    className="text-amber-600 border border-amber-500/40 hover:bg-amber-500/10 px-2.5 lg:px-4 py-1.5 lg:py-2.5 text-[11px] lg:text-xs font-extrabold tracking-wider uppercase transition-all cursor-pointer rounded-xl whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base">settings_suggest</span>
                    <span>Admin</span>
                  </button>
                )}
                <button
                  onClick={handleGoDashboard}
                  className="bg-primary text-white px-2.5 lg:px-4 py-1.5 lg:py-2.5 text-[11px] lg:text-xs font-semibold tracking-wider uppercase hover:bg-primary-container transition-all cursor-pointer shadow-md flex items-center gap-1.5 rounded-xl whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-sm sm:text-base hidden xs:inline">dashboard</span>
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-on-surface-variant hover:text-rose-600 border border-outline-variant hover:border-rose-300 px-2 lg:px-3 py-1.5 lg:py-2.5 text-[11px] lg:text-xs font-medium tracking-wider uppercase transition-all cursor-pointer bg-transparent rounded-xl whitespace-nowrap"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="text-primary border border-primary/45 hover:bg-primary-fixed/30 px-2.5 lg:px-4 py-1.5 lg:py-2.5 text-[11px] lg:text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer bg-transparent rounded-xl whitespace-nowrap"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignIn}
                  className="bg-primary text-white px-3 lg:px-5 py-1.5 lg:py-2.5 text-[11px] lg:text-xs font-semibold tracking-wider uppercase hover:bg-primary-container transition-all cursor-pointer shadow-md rounded-xl whitespace-nowrap"
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

  // After login, if on /login page, redirect to /app or custom redirect
  useEffect(() => {
    if (!loading && user && location.pathname === '/login') {
      const searchParams = new URLSearchParams(location.search)
      const redirect = searchParams.get('redirect') || '/app'
      navigate(redirect, { replace: true })
    }
  }, [user, loading, location.pathname, navigate, location.search])

  // Auth loading spinner for /app and /login
  if (loading && (location.pathname === '/app' || location.pathname === '/login')) {
    return <AstroLoader message="Connecting to AstroSutra AI..." />
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
            onSuccess={() => {
              const searchParams = new URLSearchParams(location.search)
              const redirect = searchParams.get('redirect') || '/app'
              navigate(redirect, { replace: true })
            }}
          />
        }
      />

      {/* Campaign Access & Administration */}
      <Route path="/redeem/:token" element={<RedeemPage />} />
      <Route path="/qnhr9152" element={<RedeemMonitorDemoPage />} />
      <Route
        path="/admin/campaigns"
        element={
          <ProtectedRoute>
            <AdminCampaignsPage />
          </ProtectedRoute>
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

      {/* Catch-all: show beautiful cosmic Not Found page */}
      <Route path="*" element={<NotFoundPage />} />
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
