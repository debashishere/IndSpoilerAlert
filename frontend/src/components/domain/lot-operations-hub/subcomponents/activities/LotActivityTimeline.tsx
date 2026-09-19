import React from 'react';
import { History, Mail, Bot, CheckCircle2, FileText, Phone, Handshake } from 'lucide-react';
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
  const getBadgeStyle = (type?: string) => {
    const t = (type || 'note').toLowerCase();
    if (t === 'email') {
      return {
        badgeBg: 'bg-brand-100 text-brand-900 border-brand-300',
        dotBg: 'bg-brand-500',
        label: 'EMAIL',
        icon: <Mail className="w-3.5 h-3.5 text-brand-600" />,
      };
    }
    if (t === 'quick_bid' || t === 'quick bid') {
      return {
        badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
        dotBg: 'bg-purple-500',
        label: 'QUICK_BID',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />,
      };
    }
    if (t === 'call') {
      return {
        badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
        dotBg: 'bg-blue-500',
        label: 'CALL',
        icon: <Phone className="w-3.5 h-3.5 text-blue-600" />,
      };
    }
    if (t === 'meeting') {
      return {
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        dotBg: 'bg-emerald-500',
        label: 'MEETING',
        icon: <Handshake className="w-3.5 h-3.5 text-emerald-600" />,
      };
    }
    return {
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      dotBg: 'bg-amber-500',
      label: 'NOTE',
      icon: <FileText className="w-3.5 h-3.5 text-amber-600" />,
    };
  };

  return (
    <div className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle-card space-y-5 font-sans">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-sans tracking-tight flex items-center gap-2 m-0">
              Activity &amp; Email Audit Trail
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-100 text-brand-900 font-bold border border-brand-200">
                {filteredActivities.length} ENTRIES
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Immutable audit timeline of system AI triggers, buyer negotiation emails, and tokenized quick bids
            </p>
          </div>
        </div>

        {/* Activity Filter Pills */}
        <div className="inline-flex items-center bg-slate-50 p-1 rounded-full border border-slate-200 shadow-2xs self-start sm:self-auto flex-wrap gap-0.5">
          {ACTIVITY_FILTERS.map((type) => {
            const isActive = activityFilter.toLowerCase() === type.toLowerCase();
            return (
              <button
                key={type}
                type="button"
                className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  isActive
                    ? 'font-bold bg-brand-900 text-white shadow-2xs'
                    : 'font-medium text-slate-600 hover:text-brand-900 hover:bg-white'
                }`}
                onClick={() => onActivityFilterChange(type)}
              >
                {type === 'all' ? 'All Activities' : type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 px-5 text-slate-400 font-mono">
            <History className="w-8 h-8 opacity-30 mx-auto mb-2" />
            <p className="text-xs">No activities match this filter. Log a new interaction above.</p>
          </div>
        ) : (
          filteredActivities.map((act: any, idx: number) => {
            const style = getBadgeStyle(act.type);
            const dateStr = act.timestamp
              ? new Date(act.timestamp).toLocaleString()
              : '9/13/2026, 11:21:34 AM';

            return (
              <div key={idx} className="relative group">
                {/* Connector Dot */}
                <div
                  className={`absolute -left-6 top-3 w-5 h-5 rounded-full ${style.dotBg} border-4 border-white shadow-2xs flex items-center justify-center`}
                />

                {/* Content Card */}
                <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-xl p-4 transition shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2.5 flex-wrap gap-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${style.badgeBg}`}
                      >
                        {style.label}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-800">
                        {act.summary || act.title || (style.label === 'NOTE' ? 'Operational Note Recorded' : `${style.label} Event Dispatched`)}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">{dateStr}</span>
                  </div>

                  {/* Body */}
                  <div className="text-xs font-mono text-slate-800 leading-relaxed">
                    {act.content && <p>{act.content}</p>}
                    {act.details && (
                      <div className="mt-2 text-xs font-mono text-slate-700 space-y-1 bg-white p-3 rounded-lg border border-slate-200/80">
                        <p>{act.details}</p>
                      </div>
                    )}
                  </div>

                  {/* Metadata Footer */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] font-mono text-slate-500 flex-wrap gap-2">
                    <span className="flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Logged by: <strong className="text-slate-700 font-medium">{act.author || 'System AI'}</strong>
                      </span>
                    </span>
                    <span className="text-slate-400">
                      {act.rule || act.deliveryStatus || 'Rule: RECOVERY_FLOOR_ENFORCE_V2'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
