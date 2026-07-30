import React from 'react';
import SectionCard from '../SectionCard';

interface CountryStat {
  country: string;
  count: number;
  percentage: number;
}

interface GeographicInsightsProps {
  data: { countries: CountryStat[]; total_users: number } | null;
  loading: boolean;
}

export default function GeographicInsights({ data, loading }: GeographicInsightsProps) {
  const countries = data?.countries || [];

  return (
    <SectionCard
      title="Geographic User Distribution"
      description="Breakdown of registered accounts based on country/region codes"
      icon="public"
      loading={loading}
    >
      <div className="flex-1 overflow-x-auto space-y-4">
        {countries.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-primary text-text-secondary text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Country</th>
                <th className="pb-3 font-semibold">Distribution</th>
                <th className="pb-3 font-semibold text-right">Users</th>
                <th className="pb-3 font-semibold text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary/50 text-sm">
              {countries.map((country, index) => (
                <tr key={index} className="hover:bg-bg-secondary/20 transition-colors">
                  <td className="py-3 font-medium text-text-primary capitalize">{country.country}</td>
                  <td className="py-3 w-1/2">
                    <div className="w-full bg-bg-secondary h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-accent-indigo h-full rounded-full" 
                        style={{ width: `${country.percentage}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono text-text-secondary">{country.count.toLocaleString()}</td>
                  <td className="py-3 text-right font-mono font-bold text-accent-indigo-light">{country.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-full flex items-center justify-center text-text-secondary text-sm">
            No geographic profile logs found.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
