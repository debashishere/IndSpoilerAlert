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
        backgroundColor: 'hsl(var(--bg-card))',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid hsl(var(--border-color))',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        borderRadius: '0 0 12px 12px'
      }}
    >
      {/* Title & Brand Badge */}
      <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={16} className="text-orange-500" style={{ color: 'hsl(var(--primary))' }} />
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: 'hsl(var(--border-color))'
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
                    ? ('1px solid hsl(var(--primary))')
                    : ('1px solid hsl(var(--border-color))'),
                  backgroundColor: isActive
                    ? ('hsl(var(--primary) / 0.15)')
                    : ('hsl(var(--bg-card))'),
                  color: isActive
                    ? ('hsl(var(--primary))')
                    : ('hsl(var(--text-secondary))'),
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
                      ? 'hsl(var(--primary))'
                      : ('hsl(var(--bg-card))'),
                    color: isActive
                      ? 'white'
                      : ('hsl(var(--text-muted))')
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
                          ? ('hsl(var(--primary))')
                          : ('hsl(var(--text-muted))')
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
                  style={{ color: 'hsl(var(--border-color))', margin: '0 2px' }}
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
            color: 'hsl(var(--primary))',
            backgroundColor: 'hsl(var(--primary) / 0.12)',
            border: '1px solid hsl(var(--primary) / 0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Plus size={14} style={{ color: 'hsl(var(--primary))' }} />
          <span>+ Add Escalation Stage</span>
        </button>
      )}
    </div>
  );
};
