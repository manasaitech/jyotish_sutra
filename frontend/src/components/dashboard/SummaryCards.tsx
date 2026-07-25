import type { TabType } from './TabNavigation'
import { formatSignWithHindi, formatPlanetWithHindi } from '../../utils/hindiMapping'
import { getCurrentDashaFromChart } from '../../utils/dashaCalculator'

interface SummaryCardItem {
  label: string
  value: string | number
  subtext?: string
  icon?: string
  color?: string
}

interface SummaryCardsProps {
  tab: TabType
  chartData: any
  computed?: any
  birthData?: any
}

export default function SummaryCards({ tab, chartData, computed, birthData }: SummaryCardsProps) {
  const cards = getCardsForTab(tab, chartData, computed, birthData)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {cards.map((card, i) => (
        <div
          key={i}
          className="celestial-card p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-surface border border-outline-variant/60 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between min-w-0"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80 truncate mr-1">
              {card.label}
            </span>
            {card.icon && (
              <span className="material-symbols-outlined text-primary text-base sm:text-xl opacity-80 shrink-0">
                {card.icon}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display text-base sm:text-xl font-bold text-primary leading-tight truncate">
              {card.value}
            </p>
            {card.subtext && (
              <p className="text-[10px] sm:text-[11px] text-on-surface-variant mt-0.5 sm:mt-1 leading-snug line-clamp-1">
                {card.subtext}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function getCardsForTab(tab: TabType, chartData: any, computed?: any, birthData?: any): SummaryCardItem[] {
  const meta = {
    ascendant_sign: chartData?.metadata?.ascendant_sign || chartData?.ascendant_sign || 'Aries',
    moon_sign: chartData?.metadata?.moon_sign || chartData?.moon_sign || 'Cancer',
    nakshatra: chartData?.metadata?.nakshatra || chartData?.nakshatra || 'Pushya',
    pada: chartData?.metadata?.pada || chartData?.pada || 1,
  }
  const planets = chartData?.raw_positions || chartData?.planets || {}
  const houses = chartData?.houses || {}
  const doshas = chartData?.doshas || {}
  const yogas = chartData?.yogas || []
  const comp = computed || chartData?.computed || {}
  const currentDasha = getCurrentDashaFromChart(chartData, birthData)

  switch (tab) {
    case 'overview': {
      const lucky = getLuckyAttributes(comp, chartData)
      return [
        { label: 'Lagna (Ascendant)', value: formatSignWithHindi(meta.ascendant_sign), icon: 'person', subtext: 'Core personality & body' },
        { label: 'Moon Sign (Rashi)', value: formatSignWithHindi(meta.moon_sign), icon: 'brightness_3', subtext: 'Mind & emotions' },
        { label: 'Nakshatra', value: meta.nakshatra, icon: 'auto_awesome', subtext: `Pada ${meta.pada}` },
        { label: 'Current Dasha', value: formatPlanetWithHindi(currentDasha), icon: 'schedule', subtext: 'Major life chapter' },
        { label: 'Lucky Color', value: lucky.colors?.[0] || lucky.lucky_colors?.[0] || 'Gold', icon: 'palette' },
        { label: 'Lucky Number', value: lucky.numbers?.[0] ?? lucky.lucky_numbers?.[0] ?? 1, icon: 'pin' },
        { label: 'Lucky Day', value: lucky.day || lucky.lucky_day || 'Sunday', icon: 'calendar_today' },
        { label: 'Dominant Element', value: comp.elements?.dominant || getDominantElement(planets, meta), icon: 'water_drop' },
      ]
    }


    case 'career':
      return [
        { label: '10th House (Karma)', value: formatPlanetWithHindi(getHouseLord('10', chartData)), icon: 'work', subtext: `Sign: ${formatSignWithHindi(houses['10']?.sign)}` },
        { label: 'Sun Sign', value: planets.sun?.sign ? `${formatSignWithHindi(planets.sun.sign)} (H${planets.sun.house || '?'})` : 'N/A', icon: 'wb_sunny', subtext: 'Authority & status' },
        { label: 'Career Yogas', value: `${yogas.length} Active`, icon: 'stars', subtext: yogas[0]?.name || 'Raj Yoga' },
        { label: '10th Lord Status', value: getLordDignity('10', chartData, planets), icon: 'trending_up', subtext: 'Karma lord strength' },
      ]

    case 'marriage':
      return [
        { label: '7th House Lord', value: formatPlanetWithHindi(getHouseLord('7', chartData)), icon: 'favorite', subtext: `Sign: ${formatSignWithHindi(houses['7']?.sign)}` },
        { label: 'Venus Placement', value: planets.venus?.sign ? `${formatSignWithHindi(planets.venus.sign)} (H${planets.venus.house || '?'})` : 'N/A', icon: 'favorite_border', subtext: planets.venus?.dignity || 'Relationships' },
        { label: 'Manglik Status', value: doshas.manglik?.is_present ? 'Active' : 'Non-Manglik', icon: 'shield_moon', subtext: doshas.manglik?.is_present ? doshas.manglik.description || 'Mars in 7th' : 'No affliction' },
        { label: '7th House Sign', value: formatSignWithHindi(houses['7']?.sign), icon: 'groups', subtext: 'Partnership Sign' },
      ]

    case 'health': {
      const prakriti = getPrakriti(comp, chartData)
      return [
        { label: '1st House Lord', value: formatPlanetWithHindi(getHouseLord('1', chartData)), icon: 'fitness_center', subtext: 'Vitality Lord' },
        { label: '6th House Lord', value: formatPlanetWithHindi(getHouseLord('6', chartData)), icon: 'medical_services', subtext: 'Immunity Lord' },
        { label: 'Dominant Dosha', value: prakriti.dominant_dosha, icon: 'spa', subtext: `Vata ${prakriti.vata}% | Pitta ${prakriti.pitta}%` },
        { label: 'Weakest Planet', value: comp.remedy_data?.weak_planets?.[0]?.display_name || 'Balanced', icon: 'warning', subtext: comp.remedy_data?.weak_planets?.[0]?.status || 'No severe affliction' },
      ]
    }

    case 'food': {
      const prakriti = getPrakriti(comp, chartData)
      return [
        { label: 'Vata Proportion', value: `${prakriti.vata}%`, icon: 'air', subtext: 'Air & Ether element' },
        { label: 'Pitta Proportion', value: `${prakriti.pitta}%`, icon: 'local_fire_department', subtext: 'Fire & Water element' },
        { label: 'Kapha Proportion', value: `${prakriti.kapha}%`, icon: 'water', subtext: 'Earth & Water element' },
        { label: 'Dominant Constitution', value: prakriti.dominant_dosha, icon: 'restaurant', subtext: 'Prakriti Type' },
      ]
    }

    case 'remedies': {
      const remedyInfo = getRemedySummary(chartData, comp, birthData)
      return [
        {
          label: 'Active Dasha Planet',
          value: formatPlanetWithHindi(remedyInfo.currentDasha),
          icon: 'schedule',
          subtext: `${remedyInfo.currentDasha} Mahadasha Active`
        },
        {
          label: 'Afflicted Planets',
          value: `${remedyInfo.weakCount} Planets`,
          icon: 'warning',
          subtext: remedyInfo.weakCount > 0 ? `Primary: ${remedyInfo.primaryWeak}` : 'Chart In Harmony'
        },
        {
          label: 'Recommended Gem',
          value: remedyInfo.gemstone,
          icon: 'diamond',
          subtext: `For ${remedyInfo.primaryWeak}`
        },
        {
          label: 'Fasting Day (Vrata)',
          value: remedyInfo.fastingDay,
          icon: 'event',
          subtext: `Dedicated to ${remedyInfo.primaryWeak}`
        },
      ]
    }


    case 'finance':
      return [
        { label: '2nd House (Wealth)', value: formatPlanetWithHindi(getHouseLord('2', chartData)), icon: 'account_balance', subtext: `Sign: ${formatSignWithHindi(houses['2']?.sign)}` },
        { label: '11th House (Gains)', value: formatPlanetWithHindi(getHouseLord('11', chartData)), icon: 'payments', subtext: `Sign: ${formatSignWithHindi(houses['11']?.sign)}` },
        { label: 'Jupiter Placement', value: planets.jupiter?.sign ? `${formatSignWithHindi(planets.jupiter.sign)} (H${planets.jupiter.house || '?'})` : 'N/A', icon: 'monetization_on', subtext: 'Karak for Wealth' },
        { label: '5th House (Investments)', value: formatPlanetWithHindi(getHouseLord('5', chartData)), icon: 'pie_chart', subtext: `Sign: ${formatSignWithHindi(houses['5']?.sign)}` },
      ]

    case 'personality':
      return [
        { label: 'Ascendant Sign', value: formatSignWithHindi(meta.ascendant_sign), icon: 'face', subtext: 'Outer persona' },
        { label: 'Moon Sign', value: formatSignWithHindi(meta.moon_sign), icon: 'psychology', subtext: 'Emotional core' },
        { label: 'Mercury Sign', value: planets.mercury?.sign ? `${formatSignWithHindi(planets.mercury.sign)} (H${planets.mercury.house || '?'})` : 'N/A', icon: 'chat', subtext: 'Intellect & Speech' },
        { label: 'Mars Sign', value: planets.mars?.sign ? `${formatSignWithHindi(planets.mars.sign)} (H${planets.mars.house || '?'})` : 'N/A', icon: 'bolt', subtext: 'Courage & Action' },
      ]

    case 'spiritual':
      return [
        { label: '9th House (Dharma)', value: formatPlanetWithHindi(getHouseLord('9', chartData)), icon: 'auto_awesome', subtext: `Sign: ${formatSignWithHindi(houses['9']?.sign)}` },
        { label: '12th House (Moksha)', value: formatPlanetWithHindi(getHouseLord('12', chartData)), icon: 'self_improvement', subtext: `Sign: ${formatSignWithHindi(houses['12']?.sign)}` },
        { label: 'Ketu Placement', value: planets.ketu?.sign ? `${formatSignWithHindi(planets.ketu.sign)} (H${planets.ketu.house || '?'})` : 'N/A', icon: 'landscape', subtext: 'Detachment path' },
        { label: 'Recommended Path', value: getSpiritualPath(comp.elements?.dominant || getDominantElement(planets, meta)), icon: 'menu_book', subtext: 'Based on element' },
      ]


    default:
      return []
  }
}

/** Dynamic client-side Prakriti calculation matching backend algorithm exactly */
function getPrakriti(comp: any, chartData: any) {
  if (comp?.prakriti?.dominant_dosha && typeof comp.prakriti.vata === 'number') {
    return comp.prakriti
  }

  const meta = {
    ascendant_sign: chartData?.metadata?.ascendant_sign || chartData?.ascendant_sign || 'Aries',
    nakshatra: chartData?.metadata?.nakshatra || chartData?.nakshatra || 'Ashwini',
  }
  const planets = chartData?.raw_positions || chartData?.planets || {}

  const signElements: Record<string, string> = {
    Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
  }

  const elementDosha: Record<string, { vata: number; pitta: number; kapha: number }> = {
    Fire:  { vata: 0.1, pitta: 0.7, kapha: 0.2 },
    Earth: { vata: 0.1, pitta: 0.2, kapha: 0.7 },
    Air:   { vata: 0.7, pitta: 0.2, kapha: 0.1 },
    Water: { vata: 0.2, pitta: 0.3, kapha: 0.5 },
  }

  const planetWeights: Record<string, number> = {
    sun: 2.0, moon: 2.5, mars: 1.5, mercury: 1.2, jupiter: 1.5, venus: 1.2, saturn: 1.5, rahu: 0.8, ketu: 0.8
  }

  let vata = 0, pitta = 0, kapha = 0

  // 1. Ascendant (weight 3.0)
  const ascElement = signElements[meta.ascendant_sign] || 'Fire'
  const ascDosha = elementDosha[ascElement] || elementDosha.Fire
  vata += ascDosha.vata * 3.0
  pitta += ascDosha.pitta * 3.0
  kapha += ascDosha.kapha * 3.0

  // 2. Planets
  Object.entries(planets).forEach(([pName, pData]: [string, any]) => {
    const sign = pData?.sign || 'Aries'
    const elem = signElements[sign] || 'Fire'
    const d = elementDosha[elem] || elementDosha.Fire
    const w = planetWeights[pName.toLowerCase()] || 1.0
    vata += d.vata * w
    pitta += d.pitta * w
    kapha += d.kapha * w
  })

  const sum = vata + pitta + kapha || 1.0
  const vataPct = Math.round((vata / sum) * 1000) / 10
  const pittaPct = Math.round((pitta / sum) * 1000) / 10
  const kaphaPct = Math.round((100 - vataPct - pittaPct) * 10) / 10

  const doshas: Record<string, number> = { Vata: vataPct, Pitta: pittaPct, Kapha: kaphaPct }
  const dominant_dosha = Object.entries(doshas).reduce((a, b) => (a[1] > b[1] ? a : b))[0]

  return {
    vata: vataPct,
    pitta: pittaPct,
    kapha: kaphaPct,
    dominant_dosha,
  }
}

function getDominantElement(planets: any, meta: any): string {
  const signElements: Record<string, string> = {
    Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
  }
  const counts: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 }
  const ascElem = signElements[meta.ascendant_sign] || 'Fire'
  counts[ascElem] += 3

  Object.values(planets).forEach((p: any) => {
    const elem = signElements[p?.sign]
    if (elem) counts[elem] += 1
  })

  return Object.entries(counts).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
}

function getHouseLord(houseNum: string, chartData: any): string {
  const houses = chartData?.houses || {}
  const h = houses[houseNum]
  if (h?.lord) return h.lord.charAt(0).toUpperCase() + h.lord.slice(1)
  return 'Benefic'
}

function getLordDignity(houseNum: string, chartData: any, planets: any): string {
  const houses = chartData?.houses || {}
  const lord = houses[houseNum]?.lord?.toLowerCase()
  if (lord && planets[lord]) {
    const p = planets[lord]
    return p.dignity ? `${p.dignity.charAt(0).toUpperCase() + p.dignity.slice(1)}` : `House ${p.house || '?'}`
  }
  return 'Favorable'
}

function getSpiritualPath(element?: string): string {
  switch (element) {
    case 'Air':
      return 'Pranayama & Kriya'
    case 'Water':
      return 'Bhakti & Devotion'
    case 'Fire':
      return 'Tapas & Discipline'
    case 'Earth':
      return 'Karma Yoga & Service'
    default:
      return 'Jnana & Self-Inquiry'
  }
}

function getRemedySummary(chartData: any, comp: any, birthData?: any) {
  const currentDashaRaw = getCurrentDashaFromChart(chartData, birthData)
  const currentDasha = currentDashaRaw.charAt(0).toUpperCase() + currentDashaRaw.slice(1).toLowerCase()

  const planets = chartData?.planets || chartData?.raw_positions || {}
  const weakPlanetsList: Array<{ name: string; status: string }> = []

  // Check dignity, combust, dusthana
  Object.entries(planets).forEach(([pName, pData]: [string, any]) => {
    const dignity = (pData?.dignity || '').toLowerCase()
    const combust = pData?.combust || false
    const house = pData?.house

    const isDebil = dignity.includes('debilitated') || dignity.includes('enemy')
    const isDusthana = house && [6, 8, 12].includes(Number(house))

    if (isDebil || combust || isDusthana) {
      const status = isDebil ? 'Debilitated' : combust ? 'Combust' : 'Dusthana (H' + house + ')'
      const nameCap = pName.charAt(0).toUpperCase() + pName.slice(1).toLowerCase()
      weakPlanetsList.push({ name: nameCap, status })
    }
  })

  // Priority to pre-computed weak planets if present
  const preComputedWeak = comp?.remedy_data?.weak_planets
  const weakCount = preComputedWeak ? preComputedWeak.length : weakPlanetsList.length
  const primaryWeak = preComputedWeak?.[0]?.display_name || weakPlanetsList[0]?.name || currentDasha

  // Gemstones map
  const gemMap: Record<string, string> = {
    Sun: 'Ruby (Manik)',
    Moon: 'Pearl (Moti)',
    Mars: 'Red Coral (Moonga)',
    Mercury: 'Emerald (Panna)',
    Jupiter: 'Yellow Sapphire (Pukhraj)',
    Venus: 'Diamond (Heera)',
    Saturn: 'Blue Sapphire (Neelam)',
    Rahu: 'Hessonite (Gomed)',
    Ketu: "Cat's Eye (Lehsunia)",
  }

  // Fasting map
  const fastMap: Record<string, string> = {
    Sun: 'Sunday',
    Moon: 'Monday',
    Mars: 'Tuesday',
    Mercury: 'Wednesday',
    Jupiter: 'Thursday',
    Venus: 'Friday',
    Saturn: 'Saturday',
    Rahu: 'Saturday',
    Ketu: 'Tuesday',
  }

  const targetPlanet = primaryWeak in gemMap ? primaryWeak : currentDasha
  const gemstone = gemMap[targetPlanet] || 'Yellow Sapphire (Pukhraj)'
  const fastingDay = fastMap[targetPlanet] || 'Thursday'

  return {
    currentDasha,
    weakCount,
    primaryWeak,
    gemstone,
    fastingDay,
  }
}


function getLuckyAttributes(comp: any, chartData: any) {
  if (comp?.lucky?.lucky_day) return comp.lucky

  const moonSign = chartData?.metadata?.moon_sign || chartData?.moon_sign || 'Aries'
  const luckyMap: Record<string, { colors: string[]; numbers: number[]; day: string; direction: string }> = {
    Aries: { colors: ['Red', 'Coral'], numbers: [9, 18, 27], day: 'Tuesday', direction: 'East' },
    Taurus: { colors: ['Pink', 'White'], numbers: [6, 15, 24], day: 'Friday', direction: 'South-East' },
    Gemini: { colors: ['Green', 'Yellow'], numbers: [5, 14, 23], day: 'Wednesday', direction: 'North' },
    Cancer: { colors: ['White', 'Silver'], numbers: [2, 11, 20], day: 'Monday', direction: 'North-West' },
    Leo: { colors: ['Gold', 'Orange'], numbers: [1, 10, 19], day: 'Sunday', direction: 'East' },
    Virgo: { colors: ['Green', 'Navy'], numbers: [5, 14, 23], day: 'Wednesday', direction: 'North' },
    Libra: { colors: ['Royal Blue', 'White'], numbers: [6, 15, 24], day: 'Friday', direction: 'South-East' },
    Scorpio: { colors: ['Deep Red', 'Maroon'], numbers: [9, 18, 27], day: 'Tuesday', direction: 'North' },
    Sagittarius: { colors: ['Yellow', 'Gold'], numbers: [3, 12, 21], day: 'Thursday', direction: 'North-East' },
    Capricorn: { colors: ['Navy Blue', 'Black'], numbers: [8, 17, 26], day: 'Saturday', direction: 'West' },
    Aquarius: { colors: ['Electric Blue', 'Cyan'], numbers: [8, 17, 26], day: 'Saturday', direction: 'West' },
    Pisces: { colors: ['Sea Green', 'Yellow'], numbers: [3, 12, 21], day: 'Thursday', direction: 'North-East' },
  }

  return luckyMap[moonSign] || luckyMap.Aries
}

