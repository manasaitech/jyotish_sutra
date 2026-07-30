import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor: string; // e.g., 'text-accent-green', 'text-accent-blue'
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
      <div className="glass-card rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative min-h-[180px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton w-8 h-8 rounded-lg"></div>
          <div className="skeleton w-32 h-4"></div>
        </div>
        <div className="mb-6 space-y-2">
          <div className="skeleton w-16 h-10"></div>
          <div className="skeleton w-24 h-3"></div>
        </div>
      </div>
    );
  }

  // Get background opacity colored background container
  const bgAccentColor = accentColor.replace('text-', 'bg-') + '/10';

  return (
    <div 
      className="glass-card rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative" 
      data-purpose="metric-card"
    >
      {/* Card Header Title and Icon */}
      <div className={`flex items-center gap-3 ${accentColor} mb-4`}>
        <div className={`p-2 rounded-lg ${bgAccentColor}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-slate-300">{title}</span>
      </div>

      {/* Card Value and Performance Status */}
      <div className="mb-10">
        <h3 className="text-5xl font-bold text-white mb-1">{value}</h3>
        <p className={`text-xs ${accentColor} font-semibold`}>
          {change} <span className="text-slate-400 font-normal ml-1">vs last week</span>
        </p>
      </div>

      {/* Sparkline Chart */}
      <div className={`absolute bottom-0 left-0 w-full px-1 py-1 ${accentColor}`}>
        <svg className="w-full h-16 glow-path" preserveAspectRatio="none" viewBox="0 0 200 60">
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
