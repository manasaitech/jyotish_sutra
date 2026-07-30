import React from 'react';
import SectionCard from '../SectionCard';

interface ActivityItem {
  action: string;
  resource: string;
  status: string;
  time: string;
  user_name: string;
  user_email: string;
}

interface ActivityFeedProps {
  data: { activities: ActivityItem[] } | null;
  loading: boolean;
}

export default function ActivityFeed({ data, loading }: ActivityFeedProps) {
  const activities = data?.activities || [];

  return (
    <SectionCard
      title="Platform Operations Activity Feed"
      description="Recent audit log events capturing operations, administrative, and configuration updates"
      icon="history"
      loading={loading}
    >
      <div className="flex-1 overflow-y-auto max-h-[450px] space-y-4">
        {activities.length > 0 ? (
          activities.map((act, idx) => {
            const isSuccess = act.status === 'success';
            
            return (
              <div 
                key={idx}
                className="flex items-start gap-4 border-l-2 border-border-primary hover:border-accent-indigo transition-colors pl-4 py-1"
              >
                <div className="shrink-0 mt-1">
                  <span className={`material-symbols-rounded text-lg ${
                    isSuccess ? 'text-accent-emerald' : 'text-accent-rose'
                  }`}>
                    {isSuccess ? 'check_circle' : 'cancel'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-xs font-bold text-text-primary capitalize">
                      {act.action.replace(/_/g, ' ')}
                    </h4>
                    <span className="text-[10px] text-text-muted shrink-0">
                      {new Date(act.time).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-[11px] text-text-secondary mt-1">
                    Resource: <code className="bg-bg-secondary px-1 py-0.5 rounded text-text-primary text-[10px]">{act.resource || 'N/A'}</code>
                  </p>

                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-text-muted">
                    <span className="material-symbols-rounded text-[11px]">person</span>
                    <span className="truncate max-w-[200px]" title={`${act.user_name} (${act.user_email})`}>
                      {act.user_name} ({act.user_email})
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-text-secondary text-sm">
            No administrative activity logs captured.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
