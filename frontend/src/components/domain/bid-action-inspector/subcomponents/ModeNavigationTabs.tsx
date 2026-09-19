import React from 'react';
import { CheckCircle2, ArrowLeftRight, XCircle, Clock } from 'lucide-react';
import type { InspectorMode } from '../types/bidActionInspector.types';
import { DEFAULT_COUNTER_MESSAGE } from '../constants/bidActionInspectorTemplates';

export interface ModeNavigationTabsProps {
  activeMode: InspectorMode;
  setActiveMode: (mode: InspectorMode) => void;
  isAccepted: boolean;
  counterMessage: string;
  setCounterMessage: (msg: string) => void;
  timelineEventCount: number;
}

export const ModeNavigationTabs: React.FC<ModeNavigationTabsProps> = ({
  activeMode,
  setActiveMode,
  isAccepted,
  counterMessage,
  setCounterMessage,
  timelineEventCount
}) => {
  return (
    <div
      style={{
        position: 'relative',
        borderBottom: '1px solid hsl(var(--border-color))',
        backgroundColor: 'hsl(var(--bg-card))',
        width: '100%'
      }}
    >
      <div
        data-testid="centralized-navigation-tabs-bar"
        className="relative max-w-[1100px] mx-auto w-full flex justify-center"
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '0 24px',
          gap: '8px'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveMode('accept')}
          style={{
            padding: '12px 18px',
            border: 'none',
            background: activeMode === 'accept' ? 'rgba(16, 185, 129, 0.08)' : 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: activeMode === 'accept' ? '3px solid hsl(var(--primary))' : '3px solid transparent',
            color: activeMode === 'accept' ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))'
          }}
        >
          <CheckCircle2 size={16} /> Accept Offer
        </button>

        <button
          type="button"
          data-testid="tab-counter"
          aria-label="Negotiate (Re-negotiate / Counter)"
          onClick={() => {
            if (isAccepted) return;
            setActiveMode('counter');
            if (!counterMessage || counterMessage.trim() === '') {
              setCounterMessage(DEFAULT_COUNTER_MESSAGE);
            }
          }}
          disabled={isAccepted}
          title={isAccepted ? 'Cannot counter an accepted offer.' : undefined}
          style={{
            padding: '12px 18px',
            border: 'none',
            background: activeMode === 'counter' ? 'rgba(245, 158, 11, 0.08)' : 'none',
            cursor: isAccepted ? 'not-allowed' : 'pointer',
            opacity: isAccepted ? 0.5 : 1,
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: activeMode === 'counter' ? '3px solid #f59e0b' : '3px solid transparent',
            color: activeMode === 'counter' ? '#d97706' : 'hsl(var(--text-secondary))'
          }}
        >
          <ArrowLeftRight size={16} /> Negotiate
        </button>

        <button
          type="button"
          data-testid="tab-decline"
          aria-label="Decline (Decline Offer)"
          onClick={() => {
            if (isAccepted) return;
            setActiveMode('decline');
          }}
          disabled={isAccepted}
          title={isAccepted ? 'Cannot decline an accepted offer.' : undefined}
          style={{
            padding: '12px 18px',
            border: 'none',
            background: activeMode === 'decline' ? 'rgba(239, 68, 68, 0.06)' : 'none',
            cursor: isAccepted ? 'not-allowed' : 'pointer',
            opacity: isAccepted ? 0.5 : 1,
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: activeMode === 'decline' ? '3px solid #ef4444' : '3px solid transparent',
            color: activeMode === 'decline' ? '#ef4444' : 'hsl(var(--text-secondary))'
          }}
        >
          <XCircle size={16} /> Decline
        </button>

        <button
          type="button"
          data-testid="tab-timeline"
          aria-label="Timeline"
          onClick={() => setActiveMode('timeline')}
          style={{
            padding: '12px 18px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: activeMode === 'timeline' ? '3px solid hsl(var(--primary))' : '3px solid transparent',
            color: activeMode === 'timeline' ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))'
          }}
        >
          <Clock size={16} /> Timeline
          <span
            data-testid="timeline-tab-badge"
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '10px',
              backgroundColor: activeMode === 'timeline' ? 'hsl(var(--primary))' : 'hsl(var(--border-color))',
              color: activeMode === 'timeline' ? '#fff' : 'hsl(var(--text-secondary))'
            }}
          >
            {timelineEventCount}
          </span>
        </button>
      </div>
    </div>
  );
};
