import { useState, useEffect } from 'react'
import Navbar from '../components/layout/Navbar'
import BirthDetailsForm, { type BirthData } from '../components/chat/BirthDetailsForm'
import ComputingCard from '../components/chat/ComputingCard'

import AssistantMessage from '../components/chat/AssistantMessage'
import DashboardPage from './DashboardPage'
import PricingPage from './PricingPage'
import ProfilePage from './ProfilePage'

import type { UserProfile } from '../types/profile'
import {
  getSavedProfiles,
  getActiveProfileId,
  setActiveProfileId,
  saveProfile,
  deleteProfile,
} from '../utils/profileManager'
import { useAuth } from '../context/AuthContext'
import { authenticatedFetch } from '../utils/apiClient'

type ChatStep = 'loading' | 'welcome' | 'birthplace' | 'computing' | 'ready'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://kundli-gpt-clone-back.onrender.com')


export default function ChatPage() {
  const { user } = useAuth()
  const [sessionId] = useState(() => Math.random().toString(36).substring(7))
  const [step, setStep] = useState<ChatStep>('loading')
  const [showPricing, setShowPricing] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Multi-profile state
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editProfileId, setEditProfileId] = useState<string | null>(null)

  // Current active profile's chart and birth data
  const [birthData, setBirthData] = useState<BirthData | null>(null)
  const [chartData, setChartData] = useState<any>(null)

  // -----------------------------------------------------------------------
  // On Mount & User Change — Load saved profiles / hydrate from backend for active User
  // -----------------------------------------------------------------------
  useEffect(() => {
    const saved = getSavedProfiles()
    const savedActiveId = getActiveProfileId()

    setProfiles(saved)

    if (user?.uid) {
      // Check if we have an active local profile (either matching user.uid or a guest profile)
      const localProfile = saved.find((p) => p.id === user.uid)
      const guestProfile = saved.find((p) => p.id === savedActiveId || p.id.startsWith('prof_'))
      const activeLocal = localProfile || guestProfile

      if (activeLocal && activeLocal.chartData) {
        setActiveId(activeLocal.id)
        setActiveProfileId(activeLocal.id)
        const normalizedLocalBirth = activeLocal.birthData ? {
          ...activeLocal.birthData,
          fullName: activeLocal.birthData.fullName || (activeLocal.birthData as any).name || activeLocal.name || user?.displayName || 'Seeker'
        } : null
        setBirthData(normalizedLocalBirth)
        setChartData(activeLocal.chartData)
        setStep('ready')
      }

      // 1. Authenticated User flow: Always prioritize checking database profile
      authenticatedFetch(`${API_BASE_URL}/api/profile/${user.uid}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.exists && (data.chart_summary || data.natal_chart)) {
            const chart = data.chart_summary || data.natal_chart
            const nameFromBackend = data.birth_details?.fullName || data.birth_details?.name || user.displayName || 'Seeker'
            const normalizedBirthData = data.birth_details ? {
              ...data.birth_details,
              fullName: nameFromBackend
            } : null

            const restoredProfile: UserProfile = {
              id: user.uid,
              name: nameFromBackend,
              relationship: 'Self',
              birthData: normalizedBirthData,
              chartData: chart,
              computed: data.computed,
              createdAt: new Date().toISOString(),
            }
            
            // Clean up the guest profile to avoid duplicates in localStorage
            if (activeLocal && activeLocal.id && activeLocal.id !== user.uid) {
              deleteProfile(activeLocal.id)
            }
            saveProfile(restoredProfile)
            
            // Keep local profiles updated with the resolved database profile
            const updatedSaved = getSavedProfiles()
            setProfiles(updatedSaved)

            setActiveId(user.uid)
            setActiveProfileId(user.uid)
            setChartData(chart)
            setBirthData(normalizedBirthData)
            setStep('ready')
          } else {
            // New user, or database details are missing -> check if we have a local profile to sync
            if (activeLocal && activeLocal.birthData) {
              console.log("Migrating and syncing local profile to database for authenticated user:", user.uid)
              if (activeLocal.id && activeLocal.id !== user.uid) {
                deleteProfile(activeLocal.id)
              }
              handleBirthSubmit(activeLocal.birthData, user.uid)
            } else {
              setStep('welcome')
            }
          }
        })
        .catch((err) => {
          console.error("Failed to fetch database profile, falling back to local profile:", err)
          if (activeLocal && activeLocal.chartData) {
            setStep('ready')
          } else {
            setStep('welcome')
          }
        })
    } else {
      // 2. Anonymous/Guest User flow: Use localStorage
      if (saved.length > 0) {
        const active = saved.find((p) => p.id === savedActiveId) || saved[0]
        setActiveId(active.id)
        setActiveProfileId(active.id)
        setBirthData(active.birthData || null)

        if (active.chartData && active.chartData.ascendant_sign) {
          setChartData(active.chartData)
          setStep('ready')
        } else if (active.id) {
          // Fallback check profile store for active id
          authenticatedFetch(`${API_BASE_URL}/api/profile/${active.id}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data && data.exists && data.chart_summary) {
                setChartData(data.chart_summary)
                setStep('ready')
              } else if (active.birthData) {
                handleBirthSubmit(active.birthData, active.id)
              } else {
                setStep('welcome')
              }
            })
            .catch(() => setStep('welcome'))
        } else {
          setStep('ready')
        }
      } else {
        setStep('welcome')
      }
    }
  }, [user?.uid])

  // -----------------------------------------------------------------------
  // Switch active profile
  // -----------------------------------------------------------------------
  const handleSelectProfile = (profileId: string) => {
    const selected = profiles.find((p) => p.id === profileId)
    if (!selected) return

    setActiveId(selected.id)
    setActiveProfileId(selected.id)
    const normalizedSelectedBirth = selected.birthData ? {
      ...selected.birthData,
      fullName: selected.birthData.fullName || (selected.birthData as any).name || selected.name || user?.displayName || 'Seeker'
    } : null
    setBirthData(normalizedSelectedBirth)

    if (selected.chartData && selected.chartData.ascendant_sign) {
      setChartData(selected.chartData)
      setStep('ready')
    } else {
      if (selected.birthData) handleBirthSubmit(selected.birthData, selected.id)
    }
  }

  // -----------------------------------------------------------------------
  // Add new profile (triggers welcome form)
  // -----------------------------------------------------------------------
  const handleAddNewProfile = () => {
    setActiveId(null)
    setEditProfileId(null)
    setBirthData(null)
    setChartData(null)
    setStep('welcome')
  }

  // -----------------------------------------------------------------------
  // Delete profile
  // -----------------------------------------------------------------------
  const handleDeleteProfile = (profileId: string) => {
    const updated = deleteProfile(profileId)
    setProfiles(updated)

    if (updated.length === 0) {
      setActiveId(null)
      setBirthData(null)
      setChartData(null)
      setStep('welcome')
    } else if (activeId === profileId) {
      handleSelectProfile(updated[0].id)
    }
  }

  // -----------------------------------------------------------------------
  // Form submission -> Calculate Kundli chart & save user profile
  // -----------------------------------------------------------------------
  const handleBirthSubmit = async (data: BirthData, targetProfileId?: string) => {
    setBirthData(data)
    setStep('computing')

    const userProfileId = editProfileId || targetProfileId || 
      ((user?.uid && profiles.length === 0) ? user.uid : `prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`)

    try {
      let chart: any = null
      let resData: any = null

      if (editProfileId) {
        // Edit Mode: PUT /api/profile/{profile_id}
        const updatePayload = {
          name: data.fullName || user?.displayName || 'Seeker',
          date_of_birth: data.dateOfBirth,
          time_of_birth: data.timeOfBirth,
          latitude: data.latitude || 28.6139,
          longitude: data.longitude || 77.209,
          timezone_offset: data.timezone_offset || 5.5,
          gender: data.gender || 'male',
          relationship_type: data.relationship || 'Self'
        }

        const response = await authenticatedFetch(`${API_BASE_URL}/api/profile/${editProfileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        })

        if (!response.ok) {
          throw new Error('Failed to update profile')
        }

        resData = await response.json()
        chart = resData.natal || resData
      } else {
        // Create Mode: POST /api/chart
        const payload: any = {
          name: data.fullName || user?.displayName || 'Seeker',
          latitude: data.latitude || 28.6139,
          longitude: data.longitude || 77.209,
          session_id: sessionId,
          user_id: userProfileId,
          mode: data.mode || 'exact',
          time_slot: data.timeSlot || 'unknown',
          question: data.question || null,
          category: data.category || 'general',
        }

        if (data.dateOfBirth) payload.date_str = data.dateOfBirth
        if (data.timeOfBirth) payload.time_str = data.timeOfBirth

        const response = await authenticatedFetch(`${API_BASE_URL}/api/chart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Failed to calculate birth chart')
        }

        resData = await response.json()
        chart = resData.natal || resData
      }

      setBirthData(data)
      setChartData(chart)

      // Save to multi-profile storage linked to user account
      const newProfile: UserProfile = {
        id: userProfileId,
        name: data.fullName || user?.displayName || 'Seeker',
        relationship: data.relationship || 'Self',
        birthData: data,
        chartData: chart,
        computed: resData.computed || chart.computed,
        createdAt: new Date().toISOString(),
      }

      const updated = saveProfile(newProfile)
      setProfiles(updated)
      setActiveId(userProfileId)
      setActiveProfileId(userProfileId)
      setEditProfileId(null) // clear edit target!
      setStep('ready')
    } catch (err) {
      console.error('Error computing/updating chart:', err)
      alert('Failed to compute or update birth chart. Please check your network or backend server.')
      setStep('welcome')
    }
  }

  // -----------------------------------------------------------------------
  // Render Pricing Page if user clicked Pricing
  // -----------------------------------------------------------------------
  if (showPricing) {
    return <PricingPage onNavigateBack={() => setShowPricing(false)} />
  }

  // Render Profile Page if user clicked Profile
  // -----------------------------------------------------------------------
  if (showProfile) {
    return (
      <ProfilePage
        profiles={profiles}
        activeProfileId={activeId || undefined}
        onSelectProfile={(id) => {
          handleSelectProfile(id)
          setShowProfile(false)
        }}
        onAddNewProfile={() => {
          handleAddNewProfile()
          setShowProfile(false)
        }}
        onDeleteProfile={handleDeleteProfile}
        onOpenPricing={() => {
          setShowProfile(false)
          setShowPricing(true)
        }}
        onNavigateBack={() => setShowProfile(false)}
        onEditProfile={() => {
          setEditProfileId(activeId || user?.uid || null)
          setStep('welcome')
          setShowProfile(false)
        }}
      />
    )
  }

  // -----------------------------------------------------------------------
  // Render Dashboard Page if Chart Ready
  // -----------------------------------------------------------------------
  if (step === 'ready' && chartData && activeId) {
    return (
      <DashboardPage
        key={activeId}
        chartData={chartData}
        computed={chartData.computed}
        birthData={birthData}
        sessionId={sessionId}
        userId={activeId}
        apiBaseUrl={API_BASE_URL}
        profiles={profiles}
        activeProfileId={activeId}
        onOpenProfile={() => setShowProfile(true)}
        onOpenPricing={() => setShowPricing(true)}
        onResetProfile={() => {
          setEditProfileId(activeId)
          setStep('welcome')
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        profiles={profiles}
        activeProfileId={activeId || undefined}
        onOpenProfile={() => setShowProfile(true)}
        onOpenPricing={() => setShowPricing(true)}
      />

      <main className="relative z-10 max-w-[800px] mx-auto px-4 pt-12 pb-[180px]">
        <div className="space-y-6">
          {/* Loading State */}
          {step === 'loading' && (
            <AssistantMessage icon="hourglass_top">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                <span className="text-on-surface-variant ml-2">Checking saved horoscope profiles…</span>
              </div>
            </AssistantMessage>
          )}

          {/* Welcome Message */}
          {step !== 'loading' && (
            <AssistantMessage icon="star">
              {profiles.length > 0
                ? '🙏 Namaste! Add a new profile for a family member or friend to analyze their Vedic birth chart.'
                : '🙏 Namaste! Welcome to AstroSutra AI. I will calculate your personalized Vedic birth chart and store up to 5 profiles for you and your loved ones.'}
            </AssistantMessage>
          )}

          {/* Birth Details & Location Form (Single Page) */}
          {step === 'welcome' && (
            <BirthDetailsForm
              onSubmit={handleBirthSubmit}
              initialData={editProfileId ? (profiles.find(p => p.id === editProfileId)?.birthData || undefined) : undefined}
            />
          )}

          {/* Computing State */}
          {step === 'computing' && (
            <ComputingCard
              steps={[
                { label: 'Finding Sidereal Planetary Positions', status: 'active', progress: 45 },
                { label: 'Calculating Houses & Lagna', status: 'waiting' },
                { label: 'Computing Nakshatras & Yogas', status: 'waiting' },
              ]}
            />
          )}

        </div>
      </main>
    </div>
  )
}
