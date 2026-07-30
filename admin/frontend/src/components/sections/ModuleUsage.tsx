import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SectionCard from '../SectionCard';

interface ModuleStat {
  module: string;
  count: number;
}

interface ModuleUsageProps {
  data: { modules: ModuleStat[] } | null;
  loading: boolean;
}

export default function ModuleUsage({ data, loading }: ModuleUsageProps) {
  const chartData = data?.modules?.map(m => ({
    name: m.module.charAt(0).toUpperCase() + m.module.slice(1),
    Usage: m.count,
  })) || [];

  return (
    <SectionCard
      title="Module Usage Breakdown"
      description="Compare user engagement across different astrological modules"
      icon="extension"
      loading={loading}
    >
      <div className="flex-1 w-full h-[400px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" horizontal={false} />
              <XAxis type="number" stroke="#9ca3b4" tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="#9ca3b4" tickLine={false} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1c1f2e',
                  borderColor: '#2a2d3e',
                  borderRadius: '8px',
                  color: '#e8eaf0',
                }}
              />
              <Bar dataKey="Usage" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-text-secondary text-sm">
            No module usage data found.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
