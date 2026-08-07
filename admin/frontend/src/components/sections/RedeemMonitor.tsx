import React, { useState, useEffect, useCallback } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { fetchAdminApi } from '../../api';
import MetricCard from '../MetricCard';
import SectionCard from '../SectionCard';

interface KPIStats {
  active_users: number;
  redeem_active_users: number;
  total_redeem_users_ever: number;
  new_redemptions: number;
  total_llm_requests: number;
  avg_requests_per_user: number;
  failed_llm_requests: number;
  failed_db_queries: number;
  avg_latency_ms: number;
}

interface UserRequestDetail {
  email: string;
  campaign_name: string;
  requests_count: number;
  last_request_at: string | null;
}

interface TimeSeriesPoint {
  time: string;
  requests: number;
  latency: number;
}

interface CampaignDistPoint {
  name: string;
  value: number;
}

interface RedeemMonitorData {
  minutes: number;
  kpis: KPIStats;
  time_series: TimeSeriesPoint[];
  requests_per_user: UserRequestDetail[];
  campaign_distribution: CampaignDistPoint[];
}

interface RedeemMonitorProps {
  initialData: RedeemMonitorData | null;
  loading: boolean;
  token: string;
}

const COLORS = ['#d97706', '#2563eb', '#16a34a', '#db2777', '#7c3aed', '#0891b2', '#ea580c'];

export default function RedeemMonitor({ initialData, loading: initialLoading, token }: RedeemMonitorProps) {
  const [minutes, setMinutes] = useState<number>(60);
  const [data, setData] = useState<RedeemMonitorData | null>(initialData);
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(15);

  const fetchStats = useCallback(async (minsToFetch: number, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const res = await fetchAdminApi(`/redeem-monitor?minutes=${minsToFetch}`, token);
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sync live monitor metrics.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [token]);

  // Handle manual tab content sync when initialData changes or components mount
  useEffect(() => {
    if (initialData && minutes === 60) {
      setData(initialData);
    } else {
      fetchStats(minutes);
    }
  }, [initialData, minutes, fetchStats]);

  // Auto refresh logic
  useEffect(() => {
    if (!autoRefresh) return;
    
    setRefreshCountdown(15);
    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          fetchStats(minutes, false); // fetch silently in background
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, minutes, fetchStats]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setMinutes(value);
    fetchStats(value);
  };

  const handleManualRefresh = () => {
    fetchStats(minutes);
    setRefreshCountdown(15);
  };

  // Filter user request list based on search query
  const filteredUsers = data?.requests_per_user.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.campaign_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const kpis = data?.kpis;
  const timeSeries = data?.time_series || [];
  const campaignDist = data?.campaign_distribution || [];

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    
    if (minutes <= 300) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${month}-${day} ${timeStr}`;
    }
  };

  const formattedTimeSeries = timeSeries.map(point => ({
    ...point,
    time: formatTime(point.time),
    latency: parseFloat((point.latency / 1000).toFixed(2))
  }));

  // Sparkline mockup paths for metric cards
  const sparklineUsers = "M0 40 Q 25 35, 50 38 T 100 15 T 150 25 T 200 8";
  const sparklineRedeem = "M0 45 Q 25 40, 50 20 T 100 35 T 150 15 T 200 5";
  const sparklineRequests = "M0 45 Q 25 30, 50 42 T 100 10 T 150 25 T 200 3";
  const sparklineAvg = "M0 30 Q 25 35, 50 30 T 100 32 T 150 28 T 200 30";

  return (
    <div className="space-y-6">
      {/* Control panel and filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface border border-parchment-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {autoRefresh && (
              <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            )}
            <span className={`relative inline-block rounded-full h-3 w-3 ${autoRefresh ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-charcoal-text">
              {autoRefresh ? `Real-Time Syncing (Refreshing in ${refreshCountdown}s)` : 'Live Monitoring Paused'}
            </h3>
            <p className="text-xs text-on-surface-variant">Streamed directly from AI gateway logs</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Toggle Auto Refresh */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
              autoRefresh 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                : 'bg-surface border-parchment-border text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{autoRefresh ? 'pause' : 'play_arrow'}</span>
            {autoRefresh ? 'Pause Auto-Refresh' : 'Resume Auto-Refresh'}
          </button>

          {/* Time Filter Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-on-surface-variant">Time Range:</span>
            <select
              value={minutes}
              onChange={handleFilterChange}
              className="bg-surface border border-parchment-border text-charcoal-text rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-kesari-primary focus:border-kesari-primary shadow-sm cursor-pointer"
            >
              <option value={10}>Last 10 Minutes</option>
              <option value={30}>Last 30 Minutes</option>
              <option value={60}>Last 1 Hour</option>
              <option value={120}>Last 2 Hours</option>
              <option value={300}>Last 5 Hours</option>
              <option value={1440}>Last 24 Hours</option>
            </select>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="p-2 border border-parchment-border bg-surface hover:bg-surface-container rounded-xl text-on-surface-variant disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            title="Manual sync now"
          >
            <span className={`material-symbols-outlined text-lg block ${loading ? 'animate-spin' : ''}`}>sync</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* User Engagement KPI Cards Row */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#d97706]/75">User Engagement Metrics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Active Users (Period)"
            value={kpis?.active_users ?? 0}
            icon={<span className="material-symbols-outlined text-lg text-kesari-primary">group</span>}
            accentColor="text-kesari-primary"
            change="Live Now"
            sparklinePath={sparklineUsers}
            loading={loading}
          />

          <MetricCard
            title="QR Redeemed Active"
            value={`${kpis?.redeem_active_users ?? 0} / ${kpis?.total_redeem_users_ever ?? 0}`}
            icon={<span className="material-symbols-outlined text-lg text-blue-600">qr_code_2</span>}
            accentColor="text-blue-600"
            change={`+${kpis?.new_redemptions ?? 0} new`}
            sparklinePath={sparklineRedeem}
            loading={loading}
          />

          <MetricCard
            title="LLM Requests Sent"
            value={kpis?.total_llm_requests ?? 0}
            icon={<span className="material-symbols-outlined text-lg text-green-600">forum</span>}
            accentColor="text-green-600"
            change="Live Load"
            sparklinePath={sparklineRequests}
            loading={loading}
          />

          <MetricCard
            title="Avg Requests / User"
            value={kpis?.avg_requests_per_user ?? 0}
            icon={<span className="material-symbols-outlined text-lg text-purple-600">bar_chart</span>}
            accentColor="text-purple-600"
            change="Intensity"
            sparklinePath={sparklineAvg}
            loading={loading}
          />
        </div>
      </div>

      {/* Gateway Performance & Health Cards Row */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#d97706]/75">Gateway Performance & Health</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <MetricCard
            title="Avg LLM Latency"
            value={kpis?.avg_latency_ms ? `${(kpis.avg_latency_ms / 1000).toFixed(2)}s` : '0.00s'}
            icon={<span className="material-symbols-outlined text-lg text-indigo-600">speed</span>}
            accentColor="text-indigo-600"
            change="Response"
            sparklinePath="M0 35 Q 25 25, 50 32 T 100 15 T 150 20 T 200 12"
            loading={loading}
          />

          <MetricCard
            title="Failed LLM Requests"
            value={kpis?.failed_llm_requests ?? 0}
            icon={<span className="material-symbols-outlined text-lg text-red-600">error_med</span>}
            accentColor="text-red-600"
            change={kpis?.failed_llm_requests && kpis.failed_llm_requests > 0 ? 'Errors Detected' : 'Healthy'}
            sparklinePath="M0 45 Q 25 45, 50 45 T 100 45 T 150 45 T 200 45"
            loading={loading}
          />

          <MetricCard
            title="Failed Database Queries"
            value={kpis?.failed_db_queries ?? 0}
            icon={<span className="material-symbols-outlined text-lg text-rose-600">database_off</span>}
            accentColor="text-rose-600"
            change={kpis?.failed_db_queries && kpis.failed_db_queries > 0 ? 'Queries Failed' : 'Healthy'}
            sparklinePath="M0 45 Q 25 45, 50 45 T 100 45 T 150 45 T 200 45"
            loading={loading}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LLM Requests Rate chart */}
        <div className="lg:col-span-2">
          <SectionCard
            title="LLM Requests Rate"
            description={`Monitoring incoming query volume per minute over the selected time range (${minutes} mins)`}
            icon="query_stats"
            loading={loading}
          >
            <div className="flex-1 w-full h-[320px]">
              {timeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedTimeSeries} margin={{ top: 15, right: -5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#d97706" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#8b5cf6" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      unit="s"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        color: '#1e293b',
                        fontSize: '12px'
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="requests" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" name="Queries" />
                    <Area yAxisId="right" type="monotone" dataKey="latency" stroke="#8b5cf6" strokeWidth={2} fillOpacity={0.5} fill="url(#colorLatency)" name="Latency (s)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
                  No LLM query logs found in this time range.
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Campaign breakdown pie chart */}
        <div>
          <SectionCard
            title="Redeem vs Direct Users"
            description="Campaign origin of active users in this period"
            icon="pie_chart"
            loading={loading}
          >
            <div className="flex-1 w-full h-[320px] flex flex-col justify-center items-center">
              {campaignDist.length > 0 ? (
                <>
                  <div className="w-full h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={campaignDist}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {campaignDist.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            color: '#1e293b',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Custom Legend for cleaner layout */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 px-2">
                    {campaignDist.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="text-on-surface-variant font-medium">{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-on-surface-variant text-sm">No user origin metrics in this range.</div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Requests per user list table */}
      <SectionCard
        title="Active User LLM Consumption"
        description="Detailed requests sent per user during this monitoring window"
        icon="person_search"
        loading={loading}
        actions={
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">search</span>
            </span>
            <input
              type="text"
              placeholder="Search email or campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface border border-parchment-border text-charcoal-text rounded-xl pl-9 pr-3 py-1.5 w-60 outline-none text-xs focus:ring-2 focus:ring-kesari-primary focus:border-kesari-primary shadow-sm"
            />
          </div>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-parchment-border bg-surface shadow-inner">
          <table className="min-w-full divide-y divide-parchment-border">
            <thead className="bg-bg-secondary/40 text-on-surface-variant text-[10px] font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4.5 text-left">User Email</th>
                <th scope="col" className="px-6 py-4.5 text-left">Campaign / Path</th>
                <th scope="col" className="px-6 py-4.5 text-center">LLM Requests</th>
                <th scope="col" className="px-6 py-4.5 text-right">Last Action Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-border text-xs text-charcoal-text font-medium">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <tr key={user.email + idx} className="hover:bg-bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-left font-semibold text-slate-800">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.campaign_name === 'Direct Login'
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {user.campaign_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                      {user.requests_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-[11px] text-on-surface-variant font-mono">
                      {user.last_request_at ? new Date(user.last_request_at).toLocaleTimeString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">
                    No active user requests match the criteria inside this window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
