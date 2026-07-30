import React from 'react';

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
}

export default function SectionCard({
  title,
  description,
  icon,
  actions,
  children,
  loading = false,
}: SectionCardProps) {
  return (
    <section className="bg-bg-card border border-border-primary rounded-card shadow-card overflow-hidden flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border-primary flex flex-wrap items-center justify-between gap-4 bg-bg-secondary/40">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center border border-border-primary text-text-accent">
              <span className="material-symbols-rounded text-lg">{icon}</span>
            </div>
          )}
          <div>
            <h2 className="text-base font-bold text-text-primary tracking-wide">{title}</h2>
            {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col min-h-[300px]">
        {loading ? (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="skeleton w-full h-8"></div>
            <div className="skeleton w-full h-32"></div>
            <div className="skeleton w-3/4 h-8"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
