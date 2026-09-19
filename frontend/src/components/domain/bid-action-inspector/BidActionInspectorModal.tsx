import React from 'react';
import type { BidActionInspectorModalProps } from './types/bidActionInspector.types';
import { useBidActionInspector } from './hooks/useBidActionInspector';
import { BidActionInspectorHeader } from './subcomponents/BidActionInspectorHeader';
import { CommercialStatCards } from './subcomponents/CommercialStatCards';
import { ModeNavigationTabs } from './subcomponents/ModeNavigationTabs';
import { StateAwareBanners } from './subcomponents/StateAwareBanners';
import { EmailPreviewDialog } from './subcomponents/EmailPreviewDialog';
import { AcceptOfferStage } from './subcomponents/stages/AcceptOfferStage';
import { NegotiateCounterStage } from './subcomponents/stages/NegotiateCounterStage';
import { DeclineOfferStage } from './subcomponents/stages/DeclineOfferStage';
import { TimelineAuditStage } from './subcomponents/stages/TimelineAuditStage';

export const BidActionInspectorModal: React.FC<BidActionInspectorModalProps> = (props) => {
  const { isOpen, bid, lot, onClose, onReset, onResendSettlement, isSubmitting = false } = props;

  const inspector = useBidActionInspector(props);

  if (!isOpen || !bid) return null;

  const { calculations, timeline } = inspector;

  return (
    <div
      data-testid="bid-action-inspector-workspace"
      className="fixed inset-0 w-screen h-screen z-[1050] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
    >
      {/* Whole-page unified scroll container */}
      <div
        data-testid="bid-action-inspector-scroll-container"
        className="relative flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col"
        style={{ scrollBehavior: 'smooth' }}
      >
        <BidActionInspectorHeader
          onClose={onClose}
          lotNumber={calculations.lotNumber}
          lotSku={calculations.lotSku}
          productTitle={calculations.productTitle}
          isRejected={calculations.isRejected}
          isAccepted={calculations.isAccepted}
          isCountered={calculations.isCountered}
          isBuyerCountered={!!calculations.isBuyerCountered}
          internalStatus={inspector.internalStatus}
          bidStatus={bid.status}
          rawStatus={calculations.rawStatus}
          isSubmitting={isSubmitting}
          onReset={inspector.handleResetToPending}
        />

        <StateAwareBanners
          isRejected={calculations.isRejected}
          selectedDeclineReason={inspector.selectedDeclineReason}
          bidDeclineReason={bid.declineReason}
          declineRationale={inspector.declineRationale}
          isSubmitting={isSubmitting}
          onReset={onReset ? inspector.handleResetToPending : undefined}
          inSituToast={inspector.inSituToast}
        />

        <CommercialStatCards
          buyerCompany={calculations.buyerCompany}
          buyerEmail={calculations.buyerEmail}
          hasNegotiatedSettledPrice={!!calculations.hasNegotiatedSettledPrice}
          finalPrice={calculations.finalPrice}
          unitPrice={calculations.unitPrice}
          reserveFloorPrice={calculations.reserveFloorPrice}
          allocationPct={calculations.allocationPct}
          quantity={calculations.quantity}
          isFullClearing={calculations.isFullClearing}
          totalRecovery={calculations.totalRecovery}
          netClearingTotal={calculations.netClearingTotal}
        />

        <ModeNavigationTabs
          activeMode={inspector.activeMode}
          setActiveMode={inspector.setActiveMode}
          isAccepted={calculations.isAccepted}
          counterMessage={inspector.counterMessage}
          setCounterMessage={inspector.setCounterMessage}
          timelineEventCount={timeline.allEvents.length}
        />

        <div className="relative flex-1 w-full" style={{ padding: '24px' }}>
          <div
            data-testid="centralized-workspace-body"
            className="relative max-w-[1100px] mx-auto w-full"
          >
          {inspector.activeMode === 'accept' && (
            <AcceptOfferStage
              isAccepted={calculations.isAccepted}
              bid={bid}
              lot={lot}
              internalStatus={inspector.internalStatus}
              hasNegotiatedSettledPrice={!!calculations.hasNegotiatedSettledPrice}
              effectiveAwardedQty={calculations.effectiveAwardedQty}
              buyerCompany={calculations.buyerCompany}
              finalPrice={calculations.finalPrice}
              unitPrice={calculations.unitPrice}
              effectiveUnitPrice={calculations.effectiveUnitPrice}
              pickupAddress={inspector.pickupAddress}
              setPickupAddress={inspector.setPickupAddress}
              pickupHours={inspector.pickupHours}
              setPickupHours={inspector.setPickupHours}
              onResendSettlement={onResendSettlement}
              isSubmitting={isSubmitting}
              awardedQuantity={inspector.awardedQuantity}
              setAwardedQuantity={inspector.setAwardedQuantity}
              quantity={calculations.quantity}
              activeChannel={inspector.activeChannel}
              setActiveChannel={inspector.setActiveChannel}
              buyerEmail={calculations.buyerEmail}
              dynamicTokenCount={calculations.dynamicTokenCount}
              acceptanceWordCount={calculations.acceptanceWordCount}
              isCommunicationAccordionOpen={inspector.isCommunicationAccordionOpen}
              setIsCommunicationAccordionOpen={inspector.setIsCommunicationAccordionOpen}
              acceptanceMessage={inspector.acceptanceMessage}
              setAcceptanceMessage={inspector.setAcceptanceMessage}
              settlementTokenValues={calculations.settlementTokenValues}
              formattedSettlementTotal={calculations.formattedSettlementTotal}
              numAwarded={calculations.numAwarded}
              isFullClearing={calculations.isFullClearing}
              isSubmittingAccept={inspector.isSubmittingAccept}
              onOpenPreviewModal={() => inspector.setIsPreviewModalOpen(true)}
              onConfirmAccept={inspector.handleConfirmAccept}
            />
          )}

          {inspector.activeMode === 'counter' && (
            <NegotiateCounterStage
              messages={calculations.messages}
              counterPrice={inspector.counterPrice}
              setCounterPrice={inspector.setCounterPrice}
              marginUpliftPct={calculations.marginUpliftPct}
              formattedUplift={calculations.formattedUplift}
              isPriceValid={calculations.isPriceValid}
              counterQuantity={inspector.counterQuantity}
              setCounterQuantity={inspector.setCounterQuantity}
              maxCounterVolume={calculations.maxCounterVolume}
              isQuantityValid={calculations.isQuantityValid}
              isReserveMet={calculations.isReserveMet}
              reserveFloorPrice={calculations.reserveFloorPrice}
              reserveFloorTotal={calculations.reserveFloorTotal}
              counterActiveChannel={inspector.counterActiveChannel}
              setCounterActiveChannel={inspector.setCounterActiveChannel}
              buyerEmail={calculations.buyerEmail}
              counterTokenCount={calculations.counterTokenCount}
              counterWordCount={calculations.counterWordCount}
              isCounterCommunicationAccordionOpen={inspector.isCounterCommunicationAccordionOpen}
              setIsCounterCommunicationAccordionOpen={inspector.setIsCounterCommunicationAccordionOpen}
              counterMessage={inspector.counterMessage}
              setCounterMessage={inspector.setCounterMessage}
              isSubmitting={isSubmitting}
              tokenValues={calculations.tokenValues}
              counterTotalRecovery={calculations.counterTotalRecovery}
              numCounterQuantity={calculations.numCounterQuantity}
              quantity={calculations.quantity}
              numCounterPrice={calculations.numCounterPrice}
              totalDelta={calculations.totalDelta}
              totalDeltaPct={calculations.totalDeltaPct}
              priceDelta={calculations.priceDelta}
              priceDeltaPct={calculations.priceDeltaPct}
              isCounterValid={calculations.isCounterValid}
              onOpenPreviewModal={() => inspector.setIsPreviewModalOpen(true)}
              onDispatchCounter={inspector.handleDispatchCounter}
            />
          )}

          {inspector.activeMode === 'decline' && (
            <DeclineOfferStage
              selectedDeclineReason={inspector.selectedDeclineReason}
              setSelectedDeclineReason={inspector.setSelectedDeclineReason}
              declineRationale={inspector.declineRationale}
              setDeclineRationale={inspector.setDeclineRationale}
              autoRelist={inspector.autoRelist}
              setAutoRelist={inspector.setAutoRelist}
              declineActiveChannel={inspector.declineActiveChannel}
              setDeclineActiveChannel={inspector.setDeclineActiveChannel}
              buyerEmail={calculations.buyerEmail}
              declineTokenCount={calculations.declineTokenCount}
              declineWordCount={calculations.declineWordCount}
              isDeclineCommunicationAccordionOpen={inspector.isDeclineCommunicationAccordionOpen}
              setIsDeclineCommunicationAccordionOpen={inspector.setIsDeclineCommunicationAccordionOpen}
              declineMessage={inspector.declineMessage}
              setDeclineMessage={inspector.setDeclineMessage}
              isSubmitting={isSubmitting}
              declineTokenValues={calculations.declineTokenValues}
              quantity={calculations.quantity}
              onClose={onClose}
              isSubmittingDecline={inspector.isSubmittingDecline}
              onOpenPreviewModal={() => inspector.setIsPreviewModalOpen(true)}
              onConfirmDecline={inspector.handleConfirmDecline}
            />
          )}

          {inspector.activeMode === 'timeline' && (
            <TimelineAuditStage
              allEvents={timeline.allEvents}
              filteredEvents={timeline.filteredEvents}
              timelineCategoryFilter={inspector.timelineCategoryFilter}
              setTimelineCategoryFilter={inspector.setTimelineCategoryFilter}
              timelineSearchQuery={inspector.timelineSearchQuery}
              setTimelineSearchQuery={inspector.setTimelineSearchQuery}
            />
          )}
        </div>
      </div>
    </div>

      <EmailPreviewDialog
        isOpen={inspector.isPreviewModalOpen}
        onClose={() => inspector.setIsPreviewModalOpen(false)}
        buyerEmail={calculations.buyerEmail}
        activeMode={inspector.activeMode}
        productTitle={calculations.productTitle}
        hydratedEmailContent={inspector.getActivePreviewEmailContent()}
      />
    </div>
  );
};

export default BidActionInspectorModal;
