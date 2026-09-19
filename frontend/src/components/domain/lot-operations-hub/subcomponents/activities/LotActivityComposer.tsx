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
    <div className="flex gap-3 p-4 bg-[hsl(var(--bg-main))] rounded-xl border border-[hsl(var(--border-color))]">
      <select
        className="form-input w-32 rounded-lg border border-[hsl(var(--border-color))] bg-[hsl(var(--bg-card))] text-xs px-2.5 py-2"
        value={activityTypeInput}
        onChange={(e) => onActivityTypeChange(e.target.value)}
      >
        {ACTIVITY_FORM_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        className="form-input flex-1 rounded-lg border border-[hsl(var(--border-color))] bg-[hsl(var(--bg-card))] text-xs px-3 py-2"
        placeholder="Log new interaction, note, call summary, or meeting takeaway..."
        value={activityContentInput}
        onChange={(e) => onActivityContentChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && activityContentInput.trim()) {
            onCreateActivity();
          }
        }}
      />
      <button
        className="btn btn-primary text-xs font-semibold px-4 py-2 rounded-lg"
        onClick={onCreateActivity}
        disabled={!activityContentInput.trim()}
      >
        + Log Activity
      </button>
    </div>
  );
};
