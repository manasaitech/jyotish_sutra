import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor: string; // e.g., 'text-kesari-primary', 'text-green-600'
  change: string;
  sparklinePath: string;
  loading?: boolean;
}

export default function MetricCard({
  title,
  value,
  icon,
  accentColor,
  change,
  sparklinePath,
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative min-h-[160px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton w-8 h-8 rounded-lg bg-surface-container-high"></div>
          <div className="skeleton w-32 h-4 bg-surface-container-high"></div>
        </div>
        <div className="mb-6 space-y-2">
          <div className="skeleton w-16 h-10 bg-surface-container-high"></div>
          <div className="skeleton w-24 h-3 bg-surface-container-high"></div>
        </div>
      </div>
    );
  }

  // Determine change color
  const isNegative = change.includes('-');
  const badgeBg = isNegative ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600';
  const badgeIcon = isNegative ? 'arrow_downward' : 'arrow_upward';

  return (
    <div 
      className="glass-card rounded-2xl p-5 flex flex-col justify-between overflow-hidden relative group" 
      data-purpose="metric-card"
    >
      {/* Card Header Title and Icon */}
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 bg-surface-container rounded-lg ${accentColor}`}>
          {icon}
        </div>
        <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${badgeBg}`}>
          <span className="material-symbols-outlined text-[14px] mr-0.5">{badgeIcon}</span> {change}
        </span>
      </div>

      {/* Card Value and Performance Status */}
      <div className="mb-6 relative z-10">
        <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">{title}</p>
        <h3 className="text-4xl font-display font-semibold text-charcoal-text">{value}</h3>
      </div>

      {/* Sparkline Chart */}
      <div className={`absolute bottom-0 left-0 w-full px-1 ${accentColor} opacity-20 group-hover:opacity-40 transition-opacity`}>
        <svg className="w-full h-10" preserveAspectRatio="none" viewBox="0 0 200 60">
          <path 
            d={sparklinePath} 
            fill="none" 
            stroke="currentColor" 
            strokeLinecap="round" 
            strokeWidth="3"
          ></path>
        </svg>
      </div>
    </div>
  );
}
