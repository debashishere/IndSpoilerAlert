import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../../../store';
import {
  setSelectedLotHubId,
  setLotHubSubTab,
  setSelectedLot,
} from '../../../../store/slices/inventorySlice';
import { setActiveTab } from '../../../../store/slices/coreSlice';
import {
  enableLotBiddingThunk,
  donateLotThunk,
  recycleLotThunk,
  updateProductAllergensThunk,
  updateLotComplianceThunk,
  uploadComplianceDocThunk,
} from '../../../../services/inventoryService';
import { useLotPricingSimulator } from './useLotPricingSimulator';
import { useLotBidsTradingDesk } from './useLotBidsTradingDesk';
import { useLotActivitiesStream } from './useLotActivitiesStream';
import type { FeedbackToastState, LotHubSubTab, LotOperationsHubViewProps } from '../types/lotOperations.types';

export function useLotOperationsHub(props: LotOperationsHubViewProps) {
  const dispatch = useDispatch<AppDispatch>();
  const reduxInventory = useSelector((state: RootState) => state.inventory);
  const { selectedLotHubId, lotHubSubTab, lotHubData, selectedLot, inventoryList } = reduxInventory;

  const [localComplianceFile, setLocalComplianceFile] = useState<File | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<FeedbackToastState | null>(null);

  // Compute resolved values
  const lot = props.lot || selectedLot || inventoryList.find((l: any) => l._id === selectedLotHubId);
  const subTab: LotHubSubTab = props.subTab || lotHubSubTab || 'details';
  const drawerLoading = props.drawerLoading ?? lotHubData.loading;
  const riskProfile = props.riskProfile ?? lotHubData.riskProfile;
  const suggestingPricing = props.suggestingPricing ?? lotHubData.pricingLoading;
  const recommendedBuyers = props.recommendedBuyers ?? lotHubData.buyerMatches ?? [];
  const buyersLoading = props.buyersLoading ?? lotHubData.buyersLoading;
  const complianceFile = props.complianceFile !== undefined ? props.complianceFile : localComplianceFile;
  const sliderDays = props.sliderDays ?? lotHubData.sliderDays ?? 30;
  const sliderQty = props.sliderQty ?? lotHubData.sliderQty ?? (lot?.quantityCases || 100);
  const pricingData = props.pricingData ?? lotHubData.pricingData;
  const bidsList = props.bidsList ?? lotHubData.bidsList ?? [];
  const negotiationBids = props.negotiationBids ?? lotHubData.negotiationBids ?? [];
  const negotiationBidsLoading = props.negotiationBidsLoading ?? lotHubData.negotiationBidsLoading;
  const selectedBidForNegotiation = props.selectedBidForNegotiation !== undefined ? props.selectedBidForNegotiation : lotHubData.selectedBidForNegotiation;
  const lotActivities = props.lotActivities ?? lotHubData.lotActivities ?? [];
  const activityFilter = props.activityFilter ?? lotHubData.activityFilter ?? 'all';
  const activityTypeInput = props.activityTypeInput ?? lotHubData.selectedFormType ?? 'Email';
  const activityContentInput = props.activityContentInput !== undefined ? props.activityContentInput : lotHubData.activityContentInput;

  const returnTab = useSelector((state: RootState) => state.core?.returnTab);
  const backButtonLabel = returnTab === 'ingestion' ? 'Back to Ingestion Table' : 'Back to Inventory List';

  const handleBack = () => {
    if (props.onBack) {
      props.onBack();
    } else {
      dispatch(setSelectedLotHubId(null));
      dispatch(setSelectedLot(null));
      dispatch(setActiveTab((returnTab || 'inventory') as any));
    }
  };

  const handleSubTabChange = (tab: LotHubSubTab) => {
    if (props.setSubTab) {
      props.setSubTab(tab);
    } else {
      dispatch(setLotHubSubTab(tab));
    }
  };

  const handleEnableBiddingAction = (targetLot: any) => {
    if (props.onEnableBidding) {
      props.onEnableBidding(targetLot);
    } else {
      dispatch(enableLotBiddingThunk(targetLot) as any);
    }
  };

  const handleDonateAction = (targetLot: any) => {
    if (props.onDonate) {
      props.onDonate(targetLot);
    } else {
      dispatch(donateLotThunk(targetLot._id) as any);
    }
  };

  const handleRecycleAction = (targetLot: any) => {
    if (props.onRecycle) {
      props.onRecycle(targetLot);
    } else {
      dispatch(recycleLotThunk(targetLot._id) as any);
    }
  };

  const handleUpdateProductAllergensAction = async (productId: string, newAllergens: string[]) => {
    if (props.handleUpdateProductAllergens) {
      await props.handleUpdateProductAllergens(productId, newAllergens);
    } else {
      await dispatch(updateProductAllergensThunk({ productId, allergens: newAllergens }) as any);
    }
  };

  const handleUpdateLotComplianceAction = (lotId: string, updates: any) => {
    if (props.handleUpdateLotCompliance) {
      props.handleUpdateLotCompliance(lotId, updates);
    } else {
      dispatch(updateLotComplianceThunk({ lotId, updates }) as any);
    }
  };

  const handleSetComplianceFile = (file: File | null) => {
    if (props.setComplianceFile) {
      props.setComplianceFile(file);
    } else {
      setLocalComplianceFile(file);
    }
  };

  const handleUploadComplianceDocAction = () => {
    if (props.handleUploadComplianceDoc) {
      props.handleUploadComplianceDoc();
    } else if (complianceFile && lot?._id) {
      dispatch(
        uploadComplianceDocThunk({
          lotId: lot._id,
          docType: 'COA',
          file: complianceFile,
        }) as any
      ).then(() => {
        handleSetComplianceFile(null);
      });
    }
  };

  // Sub-hooks
  const pricingSimulator = useLotPricingSimulator({
    lot,
    pricingData,
    suggestingPricing,
    sliderDays,
    setSliderDays: props.setSliderDays,
    sliderQty,
    setSliderQty: props.setSliderQty,
    onSlidersCommit: props.onSlidersCommit,
    handleSuggestPricing: props.handleSuggestPricing,
  });

  const bidsTradingDesk = useLotBidsTradingDesk({
    lot,
    bidsList,
    negotiationBids,
    negotiationBidsLoading,
    selectedBidForNegotiation,
    setSelectedBidForNegotiation: props.setSelectedBidForNegotiation,
    inventoryList,
    selectedLot,
    onSelectBid: props.onSelectBid,
    onOpenBidInspector: props.onOpenBidInspector,
    isBidInspectorOpen: props.isBidInspectorOpen,
    setIsBidInspectorOpen: props.setIsBidInspectorOpen,
    onDeclineBid: props.onDeclineBid,
    onResetBid: props.onResetBid,
    onCounterBid: props.onCounterBid,
    onAcceptBid: props.onAcceptBid,
    setFeedbackToast,
  });

  const activitiesStream = useLotActivitiesStream({
    lot,
    lotActivities,
    activityFilter,
    setActivityFilter: props.setActivityFilter,
    activityTypeInput,
    setActivityTypeInput: props.setActivityTypeInput,
    activityContentInput,
    setActivityContentInput: props.setActivityContentInput,
    handleCreateLotActivity: props.handleCreateLotActivity,
  });

  return {
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
    onPublishMarketplace: props.onPublishMarketplace,
  };
}
