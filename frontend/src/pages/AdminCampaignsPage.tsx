import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://kundli-gpt-clone-back.onrender.com')

interface Campaign {
  id: string
  campaign_name: string
  plan: string
  duration_hours: number
  max_redemptions: number
  redeemed_count: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  status: string
  qr_url: string
}

interface CampaignDetail extends Campaign {
  qr_image: string
  stats: {
    active_users: number
    expired_users: number
    average_session_time_mins: number
    average_llm_requests: number
    average_tokens: number
    conversion_rate: number
  }
}

interface AggregatedAnalytics {
  total_qr_scans: number
  successful_activations: number
  failed_activations: number
  duplicate_attempts: number
  expired_campaign_attempts: number
  most_active_campaign: string
  average_trial_duration_used_hours: number
  average_session_time_mins: number
  llm_requests_during_trial: number
  prompt_tokens: number
  completion_tokens: number
  conversion_to_paid_rate: number
}

export default function AdminCampaignsPage() {
  const { user } = useAuth()
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Selection & Details
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [details, setDetails] = useState<CampaignDetail | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Aggregated Stats
  const [analytics, setAnalytics] = useState<AggregatedAnalytics | null>(null)

  // Form State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formPlan, setFormPlan] = useState('pro')
  const [formDuration, setFormDuration] = useState('10')
  const [formMaxUsers, setFormMaxUsers] = useState('100')
  const [formStartsAt, setFormStartsAt] = useState('')
  const [formExpiresAt, setFormExpiresAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Copy Feedback
  const [copiedLink, setCopiedLink] = useState(false)

  // Load basic campaigns and aggregated stats
  const loadDashboardData = async () => {
    if (!user?.token) return
    try {
      setLoading(true)
      setError(null)
      
      // Load list
      const listRes = await fetch(`${API_BASE_URL}/api/admin/campaigns`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      })
      if (!listRes.ok) {
        if (listRes.status === 403 || listRes.status === 401) {
          throw new Error('Unauthorized. Admin permissions required.')
        }
        throw new Error('Failed to load campaigns.')
      }
      const listData = await listRes.json()
      setCampaigns(listData)

      // Load analytics
      const analyticsRes = await fetch(`${API_BASE_URL}/api/admin/analytics/campaigns`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      })
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [user])

  // Load detailed single campaign stats
  const handleViewDetails = async (id: string) => {
    if (!user?.token) return
    try {
      setSelectedId(id)
      setDetailsLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/admin/campaigns/${id}`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      })
      if (!res.ok) throw new Error('Failed to load campaign details.')
      const data = await res.json()
      setDetails(data)
    } catch (err: any) {
      alert(err.message || 'Failed to load details.')
    } finally {
      setDetailsLoading(false)
    }
  }

  // Toggle Campaign active status
  const handleToggleActive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user?.token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/campaigns/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${user.token}` },
      })
      if (!res.ok) throw new Error('Failed to toggle status.')
      
      // Refresh list & current details if selected
      loadDashboardData()
      if (selectedId === id) {
        handleViewDetails(id)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status.')
    }
  }

  // Create Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.token || submitting) return
    if (!formName.trim() || !formDuration || !formMaxUsers) {
      alert('Please fill in all required fields.')
      return
    }

    try {
      setSubmitting(true)
      const body = {
        campaign_name: formName.trim(),
        plan: formPlan,
        duration_hours: parseInt(formDuration, 10),
        max_redemptions: parseInt(formMaxUsers, 10),
        starts_at: formStartsAt ? new Date(formStartsAt).toISOString() : null,
        expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
      }

      const res = await fetch(`${API_BASE_URL}/api/admin/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to create campaign.')
      }

      // Reset Form and Modal
      setFormName('')
      setFormPlan('pro')
      setFormDuration('10')
      setFormMaxUsers('100')
      setFormStartsAt('')
      setFormExpiresAt('')
      setShowCreateModal(false)

      // Refresh data
      await loadDashboardData()
      
      // Auto-view the newly created campaign details
      const responseData = await res.json()
      if (responseData.campaign && responseData.campaign.id) {
        handleViewDetails(responseData.campaign.id)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create campaign.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (loading && campaigns.length === 0) {
    return <div className="text-center py-20 text-on-surface-variant font-serif">Aligning admin cosmos...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans bg-background text-on-background min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-xs font-bold text-primary uppercase tracking-wide">
            <span className="material-symbols-outlined text-sm">settings_suggest</span>
            Admin Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-on-surface mt-1">
            Access Campaigns Manager
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
            Provision, monitor, and configure QR code invitations for temporary AstroSutra Pro/Standard trial access.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary hover:bg-primary-container text-white font-bold text-sm tracking-wide shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">add_box</span>
          <span>Create Campaign</span>
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="p-4 bg-error-container/20 border border-error/30 text-error rounded-2xl text-sm flex items-center gap-3">
          <span className="material-symbols-outlined shrink-0 text-xl">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* SYSTEM METRICS SUMMARY */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 bg-surface border border-outline-variant/40 rounded-3xl space-y-2">
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Total Scans</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-on-surface">{analytics.total_qr_scans}</div>
          </div>
          <div className="p-4 sm:p-5 bg-surface border border-outline-variant/40 rounded-3xl space-y-2">
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Successful Claims</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{analytics.successful_activations}</div>
          </div>
          <div className="p-4 sm:p-5 bg-surface border border-outline-variant/40 rounded-3xl space-y-2">
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Failed Attempts</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-500">{analytics.failed_activations + analytics.duplicate_attempts + analytics.expired_campaign_attempts}</div>
          </div>
          <div className="p-4 sm:p-5 bg-surface border border-outline-variant/40 rounded-3xl space-y-2">
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Paid Conversion</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-500">{analytics.conversion_to_paid_rate}%</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: CAMPAIGNS TABLE */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface border border-outline-variant/50 rounded-3xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-outline-variant/50 bg-surface/50">
              <h2 className="text-lg font-bold font-serif text-on-surface">Active Campaigns</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/40 text-[10px] sm:text-xs text-on-surface-variant uppercase tracking-wider font-bold bg-surface-variant/20">
                    <th className="p-4 pl-6">Campaign</th>
                    <th className="p-4">Tier</th>
                    <th className="p-4 text-center">Duration</th>
                    <th className="p-4 text-center">Scans</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-on-surface-variant">
                        No campaigns provisioned yet.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => handleViewDetails(c.id)}
                        className={`hover:bg-surface-variant/20 transition-colors cursor-pointer ${
                          selectedId === c.id ? 'bg-surface-variant/35' : ''
                        }`}
                      >
                        <td className="p-4 pl-6 font-semibold text-on-surface max-w-[150px] truncate">
                          {c.campaign_name}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                            c.plan === 'pro' 
                              ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20' 
                              : 'bg-orange-500/10 text-orange-800 border border-orange-500/20'
                          }`}>
                            {c.plan}
                          </span>
                        </td>
                        <td className="p-4 text-center font-medium">{c.duration_hours}h</td>
                        <td className="p-4 text-center text-on-surface-variant font-mono">
                          {c.redeemed_count} / {c.max_redemptions}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.status === 'Active' ? 'bg-emerald-500/10 text-emerald-700' :
                            c.status === 'Disabled' ? 'bg-rose-500/10 text-rose-700' :
                            c.status === 'Expired' ? 'bg-amber-500/10 text-amber-700' :
                            'bg-slate-500/10 text-slate-700'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={(e) => handleToggleActive(c.id, e)}
                              className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                                c.is_active 
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={c.is_active ? 'Disable campaign' : 'Enable campaign'}
                            >
                              {c.is_active ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL & STATISTICS */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-outline-variant/50 rounded-3xl shadow-xs p-6 space-y-6 sticky top-24 min-h-[450px]">
            {detailsLoading ? (
              <div className="text-center py-20 text-on-surface-variant">Gathering campaign statistics...</div>
            ) : details ? (
              <div className="space-y-6 animate-fade-in text-xs sm:text-sm">
                
                {/* Header detail */}
                <div className="border-b border-outline-variant/40 pb-4">
                  <h3 className="text-xl font-bold font-serif text-on-surface max-w-[280px] truncate">
                    {details.campaign_name}
                  </h3>
                  <div className="flex gap-2 items-center mt-2">
                    <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                      details.plan === 'pro' 
                        ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20' 
                        : 'bg-orange-500/10 text-orange-800 border border-orange-500/20'
                    }`}>
                      {details.plan}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      Duration: {details.duration_hours} hours
                    </span>
                  </div>
                </div>

                {/* QR preview box */}
                <div className="bg-surface-variant/20 border border-outline-variant/30 rounded-2xl p-4 text-center space-y-3">
                  <div className="w-40 h-40 bg-white border border-outline-variant/50 mx-auto flex items-center justify-center p-2 rounded-xl">
                    {details.qr_image ? (
                      <img src={details.qr_image} alt="Campaign QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-xs text-on-surface-variant">QR Unavailable</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyLink(details.qr_url)}
                      className="flex-1 py-2 px-3 border border-outline-variant hover:border-primary/50 text-on-surface hover:text-primary rounded-xl font-semibold text-xs transition-all cursor-pointer whitespace-nowrap"
                    >
                      {copiedLink ? '✓ Copied' : 'Copy Link'}
                    </button>
                    
                    {details.qr_image && (
                      <a
                        href={details.qr_image}
                        download={`astrosutra_qr_${details.campaign_name.replace(/\s+/g, '_')}.svg`}
                        className="flex-1 py-2 px-3 bg-primary hover:bg-primary-container text-white text-center rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap no-underline block"
                      >
                        Download QR
                      </a>
                    )}
                  </div>
                </div>

                {/* Redemption stats */}
                <div className="space-y-3 border-b border-outline-variant/35 pb-4">
                  <h4 className="font-bold text-on-surface">Redemptions Status</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-variant/10 border border-outline-variant/30 p-3 rounded-xl">
                      <div className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">Active Users</div>
                      <div className="text-base font-bold text-emerald-600 mt-0.5">{details.stats.active_users}</div>
                    </div>
                    <div className="bg-surface-variant/10 border border-outline-variant/30 p-3 rounded-xl">
                      <div className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">Expired Users</div>
                      <div className="text-base font-bold text-on-surface-variant mt-0.5">{details.stats.expired_users}</div>
                    </div>
                  </div>
                </div>

                {/* Trial activity usage stats */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-on-surface">Usage During Trial</h4>
                  
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-on-surface-variant">Avg LLM Requests</span>
                    <span className="font-semibold text-on-surface">{details.stats.average_llm_requests} requests</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-on-surface-variant">Avg Tokens Consumed</span>
                    <span className="font-semibold text-on-surface">{details.stats.average_tokens} tokens</span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-on-surface-variant">Paid Conversion Rate</span>
                    <span className="font-bold text-amber-500">{details.stats.conversion_rate}%</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-on-surface-variant space-y-3">
                <span className="material-symbols-outlined text-4xl text-outline">query_stats</span>
                <p className="text-xs max-w-[200px] leading-relaxed">
                  Select a campaign from the table to view analytics, copy links, or download QR invitation codes.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CREATE CAMPAIGN DIALOG MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-fade-in space-y-6">
            
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant/40 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold font-serif text-on-surface">Create Access Campaign</h3>
              <p className="text-[11px] text-on-surface-variant">
                Configure limits, times, and access rules for this invitation.
              </p>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-on-surface mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. ITM Seminar Aug 2026"
                  className="w-full px-4 py-2.5 bg-surface-variant/20 border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary transition-all text-on-surface text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Subscription Plan</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-variant/20 border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary transition-all text-on-surface text-sm cursor-pointer"
                  >
                    <option value="pro">Pro Plan</option>
                    <option value="standard">Standard Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Duration (Hours) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-variant/20 border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary transition-all text-on-surface text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Maximum Activations *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formMaxUsers}
                  onChange={(e) => setFormMaxUsers(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-variant/20 border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary transition-all text-on-surface text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Starts At (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formStartsAt}
                    onChange={(e) => setFormStartsAt(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-variant/20 border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary transition-all text-on-surface text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Expires At (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-variant/20 border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary transition-all text-on-surface text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary hover:bg-primary-container text-white font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">qr_code_2</span>
                    <span>Generate Invite & QR</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
