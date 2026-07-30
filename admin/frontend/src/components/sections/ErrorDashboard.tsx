import React from 'react';
import SectionCard from '../SectionCard';

interface ErrorTypeStat {
  type: string;
  count: number;
}

interface RecentError {
  type: string;
  message: string;
  module: string;
  time: string;
}

interface ErrorData {
  total_errors: number;
  by_type: ErrorTypeStat[];
  recent_errors: RecentError[];
}

interface ErrorDashboardProps {
  data: ErrorData | null;
  loading: boolean;
}

export default function ErrorDashboard({ data, loading }: ErrorDashboardProps) {
  const errorTypes = data?.by_type || [];
  const recent = data?.recent_errors || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Error Breakdown by Type */}
      <div className="lg:col-span-1">
        <SectionCard
          title="Errors by Exception Type"
          description="Classification of system failures"
          icon="error"
          loading={loading}
        >
          <div className="flex flex-col space-y-4 flex-1 justify-center">
            {errorTypes.length > 0 ? (
              errorTypes.map((err, idx) => (
                <div key={idx} className="flex justify-between items-center bg-bg-secondary/40 p-3 rounded-lg border border-border-primary">
                  <span className="text-xs font-semibold text-accent-rose truncate max-w-[150px]" title={err.type}>
                    {err.type}
                  </span>
                  <span className="font-mono text-sm font-bold bg-accent-rose/10 text-accent-rose px-2 py-0.5 rounded-full">
                    {err.count}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-text-secondary text-sm text-center">No error logs captured.</div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Recent Error Logs */}
      <div className="lg:col-span-2">
        <SectionCard
          title="Recent Error Logs"
          description="Real-time log stream of active system exceptions"
          icon="bug_report"
          loading={loading}
        >
          <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3">
            {recent.length > 0 ? (
              recent.map((err, idx) => (
                <div 
                  key={idx}
                  className="bg-bg-secondary/20 border border-border-primary rounded-lg p-3 hover:border-accent-rose/30 transition-colors"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-accent-rose bg-accent-rose/5 px-2 py-0.5 rounded border border-accent-rose/15">
                      {err.type}
                    </span>
                    <span className="text-[10px] text-text-muted">{new Date(err.time).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-text-primary font-mono bg-bg-secondary p-2 rounded mt-1.5 overflow-x-auto whitespace-pre-wrap">
                    {err.message}
                  </p>
                  <div className="flex gap-2 items-center mt-2 text-[10px] text-text-secondary">
                    <span>Module: <strong className="text-text-primary capitalize">{err.module}</strong></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary text-sm">
                Clean logs! No exception reports.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
