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
    <div className="relative border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-full select-none">
      <div
        data-testid="centralized-navigation-tabs-bar"
        className="relative max-w-[1100px] mx-auto w-full px-6 flex items-center gap-2 sm:gap-4 overflow-x-auto"
        style={{ justifyContent: 'center' }}
      >
        <button
          type="button"
          onClick={() => setActiveMode('accept')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-3 text-[13px] border-b-[3px] -mb-[1px] transition-all cursor-pointer ${
            activeMode === 'accept'
              ? 'font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Accept Offer</span>
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
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-3 text-[13px] border-b-[3px] -mb-[1px] transition-all ${
            isAccepted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          } ${
            activeMode === 'counter'
              ? 'font-bold text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
              : 'font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Negotiate</span>
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
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-3 text-[13px] border-b-[3px] -mb-[1px] transition-all ${
            isAccepted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          } ${
            activeMode === 'decline'
              ? 'font-bold text-rose-600 dark:text-rose-400 border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
              : 'font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Decline</span>
        </button>

        <button
          type="button"
          data-testid="tab-timeline"
          aria-label="Timeline"
          onClick={() => setActiveMode('timeline')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-3 text-[13px] border-b-[3px] -mb-[1px] transition-all cursor-pointer ${
            activeMode === 'timeline'
              ? 'font-bold text-blue-600 dark:text-blue-400 border-blue-600 bg-blue-50/40 dark:bg-blue-950/20'
              : 'font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Timeline</span>
          <span
            data-testid="timeline-tab-badge"
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeMode === 'timeline'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {timelineEventCount}
          </span>
        </button>
      </div>
    </div>
  );
};
