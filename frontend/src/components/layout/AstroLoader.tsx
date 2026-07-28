interface AstroLoaderProps {
  message?: string
  fullscreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function AstroLoader({
  message = 'Connecting to AstroSutra AI...',
  fullscreen = true,
  size = 'lg',
}: AstroLoaderProps) {
  // Polar styling helper
  const getPolarStyle = (deg: number, radius = 50) => {
    const rad = (deg * Math.PI) / 180
    const x = Math.round(50 + radius * Math.cos(rad))
    const y = Math.round(50 + radius * Math.sin(rad))
    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
    }
  }

  // Size mapping
  const sizeClasses = {
    sm: {
      container: 'w-32 h-32',
      ring1: 'inset-8',
      ring2: 'inset-4',
      hub: 'w-10 h-10 text-[9px]',
      hubHindi: 'text-[9px]',
      hubEnglish: 'text-[6px]',
      pillText: 'text-[7px] px-1 py-0.5',
      messageText: 'text-[10px] mt-4',
    },
    md: {
      container: 'w-44 h-44',
      ring1: 'inset-11',
      ring2: 'inset-6',
      hub: 'w-14 h-14 text-[11px]',
      hubHindi: 'text-[11px]',
      hubEnglish: 'text-[7px]',
      pillText: 'text-[8px] px-1.5 py-0.5',
      messageText: 'text-xs mt-6',
    },
    lg: {
      container: 'w-56 h-56',
      ring1: 'inset-14',
      ring2: 'inset-7',
      hub: 'w-16 h-16 text-xs',
      hubHindi: 'text-xs',
      hubEnglish: 'text-[8px]',
      pillText: 'text-[9px] px-2 py-0.5',
      messageText: 'text-sm mt-8',
    },
  }[size]

  const loaderContent = (
    <div className="flex flex-col items-center justify-center p-4 relative select-none">
      {/* Background Celestial Blurs (only for larger sizes/fullscreen) */}
      {size !== 'sm' && (
        <>
          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* COMPACT GOCHARA ORBITS LOADER */}
      <div className={`relative ${sizeClasses.container} flex items-center justify-center shrink-0`}>
        
        {/* Outer Ring 3 — Shani (शनि), Rahu (राहु) & Ketu (केतु) */}
        <div
          className="absolute inset-0 rounded-full border border-primary/25 border-dashed"
          style={{ animation: 'spinCounter 30s linear infinite' }}
        >
          <div className="absolute" style={getPolarStyle(315, 50)}>
            <div
              className={`rounded-full border border-primary/30 bg-surface text-primary font-display font-extrabold shadow-xs ${sizeClasses.pillText}`}
              style={{ animation: 'spinClockwise 30s linear infinite' }}
            >
              शनि
            </div>
          </div>
          <div className="absolute" style={getPolarStyle(45, 50)}>
            <div
              className={`rounded-full border border-amber-800/30 bg-surface text-amber-600 font-display font-extrabold shadow-xs ${sizeClasses.pillText}`}
              style={{ animation: 'spinClockwise 30s linear infinite' }}
            >
              राहु
            </div>
          </div>
          <div className="absolute" style={getPolarStyle(225, 50)}>
            <div
              className={`rounded-full border border-orange-850/30 bg-surface text-orange-600 font-display font-extrabold shadow-xs ${sizeClasses.pillText}`}
              style={{ animation: 'spinClockwise 30s linear infinite' }}
            >
              केतु
            </div>
          </div>
        </div>

        {/* Middle Ring 2 — Guru (गुरु), Mangal (मंगल) & Chandra (चन्द्र) */}
        <div
          className={`absolute ${sizeClasses.ring2} rounded-full border-2 border-primary/30`}
          style={{ animation: 'spinClockwise 20s linear infinite' }}
        >
          <div className="absolute" style={getPolarStyle(90, 50)}>
            <div
              className={`rounded-full border border-primary/30 bg-surface text-primary font-display font-extrabold shadow-xs ${sizeClasses.pillText}`}
              style={{ animation: 'spinCounter 20s linear infinite' }}
            >
              गुरु
            </div>
          </div>
          <div className="absolute" style={getPolarStyle(270, 50)}>
            <div
              className={`rounded-full border border-rose-700/30 bg-surface text-rose-600 font-display font-extrabold shadow-xs ${sizeClasses.pillText}`}
              style={{ animation: 'spinCounter 20s linear infinite' }}
            >
              मंगल
            </div>
          </div>
          <div className="absolute" style={getPolarStyle(180, 50)}>
            <div
              className={`rounded-full border border-primary/30 bg-surface text-primary font-display font-extrabold shadow-xs ${sizeClasses.pillText}`}
              style={{ animation: 'spinCounter 20s linear infinite' }}
            >
              चन्द्र
            </div>
          </div>
        </div>

        {/* Inner Ring 1 — Surya (सूर्य), Budh (बुध) & Shukra (शुक्र) */}
        <div
          className={`absolute ${sizeClasses.ring1} rounded-full border border-primary/40 border-dotted`}
          style={{ animation: 'spinCounter 10s linear infinite' }}
        >
          <div className="absolute" style={getPolarStyle(0, 50)}>
            <div
              className={`rounded-full border border-amber-600/30 bg-amber-500 text-white font-display font-extrabold shadow-xs ${sizeClasses.pillText}`}
              style={{ animation: 'spinClockwise 10s linear infinite' }}
            >
              सूर्य
            </div>
          </div>
          <div className="absolute" style={getPolarStyle(120, 50)}>
            <div
              className={`rounded-full border border-teal-700/30 bg-surface text-teal-600 font-display font-extrabold shadow-xs ${sizeClasses.pillText}`}
              style={{ animation: 'spinClockwise 10s linear infinite' }}
            >
              बुध
            </div>
          </div>
          <div className="absolute" style={getPolarStyle(240, 50)}>
            <div
              className={`rounded-full border border-purple-300/30 bg-surface text-purple-600 font-display font-extrabold shadow-xs ${sizeClasses.pillText}`}
              style={{ animation: 'spinClockwise 10s linear infinite' }}
            >
              शुक्र
            </div>
          </div>
        </div>

        {/* Center Hub */}
        <div className={`rounded-full bg-gradient-to-br from-primary-fixed to-surface border border-primary/50 flex flex-col items-center justify-center p-1 shadow-md z-10 text-center animate-pulse ${sizeClasses.hub}`}>
          <span className={`font-display font-bold text-primary ${sizeClasses.hubHindi}`}>गोचर</span>
          <span className={`font-sans font-semibold text-on-surface-variant opacity-80 ${sizeClasses.hubEnglish}`}>Gochara</span>
        </div>

      </div>

      {/* Message */}
      <p className={`font-semibold text-primary animate-pulse tracking-wide font-display uppercase text-center ${sizeClasses.messageText}`}>
        {message}
      </p>

      {/* Orbit Animation Keyframes */}
      <style>{`
        @keyframes spinClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinCounter {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  )

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {loaderContent}
      </div>
    )
  }

  return loaderContent
}
