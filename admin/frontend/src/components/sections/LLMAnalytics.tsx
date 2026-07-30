import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import SectionCard from '../SectionCard';

interface LLMData {
  total_requests: number;
  by_category: { category: string; count: number }[];
  by_model: { model: string; count: number }[];
  tokens: { input: number; output: number; total: number };
  cost: { today: number; this_week: number; this_month: number; period_total: number };
}

interface LLMAnalyticsProps {
  data: LLMData | null;
  loading: boolean;
}

const COLORS = ['#6366f1', '#22d3ee', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#fb923c'];

export default function LLMAnalytics({ data, loading }: LLMAnalyticsProps) {
  const modelData = data?.by_model?.map(m => ({
    name: m.model,
    value: m.count,
  })) || [];

  const categoryData = data?.by_category?.map(c => ({
    name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
    value: c.count,
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Chart: Model distribution */}
      <SectionCard
        title="Model Distribution"
        description="Overview of requests dispatched to different LLM providers"
        icon="dns"
        loading={loading}
      >
        <div className="flex-1 w-full h-[300px] flex items-center justify-center">
          {modelData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {modelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1f2e',
                    borderColor: '#2a2d3e',
                    borderRadius: '8px',
                    color: '#e8eaf0',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-text-secondary text-sm">No LLM model distribution metrics found.</div>
          )}
        </div>
      </SectionCard>

      {/* Chart: Category distribution */}
      <SectionCard
        title="Query Category Analysis"
        description="Distribution of LLM requests grouped by analysis categories"
        icon="pie_chart"
        loading={loading}
      >
        <div className="flex-1 w-full h-[300px] flex items-center justify-center">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={85}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1f2e',
                    borderColor: '#2a2d3e',
                    borderRadius: '8px',
                    color: '#e8eaf0',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-text-secondary text-sm">No LLM query category metrics found.</div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
