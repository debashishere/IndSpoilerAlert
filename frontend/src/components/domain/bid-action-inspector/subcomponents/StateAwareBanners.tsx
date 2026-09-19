import React from 'react';
import { XCircle, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { InSituToastState } from '../types/bidActionInspector.types';

export interface StateAwareBannersProps {
  isRejected: boolean;
  selectedDeclineReason: string;
  bidDeclineReason?: string;
  declineRationale: string;
  isSubmitting: boolean;
  onReset?: () => Promise<void> | void;
  inSituToast: InSituToastState;
}

export const StateAwareBanners: React.FC<StateAwareBannersProps> = ({
  isRejected,
  selectedDeclineReason,
  bidDeclineReason,
  declineRationale,
  isSubmitting,
  onReset,
  inSituToast
}) => {
  return (
    <>
      {/* State-Aware Banner: Declined Offer */}
      {isRejected && (
        <div
          data-testid="declined-active-banner"
          style={{
            position: 'relative',
            margin: '16px 24px 0',
            padding: '14px 18px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-primary))' }}>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>Offer Declined</span> — Reason: {selectedDeclineReason || bidDeclineReason || 'Declined'}
              {declineRationale ? ` (Memo: ${declineRationale})` : ''}.
            </div>
          </div>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={isSubmitting}
              className="btn btn-outline"
              style={{
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={12} />
              Re-open Offer
            </button>
          )}
        </div>
      )}

      {/* In-situ notification toast banner */}
      {inSituToast && (
        <div
          role="status"
          style={{
            position: 'relative',
            padding: '10px 24px',
            backgroundColor: (typeof inSituToast === 'object' && inSituToast.type === 'warning') ? '#d97706' : '#10b981',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          {(typeof inSituToast === 'object' && inSituToast.type === 'warning') ? (
            <AlertTriangle size={16} data-testid="in-situ-warning-icon" />
          ) : (
            <CheckCircle2 size={16} data-testid="in-situ-success-icon" />
          )}
          <span>{typeof inSituToast === 'string' ? inSituToast : inSituToast.message}</span>
        </div>
      )}
    </>
  );
};
