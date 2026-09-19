import React from 'react';
import { Activity } from 'lucide-react';
import { ACTIVITY_FILTERS } from '../../constants/lotOperationsConstants';

interface LotActivityTimelineProps {
  filteredActivities: any[];
  activityFilter: string;
  onActivityFilterChange: (val: string) => void;
}

export const LotActivityTimeline: React.FC<LotActivityTimelineProps> = ({
  filteredActivities = [],
  activityFilter,
  onActivityFilterChange,
}) => {
  return (
    <>
      <div className="lot-hub-card-header flex justify-between items-center flex-wrap gap-2">
        <div className="lot-hub-card-title flex items-center gap-2 font-semibold">
          <Activity size={18} className="text-[hsl(var(--primary))]" />
          <span>Lot CRM Activities & Email Audit Trail ({filteredActivities.length})</span>
        </div>
        <div className="flex gap-1.5">
          {ACTIVITY_FILTERS.map((type) => (
            <button
              key={type}
              className={`btn btn-sm text-xs px-2.5 py-1 rounded-md transition-colors ${
                activityFilter.toLowerCase() === type.toLowerCase()
                  ? 'btn-primary font-semibold'
                  : 'btn-secondary font-normal'
              }`}
              onClick={() => onActivityFilterChange(type)}
            >
              {type === 'all' ? 'All Activities' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Chronological Activities Log */}
      <div className="flex flex-col gap-3 mt-3">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16 px-5 text-[hsl(var(--text-muted))]">
            <Activity size={36} className="opacity-30 mx-auto mb-3" />
            <p className="text-sm">No activities found for this filter. Log a new interaction above.</p>
          </div>
        ) : (
          filteredActivities.map((act: any, idx: number) => {
            let badgeBg = 'hsl(var(--primary) / 15%)';
            let badgeColor = 'hsl(var(--primary))';
            if (act.type === 'Call') {
              badgeBg = 'hsl(var(--warning) / 15%)';
              badgeColor = 'hsl(var(--warning))';
            }
            if (act.type === 'Meeting') {
              badgeBg = 'hsl(var(--success) / 15%)';
              badgeColor = 'hsl(var(--success))';
            }
            if (act.type === 'Note') {
              badgeBg = 'hsl(var(--secondary) / 15%)';
              badgeColor = 'hsl(var(--secondary))';
            }

            return (
              <div
                key={idx}
                className="flex gap-4 p-4 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-color))] rounded-xl"
              >
                <div
                  className="px-3 py-1.5 rounded-md font-bold text-xs h-fit uppercase"
                  style={{ backgroundColor: badgeBg, color: badgeColor }}
                >
                  {act.type || 'Note'}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-[hsl(var(--text-primary))] leading-relaxed font-medium">
                    {act.content || act.summary || 'Activity recorded'}
                  </div>
                  {act.details && (
                    <div className="text-xs text-[hsl(var(--text-secondary))] mt-1.5 p-2.5 bg-[hsl(var(--bg-card))] rounded-md border border-[hsl(var(--border-color))]">
                      {act.details}
                    </div>
                  )}
                  <div className="text-xs text-[hsl(var(--text-muted))] mt-2 flex gap-3">
                    <span>
                      Logged by: <strong>{act.author || 'System AI'}</strong>
                    </span>
                    <span>•</span>
                    <span>{act.timestamp ? new Date(act.timestamp).toLocaleString() : 'Just now'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};
