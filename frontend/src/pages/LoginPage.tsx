import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface LoginPageProps {
  onSuccess?: () => void
  onClose?: () => void
}

export default function LoginPage({ onSuccess, onClose }: LoginPageProps) {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, user } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      await loginWithGoogle()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Google login error:', err)
      let msg = err.message || 'Google sign-in failed. Please try again.'
      if (msg.includes('auth/api-key-not-valid') || msg.includes('api-key-not-valid')) {
        msg = 'Firebase configuration missing on host. Please add VITE_FIREBASE_* environment variables in your Render Dashboard.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (mode === 'login') {
        await loginWithEmail(email, password)
      } else {
        if (!name) {
          setError('Please enter your full name.')
          setLoading(false)
          return
        }
        await registerWithEmail(name, email, password)
      }

      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Auth error:', err)
      let msg = err.message || 'Authentication failed'
      if (msg.includes('auth/api-key-not-valid') || msg.includes('api-key-not-valid')) {
        msg = 'Firebase configuration missing on host. Please add VITE_FIREBASE_* environment variables in your Render Dashboard.'
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password.'
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email already exists.'
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password should be at least 6 characters.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-6 py-6 relative overflow-x-hidden font-sans">
      {/* BACKGROUND CELESTIAL BLURS */}
      <div className="absolute top-10 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* LOGIN CARD */}
      <div className="w-full max-w-md bg-surface/95 sm:backdrop-blur-xl border border-outline-variant/60 rounded-3xl p-5 sm:p-8 shadow-xl relative z-10 space-y-5 sm:space-y-6 mx-auto my-auto">
        
        {/* CLOSE BUTTON (IF MODAL) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant/40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}

        {/* LOGO & HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain rounded-xs" />
            AstroSutra AI Auth
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-on-surface font-serif leading-tight">
            {mode === 'login' ? 'Welcome Back' : 'Begin Your Cosmic Journey'}
          </h2>
          <p className="text-xs sm:text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
            {mode === 'login'
              ? 'Access your personalized horoscopes, Dasha timelines, & saved profiles.'
              : 'Create an account to unlock lifelong Vedic predictions & AI guidance.'}
          </p>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="p-3 sm:p-3.5 bg-error-container/20 border border-error/30 text-error rounded-2xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* ALREADY LOGGED IN STATE */}
        {user ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary text-2xl font-bold">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full rounded-full object-cover" />
              ) : (
                user.displayName?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="text-base font-bold text-on-surface">{user.displayName}</div>
              <div className="text-xs text-on-surface-variant truncate max-w-xs mx-auto">{user.email}</div>
            </div>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-bold rounded-xl">
              ✓ Logged in & Authenticated
            </div>
            {onSuccess && (
              <button
                onClick={onSuccess}
                className="w-full py-3.5 sm:py-3 min-h-[48px] bg-primary text-white font-bold text-base sm:text-sm rounded-2xl hover:bg-primary/90 transition-colors shadow-md cursor-pointer"
              >
                Continue to Dashboard
              </button>
            )}
          </div>
        ) : (
          <>
            {/* GOOGLE LOGIN BUTTON */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 sm:py-3 px-4 min-h-[48px] bg-surface border border-outline-variant/80 hover:border-primary/50 text-on-surface font-semibold text-base sm:text-sm rounded-2xl transition-all shadow-2xs hover:shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* DIVIDER */}
            <div className="flex items-center gap-3 my-1 sm:my-2">
              <div className="h-[1px] bg-outline-variant/60 flex-1" />
              <span className="text-[11px] sm:text-xs text-on-surface-variant/70 uppercase tracking-wider font-semibold">Or with Email</span>
              <div className="h-[1px] bg-outline-variant/60 flex-1" />
            </div>

            {/* TAB SELECTOR: LOGIN / REGISTER */}
            <div className="flex bg-surface-variant/30 p-1 rounded-2xl border border-outline-variant/40">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-surface text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setError(null)
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-surface text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Anmol Dixit"
                    className="w-full px-4 py-3 sm:py-2.5 bg-surface-variant/20 border border-outline-variant/60 rounded-xl text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 sm:py-2.5 bg-surface-variant/20 border border-outline-variant/60 rounded-xl text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 sm:py-2.5 bg-surface-variant/20 border border-outline-variant/60 rounded-xl text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 sm:py-3 min-h-[48px] bg-primary text-white font-bold text-base sm:text-sm rounded-2xl hover:bg-primary/90 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{mode === 'login' ? 'Sign In to Account' : 'Register Account'}</span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
