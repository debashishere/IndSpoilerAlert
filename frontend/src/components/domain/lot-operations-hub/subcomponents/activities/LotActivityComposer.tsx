import React from 'react';
import { ACTIVITY_FORM_TYPES } from '../../constants/lotOperationsConstants';

interface LotActivityComposerProps {
  activityTypeInput: string;
  activityContentInput: string;
  onActivityTypeChange: (val: string) => void;
  onActivityContentChange: (val: string) => void;
  onCreateActivity: () => void;
}

export const LotActivityComposer: React.FC<LotActivityComposerProps> = ({
  activityTypeInput,
  activityContentInput,
  onActivityTypeChange,
  onActivityContentChange,
  onCreateActivity,
}) => {
  return (
    <div className="bg-white border border-surface-border rounded-xl p-4 shadow-subtle-card font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative w-36 shrink-0">
            <select
              className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-slate-50/80 text-xs font-mono font-semibold text-slate-700 focus:outline-none focus:border-brand-500 transition-all cursor-pointer shadow-2xs"
              value={activityTypeInput}
              onChange={(e) => onActivityTypeChange(e.target.value)}
            >
              {ACTIVITY_FORM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            className="flex-1 h-10 px-4 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition-all shadow-2xs"
            placeholder="Log new interaction, internal note, buyer outreach memo, or dispute update..."
            value={activityContentInput}
            onChange={(e) => onActivityContentChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && activityContentInput.trim()) {
                onCreateActivity();
              }
            }}
          />
        </div>

        <button
          type="button"
          disabled={!activityContentInput.trim()}
          onClick={onCreateActivity}
          className="h-10 px-4 bg-brand-900 hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-mono font-semibold rounded-lg shadow-2xs transition-all inline-flex items-center justify-center cursor-pointer shrink-0"
        >
          + Log Activity
        </button>
      </div>
    </div>
  );
};
