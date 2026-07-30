import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import SectionCard from '../SectionCard';

interface SubData {
  total_users: number;
  free_users: number;
  by_tier: {
    free: number;
    standard: number;
    pro: number;
    enterprise: number;
  };
  paid_users: number;
  conversion_rate: number;
  revenue_30d: number;
  payment_count_30d: number;
}

interface SubscriptionMetricsProps {
  data: SubData | null;
  loading: boolean;
}

const COLORS = ['#6b7280', '#6366f1', '#22d3ee', '#34d399'];

export default function SubscriptionMetrics({ data, loading }: SubscriptionMetricsProps) {
  const tierDistribution = data ? [
    { name: 'Free Tier', value: data.by_tier.free },
    { name: 'Standard Tier', value: data.by_tier.standard },
    { name: 'Pro Tier', value: data.by_tier.pro },
    { name: 'Enterprise Tier', value: data.by_tier.enterprise },
  ].filter(t => t.value > 0) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-card border border-border-primary p-4 rounded-card">
          <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">Conversion Rate</span>
          <span className="text-xl font-bold text-accent-emerald mt-1 block">{data ? `${data.conversion_rate}%` : '0.0%'}</span>
        </div>

        <div className="bg-bg-card border border-border-primary p-4 rounded-card">
          <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">Active Paid Users</span>
          <span className="text-xl font-bold text-accent-indigo-light mt-1 block">{data ? data.paid_users.toLocaleString() : 0}</span>
        </div>

        <div className="bg-bg-card border border-border-primary p-4 rounded-card">
          <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">30-Day Revenue</span>
          <span className="text-xl font-bold text-accent-cyan mt-1 block">₹{data ? data.revenue_30d.toFixed(2) : '0.00'}</span>
        </div>

        <div className="bg-bg-card border border-border-primary p-4 rounded-card">
          <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">30-Day Purchases</span>
          <span className="text-xl font-bold text-accent-orange mt-1 block">{data ? data.payment_count_30d.toLocaleString() : 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Chart */}
        <SectionCard
          title="Subscription Tier Breakdown"
          description="Distribution of active users across plans"
          icon="pie_chart"
          loading={loading}
        >
          <div className="flex-1 w-full h-[300px] flex items-center justify-center">
            {tierDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tierDistribution.map((entry, index) => (
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
              <div className="text-text-secondary text-sm">No subscription distribution logged.</div>
            )}
          </div>
        </SectionCard>

        {/* User Stats Summary */}
        <SectionCard
          title="Account Status Summary"
          description="Distribution of free vs paid active accounts"
          icon="group"
          loading={loading}
        >
          <div className="flex-1 flex flex-col justify-around py-4">
            <div className="flex justify-between items-center border-b border-border-primary pb-3">
              <span className="text-sm text-text-secondary">Free Accounts</span>
              <span className="font-mono text-base font-semibold text-text-primary">
                {data ? data.free_users.toLocaleString() : 0}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-border-primary pb-3">
              <span className="text-sm text-text-secondary">Premium/Paid Accounts</span>
              <span className="font-mono text-base font-semibold text-accent-indigo-light">
                {data ? data.paid_users.toLocaleString() : 0}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-bold text-text-primary">Total Registered Users</span>
              <span className="font-mono text-lg font-extrabold text-accent-cyan">
                {data ? data.total_users.toLocaleString() : 0}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
