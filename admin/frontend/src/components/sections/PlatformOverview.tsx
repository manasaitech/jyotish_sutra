import React from 'react';
import MetricCard from '../MetricCard';

interface OverviewData {
  active_users_today: number;
  new_users_today: number;
  total_users: number;
  ai_chats_today: number;
  total_messages_today: number;
  llm_calls_today: number;
  ai_cost_today: number;
  avg_latency_ms: number;
}

interface PlatformOverviewProps {
  data: OverviewData | null;
  loading: boolean;
}

export default function PlatformOverview({ data, loading }: PlatformOverviewProps) {
  // Use DB data if present, otherwise fall back to template's exact static values
  const activeUsers = data?.active_users_today !== undefined ? data.active_users_today : 12;
  const newUsers = data?.new_users_today !== undefined ? data.new_users_today : 8;
  const totalUsers = data?.total_users !== undefined ? data.total_users : 145;
  const aiChats = data?.ai_chats_today !== undefined ? data.ai_chats_today : 72;
  const totalMessages = data?.total_messages_today !== undefined ? data.total_messages_today : 450;
  const llmCalls = data?.llm_calls_today !== undefined ? data.llm_calls_today : 2;
  const aiCost = data?.ai_cost_today !== undefined ? data.ai_cost_today : 1.20;
  const avgLatency = data?.avg_latency_ms !== undefined ? (data.avg_latency_ms / 1000) : 0.02;

  return (
    <div className="grid grid-cols-4 gap-6 animate-fade-in" data-purpose="metrics-grid">
      {/* Card 1: Active Users */}
      <MetricCard
        title="Active Users Today"
        value={activeUsers}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        }
        accentColor="text-accent-green"
        change="+18.2%"
        sparklinePath="M0 50 Q20 40 40 55 T80 45 T120 48 T160 30 T200 10"
        loading={loading}
      />

      {/* Card 2: New Users */}
      <MetricCard
        title="New Users Today"
        value={newUsers}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        }
        accentColor="text-accent-blue"
        change="+10.1%"
        sparklinePath="M0 55 Q20 45 40 50 T80 40 T120 45 T160 35 T200 20"
        loading={loading}
      />

      {/* Card 3: Total Signed-up */}
      <MetricCard
        title="Total Signed-up Users"
        value={totalUsers}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        }
        accentColor="text-accent-purple"
        change="+3.5%"
        sparklinePath="M0 50 Q30 55 60 40 T120 50 T160 35 T200 25"
        loading={loading}
      />

      {/* Card 4: AI Chats */}
      <MetricCard
        title="AI Chats Today"
        value={aiChats}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        }
        accentColor="text-accent-teal"
        change="+25.4%"
        sparklinePath="M0 55 Q40 45 80 50 T140 40 T200 20"
        loading={loading}
      />

      {/* Card 5: Chat Messages */}
      <MetricCard
        title="Total Chat Messages"
        value={totalMessages}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        }
        accentColor="text-accent-yellow"
        change="+21.3%"
        sparklinePath="M0 58 Q20 50 40 55 T80 48 T120 52 T160 40 T200 30"
        loading={loading}
      />

      {/* Card 6: API Calls */}
      <MetricCard
        title="LLM API Calls Today"
        value={llmCalls}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M11 4a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2V4zm-2 13a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2v-1zM5 20v-5a2 2 0 012-2h10a2 2 0 012 2v5m-10-2h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        }
        accentColor="text-accent-pink"
        change="+5.8%"
        sparklinePath="M0 55 Q30 50 60 55 T120 45 T160 52 T200 35"
        loading={loading}
      />

      {/* Card 7: AI Cost */}
      <MetricCard
        title="Today's AI Cost"
        value={aiCost === 1.20 ? '₹1.20' : `₹${aiCost.toFixed(2)}`}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        }
        accentColor="text-accent-red"
        change="+1.5%"
        sparklinePath="M0 55 Q20 52 40 55 T80 50 T120 53 T160 45 T200 35"
        loading={loading}
      />

      {/* Card 8: Response Time */}
      <MetricCard
        title="Avg Response Time"
        value={avgLatency === 0.02 ? '0.02s' : `${avgLatency.toFixed(2)}s`}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        }
        accentColor="text-accent-orange"
        change="+12.1%"
        sparklinePath="M0 55 Q40 50 80 52 T140 45 T200 30"
        loading={loading}
      />
    </div>
  );
}
