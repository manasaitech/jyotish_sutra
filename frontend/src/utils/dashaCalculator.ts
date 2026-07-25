/**
 * Frontend Vimshottari Mahadasha Calculator
 *
 * Derives the current major Mahadasha planet from the Moon's sidereal longitude
 * and the native's date of birth.  Used as a robust fallback whenever
 * `chartData.current_dasha` is missing from localStorage-cached profiles.
 *
 * The algorithm mirrors the backend `services/astrology/dasha.py` logic.
 */

const DASHA_ORDER = [
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury',
] as const

const DASHA_YEARS: Record<string, number> = {
  ketu: 7,
  venus: 20,
  sun: 6,
  moon: 10,
  mars: 7,
  rahu: 18,
  jupiter: 16,
  saturn: 19,
  mercury: 17,
}

const DAYS_PER_YEAR = 365.25
const MS_PER_DAY = 86_400_000

/**
 * Calculate the currently-active Vimshottari Mahadasha planet.
 *
 * @param moonLongitude  Sidereal longitude of the Moon (0-360)
 * @param birthDateStr   ISO date string for date of birth, e.g. "2003-09-14"
 * @returns lowercase planet name, e.g. "venus", "rahu", etc.
 */
function calculateCurrentDasha(moonLongitude: number, birthDateStr: string): string {
  const nakWidth = 360 / 27 // 13.333…° per Nakshatra
  const nakIdx = Math.floor(moonLongitude / nakWidth)
  const startLordIdx = nakIdx % 9

  const progressFrac = (moonLongitude - nakIdx * nakWidth) / nakWidth
  const startLord = DASHA_ORDER[startLordIdx]
  const remainingYears = DASHA_YEARS[startLord] * (1 - progressFrac)

  const birthDate = new Date(birthDateStr)
  if (isNaN(birthDate.getTime())) return 'jupiter'

  const todayMs = Date.now()

  // Walk forward through dashas from birth, starting with the remaining balance
  let cursorMs = birthDate.getTime() + remainingYears * DAYS_PER_YEAR * MS_PER_DAY
  if (todayMs < cursorMs) return startLord

  let lordIdx = (startLordIdx + 1) % 9
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[lordIdx]
    cursorMs += DASHA_YEARS[lord] * DAYS_PER_YEAR * MS_PER_DAY
    if (todayMs < cursorMs) return lord
    lordIdx = (lordIdx + 1) % 9
  }

  return 'jupiter'
}

/**
 * Extract the current Mahadasha planet from chart data, using every available
 * source and falling back to live computation when the stored value is absent.
 *
 * @param chartData  The chart / chart_summary object
 * @param birthData  Optional birth-details object (from profile.birthData)
 * @returns Lowercase planet name, e.g. "venus"
 */
export function getCurrentDashaFromChart(chartData: any, birthData?: any): string {
  // 1. Direct top-level field (string or object with .planet)
  const raw = chartData?.current_dasha
  const direct = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : raw?.planet
  if (direct) return direct.toLowerCase()

  // 2. Nested inside metadata
  const metaDasha = chartData?.metadata?.current_dasha
  if (metaDasha && typeof metaDasha === 'string') return metaDasha.toLowerCase()

  // 3. Compute from Moon longitude + birth date
  const moonLong =
    chartData?.planets?.moon?.longitude ??
    chartData?.raw_positions?.moon?.longitude
  const birthDateStr =
    chartData?.metadata?.date_of_birth ||
    chartData?.metadata?.birth_date ||
    chartData?.metadata?.date_str ||
    birthData?.dateOfBirth ||
    birthData?.date_of_birth

  if (moonLong != null && birthDateStr) {
    return calculateCurrentDasha(moonLong, birthDateStr)
  }

  // 4. Absolute last resort
  return 'jupiter'
}
