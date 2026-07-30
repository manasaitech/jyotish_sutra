import React from 'react';
import SectionCard from '../SectionCard';

interface FeedbackTabStat {
  tab: string;
  count: number;
  avg_rating: number;
}

interface FeedbackData {
  total_feedback: number;
  avg_rating: number;
  distribution: {
    '5_star': number;
    '4_star': number;
    '3_star': number;
    '2_star': number;
    '1_star': number;
  };
  by_tab: FeedbackTabStat[];
}

interface FeedbackDashboardProps {
  data: FeedbackData | null;
  loading: boolean;
}

export default function FeedbackDashboard({ data, loading }: FeedbackDashboardProps) {
  const dist = data?.distribution;
  const maxCount = dist ? Math.max(dist['5_star'], dist['4_star'], dist['3_star'], dist['2_star'], dist['1_star'], 1) : 1;

  const stars = [
    { label: '5 Star', count: dist?.['5_star'] || 0, color: 'bg-accent-emerald' },
    { label: '4 Star', count: dist?.['4_star'] || 0, color: 'bg-accent-indigo-light' },
    { label: '3 Star', count: dist?.['3_star'] || 0, color: 'bg-accent-amber' },
    { label: '2 Star', count: dist?.['2_star'] || 0, color: 'bg-accent-orange' },
    { label: '1 Star', count: dist?.['1_star'] || 0, color: 'bg-accent-rose' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Star distribution */}
      <SectionCard
        title="Prediction Rating Distribution"
        description="Check user feedback ratings for AI astrological analysis"
        icon="star"
        loading={loading}
      >
        <div className="flex flex-col space-y-5 flex-1 justify-center">
          {/* Average Box */}
          <div className="flex items-center gap-6 bg-bg-secondary/40 p-4 rounded-lg border border-border-primary self-start">
            <div className="text-4xl font-extrabold text-accent-amber">{data?.avg_rating || '0.0'}</div>
            <div>
              <div className="flex text-accent-amber text-lg">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="material-symbols-rounded">
                    {i < Math.round(data?.avg_rating || 0) ? 'star' : 'star_outline'}
                  </span>
                ))}
              </div>
              <span className="text-xs text-text-secondary mt-1 block">Based on {data?.total_feedback || 0} reviews</span>
            </div>
          </div>

          {/* Progress lines */}
          <div className="space-y-3">
            {stars.map((star, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-text-secondary font-medium">{star.label}</span>
                <div className="flex-1 h-2.5 bg-bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${star.color}`} 
                    style={{ width: `${(star.count / maxCount) * 100}%` }}
                  ></div>
                </div>
                <span className="w-8 text-right font-mono font-semibold text-text-primary">{star.count}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Tab breakdown */}
      <SectionCard
        title="Ratings by Scope/Tab"
        description="Understand user satisfaction in different domains"
        icon="reviews"
        loading={loading}
      >
        <div className="flex-1 overflow-x-auto">
          {data?.by_tab && data.by_tab.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-primary text-text-secondary text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Horoscope Domain</th>
                  <th className="pb-3 font-semibold text-center">Reviews</th>
                  <th className="pb-3 font-semibold text-right">Avg. Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/50 text-sm">
                {data.by_tab.map((item, index) => (
                  <tr key={index} className="hover:bg-bg-secondary/20 transition-colors">
                    <td className="py-3 font-medium text-text-primary capitalize">{item.tab}</td>
                    <td className="py-3 text-center font-mono text-text-secondary">{item.count}</td>
                    <td className="py-3 text-right">
                      <span className="font-mono font-bold text-accent-amber">{item.avg_rating}⭐</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex items-center justify-center text-text-secondary text-sm">
              No rating logs by tab found.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
