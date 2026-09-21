import React from 'react';
import type { LiquidationAutomationStudioProps } from './types/studio.types';
import { useWorkflowStudio } from './hooks/useWorkflowStudio';
import { StudioHeaderSchedulingBar } from './slices/StudioHeaderSchedulingBar';
import { StudioScopeSection } from './slices/StudioScopeSection';
import { StudioStageTimelineSection } from './slices/StudioStageTimelineSection';
import { StudioDispatchSection } from './slices/StudioDispatchSection';

export const WorkflowStudioOrchestrator: React.FC<LiquidationAutomationStudioProps> = (props) => {
  const {
    buyers = [],
    editingCampaignId = null,
    onCancel,
  } = props;

  const studio = useWorkflowStudio(props);

  return (
    <div
      className="liquidation-automation-studio animate-fadeIn"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: editingCampaignId ? '20px' : '8px 0',
        borderRadius: '16px',
        border: editingCampaignId ? '2px solid hsl(var(--warning))' : '1px solid transparent',
        boxShadow: editingCampaignId ? '0 0 20px hsl(var(--warning) / 15%)' : 'none',
        transition: 'all 0.25s ease-in-out'
      }}
    >
      {/* ══ SLICE 1: Workspace Framing, Header & Scheduling Engine ═══════════ */}
      <StudioHeaderSchedulingBar
        studio={studio}
        editingCampaignId={editingCampaignId}
        onCancel={onCancel}
      />

      {/* ══ MAIN BODY: Full-Width 100% Canvas ════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        {/* ══ SLICE 2: Strategy & Matching Inventory Scope Engine ═══════════ */}
        <StudioScopeSection studio={studio} />

        {/* ══ SLICE 3: Polymorphic Stage-Gate Escalation Timeline ═══════════ */}
        <StudioStageTimelineSection studio={studio} buyers={buyers} />

        {/* ══ SLICE 4: Pre-Flight Audit Ledger & Execution Dispatch Engine ══ */}
        <StudioDispatchSection studio={studio} buyers={buyers} />
      </div>
    </div>
  );
};
