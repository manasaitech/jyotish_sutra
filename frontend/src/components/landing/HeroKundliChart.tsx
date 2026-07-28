import { useState, useEffect } from 'react'

/**
 * HeroKundliChart — An animated North Indian Kundli (Janam Kundli) chart
 * that draws its grid line-by-line ONCE on initial load, then continuously
 * moves/replaces the 9 Navagraha planets slowly and steadily across houses.
 */

interface Navagraha {
  id: string
  nameHi: string
  nameEn: string
  short: string
  color: string
  bgColor: string
  borderColor: string
  house: number // 1 to 12
}

// 9 Navagraha planets with color coding matching the Gochar chart
const INITIAL_NAVAGRAHAS: Navagraha[] = [
  { id: 'sun', nameHi: 'सूर्य', nameEn: 'Sun', short: 'Su', color: '#D97706', bgColor: '#FEF3C7', borderColor: '#F59E0B', house: 1 },
  { id: 'moon', nameHi: 'चन्द्र', nameEn: 'Moon', short: 'Mo', color: '#059669', bgColor: '#D1FAE5', borderColor: '#10B981', house: 4 },
  { id: 'mars', nameHi: 'मंगल', nameEn: 'Mars', short: 'Ma', color: '#E11D48', bgColor: '#FFE4E6', borderColor: '#F43F5E', house: 7 },
  { id: 'mercury', nameHi: 'बुध', nameEn: 'Mercury', short: 'Me', color: '#0D9488', bgColor: '#CCFBF1', borderColor: '#14B8A6', house: 1 },
  { id: 'jupiter', nameHi: 'गुरु', nameEn: 'Jupiter', short: 'Ju', color: '#CA8A04', bgColor: '#FEF9C3', borderColor: '#EAB308', house: 5 },
  { id: 'venus', nameHi: 'शुक्र', nameEn: 'Venus', short: 'Ve', color: '#9333EA', bgColor: '#F3E8FF', borderColor: '#A855F7', house: 12 },
  { id: 'saturn', nameHi: 'शनि', nameEn: 'Saturn', short: 'Sa', color: '#2563EB', bgColor: '#DBEAFE', borderColor: '#3B82F6', house: 9 },
  { id: 'rahu', nameHi: 'राहु', nameEn: 'Rahu', short: 'Ra', color: '#4F46E5', bgColor: '#E0E7FF', borderColor: '#6366F1', house: 3 },
  { id: 'ketu', nameHi: 'केतु', nameEn: 'Ketu', short: 'Ke', color: '#EA580C', bgColor: '#FFEDD5', borderColor: '#F97316', house: 9 },
]

// Precise House Centroids for North Indian Kundli (400×400 canvas)
const HOUSE_CENTROIDS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 100 },  // H1 (Top Diamond - Lagna)
  2: { x: 100, y: 50 },   // H2 (Top Left Triangle)
  3: { x: 50, y: 100 },   // H3 (Upper Left Outer Triangle)
  4: { x: 100, y: 200 },  // H4 (Left Diamond)
  5: { x: 50, y: 300 },   // H5 (Lower Left Outer Triangle)
  6: { x: 100, y: 350 },  // H6 (Bottom Left Triangle)
  7: { x: 200, y: 300 },  // H7 (Bottom Diamond)
  8: { x: 300, y: 350 },  // H8 (Bottom Right Triangle)
  9: { x: 350, y: 300 },  // H9 (Lower Right Outer Triangle)
  10: { x: 300, y: 200 }, // H10 (Right Diamond)
  11: { x: 350, y: 100 }, // H11 (Upper Right Outer Triangle)
  12: { x: 300, y: 50 },  // H12 (Top Right Triangle)
}

// Zodiac sign numbers placed in house triangles
const SIGN_POSITIONS: { num: number; x: number; y: number }[] = [
  { num: 1, x: 200, y: 38 },
  { num: 2, x: 100, y: 38 },
  { num: 3, x: 38, y: 100 },
  { num: 4, x: 38, y: 200 },
  { num: 5, x: 38, y: 300 },
  { num: 6, x: 100, y: 362 },
  { num: 7, x: 200, y: 362 },
  { num: 8, x: 300, y: 362 },
  { num: 9, x: 362, y: 300 },
  { num: 10, x: 362, y: 200 },
  { num: 11, x: 362, y: 100 },
  { num: 12, x: 300, y: 38 },
]

export default function HeroKundliChart() {
  const [navagrahas, setNavagrahas] = useState<Navagraha[]>(INITIAL_NAVAGRAHAS)
  const [visiblePlanetsCount, setVisiblePlanetsCount] = useState(0)

  // 1. Initial Load: Reveal planets one by one after line animation finishes
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    INITIAL_NAVAGRAHAS.forEach((_, idx) => {
      const timer = setTimeout(() => {
        setVisiblePlanetsCount((prev) => Math.max(prev, idx + 1))
      }, 2200 + idx * 250)
      timers.push(timer)
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  // 2. Slow and Steady Transit: Move/replace one planet to a new house every 4 seconds
  useEffect(() => {
    if (visiblePlanetsCount < INITIAL_NAVAGRAHAS.length) return

    const transitInterval = setInterval(() => {
      setNavagrahas((prevGrahas) => {
        // Select a random planet to transit to a new house
        const targetIdx = Math.floor(Math.random() * prevGrahas.length)
        const updated = [...prevGrahas]
        const currentHouse = updated[targetIdx].house
        
        // Pick a new house (1-12) different from current house
        let nextHouse = Math.floor(Math.random() * 12) + 1
        if (nextHouse === currentHouse) {
          nextHouse = (currentHouse % 12) + 1
        }

        updated[targetIdx] = {
          ...updated[targetIdx],
          house: nextHouse,
        }
        return updated
      })
    }, 4000)

    return () => clearInterval(transitInterval)
  }, [visiblePlanetsCount])

  // SVG grid line paths for North Indian Kundli chart (400×400 canvas)
  const lines = [
    // Outer square — drawn first
    { x1: 0, y1: 0, x2: 400, y2: 0, delay: 0 },
    { x1: 400, y1: 0, x2: 400, y2: 400, delay: 200 },
    { x1: 400, y1: 400, x2: 0, y2: 400, delay: 400 },
    { x1: 0, y1: 400, x2: 0, y2: 0, delay: 600 },
    // Main diagonals
    { x1: 0, y1: 0, x2: 400, y2: 400, delay: 900 },
    { x1: 0, y1: 400, x2: 400, y2: 0, delay: 1100 },
    // Inner diamond
    { x1: 200, y1: 0, x2: 400, y2: 200, delay: 1400 },
    { x1: 400, y1: 200, x2: 200, y2: 400, delay: 1600 },
    { x1: 200, y1: 400, x2: 0, y2: 200, delay: 1800 },
    { x1: 0, y1: 200, x2: 200, y2: 0, delay: 2000 },
  ]

  // Group current planets by house for multi-planet offsetting
  const planetsByHouse: Record<number, Navagraha[]> = {}
  navagrahas.slice(0, visiblePlanetsCount).forEach((p) => {
    if (!planetsByHouse[p.house]) planetsByHouse[p.house] = []
    planetsByHouse[p.house].push(p)
  })

  return (
    <div className="relative w-full max-w-lg aspect-square">
      {/* Decorative corner brackets */}
      <div className="absolute -top-3 -left-3 w-10 h-10 border-t-2 border-l-2 border-primary opacity-60" />
      <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-2 border-r-2 border-primary opacity-60" />

      {/* Outer frame with subtle shadow */}
      <div
        className="w-full h-full p-3 sm:p-4 bg-surface/50 backdrop-blur-sm"
        style={{ border: '1.5px solid #E9DFC8', boxShadow: '0 10px 40px -10px rgba(230, 126, 34, 0.12)' }}
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full select-none"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(230,126,34,0.08))' }}
        >
          {/* ── Grid Lines (Line-by-line single run on page load) ── */}
          {lines.map((line, idx) => {
            const dx = line.x2 - line.x1
            const dy = line.y2 - line.y1
            const len = Math.sqrt(dx * dx + dy * dy)

            return (
              <line
                key={`line-${idx}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#E67E22"
                strokeWidth="2"
                strokeLinecap="butt"
                strokeDasharray={len}
                strokeDashoffset={len}
                opacity="0.85"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from={len}
                  to="0"
                  dur="0.6s"
                  begin={`${line.delay}ms`}
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.25 0.1 0.25 1"
                  keyTimes="0;1"
                />
              </line>
            )
          })}

          {/* ── Zodiac Sign Numbers ── */}
          {SIGN_POSITIONS.map((sp) => (
            <text
              key={`sign-${sp.num}`}
              x={sp.x}
              y={sp.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-bold"
              fontSize="11"
              fill="#B37D4E"
              opacity="0"
            >
              {sp.num}
              <animate
                attributeName="opacity"
                from="0"
                to="0.7"
                dur="0.4s"
                begin="2100ms"
                fill="freeze"
              />
            </text>
          ))}

          {/* ── Central OM Symbol ── */}
          <text
            x="200"
            y="200"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="28"
            fill="#E67E22"
            opacity="0"
            className="font-display"
          >
            ॐ
            <animate
              attributeName="opacity"
              from="0"
              to="0.25"
              dur="0.8s"
              begin="2000ms"
              fill="freeze"
            />
          </text>

          {/* ── Dynamic Navagraha Badges (Slow and Steady Movement across Houses) ── */}
          {navagrahas.slice(0, visiblePlanetsCount).map((planet) => {
            const centroid = HOUSE_CENTROIDS[planet.house] || { x: 200, y: 200 }
            const housePlanets = planetsByHouse[planet.house] || []
            const indexInHouse = housePlanets.indexOf(planet)
            const totalInHouse = housePlanets.length
            const spacing = totalInHouse >= 3 ? 20 : 26
            const offsetX = (indexInHouse - (totalInHouse - 1) / 2) * spacing

            const posX = centroid.x + offsetX
            const posY = centroid.y

            return (
              <g
                key={planet.id}
                style={{
                  transform: `translate(${posX}px, ${posY}px)`,
                  transition: 'transform 1.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Outer Color Halo */}
                <circle r="13" fill={planet.bgColor} stroke={planet.borderColor} strokeWidth="1" opacity="0.9" />
                {/* Hindi Navagraha Short Name */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontWeight="800"
                  fill={planet.color}
                  className="font-display select-none"
                >
                  {planet.nameHi}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Floating annotation labels */}
      <div
        className="absolute -right-2 sm:-right-6 top-1/4 bg-surface/90 backdrop-blur-sm px-2.5 py-1 border border-outline-variant text-[10px] sm:text-[11px] tracking-[0.1em] uppercase italic text-on-surface font-extrabold shadow-sm"
        style={{
          opacity: 0,
          animation: 'fadeSlideLeft 0.5s ease-out 2.8s forwards',
        }}
      >
        Lagna: Mesha
      </div>
      <div
        className="absolute -left-2 sm:-left-6 bottom-1/4 bg-surface/90 backdrop-blur-sm px-2.5 py-1 border border-outline-variant text-[10px] sm:text-[11px] tracking-[0.1em] uppercase italic text-on-surface font-extrabold shadow-sm"
        style={{
          opacity: 0,
          animation: 'fadeSlideRight 0.5s ease-out 3.2s forwards',
        }}
      >
        Nakshatra: Ashwini
      </div>

      {/* Keyframe animations for annotations */}
      <style>{`
        @keyframes fadeSlideLeft {
          0% { opacity: 0; transform: translateX(12px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideRight {
          0% { opacity: 0; transform: translateX(-12px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
