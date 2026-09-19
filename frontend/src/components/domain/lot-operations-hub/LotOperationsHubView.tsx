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
      <div className="lot-hub-container text-center py-16 px-5">
        <p className="text-[hsl(var(--text-muted))] text-sm">
          No inventory lot selected. Please select an item from the Inventory tab.
        </p>
        <button className="btn btn-secondary mt-4 text-xs font-medium" onClick={handleBack}>
          <ArrowLeft size={16} /> {backButtonLabel}
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
    <div className="lot-hub-container">
      {/* Top Header */}
      <LotOperationsHeader
        lot={lot}
        backButtonLabel={backButtonLabel}
        onBack={handleBack}
        onPublishMarketplace={onPublishMarketplace}
        onEnableBidding={handleEnableBiddingAction}
        onDonate={handleDonateAction}
        onRecycle={handleRecycleAction}
      />

      {/* Sub-Tab Navigation Bar */}
      <LotOperationsSubTabs
        subTab={subTab}
        onSubTabChange={handleSubTabChange}
        bidsCount={bidsCount}
        activitiesCount={activitiesCount}
      />

      {/* Stage: Details & Operations */}
      {subTab === 'details' && (
        <div className="lot-hub-grid">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
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
            />
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
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

      {/* Stage: Bid & Offer Workspace */}
      {subTab === 'bids' && (
        <LotBidsTradingDesk
          lot={lot}
          bidsTradingDesk={bidsTradingDesk}
        />
      )}

      {/* Stage: Activities & Audit Timeline */}
      {subTab === 'activities' && (
        <div className="lot-hub-grid">
          <div className="lot-hub-card col-span-full flex flex-col gap-4">
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
        </div>
      )}

      {/* Feedback Toast Notification */}
      <LotFeedbackToast toast={feedbackToast} />

      {/* Bid Action Inspector Full-Screen Operational Workspace */}
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
    </div>
  );
};

export default LotOperationsHubView;
