import { useState, useEffect } from 'react'
import type { RelationshipType } from '../../types/profile'
import DynamicDateSelector from './DynamicDateSelector'

export type OnboardingMode = 'exact' | 'partial'

export interface BirthData {
  fullName: string
  gender: 'male' | 'female' | 'other'
  dateOfBirth?: string
  timeOfBirth?: string
  relationship?: RelationshipType
  mode?: OnboardingMode | 'prashna'
  timeSlot?: string
  question?: string
  category?: string
  placeName?: string
  latitude?: number
  longitude?: number
  timezone_offset?: number
}

interface Suggestion {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface BirthDetailsFormProps {
  onSubmit: (data: BirthData) => void
  initialData?: BirthData
  onCancel?: () => void
}

export default function BirthDetailsForm({ onSubmit, initialData, onCancel }: BirthDetailsFormProps) {
  const [mode, setMode] = useState<OnboardingMode>(
    initialData?.mode === 'partial' || initialData?.mode === 'prashna' ? 'partial' : 'exact'
  )

  // Form State
  const [name, setName] = useState(initialData?.fullName || (initialData as any)?.name || '')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(initialData?.gender || (initialData as any)?.gender || 'male')
  const [relationship, setRelationship] = useState<RelationshipType>(initialData?.relationship || (initialData as any)?.relationship || 'Self')
  const [dob, setDob] = useState(((initialData?.dateOfBirth || (initialData as any)?.date_of_birth || '1995-01-01') as string).slice(0, 10))
  const [tob, setTob] = useState(((initialData?.timeOfBirth || (initialData as any)?.time_of_birth || '12:00') as string).slice(0, 5))

  // Location & Map State (Embedded on Same Page)
  const [searchQuery, setSearchQuery] = useState(initialData?.placeName || (initialData as any)?.placeName || '')
  const [selectedPlace, setSelectedPlace] = useState(initialData?.placeName || (initialData as any)?.placeName || 'Delhi, India')
  const [coordinates, setCoordinates] = useState({
    lat: initialData?.latitude ?? (initialData as any)?.latitude ?? 28.6139,
    lon: initialData?.longitude ?? (initialData as any)?.longitude ?? 77.2090,
  })
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Partial / Unknown Time State
  const [timeSlot, setTimeSlot] = useState<string>(initialData?.timeSlot || 'unknown')

  // Debounced Geocoding Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoadingGeo(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=5&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'KundliGPT-VedicAstrology-Assistant',
            },
          }
        )
        if (response.ok) {
          const data: Suggestion[] = await response.json()
          setSuggestions(data)
          setShowDropdown(data.length > 0)
        }
      } catch (err) {
        console.error('Geocoding error:', err)
      } finally {
        setLoadingGeo(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSelectSuggestion = (s: Suggestion) => {
    setSelectedPlace(s.display_name)
    setCoordinates({ lat: parseFloat(s.lat), lon: parseFloat(s.lon) })
    setSearchQuery(s.display_name)
    setShowDropdown(false)
  }

  // Submit Handler — All Details on 1 Single Page!
  const handleFormSubmit = () => {
    if (!name.trim()) return

    if (mode === 'exact') {
      if (dob && tob) {
        onSubmit({
          fullName: name.trim(),
          gender,
          dateOfBirth: dob,
          timeOfBirth: tob,
          relationship,
          mode: 'exact',
          placeName: selectedPlace,
          latitude: coordinates.lat,
          longitude: coordinates.lon,
        })
      }
    } else if (mode === 'partial') {
      const isKnownDob = Boolean(dob)
      onSubmit({
        fullName: name.trim(),
        gender,
        dateOfBirth: dob || '2000-01-01',
        timeOfBirth: tob || undefined,
        relationship,
        mode: isKnownDob ? 'partial' : 'prashna',
        timeSlot,
        placeName: selectedPlace,
        latitude: coordinates.lat,
        longitude: coordinates.lon,
      })
    }
  }

  const genderOptions: Array<{ value: 'male' | 'female' | 'other'; label: string }> = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ]

  const timeSlotOptions = [
    { value: 'unknown', label: '❓ Unknown Time (Approximate Planetary Calculation)' },
    { value: 'morning', label: '🌅 Morning (6:00 AM – 12:00 PM)' },
    { value: 'afternoon', label: '☀️ Afternoon (12:00 PM – 5:00 PM)' },
    { value: 'evening', label: '🌇 Evening (5:00 PM – 8:00 PM)' },
    { value: 'night', label: '🌙 Night (8:00 PM – 4:00 AM)' },
    { value: 'sunrise', label: '🌅 Around Sunrise' },
    { value: 'sunset', label: '🌇 Around Sunset' },
  ]

  // Calculate bbox for OpenStreetMap embed
  const offset = 0.02
  const bbox = `${coordinates.lon - offset}%2C${coordinates.lat - offset}%2C${coordinates.lon + offset}%2C${coordinates.lat + offset}`
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lon}`

  return (
    <div className="mx-auto celestial-card rounded-3xl p-6 sm:p-10 shadow-xl border border-outline-variant/60 animate-fade-in-up space-y-8 max-w-3xl bg-surface/95 backdrop-blur-md">
      {/* Header Banner */}
      <div className="border-b border-outline-variant/40 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          </div>
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-primary leading-tight">
              ✨ Vedic Profile Registration
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant font-medium mt-1">
              Enter your profile details, birth date, time and location below to generate your complete Janma Kundli on a single page.
            </p>
          </div>
        </div>
      </div>

      {/* 2 Onboarding Section Cards */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-primary block">
          Step 1: Choose Your Birth Details Availability
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section 1: Complete Birth Details */}
          <div
            onClick={() => setMode('exact')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              mode === 'exact'
                ? 'bg-primary/5 border-primary ring-4 ring-primary/10 shadow-md scale-[1.01]'
                : 'bg-surface-variant/30 border-outline-variant/50 hover:border-primary/40 hover:bg-surface-variant/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                <span className="material-symbols-outlined text-xl">verified</span>
              </span>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                mode === 'exact' ? 'bg-primary text-white' : 'bg-surface-variant text-on-surface-variant'
              }`}>
                Complete Details
              </span>
            </div>
            <div>
              <h4 className="font-display text-lg font-bold text-primary">
                ✅ Complete Birth Details
              </h4>
              <p className="text-xs text-on-surface-variant font-medium mt-1 leading-relaxed">
                Requires Date, Time & Place. Generates full D1 Janma Kundli with Lagna, Houses, D9, D10 & Dashas.
              </p>
            </div>
          </div>

          {/* Section 2: Incomplete Birth Details */}
          <div
            onClick={() => setMode('partial')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              mode === 'partial'
                ? 'bg-primary/5 border-primary ring-4 ring-primary/10 shadow-md scale-[1.01]'
                : 'bg-surface-variant/30 border-outline-variant/50 hover:border-primary/40 hover:bg-surface-variant/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
                <span className="material-symbols-outlined text-xl">help</span>
              </span>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                mode === 'partial' ? 'bg-primary text-white' : 'bg-surface-variant text-on-surface-variant'
              }`}>
                Incomplete Details
              </span>
            </div>
            <div>
              <h4 className="font-display text-lg font-bold text-primary">
                ❓ Incomplete / Unknown Details
              </h4>
              <p className="text-xs text-on-surface-variant font-medium mt-1 leading-relaxed">
                For missing birth time or date. Generates Estimated Horoscope or Horary Prashna Guidance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 Inputs Container — All On 1 Single Page */}
      <div className="space-y-6 pt-2">
        <label className="text-xs font-bold uppercase tracking-wider text-primary block">
          Step 2: Enter Profile & Birth Parameters
        </label>

        {/* Common Name, Gender & Relationship Fields */}
        <div className="space-y-5 bg-surface-variant/20 p-5 rounded-3xl border border-outline-variant/50">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary block mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anmol Dixit"
              className="w-full bg-surface border border-outline-variant/60 rounded-2xl px-4 py-3 text-sm sm:text-base text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-primary block mb-2">Gender</label>
              <div className="flex gap-2">
                {genderOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold rounded-2xl border transition-all cursor-pointer text-center ${
                      gender === opt.value
                        ? 'bg-primary-fixed border-primary/30 text-primary shadow-xs'
                        : 'bg-surface border-outline-variant/50 text-on-surface-variant hover:bg-surface-variant/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-primary block mb-2">Profile Target (Relationship)</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                className="w-full bg-surface border border-outline-variant/60 rounded-2xl px-4 py-3 text-sm sm:text-base text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer font-medium"
              >
                {['Self', 'Spouse', 'Child', 'Parent', 'Friend', 'Other'].map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Date & Time Section */}
        {mode === 'exact' ? (
          <div className="space-y-6 animate-fade-in-up bg-surface-variant/20 p-5 rounded-3xl border border-outline-variant/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dynamic Theme-Matching Date Selector (No Scrolling Lag!) */}
              <DynamicDateSelector
                value={dob}
                onChange={setDob}
                label="📅 Date of Birth"
                required
              />

              {/* Time of Birth Input */}
              <div>
                <label className="text-xs font-bold text-primary block mb-2">
                  ⏰ Time of Birth *
                </label>
                <input
                  type="time"
                  value={tob}
                  onChange={(e) => setTob(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/60 rounded-2xl px-4 py-3.5 text-sm sm:text-base text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary font-medium"
                />
                <span className="text-[11px] text-on-surface-variant mt-1.5 block">
                  Exact time produces accurate Lagna & House calculations.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in-up bg-amber-500/5 p-5 rounded-3xl border border-amber-500/30">
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-xs text-amber-950 font-medium leading-relaxed">
              ℹ️ <strong>Incomplete Details Mode</strong>: Select approximate date or time slot. If birth date is unknown, Horary Prashna mode is activated automatically.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <DynamicDateSelector
                value={dob}
                onChange={setDob}
                label="📅 Birth Date / Year (Optional)"
              />

              <div>
                <label className="text-xs font-bold text-primary block mb-2">
                  🌅 Approximate Time Slot
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/60 rounded-2xl px-4 py-3.5 text-sm sm:text-base text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer font-medium"
                >
                  {timeSlotOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Embedded Location Search & Interactive Map (Same Page!) */}
        <div className="space-y-4 bg-surface-variant/20 p-5 rounded-3xl border border-outline-variant/50">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">location_on</span>
              Birthplace Location & Map Search *
            </label>
            <span className="text-[11px] font-semibold text-primary bg-primary-fixed border border-primary/20 px-2.5 py-0.5 rounded-full">
              GPS Coordinates: {coordinates.lat.toFixed(4)}° N, {coordinates.lon.toFixed(4)}° E
            </span>
          </div>

          {/* Location Search Bar with Autocomplete */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
              {loadingGeo ? 'sync' : 'search'}
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search birth city (e.g. Delhi, Mumbai, London, New York)..."
              className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant/60 rounded-2xl text-sm sm:text-base text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true)
              }}
            />

            {/* Autocomplete Dropdown */}
            {showDropdown && (
              <div className="absolute left-0 right-0 mt-2 bg-surface/95 backdrop-blur-md border border-outline-variant/60 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-30 divide-y divide-outline-variant/30">
                {suggestions.map((s) => (
                  <button
                    key={s.place_id}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full px-4 py-2.5 text-left text-xs sm:text-sm hover:bg-primary-fixed hover:text-primary transition-colors text-primary line-clamp-1 cursor-pointer font-medium"
                  >
                    {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Map Preview Card */}
          <div className="relative h-52 w-full rounded-2xl overflow-hidden border border-outline-variant/60 shadow-inner bg-surface-variant/40">
            <iframe
              title="Embedded Birthplace Map"
              src={mapSrc}
              className="w-full h-full border-none opacity-90"
              loading="lazy"
            />

            {/* Center Map Pin Marker */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div className="w-8 h-8 bg-primary/20 rounded-full animate-ping absolute" />
              <span
                className="material-symbols-outlined text-primary text-3xl relative z-10 -translate-y-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                location_on
              </span>
            </div>

            {/* Selected Location Pill Bar */}
            <div className="absolute bottom-2 left-2 right-2 glass p-2.5 rounded-xl border border-white/40 flex items-center justify-between text-xs font-semibold text-primary z-20">
              <span className="line-clamp-1 max-w-[80%]">📍 {selectedPlace}</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                Selected
              </span>
            </div>
          </div>
        </div>

        {/* Primary Actions — Submit & optional Go Back */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-surface border border-outline-variant hover:bg-surface-variant/40 text-on-surface font-bold py-4 rounded-2xl text-sm sm:text-base shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span>Go Back</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={!name.trim() || (mode === 'exact' && (!dob || !tob))}
            className={`${onCancel ? 'flex-grow sm:flex-1' : 'w-full'} bg-primary text-white font-bold py-4 rounded-2xl text-sm sm:text-base shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2`}
          >
            <span>
              {initialData
                ? '💾 Save Profile Changes'
                : mode === 'exact'
                ? '✨ Generate Complete Janma Kundli'
                : '✨ Start Astrological Guidance'}
            </span>
            <span className="material-symbols-outlined text-lg">
              {initialData ? 'save' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
