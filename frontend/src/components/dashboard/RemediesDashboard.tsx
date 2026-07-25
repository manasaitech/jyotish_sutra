import { useState, useEffect } from 'react'
import { getCurrentDashaFromChart } from '../../utils/dashaCalculator'

interface RemediesDashboardProps {
  chartData: any
  computed?: any
  birthData?: any
}

interface PlanetRemedyData {
  id: string
  name: string
  sanskrit: string
  icon: string
  color: string
  bgBorder: string
  beejMantra: string
  vedicMantra: string
  jaapCount: string
  gemstone: string
  altGemstone: string
  metal: string
  finger: string
  charityItems: string
  charityDay: string
  fastingDay: string
  deity: string
  practice: string
}

const PLANET_REMEDIES_DATABASE: Record<string, PlanetRemedyData> = {
  sun: {
    id: 'sun',
    name: 'Sun',
    sanskrit: 'Surya (सूर्य)',
    icon: 'light_mode',
    color: 'text-amber-600',
    bgBorder: 'bg-amber-500/10 border-amber-500/30',
    beejMantra: 'Om Hraam Hreem Hraum Sah Suryaya Namaha',
    vedicMantra: 'Om Adityaya Vidmahe Divakaraya Dhimahi Tanno Suryah Prachodayat',
    jaapCount: '7,000 times',
    gemstone: 'Ruby (Manik)',
    altGemstone: 'Red Garnet, Spinel',
    metal: 'Gold or Copper',
    finger: 'Ring finger',
    charityItems: 'Wheat, Jaggery (Gur), Red Flowers, Copper vessel',
    charityDay: 'Sunday morning',
    fastingDay: 'Sundays (Saltless food)',
    deity: 'Lord Surya / Gayatri Mata',
    practice: 'Offer Arghya (water) to Sun at sunrise with Gayatri Mantra.'
  },
  moon: {
    id: 'moon',
    name: 'Moon',
    sanskrit: 'Chandra (चन्द्र)',
    icon: 'dark_mode',
    color: 'text-blue-600',
    bgBorder: 'bg-blue-500/10 border-blue-500/30',
    beejMantra: 'Om Shraam Shreem Shraum Sah Chandraya Namaha',
    vedicMantra: 'Om Kshirputraya Vidmahe Amrittatvaya Dhimahi Tanno Chandrah Prachodayat',
    jaapCount: '11,000 times',
    gemstone: 'Natural Pearl (Moti)',
    altGemstone: 'Moonstone',
    metal: 'Silver',
    finger: 'Little finger',
    charityItems: 'White Rice, Milk, White Cloth, Silver coin',
    charityDay: 'Monday evening',
    fastingDay: 'Mondays or Purnima (Full Moon)',
    deity: 'Lord Shiva / Chandra Dev',
    practice: 'Recite Shiv Chalisa and offer milk abhishekam on Mondays.'
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    sanskrit: 'Mangal (मंगल)',
    icon: 'local_fire_department',
    color: 'text-rose-600',
    bgBorder: 'bg-rose-500/10 border-rose-500/30',
    beejMantra: 'Om Kraam Kreem Kraum Sah Bhaumaya Namaha',
    vedicMantra: 'Om Angarakaya Vidmahe Bhoomiputraya Dhimahi Tanno Kujah Prachodayat',
    jaapCount: '10,000 times',
    gemstone: 'Red Coral (Moonga)',
    altGemstone: 'Carnelian',
    metal: 'Gold or Copper',
    finger: 'Ring finger',
    charityItems: 'Red Lentils (Masoor Dal), Red Cloth, Copper utensils',
    charityDay: 'Tuesday afternoon',
    fastingDay: 'Tuesdays',
    deity: 'Lord Hanuman / Kartikeya',
    practice: 'Recite Hanuman Chalisa or Sundarkand on Tuesdays.'
  },
  mercury: {
    id: 'mercury',
    name: 'Mercury',
    sanskrit: 'Budh (बुध)',
    icon: 'forest',
    color: 'text-emerald-600',
    bgBorder: 'bg-emerald-500/10 border-emerald-500/30',
    beejMantra: 'Om Braam Breem Braum Sah Budhaya Namaha',
    vedicMantra: 'Om Budhaya Vidmahe Priyangu Kalikanaya Dhimahi Tanno Budhah Prachodayat',
    jaapCount: '9,000 times',
    gemstone: 'Emerald (Panna)',
    altGemstone: 'Peridot, Green Tourmaline',
    metal: 'Gold',
    finger: 'Little finger',
    charityItems: 'Green Moong Dal, Green Cloth, Stationery/Books',
    charityDay: 'Wednesday morning',
    fastingDay: 'Wednesdays',
    deity: 'Lord Ganesha / Vishnu',
    practice: 'Recite Ganesha Atharvashirsha or Vishnu Sahasranama.'
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    sanskrit: 'Guru / Brihaspati (गुरु)',
    icon: 'auto_awesome',
    color: 'text-amber-700',
    bgBorder: 'bg-amber-600/10 border-amber-600/30',
    beejMantra: 'Om Graam Greem Graum Sah Gurave Namaha',
    vedicMantra: 'Om Brihaspataye Vidmahe Surashreshthaya Dhimahi Tanno Guruh Prachodayat',
    jaapCount: '19,000 times',
    gemstone: 'Yellow Sapphire (Pukhraj)',
    altGemstone: 'Citrine (Sunela), Yellow Topaz',
    metal: 'Gold',
    finger: 'Index finger',
    charityItems: 'Yellow Chana Dal, Turmeric, Yellow sweets, Bananas',
    charityDay: 'Thursday morning',
    fastingDay: 'Thursdays',
    deity: 'Lord Vishnu / Brihaspati Dev',
    practice: 'Chant Vishnu Sahasranama & respect elders and teachers.'
  },
  venus: {
    id: 'venus',
    name: 'Venus',
    sanskrit: 'Shukra (शुक्र)',
    icon: 'favorite',
    color: 'text-pink-600',
    bgBorder: 'bg-pink-500/10 border-pink-500/30',
    beejMantra: 'Om Draam Dreem Draum Sah Shukraya Namaha',
    vedicMantra: 'Om Rajadabikaraya Vidmahe Brigusuthaya Dhimahi Tanno Shukrah Prachodayat',
    jaapCount: '16,000 times',
    gemstone: 'Diamond (Heera)',
    altGemstone: 'White Sapphire, Opal, Zircon',
    metal: 'Platinum or Silver',
    finger: 'Middle or Ring finger',
    charityItems: 'White Rice, Ghee, Sugar, White clothes, Perfume',
    charityDay: 'Friday evening',
    fastingDay: 'Fridays',
    deity: 'Goddess Mahalakshmi',
    practice: 'Recite Mahalakshmi Ashtakam & maintain clean living spaces.'
  },
  saturn: {
    id: 'saturn',
    name: 'Saturn',
    sanskrit: 'Shani (शनि)',
    icon: 'balance',
    color: 'text-indigo-700',
    bgBorder: 'bg-indigo-600/10 border-indigo-600/30',
    beejMantra: 'Om Praam Preem Praum Sah Shanaischaraya Namaha',
    vedicMantra: 'Om Shanaischaraya Vidmahe Shanaidevaya Dhimahi Tanno Mandah Prachodayat',
    jaapCount: '23,000 times',
    gemstone: 'Blue Sapphire (Neelam)',
    altGemstone: 'Amethyst, Blue Spinel',
    metal: 'Silver or Iron ring',
    finger: 'Middle finger',
    charityItems: 'Black Sesame (Til), Mustard Oil, Iron items, Black cloth',
    charityDay: 'Saturday evening',
    fastingDay: 'Saturdays',
    deity: 'Lord Shani Dev / Lord Hanuman',
    practice: 'Light mustard oil lamp under Peepal tree & recite Shani Stotra.'
  },
  rahu: {
    id: 'rahu',
    name: 'Rahu',
    sanskrit: 'Rahu (राहु)',
    icon: 'cyclone',
    color: 'text-purple-700',
    bgBorder: 'bg-purple-600/10 border-purple-600/30',
    beejMantra: 'Om Bhraam Bhreem Bhraum Sah Rahave Namaha',
    vedicMantra: 'Om Sookdantaya Vidmahe Ugraroopaya Dhimahi Tanno Rahuh Prachodayat',
    jaapCount: '18,000 times',
    gemstone: 'Hessonite (Gomed)',
    altGemstone: 'Brown Zircon',
    metal: 'Silver',
    finger: 'Middle finger',
    charityItems: 'Dry Coconut, Blue/Black cloth, Electrical goods',
    charityDay: 'Saturday night',
    fastingDay: 'Saturdays',
    deity: 'Goddess Durga / Bhairav',
    practice: 'Recite Durga Saptashati & donate to workers and needy.'
  },
  ketu: {
    id: 'ketu',
    name: 'Ketu',
    sanskrit: 'Ketu (केतु)',
    icon: 'flag',
    color: 'text-amber-800',
    bgBorder: 'bg-amber-800/10 border-amber-800/30',
    beejMantra: 'Om Sraam Sreem Sraum Sah Ketave Namaha',
    vedicMantra: 'Om Chitravarnaya Vidmahe Sarparoopaya Dhimahi Tanno Ketuh Prachodayat',
    jaapCount: '17,000 times',
    gemstone: "Cat's Eye (Lehsunia)",
    altGemstone: "Tiger's Eye",
    metal: 'Silver',
    finger: 'Little finger',
    charityItems: 'Blankets, Dog Food, Multi-color cloth, Sesame seeds',
    charityDay: 'Tuesday or Saturday',
    fastingDay: 'Tuesdays',
    deity: 'Lord Ganesha',
    practice: 'Feed stray dogs & practice silent meditation.'
  }
}

export default function RemediesDashboard({ chartData, birthData }: RemediesDashboardProps) {
  // Extract Active Major Mahadasha Planet — computed from Moon longitude & DOB when missing
  const activeDashaRaw = getCurrentDashaFromChart(chartData, birthData)

  const activeDashaKey = PLANET_REMEDIES_DATABASE[activeDashaRaw] ? activeDashaRaw : 'jupiter'
  const activeDashaData = PLANET_REMEDIES_DATABASE[activeDashaKey]

  const [selectedPlanetKey, setSelectedPlanetKey] = useState<string>(activeDashaKey)

  // Reset selected planet when active Dasha key changes (e.g. on profile switch or birth detail updates)
  useEffect(() => {
    setSelectedPlanetKey(activeDashaKey)
  }, [activeDashaKey])

  const selectedPlanet = PLANET_REMEDIES_DATABASE[selectedPlanetKey] || activeDashaData

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Hero Card: Active Major Mahadasha Remedies */}
      <div className="celestial-card p-6 rounded-3xl bg-surface border border-outline-variant/60 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${activeDashaData.bgBorder} flex items-center justify-center ${activeDashaData.color} shrink-0`}>
              <span className="material-symbols-outlined text-2xl">{activeDashaData.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-primary-fixed text-primary px-2.5 py-0.5 rounded-full">
                  🌟 Active Major Mahadasha
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold text-primary mt-1">
                {activeDashaData.name} ({activeDashaData.sanskrit}) Dasha Remedies
              </h3>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/30 px-4 py-2 rounded-2xl text-xs flex items-center gap-2">
            <span className="text-on-surface-variant font-medium">Current Mahadasha:</span>
            <strong className="text-primary font-bold">{activeDashaData.name} Period Active</strong>
          </div>
        </div>

        {/* Active Dasha Specific Mantra & Remedy Kit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Authentic Beej & Vedic Mantras */}
          <div className="bg-primary/5 p-5 rounded-2xl border border-primary/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                <span>Specific Authentic Beej Mantra</span>
              </div>
              <span className="text-[10px] font-extrabold bg-primary text-white px-2 py-0.5 rounded-full">
                {activeDashaData.jaapCount}
              </span>
            </div>

            <div className="bg-surface p-3.5 rounded-xl border border-outline-variant/40 font-mono text-sm sm:text-base font-bold text-primary tracking-wide text-center">
              "{activeDashaData.beejMantra}"
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Vedic Gayatri Mantra:
              </span>
              <p className="text-xs text-on-surface font-medium italic leading-relaxed">
                "{activeDashaData.vedicMantra}"
              </p>
            </div>
          </div>

          {/* Dasha Specific Fasting, Charity & Gemstones */}
          <div className="bg-surface-variant/30 p-5 rounded-2xl border border-outline-variant/40 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface p-3 rounded-xl border border-outline-variant/30 space-y-1">
                <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block">
                  🙏 Charity (Daana)
                </span>
                <p className="text-xs font-semibold text-on-surface">
                  {activeDashaData.charityItems}
                </p>
                <span className="text-[11px] text-on-surface-variant block mt-0.5">
                  Day: {activeDashaData.charityDay}
                </span>
              </div>

              <div className="bg-surface p-3 rounded-xl border border-outline-variant/30 space-y-1">
                <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block">
                  💎 Gemstone & Metal
                </span>
                <p className="text-xs font-semibold text-on-surface">
                  {activeDashaData.gemstone}
                </p>
                <span className="text-[11px] text-on-surface-variant block mt-0.5">
                  Metal: {activeDashaData.metal} ({activeDashaData.finger})
                </span>
              </div>
            </div>

            <div className="bg-surface p-3 rounded-xl border border-outline-variant/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block">
                  🕉️ Deity Worship & Practice
                </span>
                <p className="text-xs font-semibold text-on-surface mt-0.5">
                  {activeDashaData.deity} — {activeDashaData.practice}
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-500/10 px-2.5 py-1 rounded-lg shrink-0">
                Fasting: {activeDashaData.fastingDay}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Planetary Specific Remedies Explorer */}
      <div className="celestial-card p-6 rounded-3xl bg-surface border border-outline-variant/60 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 pb-3">
          <div>
            <h4 className="font-display text-2xl font-bold text-primary">
              📿 Navagraha Specific Remedies Explorer
            </h4>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Select any planet below to view its specific authentic Beej Mantra, Gayatri Mantra, Gemstone, and Charity items.
            </p>
          </div>

          <span className="text-xs font-bold text-primary bg-primary-fixed px-3 py-1 rounded-full">
            Exact Planetary Mantras
          </span>
        </div>

        {/* Planet Pills Selection */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 no-scrollbar">
          {Object.values(PLANET_REMEDIES_DATABASE).map((p) => {
            const isSelected = selectedPlanetKey === p.id
            const isActiveDasha = activeDashaKey === p.id

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlanetKey(p.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-white shadow-md scale-[1.02]'
                    : 'bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant/70 border border-outline-variant/40'
                }`}
              >
                <span className="material-symbols-outlined text-base">{p.icon}</span>
                <span>{p.name}</span>
                {isActiveDasha && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-amber-400 text-amber-950 font-extrabold' : 'bg-primary/20 text-primary'}`}>
                    Dasha
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected Planet Specific Card */}
        {selectedPlanet && (
          <div className="p-5 rounded-2xl bg-surface-variant/30 border border-outline-variant/50 space-y-4 animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-9 h-9 rounded-xl ${selectedPlanet.bgBorder} flex items-center justify-center ${selectedPlanet.color}`}>
                  <span className="material-symbols-outlined text-xl">{selectedPlanet.icon}</span>
                </span>
                <div>
                  <h5 className="font-display text-xl font-bold text-primary">
                    {selectedPlanet.name} ({selectedPlanet.sanskrit}) Remedies
                  </h5>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-on-surface-variant">
                  Recitation: <strong className="text-primary">{selectedPlanet.jaapCount}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Mantra */}
              <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 space-y-2 md:col-span-2">
                <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block">
                  📿 Specific Authentic Beej Mantra
                </span>
                <p className="font-mono text-sm font-bold text-primary bg-primary/5 p-2.5 rounded-lg border border-primary/20">
                  "{selectedPlanet.beejMantra}"
                </p>
                <div className="pt-1">
                  <span className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                    Vedic Gayatri Mantra:
                  </span>
                  <p className="text-xs text-on-surface italic mt-0.5">
                    "{selectedPlanet.vedicMantra}"
                  </p>
                </div>
              </div>

              {/* Gemstone & Charity */}
              <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 space-y-2">
                <div>
                  <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block">
                    💎 Gemstone & Metal
                  </span>
                  <p className="font-bold text-on-surface mt-0.5">
                    {selectedPlanet.gemstone}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    Alt: {selectedPlanet.altGemstone} | Metal: {selectedPlanet.metal} ({selectedPlanet.finger})
                  </p>
                </div>

                <div className="border-t border-outline-variant/30 pt-2">
                  <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block">
                    🙏 Charity (Daana)
                  </span>
                  <p className="text-xs text-on-surface font-medium mt-0.5">
                    {selectedPlanet.charityItems}
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Day: {selectedPlanet.charityDay}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
