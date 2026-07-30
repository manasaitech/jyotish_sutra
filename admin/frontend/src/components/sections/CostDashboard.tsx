import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SectionCard from '../SectionCard';

interface CostTrendPoint {
  date: string;
  cost: number;
  requests: number;
}

interface CostData {
  cost: {
    today: number;
    this_week: number;
    this_month: number;
    period_total: number;
  };
  cost_trend: CostTrendPoint[];
}

interface CostDashboardProps {
  data: CostData | null;
  loading: boolean;
}

export default function CostDashboard({ data, loading }: CostDashboardProps) {
  const trendData = data?.cost_trend || [];
  const cost = data?.cost;

  return (
    <SectionCard
      title="Cost & Spend Dashboard"
      description="Monitor actual API/LLM consumption costs and daily billing trends"
      icon="payments"
      loading={loading}
    >
      <div className="flex flex-col space-y-6 flex-1">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-bg-secondary/40 p-4 rounded-lg border border-border-primary">
            <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider block">Today's Cost</span>
            <span className="text-xl font-extrabold text-accent-rose block mt-1">₹{cost?.today.toFixed(2) || '0.00'}</span>
          </div>

          <div className="bg-bg-secondary/40 p-4 rounded-lg border border-border-primary">
            <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider block">This Week</span>
            <span className="text-xl font-extrabold text-accent-amber block mt-1">₹{cost?.this_week.toFixed(2) || '0.00'}</span>
          </div>

          <div className="bg-bg-secondary/40 p-4 rounded-lg border border-border-primary">
            <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider block">This Month</span>
            <span className="text-xl font-extrabold text-accent-indigo-light block mt-1">₹{cost?.this_month.toFixed(2) || '0.00'}</span>
          </div>

          <div className="bg-bg-secondary/40 p-4 rounded-lg border border-border-primary">
            <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider block">Total Period Cost</span>
            <span className="text-xl font-extrabold text-accent-emerald block mt-1">₹{cost?.period_total.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {/* Trend Area Chart */}
        <div className="w-full h-[300px]">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="costGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="date" stroke="#9ca3b4" tickLine={false} style={{ fontSize: '10px' }} />
                <YAxis stroke="#9ca3b4" tickLine={false} style={{ fontSize: '10px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1f2e',
                    borderColor: '#2a2d3e',
                    borderRadius: '8px',
                    color: '#e8eaf0',
                  }}
                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Cost']}
                />
                <Area type="monotone" dataKey="cost" stroke="#fb7185" strokeWidth={2} fillOpacity={1} fill="url(#costGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-text-secondary text-sm">
              No cost trend logs found.
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
