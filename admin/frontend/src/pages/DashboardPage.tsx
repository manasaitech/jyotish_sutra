import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../auth';
import { fetchAdminApi } from '../api';
import PlatformOverview from '../components/sections/PlatformOverview';
import ModuleUsage from '../components/sections/ModuleUsage';
import LLMAnalytics from '../components/sections/LLMAnalytics';
import TokenUsage from '../components/sections/TokenUsage';
import CostDashboard from '../components/sections/CostDashboard';
import APIPerformance from '../components/sections/APIPerformance';
import FeatureUsage from '../components/sections/FeatureUsage';
import TopQuestions from '../components/sections/TopQuestions';
import FeedbackDashboard from '../components/sections/FeedbackDashboard';
import SubscriptionMetrics from '../components/sections/SubscriptionMetrics';
import GeographicInsights from '../components/sections/GeographicInsights';
import ErrorDashboard from '../components/sections/ErrorDashboard';
import ActivityFeed from '../components/sections/ActivityFeed';
import RedeemMonitor from '../components/sections/RedeemMonitor';

interface DashboardPageProps {
  user: User;
  token: string;
  activeSection: string;
}

export default function DashboardPage({ user, token, activeSection }: DashboardPageProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSectionData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '';
      switch (activeSection) {
        case 'overview':
          endpoint = '/overview';
          break;
        case 'modules':
          endpoint = '/modules';
          break;
        case 'llm':
          endpoint = '/llm';
          break;
        case 'performance':
          endpoint = '/performance';
          break;
        case 'features':
          endpoint = '/features';
          break;
        case 'questions':
          endpoint = '/questions';
          break;
        case 'feedback':
          endpoint = '/feedback';
          break;
        case 'subscriptions':
          endpoint = '/subscriptions';
          break;
        case 'geography':
          endpoint = '/geography';
          break;
        case 'errors':
          endpoint = '/errors';
          break;
        case 'activity':
          endpoint = '/activity';
          break;
        case 'redeem_monitor':
          endpoint = '/redeem-monitor?minutes=60';
          break;
        default:
          endpoint = '/overview';
      }

      const res = await fetchAdminApi(endpoint, token);
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sync admin metrics.');
    } finally {
      setLoading(false);
    }
  }, [activeSection, token]);

  useEffect(() => {
    fetchSectionData();
  }, [fetchSectionData]);

  if (error) {
    return (
      <div className="bg-accent-rose/10 border border-accent-rose/25 rounded-lg p-6 max-w-xl mx-auto text-center space-y-4 my-12">
        <span className="material-symbols-rounded text-4xl text-accent-rose">report</span>
        <h3 className="text-lg font-bold text-text-primary">Data Sync Failed</h3>
        <p className="text-sm text-text-secondary">{error}</p>
        <button
          onClick={fetchSectionData}
          className="bg-accent-rose text-white text-xs font-semibold px-4 py-2 rounded-btn cursor-pointer transition-transform hover:scale-105"
        >
          Retry Sync
        </button>
      </div>
    );
  }

  // Render the matching tab content
  switch (activeSection) {
    case 'overview':
      return <PlatformOverview data={data} loading={loading} />;
    case 'modules':
      return <ModuleUsage data={data} loading={loading} />;
    case 'llm':
      return <LLMAnalytics data={data} loading={loading} />;
    case 'performance':
      return <APIPerformance data={data} loading={loading} />;
    case 'features':
      return <FeatureUsage data={data} loading={loading} />;
    case 'questions':
      return <TopQuestions data={data} loading={loading} />;
    case 'feedback':
      return <FeedbackDashboard data={data} loading={loading} />;
    case 'subscriptions':
      return <SubscriptionMetrics data={data} loading={loading} />;
    case 'geography':
      return <GeographicInsights data={data} loading={loading} />;
    case 'errors':
      return <ErrorDashboard data={data} loading={loading} />;
    case 'activity':
      return <ActivityFeed data={data} loading={loading} />;
    case 'redeem_monitor':
      return <RedeemMonitor initialData={data} loading={loading} token={token} />;
    default:
      return <PlatformOverview data={data} loading={loading} />;
  }
}
