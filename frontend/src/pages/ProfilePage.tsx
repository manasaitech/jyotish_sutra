/**
 * ProfilePage — Full-page settings & profile management view for AstroSutra AI.
 * Replaces the old Navbar dropdown with a premium, feature-rich profile section.
 */
import { useState } from 'react'
import type { UserProfile } from '../types/profile'
import { useAuth } from '../context/AuthContext'
import { getCurrentTier } from '../utils/subscriptionManager'
import { TIER_CONFIG, getMaxProfilesForTier } from '../config/subscriptionConfig'
import { useTheme } from '../hooks/useTheme'

interface ProfilePageProps {
  profiles: UserProfile[]
  activeProfileId?: string
  onSelectProfile: (profileId: string) => void
  onAddNewProfile: () => void
  onDeleteProfile: (profileId: string) => void
  onOpenPricing: () => void
  onNavigateBack: () => void
  onEditProfileDetails: (profileId: string) => void
}

export default function ProfilePage({
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddNewProfile,
  onDeleteProfile,
  onOpenPricing,
  onNavigateBack,
  onEditProfileDetails,
}: ProfilePageProps) {
  const { user, logout, updateAccountProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  const handleSaveName = async () => {
    if (!editNameValue.trim()) return
    setIsSavingName(true)
    try {
      await updateAccountProfile(editNameValue.trim())
      setIsEditingName(false)
    } catch (error) {
      console.error("Failed to update profile name:", error)
      alert("Failed to update name. Please try again.")
    } finally {
      setIsSavingName(false)
    }
  }

  const currentTier = getCurrentTier()
  const tierConfig = TIER_CONFIG[currentTier]
  const maxProfiles = getMaxProfilesForTier(currentTier)


  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w.charAt(0))
      .slice(0, 1)
      .join('')
      .toUpperCase()
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <nav className="glass border-b border-outline-variant/50 min-h-[64px] py-3 sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-10">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="AstroSutra AI Logo" className="w-8 h-8 object-contain rounded-xl" />
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-primary">
            Profile & Settings
          </h1>
        </div>
        <div className="w-20" /> {/* Spacer for centering */}
      </nav>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ─── User Details Card ─── */}
        <section className="bg-surface border border-outline-variant/60 rounded-3xl p-6 shadow-xs animate-fade-in-up">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                {getInitials(user?.displayName || user?.email || 'U')}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Name (Editable) */}
              {isEditingName ? (
                <div className="flex items-center gap-1.5 max-w-full">
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    className="px-2 py-1 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none bg-surface text-on-surface w-full max-w-[200px]"
                    placeholder="Enter name"
                    autoFocus
                    disabled={isSavingName}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName || !editNameValue.trim()}
                    className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0"
                    title="Save name"
                  >
                    <span className="material-symbols-outlined text-sm block">check</span>
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    disabled={isSavingName}
                    className="p-1.5 bg-surface-variant text-on-surface-variant rounded-lg hover:bg-outline-variant transition-colors shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                    title="Cancel"
                  >
                    <span className="material-symbols-outlined text-sm block">close</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-on-surface truncate">
                    {user?.displayName || 'Seeker'}
                  </h2>
                  <button
                    onClick={() => {
                      setEditNameValue(user?.displayName || 'Seeker')
                      setIsEditingName(true)
                    }}
                    className="text-on-surface-variant/60 hover:text-primary transition-colors cursor-pointer flex items-center justify-center shrink-0 p-1 rounded-lg hover:bg-surface-variant/40"
                    title="Edit display name"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                </div>
              )}

              {/* Email */}
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">mail</span>
                <span className="text-sm truncate">{user?.email || 'Not available'}</span>
              </div>

              {/* Member Since */}
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <span className="text-xs">Member since {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Appearance / Theme Toggle ─── */}
        <section className="bg-surface border border-outline-variant/60 rounded-3xl p-6 shadow-xs animate-fade-in-up delay-100">
          <h3 className="font-display text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>palette</span>
            Appearance
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-on-surface">Theme Mode</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {theme === 'light' ? 'Light mode is active' : 'Dark mode is active'}
              </p>
            </div>

            {/* Segmented Toggle */}
            <button
              onClick={toggleTheme}
              className="relative flex items-center w-[140px] h-10 bg-surface-variant/60 border border-outline-variant rounded-2xl p-1 cursor-pointer transition-all"
            >
              {/* Sliding indicator */}
              <div
                className={`absolute top-1 h-8 w-[66px] bg-primary rounded-xl shadow-md transition-all duration-300 ease-in-out ${
                  theme === 'dark' ? 'left-[70px]' : 'left-1'
                }`}
              />
              {/* Light label */}
              <span
                className={`relative z-10 flex-1 flex items-center justify-center gap-1 text-xs font-bold transition-colors duration-300 ${
                  theme === 'light' ? 'text-on-primary' : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>light_mode</span>
                Light
              </span>
              {/* Dark label */}
              <span
                className={`relative z-10 flex-1 flex items-center justify-center gap-1 text-xs font-bold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-on-primary' : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>dark_mode</span>
                Dark
              </span>
            </button>
          </div>
        </section>

        {/* ─── Subscription Plan Card ─── */}
        <section className="bg-surface border border-outline-variant/60 rounded-3xl p-6 shadow-xs animate-fade-in-up delay-200">
          <h3 className="font-display text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            Subscription
          </h3>

          <div className="flex items-center justify-between p-4 rounded-2xl border border-outline-variant/40" style={{ background: tierConfig.bgGradient }}>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-md"
                style={{ backgroundColor: tierConfig.color }}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {tierConfig.icon}
                </span>
              </div>
              <div>
                <p className="text-base font-bold text-on-surface">{tierConfig.label} Plan</p>
                <p className="text-xs text-on-surface-variant">
                  {tierConfig.price}{tierConfig.priceSubtext} · {tierConfig.dailyChatLimit === Infinity ? 'Unlimited' : tierConfig.dailyChatLimit} chats/day
                </p>
              </div>
            </div>

            <button
              onClick={onOpenPricing}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {currentTier === 'pro' ? 'Manage' : 'Upgrade'}
            </button>
          </div>

          {/* Feature highlights */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {tierConfig.features.slice(0, 4).map((feature, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="leading-snug">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Saved Chart Profiles ─── */}
        <section className="bg-surface border border-outline-variant/60 rounded-3xl p-6 shadow-xs animate-fade-in-up delay-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              Chart Profiles
            </h3>
            <span className="text-xs font-semibold text-primary bg-primary-fixed px-2.5 py-1 rounded-full border border-primary/20">
              {profiles.length}/{maxProfiles}
            </span>
          </div>

          <div className="space-y-2">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfileId
              return (
                <div
                  key={profile.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-primary-fixed/40 border-primary/30'
                      : 'border-outline-variant/40 hover:bg-surface-variant/30'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectProfile(profile.id)
                    }}
                    className="flex-1 flex items-center gap-3 text-left cursor-pointer"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        isActive
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-surface-variant text-on-surface-variant'
                      }`}
                    >
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate flex items-center gap-1.5">
                        {profile.name}
                        {isActive && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-primary-fixed px-1.5 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {profile.relationship || 'Self'}
                        {profile.chartData?.metadata?.ascendant_sign && (
                          <> · {profile.chartData.metadata.ascendant_sign} Asc</>
                        )}
                      </p>
                    </div>
                  </button>

                  {/* Action buttons (Edit & Delete) */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {/* Edit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditProfileDetails(profile.id)
                      }}
                      title="Edit birth details"
                      className="text-on-surface-variant/50 hover:text-primary p-2 rounded-xl hover:bg-primary/10 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>

                    {/* Delete button */}
                    {profiles.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Remove profile for ${profile.name}?`)) {
                            onDeleteProfile(profile.id)
                          }
                        }}
                        title="Remove profile"
                        className="text-on-surface-variant/50 hover:text-red-500 p-2 rounded-xl hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">delete_outline</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Profile Button */}
          <button
            onClick={onAddNewProfile}
            disabled={profiles.length >= maxProfiles}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl text-sm font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            {profiles.length >= maxProfiles
              ? `Profile Limit Reached (${maxProfiles})`
              : 'Add Profile (Family / Friend)'}
          </button>
        </section>

        {/* ─── Sign Out ─── */}
        <section className="animate-fade-in-up delay-500">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-surface border border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 rounded-2xl text-sm font-bold transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sign Out{user?.displayName ? ` (${user.displayName})` : ''}
          </button>
        </section>

        {/* Bottom Spacer */}
        <div className="h-8" />
      </main>
    </div>
  )
}
