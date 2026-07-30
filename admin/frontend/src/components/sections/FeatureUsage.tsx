import React from 'react';
import SectionCard from '../SectionCard';

interface FeatureStat {
  feature: string;
  count: number;
}

interface FeatureUsageProps {
  data: { features: FeatureStat[] } | null;
  loading: boolean;
}

export default function FeatureUsage({ data, loading }: FeatureUsageProps) {
  const features = data?.features || [];

  return (
    <SectionCard
      title="User Interface & Feature Engagement"
      description="Track the most clicked UI components and user actions"
      icon="ads_click"
      loading={loading}
    >
      <div className="flex-1 overflow-x-auto">
        {features.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-primary text-text-secondary text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">User Action / Feature Event</th>
                <th className="pb-3 font-semibold text-right">Occurrence Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary/50 text-sm">
              {features.map((feat, index) => (
                <tr key={index} className="hover:bg-bg-secondary/20 transition-colors">
                  <td className="py-3 font-medium text-text-primary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-indigo"></span>
                    <span>{feat.feature}</span>
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-accent-indigo-light">
                    {feat.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-full flex items-center justify-center text-text-secondary text-sm">
            No UI interaction events recorded in this period.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
