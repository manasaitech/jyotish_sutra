import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import MetricCard from '../MetricCard';

interface LogEntry {
  timestamp: string;
  model: string;
  user_email: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
}

interface TrendEntry {
  day: string;
  requests: number;
}

interface TokenDist {
  prompt: number;
  completion: number;
  total: number;
}

interface OverviewData {
  active_users_today: number;
  new_users_today: number;
  total_users: number;
  ai_chats_today: number;
  total_messages_today: number;
  llm_calls_today: number;
  ai_cost_today: number;
  avg_latency_ms: number;
  daily_requests_trend: TrendEntry[];
  token_distribution: TokenDist;
  recent_logs: LogEntry[];
}

interface PlatformOverviewProps {
  data: OverviewData | null;
  loading: boolean;
}

export default function PlatformOverview({ data, loading }: PlatformOverviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Use database stats if present, otherwise default to static mock values
  const activeUsers = data?.active_users_today ?? 12;
  const newUsers = data?.new_users_today ?? 8;
  const totalUsers = data?.total_users ?? 172;
  const aiChats = data?.ai_chats_today ?? 72;
  const aiCost = data?.ai_cost_today ?? 1.20;
  const avgLatency = data?.avg_latency_ms ?? 1080;

  // Fallback static chart values if trend is empty
  const trendData = data?.daily_requests_trend && data.daily_requests_trend.length > 0 
    ? data.daily_requests_trend 
    : [
        { day: 'Mon', requests: 18 },
        { day: 'Tue', requests: 140 },
        { day: 'Wed', requests: 225 },
        { day: 'Thu', requests: 246 },
        { day: 'Fri', requests: 297 },
        { day: 'Sat', requests: 193 },
        { day: 'Sun', requests: 135 },
      ];

  // Token Distribution
  const tokenPrompt = data?.token_distribution?.prompt ?? 3530100;
  const tokenCompletion = data?.token_distribution?.completion ?? 717147;
  const tokenTotal = data?.token_distribution?.total ?? (tokenPrompt + tokenCompletion);

  const pieData = [
    { name: 'Prompt Tokens', value: tokenPrompt, color: '#f0eee9' },
    { name: 'Completion Tokens', value: tokenCompletion, color: '#E67E22' },
  ];

  // Recent Logs
  const logs = data?.recent_logs ?? [];

  // Filter and paginate logs
  const filteredLogs = logs.filter(log => 
    log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const formatTimestamp = (isoStr: string) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-purpose="metrics-grid">
        <MetricCard
          title="Total Users"
          value={totalUsers}
          icon={<span className="material-symbols-outlined text-kesari-primary">group</span>}
          accentColor="text-kesari-primary"
          change="+12.5%"
          sparklinePath="M0 50 Q30 55 60 40 T120 50 T160 35 T200 25"
          loading={loading}
        />
        <MetricCard
          title="Active Users Today"
          value={activeUsers}
          icon={<span className="material-symbols-outlined text-kesari-primary">person</span>}
          accentColor="text-kesari-primary"
          change="+18.2%"
          sparklinePath="M0 50 Q20 40 40 55 T80 45 T120 48 T160 30 T200 10"
          loading={loading}
        />
        <MetricCard
          title="AI Chats Today"
          value={aiChats}
          icon={<span className="material-symbols-outlined text-kesari-primary">chat</span>}
          accentColor="text-kesari-primary"
          change="+25.4%"
          sparklinePath="M0 55 Q40 45 80 50 T140 40 T200 20"
          loading={loading}
        />
        <MetricCard
          title="Today's AI Cost"
          value={`₹${aiCost.toFixed(2)}`}
          icon={<span className="material-symbols-outlined text-kesari-primary">payments</span>}
          accentColor="text-kesari-primary"
          change="+1.5%"
          sparklinePath="M0 55 Q20 52 40 55 T80 50 T120 53 T160 45 T200 35"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily LLM Requests Line Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 relative">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-display text-xl font-semibold text-charcoal-text">Daily LLM Requests</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Volume over the last 7 days</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="w-full h-full skeleton bg-surface-container-high"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9DFC8" opacity={0.5} />
                  <XAxis dataKey="day" stroke="#564337" fontSize={11} />
                  <YAxis stroke="#564337" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FAF8F3', 
                      borderColor: '#E9DFC8', 
                      borderRadius: '8px',
                      color: '#2D2A26'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="#E67E22" 
                    strokeWidth={3} 
                    dot={{ fill: '#ffffff', stroke: '#E67E22', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Token Distribution Pie Chart */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold text-charcoal-text">Token Distribution</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Prompt vs Completion</p>
          </div>
          <div className="flex-1 flex items-center justify-center relative my-4 min-h-[180px]">
            {loading ? (
              <div className="w-36 h-36 rounded-full skeleton bg-surface-container-high"></div>
            ) : (
              <div className="relative w-44 h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Inner Text */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-display font-bold text-charcoal-text leading-none">
                    {(tokenTotal / 1000000).toFixed(1)}M
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mt-1">Total Tokens</span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2 mt-auto">
            <div className="flex justify-between items-center text-xs font-semibold">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-surface-container mr-2 border border-parchment-border"></div>
                <span className="text-on-surface-variant">Prompt Tokens</span>
              </div>
              <span className="text-charcoal-text">{((tokenPrompt / Math.max(tokenTotal, 1)) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-kesari-primary mr-2"></div>
                <span className="text-on-surface-variant">Completion Tokens</span>
              </div>
              <span className="text-charcoal-text">{((tokenCompletion / Math.max(tokenTotal, 1)) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="p-5 border-b border-parchment-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40">
          <div>
            <h3 className="font-display text-xl font-semibold text-charcoal-text">LLM API Requests & Usage</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Detailed log of recent inferences</p>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search email, model..." 
                className="pl-9 pr-4 py-2 border border-parchment-border rounded-lg bg-surface text-xs focus:ring-2 focus:ring-kesari-primary focus:border-kesari-primary outline-none transition-all w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-xs font-semibold text-on-surface-variant border-b border-parchment-border">
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Model</th>
                <th className="py-3.5 px-5">Seeker Email</th>
                <th className="py-3.5 px-5 text-right">Tokens (P/C)</th>
                <th className="py-3.5 px-5 text-right">Latency</th>
                <th className="py-3.5 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs text-charcoal-text">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-kesari-primary border-t-transparent rounded-full animate-spin"></div>
                      <span>Retrieving recent inferences...</span>
                    </div>
                  </td>
                </tr>
              ) : currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                    No recent LLM calls found in history.
                  </td>
                </tr>
              ) : (
                currentLogs.map((log, idx) => {
                  const isFail = log.prompt_tokens === 0 || log.latency_ms > 4000;
                  return (
                    <tr 
                      key={idx} 
                      className="border-b border-parchment-border/50 hover:bg-surface/50 transition-colors"
                    >
                      <td className="py-3.5 px-5 text-on-surface-variant font-mono">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="py-3.5 px-5 font-semibold flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${log.model.includes('groq') ? 'bg-purple-400' : 'bg-kesari-primary'}`}></span>
                        {log.model}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[11px] text-on-surface-variant">
                        {log.user_email}
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold">
                        {log.prompt_tokens} / {log.completion_tokens}
                      </td>
                      <td className="py-3.5 px-5 text-right text-on-surface-variant">
                        {log.latency_ms >= 1000 ? `${(log.latency_ms / 1000).toFixed(2)}s` : `${log.latency_ms}ms`}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {isFail ? (
                          <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-semibold">Failed</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-semibold">Success</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredLogs.length > 0 && (
          <div className="p-4 border-t border-parchment-border bg-white/40 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-medium">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLogs.length)} of {filteredLogs.length} logs
            </span>
            <div className="flex space-x-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-parchment-border rounded bg-surface text-xs text-on-surface-variant disabled:opacity-50 transition-colors hover:bg-surface-container"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded text-xs transition-colors ${
                    currentPage === i + 1 
                      ? 'border-kesari-primary bg-kesari-primary text-white font-semibold shadow-sm' 
                      : 'border-parchment-border bg-surface text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-parchment-border rounded bg-surface text-xs text-on-surface-variant disabled:opacity-50 transition-colors hover:bg-surface-container"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
