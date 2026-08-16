import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Timer } from 'lucide-react';

export const formatExecutionWindow = (waitHours?: number, waitUnit?: 'd' | 'h' | 'm'): string => {
  if (waitHours == null || isNaN(waitHours) || waitHours <= 0) return 'Immediate';
  
  if (waitUnit === 'm') {
    const mins = Math.round(waitHours * 60);
    return `${mins} ${mins === 1 ? 'Min' : 'Mins'}`;
  }
  if (waitUnit === 'd') {
    const days = Number((waitHours / 24).toFixed(2));
    const roundedDays = days % 1 === 0 ? Math.round(days) : days;
    return `${roundedDays} ${roundedDays === 1 ? 'Day' : 'Days'}`;
  }
  if (waitUnit === 'h') {
    const roundedHours = waitHours % 1 === 0 ? Math.round(waitHours) : Number(waitHours.toFixed(2));
    return `${roundedHours} ${roundedHours === 1 ? 'Hour' : 'Hours'}`;
  }

  // Automatic smart inference for legacy data
  if (waitHours < 1) {
    const mins = Math.round(waitHours * 60);
    return `${mins} ${mins === 1 ? 'Min' : 'Mins'}`;
  }
  if (waitHours >= 24 && waitHours % 24 === 0) {
    const days = Math.round(waitHours / 24);
    return `${days} ${days === 1 ? 'Day' : 'Days'}`;
  }
  const roundedHours = waitHours % 1 === 0 ? Math.round(waitHours) : Number(waitHours.toFixed(2));
  return `${roundedHours} ${roundedHours === 1 ? 'Hour' : 'Hours'}`;
};

export const formatTimeRemaining = (remainingMs: number): string => {
  if (remainingMs <= 0) return '00h 00m 00s';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
};

interface WorkflowRunTimelineStepperProps {
  run: any;
  stages?: any[];
}

export const WorkflowRunTimelineStepper: React.FC<WorkflowRunTimelineStepperProps> = ({ run, stages = [] }) => {
  const [nowTime, setNowTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const campaignStages = stages.length > 0
    ? stages
    : (run?.campaignSnapshot?.stages || [
        {
          stageNumber: 1,
          name: 'Primary Tier Bargain',
          stageType: 'liquidation',
          discountType: 'percentage_off_wholesale',
          discountValue: 15,
          waitHours: 24,
          buyerMode: 'segment',
          buyerSegment: 'Tier 1 Wholesale'
        },
        {
          stageNumber: 2,
          name: 'Broad Market Clearance',
          stageType: 'liquidation',
          discountType: 'percentage_off_wholesale',
          discountValue: 35,
          waitHours: 48,
          buyerMode: 'all'
        },
        {
          stageNumber: 3,
          name: 'Final Salvage / Donation Divert',
          stageType: 'donation',
          discountType: 'fixed_price',
          discountValue: 1.0,
          waitHours: 12,
          buyerMode: 'all'
        }
      ]);

  const isAwarded = run?.status === 'awarded';
  const isFallback = run?.status === 'fallback_executed';
  const isEvaluating = run?.status === 'evaluating' || run?.status === 'dispatched';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'hsl(var(--text-primary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} style={{ color: 'hsl(var(--primary))' }} />
          Stage-Gate Execution Timeline & Escalation Trace
        </h4>
        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
          {campaignStages.length} Configured Stage Gates
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
        {campaignStages.map((stage: any, idx: number) => {
          const stageNum = stage.stageNumber || idx + 1;
          const stageType = stage.stageType || (stage.name?.toLowerCase().includes('donat') ? 'donation' : stage.name?.toLowerCase().includes('landfill') ? 'landfill' : 'liquidation');
          
          let stageState: 'completed' | 'active' | 'skipped' | 'pending' = 'pending';
          if (isAwarded) {
            stageState = idx === 0 ? 'completed' : 'skipped';
          } else if (isFallback) {
            stageState = idx < campaignStages.length - 1 ? 'completed' : 'active';
          } else if (isEvaluating) {
            stageState = idx === 0 ? 'active' : 'pending';
          }

          const badgeBg = stageType === 'donation' 
            ? 'hsl(var(--primary) / 12%)' 
            : stageType === 'landfill' 
              ? 'hsl(var(--warning) / 15%)' 
              : 'hsl(var(--success) / 12%)';
          const badgeColor = stageType === 'donation' 
            ? 'hsl(var(--primary))' 
            : stageType === 'landfill' 
              ? 'hsl(var(--warning))' 
              : 'hsl(var(--success))';

          const formattedWindow = formatExecutionWindow(stage.waitHours, stage.waitUnit);

          // Calculate remaining window for active stage
          let remainingWindowMs = 0;
          let isWindowExpired = false;
          if (stageState === 'active' && isEvaluating) {
            const endsAtMs = run.evaluationEndsAt ? new Date(run.evaluationEndsAt).getTime() : (new Date(run.dispatchedAt || run.createdAt).getTime() + (stage.waitHours || 24) * 3600000);
            remainingWindowMs = endsAtMs - nowTime;
            isWindowExpired = remainingWindowMs <= 0;
          }

          return (
            <div
              key={idx}
              data-testid={`stage-step-${stageNum}`}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px 20px',
                backgroundColor: stageState === 'active' && isEvaluating ? 'hsl(var(--warning) / 8%)' : 'hsl(var(--bg-card))',
                borderRadius: '10px',
                border: stageState === 'active' && isEvaluating ? '1px solid hsl(var(--warning) / 50%)' : '1px solid hsl(var(--border-color))',
                position: 'relative',
                boxShadow: stageState === 'active' && isEvaluating ? '0 0 16px hsl(var(--warning) / 15%)' : undefined
              }}
            >
              {/* Step indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: stageState === 'completed' 
                      ? 'hsl(var(--success))' 
                      : stageState === 'active' 
                        ? (isEvaluating ? 'hsl(var(--warning))' : 'hsl(var(--primary))') 
                        : 'hsl(var(--bg-card-hover))',
                    color: stageState === 'completed' || stageState === 'active' ? '#fff' : 'hsl(var(--text-muted))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    border: stageState === 'active' && isEvaluating ? '2px solid hsl(var(--warning))' : '2px solid hsl(var(--border-color))'
                  }}
                >
                  {stageState === 'completed' ? <CheckCircle2 size={16} /> : stageNum}
                </div>
              </div>

              {/* Step body */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'hsl(var(--text-primary))' }}>
                      Stage {stageNum}: {stage.name || `Stage Gate ${stageNum}`}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: badgeBg,
                      color: badgeColor
                    }}>
                      {stageType}
                    </span>
                    {stageState === 'active' && isEvaluating && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'hsl(var(--warning) / 20%)',
                        color: 'hsl(var(--warning))',
                        border: '1px solid hsl(var(--warning) / 40%)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'hsl(var(--warning))', animation: 'pulse 1.5s infinite' }} />
                        Active Window
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} style={{ color: 'hsl(var(--primary))' }} />
                    <span>Execution Window: <strong style={{ color: 'hsl(var(--text-primary))' }}>{formattedWindow}</strong></span>
                  </div>
                </div>

                {/* Live timer badge for in-progress stage */}
                {stageState === 'active' && isEvaluating && (
                  <div style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'hsl(var(--warning) / 12%)',
                    border: '1px solid hsl(var(--warning) / 35%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'hsl(var(--warning))' }}>
                      <Timer size={15} />
                      <span>
                        {isWindowExpired
                          ? 'Window Expired – Resolution / Escalation in Progress'
                          : `Stage Window Countdown: ${formatTimeRemaining(remainingWindowMs)} remaining`}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                      Total Window: {formattedWindow}
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '0.78rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                  <div>
                    <strong>Pricing Rule:</strong> {stage.discountValue != null ? `${stage.discountValue}% (${stage.discountType?.replace(/_/g, ' ') || 'Discount'})` : 'Fixed / Custom'}
                  </div>
                  <div>
                    <strong>Audience Target:</strong> {stage.buyerMode === 'segment' ? (stage.buyerSegment || 'Targeted Segment') : stage.buyerMode === 'custom' ? `${stage.customBuyers?.length || 0} Custom Partners` : 'All Registered Partners'}
                  </div>
                  {stage.allocatedLotIds && stage.allocatedLotIds.length > 0 && (
                    <div>
                      <strong>Allocated Lots:</strong> {stage.allocatedLotIds.length} Lots
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

