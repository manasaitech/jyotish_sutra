import { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface KPIStats {
  active_users_period: number;
  redeem_active_users_period: number;
  total_redeemed_users: number;
  llm_requests_period: number;
  avg_requests_per_user: number;
  failed_llm_requests: number;
  failed_db_queries: number;
  avg_latency_ms: number;
}

interface TimeSeriesPoint {
  time: string;
  requests: number;
  latency: number;
}

interface UserRequestDetail {
  email: string;
  campaign_name: string;
  requests_count: number;
  last_request_at: string | null;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8050'
    : 'https://kundli-gpt-clone-1.onrender.com');

export default function App() {
  const [minutes, setMinutes] = useState<number>(120);
  const [kpis, setKpis] = useState<KPIStats | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [userRequests, setUserRequests] = useState<UserRequestDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Poll intervals
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    let active = true;

    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/campaigns/redeem-monitor?minutes=${minutes}`);
        if (!res.ok) {
          throw new Error(`Failed to load data (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (active) {
          setKpis(data.kpis);
          setTimeSeries(data.time_series || []);
          setUserRequests(data.requests_per_user || []);
          setError(null);
          setLastRefreshed(new Date());
        }
      } catch (err: any) {
        if (active) {
          console.error("Monitor fetch error:", err);
          setError(err.message || "Failed to load monitor analytics");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    // Auto-refresh stats every 20 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 20000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [minutes, refreshCount]);

  // Format ISO timestamp in user's local timezone
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

  // Pie chart calculation
  const directUsers = (kpis?.active_users_period || 0) - (kpis?.redeem_active_users_period || 0);
  const pieData = [
    { name: 'Redeem Users', value: Math.max(0, kpis?.redeem_active_users_period || 0), color: '#E67E22' },
    { name: 'Direct Users', value: Math.max(0, directUsers), color: '#34495E' }
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-[#FAF8F3] py-10 px-4 sm:px-6 lg:px-8 font-sans text-[#2C3E50]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-3xl border border-orange-100/40 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/40 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500 rounded-2xl text-white shadow-md shadow-orange-500/20">
                <span className="material-symbols-outlined text-2xl font-bold">query_stats</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">
                  Redeem & Gateway Monitor
                </h1>
                <p className="text-sm text-slate-400 font-medium">
                  Real-time Campaign Verification & Gateway Performance Center
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 relative z-10">
            {/* Filter Toggle */}
            <div className="inline-flex rounded-xl bg-orange-50/50 border border-orange-100/50 p-1">
              {[
                { value: 10, label: '10m' },
                { value: 30, label: '30m' },
                { value: 60, label: '1h' },
                { value: 120, label: '2h' },
                { value: 300, label: '5h' },
                { value: 1440, label: '24h' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMinutes(opt.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    minutes === opt.value
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => setRefreshCount(prev => prev + 1)}
              className="p-2.5 hover:bg-orange-50/50 text-slate-400 hover:text-orange-500 border border-slate-200/50 hover:border-orange-100/50 rounded-xl transition-all active:scale-95 cursor-pointer bg-white"
              title="Refresh Stats Now"
            >
              <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>
                sync
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4 text-red-700 text-sm font-medium flex items-center gap-3">
            <span className="material-symbols-outlined text-xl">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* --- ROW 1: USER ENGAGEMENT METRICS --- */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">
            User Engagement Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Active Users (Period) */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                  <span className="material-symbols-outlined text-lg">group</span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-50 text-orange-600">Period</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Active Users (Period)</p>
                <h3 className="text-3xl font-bold text-slate-800">{loading ? '...' : kpis?.active_users_period ?? 0}</h3>
              </div>
            </div>

            {/* QR Redeemed Active */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                  <span className="material-symbols-outlined text-lg">qr_code_2</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-50 text-orange-600">Campaign</span>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium">Total logged: {kpis?.total_redeemed_users ?? 0}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">QR Redeemed Active</p>
                <h3 className="text-3xl font-bold text-slate-800">{loading ? '...' : kpis?.redeem_active_users_period ?? 0}</h3>
              </div>
            </div>

            {/* LLM Requests */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                  <span className="material-symbols-outlined text-lg">chat_bubble</span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-50 text-orange-600">Queries</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">LLM Requests Sent</p>
                <h3 className="text-3xl font-bold text-slate-800">{loading ? '...' : kpis?.llm_requests_period ?? 0}</h3>
              </div>
            </div>

            {/* Requests per User */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                  <span className="material-symbols-outlined text-lg">analytics</span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-50 text-orange-600">Intensity</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Avg Requests / User</p>
                <h3 className="text-3xl font-bold text-slate-800">{loading ? '...' : kpis?.avg_requests_per_user ?? '0.0'}</h3>
              </div>
            </div>

          </div>
        </div>

        {/* --- ROW 2: GATEWAY PERFORMANCE & HEALTH --- */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">
            Gateway Performance & Health
          </h2>
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
                  {loading ? '...' : kpis?.failed_llm_requests ?? 0}
                </h3>
              </div>
            </div>

            {/* Failed DB Queries */}
            <div className="bg-white border border-orange-100/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                  <span className="material-symbols-outlined text-lg">database</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpis?.failed_db_queries && kpis.failed_db_queries > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-red-50 text-red-600'}`}>
                  {kpis?.failed_db_queries && kpis.failed_db_queries > 0 ? 'Failures Detected' : 'Healthy'}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Failed Database Queries</p>
                <h3 className={`text-3xl font-bold ${kpis?.failed_db_queries && kpis.failed_db_queries > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {loading ? '...' : kpis?.failed_db_queries ?? 0}
                </h3>
              </div>
            </div>

          </div>
        </div>

        {/* Charts & Graphs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Area Chart */}
          <div className="bg-white border border-orange-100/50 rounded-2xl p-5 shadow-sm lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-800">Gateway Activity Time-Series</h2>
              <p className="text-xs text-slate-400 mt-0.5">Queries volume vs average latency per minute</p>
            </div>
            <div className="h-72">
              {timeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedTimeSeries}>
                    <defs>
                      <linearGradient id="colorRequestsDemo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E67E22" stopOpacity={0.15}/>
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
            <div className="h-72 flex flex-col justify-center items-center">
              {pieData.length > 0 ? (
                <>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-6 mt-4 text-xs font-semibold">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-500">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-sm">No active user telemetry records.</div>
              )}
            </div>
          </div>

        </div>

        {/* User Statistics breakdown table */}
        <div className="bg-white border border-orange-100/50 rounded-2xl p-6 shadow-sm">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">User LLM Consumption Details</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Active user request counts and campaigns attribution in the last {minutes} minutes
              </p>
            </div>
            <span className="text-xs text-slate-400 font-semibold italic">
              Last refresh: {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">User Email</th>
                  <th className="py-3 px-4">Attributed Campaign</th>
                  <th className="py-3 px-4 text-center">Requests Sent</th>
                  <th className="py-3 px-4 text-right">Last Action Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                {loading && userRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">Loading consumption records...</td>
                  </tr>
                ) : userRequests.length > 0 ? (
                  userRequests.map((u, i) => (
                    <tr key={i} className="hover:bg-orange-50/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          u.campaign_name === 'Direct Login'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-orange-50 text-orange-600 border border-orange-100/50'
                        }`}>
                          {u.campaign_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">{u.requests_count}</td>
                      <td className="py-3.5 px-4 text-right text-slate-400">
                        {u.last_request_at ? new Date(u.last_request_at).toLocaleTimeString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">No user queries recorded in the selected period.</td>
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
