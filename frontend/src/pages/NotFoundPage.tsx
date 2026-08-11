import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden"
      style={{
        backgroundColor: 'var(--color-background)',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(200, 155, 60, 0.08) 0%, transparent 60%)',
      }}
    >
      {/* Background Starry Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/5 w-1 h-1 bg-primary rounded-full animate-pulse" />
        <div className="absolute top-1/3 left-3/4 w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-700" />
        <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-primary rounded-full animate-pulse delay-300" />
        <div className="absolute top-3/4 left-4/5 w-2 h-2 bg-primary rounded-full animate-pulse delay-1000" />
      </div>

      <div className="max-w-md w-full space-y-8 p-8 rounded-3xl border border-outline-variant/50 bg-surface/50 backdrop-blur-xl shadow-2xl relative z-10 animate-fade-in">
        
        {/* Animated Constellation Symbol */}
        <div className="relative flex justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center animate-spin-slow">
            <span className="material-symbols-outlined text-5xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 0" }}>
              explore
            </span>
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="font-display text-7xl font-extrabold tracking-tight text-primary">
            404
          </h1>
          <h2 className="text-xl font-bold tracking-tight text-on-surface">
            Lost in the Cosmic Void
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            The coordinates you requested do not align with any known celestial bodies or pages in our universe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-outline-variant hover:border-primary/50 text-on-surface font-semibold text-sm tracking-wider uppercase transition-all cursor-pointer bg-surface hover:bg-primary-fixed/20 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">home</span>
            <span>Go Home</span>
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-white font-semibold text-sm tracking-wider uppercase transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-base">login</span>
            <span>Sign In</span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 text-xs text-on-surface-variant/60 tracking-wider uppercase font-medium">
        © {new Date().getFullYear()} JyotishaSutra AI • All Rights Reserved
      </div>
    </div>
  )
}
