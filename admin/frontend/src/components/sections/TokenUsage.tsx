import React from 'react';
import SectionCard from '../SectionCard';

interface TokenData {
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  total_requests: number;
}

interface TokenUsageProps {
  data: TokenData | null;
  loading: boolean;
}

export default function TokenUsage({ data, loading }: TokenUsageProps) {
  const tokens = data?.tokens;
  const requests = data?.total_requests || 1;

  const avgInput = tokens ? Math.round(tokens.input / requests) : 0;
  const avgOutput = tokens ? Math.round(tokens.output / requests) : 0;
  const avgTotal = tokens ? Math.round(tokens.total / requests) : 0;

  return (
    <SectionCard
      title="Token Usage Analytics"
      description="Token volume consumed across LLM requests"
      icon="toll"
      loading={loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        {/* Accumulative Token Volumes */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-accent">Accumulative Volume</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary">Input Tokens (Prompt)</span>
                <span className="font-mono text-text-primary">{tokens?.input.toLocaleString() || 0}</span>
              </div>
              <div className="w-full bg-bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-accent-indigo h-full rounded-full" 
                  style={{ width: tokens ? `${Math.min((tokens.input / (tokens.total || 1)) * 100, 100)}%` : '0%' }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary">Output Tokens (Completion)</span>
                <span className="font-mono text-text-primary">{tokens?.output.toLocaleString() || 0}</span>
              </div>
              <div className="w-full bg-bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-accent-cyan h-full rounded-full" 
                  style={{ width: tokens ? `${Math.min((tokens.output / (tokens.total || 1)) * 100, 100)}%` : '0%' }}
                ></div>
              </div>
            </div>

            <div className="pt-2 border-t border-border-primary flex justify-between items-center">
              <span className="text-sm font-medium text-text-primary">Total Tokens Combined</span>
              <span className="font-mono text-base font-bold text-accent-indigo-light">
                {tokens?.total.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Request Average Metrics */}
        <div className="bg-bg-secondary/40 p-4 rounded-lg border border-border-primary flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-text-accent mb-3">Average Per Request</h3>
          
          <div className="space-y-3 flex-1 flex flex-col justify-around">
            <div className="flex justify-between items-center border-b border-border-primary pb-2">
              <span className="text-xs text-text-secondary">Avg. Input Tokens</span>
              <span className="font-mono text-sm font-semibold text-text-primary">{avgInput.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-border-primary pb-2">
              <span className="text-xs text-text-secondary">Avg. Output Tokens</span>
              <span className="font-mono text-sm font-semibold text-text-primary">{avgOutput.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Avg. Total Tokens</span>
              <span className="font-mono text-sm font-semibold text-accent-emerald">{avgTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
