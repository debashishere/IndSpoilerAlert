import React from 'react';
import { Layers, Award, Activity } from 'lucide-react';
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
    <div className="lot-hub-nav-tabs">
      <button
        className={`lot-hub-tab-btn ${subTab === 'details' ? 'active' : ''}`}
        onClick={() => onSubTabChange('details')}
      >
        <Layers size={18} />
        <span>Lot Details & Operations</span>
      </button>
      <button
        className={`lot-hub-tab-btn ${subTab === 'bids' ? 'active' : ''}`}
        onClick={() => onSubTabChange('bids')}
      >
        <Award size={18} />
        <span>Bid & Offer (Bidding & Awarding) ({bidsCount})</span>
      </button>
      <button
        className={`lot-hub-tab-btn ${subTab === 'activities' ? 'active' : ''}`}
        onClick={() => onSubTabChange('activities')}
      >
        <Activity size={18} />
        <span>Lot CRM & Audit Timeline ({activitiesCount})</span>
      </button>
    </div>
  );
};
