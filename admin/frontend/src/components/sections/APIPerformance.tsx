import React from 'react';
import SectionCard from '../SectionCard';

interface PerfData {
  avg_latency_ms: number;
  p95_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
  failed_requests: number;
  total_requests: number;
  success_rate: number;
}

interface APIPerformanceProps {
  data: PerfData | null;
  loading: boolean;
}

export default function APIPerformance({ data, loading }: APIPerformanceProps) {
  return (
    <SectionCard
      title="API & LLM Latency Performance"
      description="Track system responsiveness, success rate, and latency distribution"
      icon="speed"
      loading={loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {/* Core Latency KPIs */}
        <div className="bg-bg-secondary/40 p-5 rounded-lg border border-border-primary flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-text-accent uppercase tracking-wider">Latency Stats</h3>
          
          <div className="space-y-4 my-auto">
            <div>
              <span className="text-[10px] text-text-secondary block">Average Latency</span>
              <span className="text-2xl font-extrabold text-text-primary">
                {data ? `${(data.avg_latency_ms / 1000).toFixed(2)}s` : '0.00s'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-text-secondary block">P95 Latency</span>
              <span className="text-2xl font-extrabold text-accent-indigo-light">
                {data ? `${(data.p95_latency_ms / 1000).toFixed(2)}s` : '0.00s'}
              </span>
            </div>
          </div>
        </div>

        {/* Min/Max Range */}
        <div className="bg-bg-secondary/40 p-5 rounded-lg border border-border-primary flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-text-accent uppercase tracking-wider">Latency Boundaries</h3>
          
          <div className="space-y-4 my-auto">
            <div>
              <span className="text-[10px] text-text-secondary block">Minimum Latency</span>
              <span className="text-xl font-bold text-accent-cyan">
                {data ? `${(data.min_latency_ms / 1000).toFixed(2)}s` : '0.00s'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-text-secondary block">Maximum Latency</span>
              <span className="text-xl font-bold text-accent-orange">
                {data ? `${(data.max_latency_ms / 1000).toFixed(2)}s` : '0.00s'}
              </span>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-bg-secondary/40 p-5 rounded-lg border border-border-primary flex flex-col justify-between items-center text-center">
          <h3 className="text-xs font-semibold text-text-accent uppercase tracking-wider self-start">Request Health</h3>
          
          <div className="my-auto">
            <div className="relative w-28 h-28 flex items-center justify-center rounded-full border-4 border-bg-secondary">
              <div 
                className="absolute inset-0 rounded-full border-4 border-accent-emerald animate-pulse-glow"
                style={{ clipPath: `inset(0 0 0 0)` }}
              ></div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-extrabold text-accent-emerald">
                  {data ? `${data.success_rate}%` : '100%'}
                </span>
                <span className="text-[9px] text-text-secondary font-medium">Success Rate</span>
              </div>
            </div>

            <div className="flex gap-4 mt-4 text-[10px] text-text-secondary">
              <span>Passed: {data ? (data.total_requests - data.failed_requests).toLocaleString() : 0}</span>
              <span>Failed: {data ? data.failed_requests.toLocaleString() : 0}</span>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
