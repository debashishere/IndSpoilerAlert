import React from 'react';
import { Box, Award, History } from 'lucide-react';
import type { LotHubSubTab } from '../types/lotOperations.types';

interface LotOperationsSubTabsProps {
  subTab: LotHubSubTab;
  onSubTabChange: (tab: LotHubSubTab) => void;
  bidsCount: number;
  activitiesCount: number;
}

export const LotOperationsSubTabs: React.FC<LotOperationsSubTabsProps> = ({
  subTab,
  onSubTabChange,
  bidsCount,
  activitiesCount,
}) => {
  return (
    <nav
      aria-label="Terminal Tabs"
      className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-surface-border pt-2 mb-6 w-full"
    >
      {/* Tab 1: Lot Details & Operations */}
      <button
        id="tabLotDetails"
        type="button"
        role="tab"
        aria-selected={subTab === 'details'}
        onClick={() => onSubTabChange('details')}
        className={`px-5 py-3 text-sm font-mono flex items-center justify-center space-x-2 transition rounded-t-lg w-full cursor-pointer relative ${
          subTab === 'details'
            ? 'font-semibold text-brand-900 bg-white shadow-2xs border border-surface-border border-b-2 border-b-brand-500'
            : 'font-medium text-slate-600 hover:text-brand-900 hover:bg-brand-50/60 border-b-2 border-transparent'
        }`}
      >
        <Box
          className={`w-4 h-4 shrink-0 ${
            subTab === 'details' ? 'text-brand-500' : 'text-slate-500'
          }`}
        />
        <span className="tracking-wide truncate">Lot Details & Operations</span>
        <span
          className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-mono border shrink-0 hidden sm:inline ${
            subTab === 'details'
              ? 'bg-brand-100 text-brand-900 border-brand-300 font-bold'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          Spec • Docs
        </span>
      </button>

      {/* Tab 2: Bid & Offer */}
      <button
        id="tabBidOffer"
        type="button"
        role="tab"
        aria-selected={subTab === 'bids'}
        onClick={() => onSubTabChange('bids')}
        className={`px-5 py-3 text-sm font-mono flex items-center justify-center space-x-2 transition rounded-t-lg w-full cursor-pointer relative ${
          subTab === 'bids'
            ? 'font-semibold text-brand-900 bg-white shadow-2xs border border-surface-border border-b-2 border-b-brand-500'
            : 'font-medium text-slate-600 hover:text-brand-900 hover:bg-brand-50/60 border-b-2 border-transparent'
        }`}
      >
        <Award
          className={`w-4 h-4 shrink-0 ${
            subTab === 'bids' ? 'text-brand-500' : 'text-slate-500'
          }`}
        />
        <span className="truncate">Bid & Offer (Bidding & Awarding)</span>
        <span
          className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-mono border font-bold shrink-0 ${
            subTab === 'bids'
              ? 'bg-brand-100 text-brand-900 border-brand-300'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {bidsCount} Active
        </span>
      </button>

      {/* Tab 3: Lot CRM & Audit Timeline */}
      <button
        id="tabLotCRM"
        type="button"
        role="tab"
        aria-selected={subTab === 'activities'}
        onClick={() => onSubTabChange('activities')}
        className={`px-5 py-3 text-sm font-mono flex items-center justify-center space-x-2 transition rounded-t-lg w-full cursor-pointer relative ${
          subTab === 'activities'
            ? 'font-semibold text-brand-900 bg-white shadow-2xs border border-surface-border border-b-2 border-b-brand-500'
            : 'font-medium text-slate-600 hover:text-brand-900 hover:bg-brand-50/60 border-b-2 border-transparent'
        }`}
      >
        <History
          className={`w-4 h-4 shrink-0 ${
            subTab === 'activities' ? 'text-brand-500' : 'text-slate-500'
          }`}
        />
        <span className="truncate">Lot CRM & Audit Timeline</span>
        <span
          className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-mono border shrink-0 ${
            subTab === 'activities'
              ? 'bg-brand-100 text-brand-900 border-brand-300 font-bold'
              : 'bg-slate-100 text-slate-600 border-slate-200 font-medium'
          }`}
        >
          {activitiesCount}
        </span>
      </button>
    </nav>
  );
};
