import React from 'react';
import { Sparkles, ArrowRight, Plus } from 'lucide-react';

export interface FlowStage {
  id: string;
  label: string;
  detail?: string;
}

export interface LogicFlowNavbarProps {
  stages: FlowStage[];
  activeStageId: string;
  onStageSelect: (stageId: string) => void;
  onAddEscalationStage?: () => void;
  className?: string;
  theme?: 'dark' | 'light';
}

export const LogicFlowNavbar: React.FC<LogicFlowNavbarProps> = ({
  stages,
  activeStageId,
  onStageSelect,
  onAddEscalationStage,
  className = '',
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      data-testid="logic-flow-navbar"
      className={`sticky top-0 z-50 transition-all py-3 px-6 flex items-center justify-between gap-4 flex-wrap ${className}`}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: isDark ? 'hsl(223 47% 8% / 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: isDark ? '1px solid hsl(var(--border-color))' : '1px solid #e2e8f0',
        boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        borderRadius: '0 0 12px 12px'
      }}
    >
      {/* Title & Brand Badge */}
      <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={16} className="text-orange-500" style={{ color: '#f97316' }} />
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: isDark ? '#94a3b8' : '#64748b'
          }}
        >
          Logic Flow
        </span>
      </div>

      {/* Stage Progression Stepper Nodes */}
      <div className="flex items-center gap-2 flex-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {stages.map((stage, i) => {
          const isActive = activeStageId === stage.id;
          return (
            <React.Fragment key={stage.id}>
              <button
                type="button"
                data-testid={`stage-node-${stage.id}`}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => onStageSelect(stage.id)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-left transition-all cursor-pointer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: isActive
                    ? (isDark ? '1px solid hsl(var(--primary))' : '1px solid #fdba74')
                    : (isDark ? '1px solid hsl(var(--border-color))' : '1px solid #e2e8f0'),
                  backgroundColor: isActive
                    ? (isDark ? 'hsl(var(--primary) / 0.15)' : '#fff7ed')
                    : (isDark ? 'hsl(223 47% 11%)' : '#f8fafc'),
                  color: isActive
                    ? (isDark ? 'hsl(var(--primary))' : '#9a3412')
                    : (isDark ? 'hsl(var(--text-secondary))' : '#475569'),
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-extrabold"
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: isActive
                      ? '#f97316'
                      : (isDark ? 'hsl(223 47% 18%)' : '#e2e8f0'),
                    color: isActive
                      ? '#ffffff'
                      : (isDark ? 'hsl(var(--text-muted))' : '#64748b')
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight" style={{ fontSize: '12px', fontWeight: isActive ? 700 : 600 }}>
                    {stage.label}
                  </div>
                  {stage.detail && (
                    <div
                      className="text-[10px] font-normal leading-none mt-0.5"
                      style={{
                        fontSize: '10px',
                        color: isActive
                          ? (isDark ? 'hsl(var(--primary))' : '#ea580c')
                          : (isDark ? 'hsl(var(--text-muted))' : '#94a3b8')
                      }}
                    >
                      {stage.detail}
                    </div>
                  )}
                </div>
              </button>

              {i < stages.length - 1 && (
                <ArrowRight
                  size={13}
                  className="mx-0.5"
                  style={{ color: isDark ? 'hsl(var(--border-color))' : '#cbd5e1', margin: '0 2px' }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Add Escalation Stage Action Button */}
      {onAddEscalationStage && (
        <button
          type="button"
          data-testid="add-escalation-stage-button"
          onClick={onAddEscalationStage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: isDark ? 'hsl(var(--primary))' : '#ea580c',
            backgroundColor: isDark ? 'hsl(var(--primary) / 0.12)' : '#fff7ed',
            border: isDark ? '1px solid hsl(var(--primary) / 0.3)' : '1px solid #fed7aa',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Plus size={14} style={{ color: isDark ? 'hsl(var(--primary))' : '#ea580c' }} />
          <span>+ Add Escalation Stage</span>
        </button>
      )}
    </div>
  );
};
