import React, { useState, useEffect, useCallback } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://kundli-gpt-clone-1.onrender.com');

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
  total_paid_subscriptions?: number;
  total_payments_sum?: number;
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

const COLORS = ['#d97706', '#2563eb', '#16a34a', '#db2777', '#7c3aed', '#0891b2', '#ea580c'];

export default function RedeemMonitorDemoPage() {
  const [minutes, setMinutes] = useState<number>(60);
  const [data, setData] = useState<RedeemMonitorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(15);

  const fetchStats = useCallback(async (minsToFetch: number, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/redeem-monitor?minutes=${minsToFetch}`);
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sync live monitor metrics.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(minutes);
  }, [minutes, fetchStats]);

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

  return (
    <div className="min-h-screen bg-[#FAF8F3] py-10 px-4 sm:px-6 lg:px-8 font-sans text-[#2C3E50]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-orange-100 pb-5 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#E67E22]">Live Redeem & LLM Monitor</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time statistics of astrological consultations and QR code campaigns.</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-orange-50/50">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-600">Public Live Demo</span>
          </div>
        </header>

        {/* Control panel and filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-orange-100/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              {autoRefresh && (
                <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
              )}
              <span className={`relative inline-block rounded-full h-3 w-3 ${autoRefresh ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                {autoRefresh ? `Real-Time Syncing (Refreshing in ${refreshCountdown}s)` : 'Live Monitoring Paused'}
              </h3>
              <p className="text-xs text-slate-400">Streamed directly from AstroSutra gateway logs</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Toggle Auto Refresh */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                autoRefresh 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{autoRefresh ? 'pause' : 'play_arrow'}</span>
              {autoRefresh ? 'Pause Auto-Refresh' : 'Resume Auto-Refresh'}
            </button>

            {/* Time Filter Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Time Range:</span>
              <select
                value={minutes}
                onChange={handleFilterChange}
                className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#E67E22] focus:border-[#E67E22] shadow-sm cursor-pointer"
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
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
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
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">User Engagement Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Active Users */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-orange-50 rounded-lg text-[#E67E22]">
                  <span className="material-symbols-outlined text-lg">group</span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">Active</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Active Users (Period)</p>
                <h3 className="text-3xl font-bold text-slate-800">{loading ? '...' : (kpis?.active_users ?? 0)}</h3>
              </div>
            </div>

            {/* QR Redeemed */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <span className="material-symbols-outlined text-lg">qr_code_2</span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                  +{kpis?.new_redemptions ?? 0} new
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">QR Redeemed Active</p>
                <h3 className="text-3xl font-bold text-slate-800">
                  {loading ? '...' : `${kpis?.redeem_active_users ?? 0} / ${kpis?.total_redeem_users_ever ?? 0}`}
                </h3>
              </div>
            </div>

            {/* LLM Requests */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <span className="material-symbols-outlined text-lg">forum</span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">Live Load</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">LLM Requests Sent</p>
                <h3 className="text-3xl font-bold text-slate-800">{loading ? '...' : (kpis?.total_llm_requests ?? 0)}</h3>
              </div>
            </div>

            {/* Average Requests */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <span className="material-symbols-outlined text-lg">bar_chart</span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-600">Avg intensity</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Avg Requests / User</p>
                <h3 className="text-3xl font-bold text-slate-800">{loading ? '...' : (kpis?.avg_requests_per_user ?? 0)}</h3>
              </div>
            </div>

          </div>
        </div>

        {/* Paid Subscription & Financial Metrics Row */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Subscription & Financial Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Subscriptions Taken */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <span className="material-symbols-outlined text-lg">workspace_premium</span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-600">Standard / Pro</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Active Paid Subscriptions</p>
                <h3 className="text-3xl font-bold text-slate-800">
                  {loading ? '...' : (kpis?.total_paid_subscriptions ?? 0)}
                </h3>
              </div>
            </div>

            {/* Total Payments Sum */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <span className="material-symbols-outlined text-lg">payments</span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">Total Payments Done</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Total Payments (INR)</p>
                <h3 className="text-3xl font-bold text-emerald-600">
                  {loading ? '...' : `₹ ${(kpis?.total_payments_sum ?? 0).toLocaleString('en-IN')}`}
                </h3>
              </div>
            </div>

          </div>
        </div>

        {/* Gateway Performance & Health Row */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Gateway Performance & Health</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            {/* LLM Latency */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <span className="material-symbols-outlined text-lg">speed</span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">Response</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Avg LLM Latency</p>
                <h3 className="text-3xl font-bold text-slate-800">
                  {loading ? '...' : kpis?.avg_latency_ms ? `${(kpis.avg_latency_ms / 1000).toFixed(2)}s` : '0.00s'}
                </h3>
              </div>
            </div>

            {/* Failed LLM Requests */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                  <span className="material-symbols-outlined text-lg">error_med</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpis?.failed_llm_requests && kpis.failed_llm_requests > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-red-50 text-red-600'}`}>
                  {kpis?.failed_llm_requests && kpis.failed_llm_requests > 0 ? 'Errors Detected' : 'Healthy'}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Failed LLM Requests</p>
                <h3 className={`text-3xl font-bold ${kpis?.failed_llm_requests && kpis.failed_llm_requests > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {loading ? '...' : (kpis?.failed_llm_requests ?? 0)}
                </h3>
              </div>
            </div>

            {/* Failed DB Queries */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                  <span className="material-symbols-outlined text-lg">database_off</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpis?.failed_db_queries && kpis.failed_db_queries > 0 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-rose-50 text-rose-600'}`}>
                  {kpis?.failed_db_queries && kpis.failed_db_queries > 0 ? 'Queries Failed' : 'Healthy'}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Failed Database Queries</p>
                <h3 className={`text-3xl font-bold ${kpis?.failed_db_queries && kpis.failed_db_queries > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {loading ? '...' : (kpis?.failed_db_queries ?? 0)}
                </h3>
              </div>
            </div>

          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Area Chart */}
          <div className="lg:col-span-2 bg-white border border-orange-100/50 rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-800">LLM Requests Rate</h2>
              <p className="text-xs text-slate-400 mt-0.5">Monitoring query volume per minute over selected time range ({minutes} mins)</p>
            </div>
            <div className="w-full h-[300px] flex items-center justify-center">
              {loading ? (
                <div className="text-slate-400 text-sm">Syncing chart...</div>
              ) : timeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedTimeSeries} margin={{ top: 15, right: -5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRequestsDemo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E67E22" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#E67E22" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorLatencyDemo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#E67E22" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" fontSize={10} tickLine={false} axisLine={false} unit="s" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="requests" stroke="#E67E22" strokeWidth={2} fillOpacity={1} fill="url(#colorRequestsDemo)" name="Queries" />
                    <Area yAxisId="right" type="monotone" dataKey="latency" stroke="#8b5cf6" strokeWidth={2} fillOpacity={0.5} fill="url(#colorLatencyDemo)" name="Latency (s)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-sm">No query logs found in this time range.</div>
              )}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white border border-orange-100/50 rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-800">Redeem vs Direct Users</h2>
              <p className="text-xs text-slate-400 mt-0.5">Campaign origin of active users in this period</p>
            </div>
            <div className="w-full h-[300px] flex flex-col justify-center items-center">
              {loading ? (
                <div className="text-slate-400 text-sm">Syncing chart...</div>
              ) : campaignDist.length > 0 ? (
                <>
                  <div className="w-full h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={campaignDist}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {campaignDist.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 px-2">
                    {campaignDist.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="text-slate-500 font-medium">{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-sm font-medium">No user origin metrics.</div>
              )}
            </div>
          </div>

        </div>

        {/* Requests Table */}
        <div className="bg-white border border-orange-100/50 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800">Active User LLM Consumption</h2>
              <p className="text-xs text-slate-400 mt-0.5">Detailed requests sent per user during this monitoring window</p>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <span className="material-symbols-outlined text-[16px]">search</span>
              </span>
              <input
                type="text"
                placeholder="Search email or campaign..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 rounded-xl pl-9 pr-3 py-1.5 w-60 outline-none text-xs focus:ring-2 focus:ring-[#E67E22] focus:border-[#E67E22] shadow-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-inner">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4.5 text-left">User Email</th>
                  <th scope="col" className="px-6 py-4.5 text-left">Campaign / Path</th>
                  <th scope="col" className="px-6 py-4.5 text-center">LLM Requests</th>
                  <th scope="col" className="px-6 py-4.5 text-right">Last Action Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      Loading details...
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user, idx) => (
                    <tr key={user.email + idx} className="hover:bg-slate-50/40 transition-colors">
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
                      <td className="px-6 py-4 whitespace-nowrap text-center font-mono font-bold text-slate-900 bg-slate-50/20">
                        {user.requests_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-[11px] text-slate-500 font-mono">
                        {user.last_request_at ? new Date(user.last_request_at).toLocaleTimeString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No active user requests match the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
