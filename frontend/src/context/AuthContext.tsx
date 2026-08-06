import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase/firebase'
import { setCurrentTier } from '../utils/subscriptionManager'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  token: string | null
}

interface AuthContextType {
  user: AuthUser | null
  firebaseUser: User | null
  loading: boolean
  token: string | null
  loginWithGoogle: () => Promise<AuthUser>
  loginWithEmail: (email: string, pass: string) => Promise<AuthUser>
  registerWithEmail: (name: string, email: string, pass: string) => Promise<AuthUser>
  logout: () => Promise<void>
  getIdToken: () => Promise<string | null>
  updateAccountProfile: (name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cache to deduplicate concurrent verification requests for the same token
const syncCache: Record<string, Promise<any> | undefined> = {}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [showDowngradeModal, setShowDowngradeModal] = useState<boolean>(false)
  const [expiresAtStr, setExpiresAtStr] = useState<string | null>(null)

  const syncWithPostgreSQL = async (idToken: string): Promise<any> => {
    if (syncCache[idToken]) {
      return syncCache[idToken]
    }

    const promise = (async () => {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL ||
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:8000'
          : 'https://kundli-gpt-clone-back.onrender.com')
      const res = await fetch(`${backendUrl}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const errMsg = errJson.detail || res.statusText || 'Unknown error'
        throw new Error(`Database synchronization failed: ${errMsg}`)
      }
      return res.json()
    })()

    syncCache[idToken] = promise

    try {
      return await promise
    } finally {
      // Evict from cache after a short window to allow fresh synchronization if needed later
      setTimeout(() => {
        delete syncCache[idToken]
      }, 5000)
    }
  }

  const mapUser = async (user: User | null): Promise<AuthUser | null> => {
    if (!user) return null
    const idToken = await user.getIdToken()
    
    try {
      const syncResult = await syncWithPostgreSQL(idToken)
      if (syncResult && syncResult.db_user && syncResult.db_user.subscription_tier) {
        const dbUser = syncResult.db_user
        setCurrentTier(dbUser.subscription_tier)
        
        // Handle Downgrade Detection on Load / Refresh
        const hadProTrial = localStorage.getItem('astro_had_pro_trial')
        if (dbUser.subscription_tier === 'free' && hadProTrial === 'true') {
          localStorage.setItem('astro_had_pro_trial', 'shown')
          setShowDowngradeModal(true)
        }
        
        if (dbUser.subscription_expires_at) {
          setExpiresAtStr(dbUser.subscription_expires_at)
        } else {
          setExpiresAtStr(null)
        }
      }
      localStorage.setItem('astro_is_logged_in', 'true')
    } catch (err: any) {
      console.error('PostgreSQL authentication sync failed:', err)
      localStorage.removeItem('astro_is_logged_in')
      await signOut(auth)
      throw err
    }

    setToken(idToken)
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Seeker',
      photoURL: user.photoURL,
      token: idToken,
    }
  }

  useEffect(() => {
    if (!expiresAtStr) return

    const expiryTime = new Date(expiresAtStr).getTime()
    const checkExpiry = () => {
      const now = new Date().getTime()
      if (now >= expiryTime) {
        // Expiration reached! Downgrade to Free.
        setCurrentTier('free')
        setExpiresAtStr(null)
        
        const hadProTrial = localStorage.getItem('astro_had_pro_trial')
        if (hadProTrial === 'true') {
          localStorage.setItem('astro_had_pro_trial', 'shown')
          setShowDowngradeModal(true)
        }
      }
    }

    checkExpiry()
    const intervalId = setInterval(checkExpiry, 5000)
    return () => clearInterval(intervalId)
  }, [expiresAtStr])

  useEffect(() => {
    let unsubscribed = false
    let unsubscribe = () => {}

    // Safety timeout: Never keep the app on a loading screen for more than 2 seconds for unauthenticated users
    const timeoutId = setTimeout(() => {
      const hasSession = localStorage.getItem('astro_is_logged_in') === 'true'
      if (!unsubscribed && !hasSession) {
        setLoading(false)
      }
    }, 2000)

    // Safety timeout for logged-in users (slow network / cold backend): 30 seconds
    const sessionTimeoutId = setTimeout(() => {
      const hasSession = localStorage.getItem('astro_is_logged_in') === 'true'
      if (!unsubscribed && hasSession) {
        console.warn('Session restore timed out')
        localStorage.removeItem('astro_is_logged_in')
        setLoading(false)
      }
    }, 30000)

    try {
      if (auth && typeof auth === 'object') {
        unsubscribe = onAuthStateChanged(
          auth,
          async (currUser) => {
            clearTimeout(timeoutId)
            clearTimeout(sessionTimeoutId)
            setFirebaseUser(currUser)
            if (currUser) {
              try {
                const mapped = await mapUser(currUser)
                setAuthUser(mapped)
              } catch (e) {
                console.warn('User mapping warning:', e)
              }
            } else {
              setAuthUser(null)
              setToken(null)
              localStorage.removeItem('astro_is_logged_in')
            }
            setLoading(false)
          },
          (err) => {
            console.error('Auth state error:', err)
            clearTimeout(timeoutId)
            clearTimeout(sessionTimeoutId)
            localStorage.removeItem('astro_is_logged_in')
            setLoading(false)
          }
        )
      } else {
        clearTimeout(timeoutId)
        clearTimeout(sessionTimeoutId)
        setLoading(false)
      }
    } catch (e) {
      console.error('onAuthStateChanged init error:', e)
      clearTimeout(timeoutId)
      clearTimeout(sessionTimeoutId)
      setLoading(false)
    }

    return () => {
      unsubscribed = true
      clearTimeout(timeoutId)
      clearTimeout(sessionTimeoutId)
      unsubscribe()
    }
  }, [])

  const loginWithGoogle = async (): Promise<AuthUser> => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const mapped = await mapUser(result.user)
    if (!mapped) throw new Error('Failed to extract user from Google login')
    setAuthUser(mapped)
    return mapped
  }

  const loginWithEmail = async (email: string, pass: string): Promise<AuthUser> => {
    const result = await signInWithEmailAndPassword(auth, email, pass)
    const mapped = await mapUser(result.user)
    if (!mapped) throw new Error('Failed to extract user from Email login')
    setAuthUser(mapped)
    return mapped
  }

  const registerWithEmail = async (name: string, email: string, pass: string): Promise<AuthUser> => {
    const result = await createUserWithEmailAndPassword(auth, email, pass)
    if (name && result.user) {
      await updateProfile(result.user, { displayName: name })
    }
    const mapped = await mapUser(result.user)
    if (!mapped) throw new Error('Failed to register user')
    setAuthUser(mapped)
    return mapped
  }

  const logout = async (): Promise<void> => {
    await signOut(auth)
    setAuthUser(null)
    setToken(null)
    localStorage.removeItem('astro_is_logged_in')
  }

  const getIdToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null
    const freshToken = await auth.currentUser.getIdToken(true)
    setToken(freshToken)
    return freshToken
  }

  const updateAccountProfile = async (name: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('No authenticated user')
    await updateProfile(auth.currentUser, { displayName: name })
    
    // Force token refresh to propagate details to local state
    await auth.currentUser.getIdToken(true)
    const mapped = await mapUser(auth.currentUser)
    if (mapped) {
      setAuthUser(mapped)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: authUser,
        firebaseUser,
        loading,
        token,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        getIdToken,
        updateAccountProfile,
      }}
    >
      {children}
      
      {showDowngradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-2xl relative text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined text-3xl">info</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-serif text-on-surface">Your Pro trial has ended</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Thank you for exploring AstroSutra AI. Upgrade anytime to continue using Premium features.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDowngradeModal(false)
                }}
                className="flex-1 py-3 border border-outline-variant hover:bg-surface-variant/30 text-on-surface rounded-xl font-semibold text-xs transition-all cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setShowDowngradeModal(false)
                  window.location.href = '/pricing'
                }}
                className="flex-1 py-3 bg-primary hover:bg-primary-container text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
