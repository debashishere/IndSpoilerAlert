import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLotOperationsHub } from './hooks/useLotOperationsHub';
import { LotOperationsHeader } from './subcomponents/LotOperationsHeader';
import { LotOperationsSubTabs } from './subcomponents/LotOperationsSubTabs';
import { LotDetailsOverview } from './subcomponents/details/LotDetailsOverview';
import { LotComplianceSection } from './subcomponents/details/LotComplianceSection';
import { LotPricingSimulator } from './subcomponents/details/LotPricingSimulator';
import { LotBuyerMatches } from './subcomponents/details/LotBuyerMatches';
import { LotBidsTradingDesk } from './subcomponents/bids/LotBidsTradingDesk';
import { LotActivityTimeline } from './subcomponents/activities/LotActivityTimeline';
import { LotActivityComposer } from './subcomponents/activities/LotActivityComposer';
import { LotFeedbackToast } from './subcomponents/LotFeedbackToast';
import BidActionInspectorModal from '../bid-action-inspector';
import type { LotOperationsHubViewProps } from './types/lotOperations.types';

export const LotOperationsHubView: React.FC<LotOperationsHubViewProps> = (props) => {
  const {
    lot,
    subTab,
    drawerLoading,
    riskProfile,
    recommendedBuyers,
    buyersLoading,
    complianceFile,
    feedbackToast,
    backButtonLabel,
    handleBack,
    handleSubTabChange,
    handleEnableBiddingAction,
    handleDonateAction,
    handleRecycleAction,
    handleUpdateProductAllergensAction,
    handleUpdateLotComplianceAction,
    handleSetComplianceFile,
    handleUploadComplianceDocAction,
    pricingSimulator,
    bidsTradingDesk,
    activitiesStream,
    onPublishMarketplace,
  } = useLotOperationsHub(props);

  if (!lot) {
    return (
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center font-mono">
        <p className="text-slate-500 text-sm mb-4">
          No inventory lot selected. Please select an item from the Inventory tab.
        </p>
        <button
          type="button"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-mono font-medium shadow-2xs transition cursor-pointer"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backButtonLabel}</span>
        </button>
      </div>
    );
  }

  const bidsCount =
    bidsTradingDesk.allBids.length ||
    (props.negotiationBids || []).length ||
    (props.bidsList || []).length ||
    0;
  const activitiesCount = (props.lotActivities || []).length;

  return (
    <main className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
      {/* Top Header & Action Bar */}
      <LotOperationsHeader
        lot={lot}
        backButtonLabel={backButtonLabel}
        onBack={handleBack}
        onPublishMarketplace={onPublishMarketplace}
        onEnableBidding={handleEnableBiddingAction}
        onDonate={handleDonateAction}
        onRecycle={handleRecycleAction}
      />

      {/* Sub-Tab Navigation Bar: 3-Way Interactive Tabs */}
      <LotOperationsSubTabs
        subTab={subTab}
        onSubTabChange={handleSubTabChange}
        bidsCount={bidsCount}
        activitiesCount={activitiesCount}
      />

      {/* Stage 1: Lot Details & Operations */}
      {subTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 transition-opacity duration-200" id="viewLotDetails">
          {/* Left Column (7 cols): Operational Ground Truth */}
          <div className="lg:col-span-7 space-y-6">
            <LotDetailsOverview
              lot={lot}
              onUpdateProductAllergens={handleUpdateProductAllergensAction}
            />
            <LotComplianceSection
              lot={lot}
              complianceFile={complianceFile}
              onSetComplianceFile={handleSetComplianceFile}
              onUploadComplianceDoc={handleUploadComplianceDocAction}
              onUpdateLotCompliance={handleUpdateLotComplianceAction}
              onUpdateProductAllergens={handleUpdateProductAllergensAction}
            />
          </div>

          {/* Right Column (5 cols): AI Distressed Risk Engine & Execution Queue */}
          <div className="lg:col-span-5 space-y-6">
            <LotPricingSimulator
              lot={lot}
              riskProfile={riskProfile}
              drawerLoading={drawerLoading}
              simulator={pricingSimulator}
            />
            <LotBuyerMatches
              recommendedBuyers={recommendedBuyers}
              buyersLoading={buyersLoading}
            />
          </div>
        </div>
      )}

      {/* Stage 2: Bid & Offer Workbench */}
      {subTab === 'bids' && (
        <div className="w-full transition-opacity duration-200" id="viewBidOffer">
          <LotBidsTradingDesk
            lot={lot}
            bidsTradingDesk={bidsTradingDesk}
          />
        </div>
      )}

      {/* Stage 3: Lot CRM & Audit Timeline */}
      {subTab === 'activities' && (
        <div className="w-full space-y-6 transition-opacity duration-200" id="viewLotCRM">
          <LotActivityComposer
            activityTypeInput={activitiesStream.activityTypeInput}
            activityContentInput={activitiesStream.activityContentInput}
            onActivityTypeChange={activitiesStream.handleActivityTypeInputChange}
            onActivityContentChange={activitiesStream.handleActivityContentInputChange}
            onCreateActivity={activitiesStream.handleCreateLotActivityAction}
          />
          <LotActivityTimeline
            filteredActivities={activitiesStream.filteredActivities}
            activityFilter={activitiesStream.activityFilter}
            onActivityFilterChange={activitiesStream.handleActivityFilterChange}
          />
        </div>
      )}

      {/* Feedback Toast Notification */}
      <LotFeedbackToast toast={feedbackToast} />

      {/* Bid Action Inspector Operational Workspace */}
      <BidActionInspectorModal
        isOpen={props.isBidInspectorOpen !== undefined ? props.isBidInspectorOpen : bidsTradingDesk.isInspectorOpen}
        onClose={() => {
          if (props.setIsBidInspectorOpen) props.setIsBidInspectorOpen(false);
          bidsTradingDesk.setIsInspectorOpen(false);
        }}
        bid={bidsTradingDesk.selectedBidForInspector}
        lot={lot}
        onDecline={(payload) => bidsTradingDesk.handleDeclineBidAction(payload, bidsTradingDesk.selectedBidForInspector)}
        onReset={() => bidsTradingDesk.handleResetBidAction()}
        onCounter={(counterData) => bidsTradingDesk.handleCounterBidAction(counterData, bidsTradingDesk.selectedBidForInspector)}
        onAccept={(acceptPayload) => bidsTradingDesk.handleAcceptBidAction(acceptPayload, bidsTradingDesk.selectedBidForInspector)}
        onResendSettlement={bidsTradingDesk.handleResendSettlementAction}
        isSubmitting={bidsTradingDesk.isSubmittingAction}
      />
    </main>
  );
};

export default LotOperationsHubView;
