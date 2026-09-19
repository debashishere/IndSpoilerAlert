import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../store';
import { setSliderDays as setReduxSliderDays, setSliderQty as setReduxSliderQty } from '../../../../store/slices/inventorySlice';
import { fetchPricingThunk } from '../../../../services/inventoryService';
import { calculateDaysRemaining, generatePricingPoints } from '../constants/lotPricingCalculations';

interface UseLotPricingSimulatorParams {
  lot: any;
  pricingData?: any;
  suggestingPricing?: boolean;
  sliderDays?: number;
  setSliderDays?: (val: number) => void;
  sliderQty?: number;
  setSliderQty?: (val: number) => void;
  onSlidersCommit?: (days: number, qty: number) => void;
  handleSuggestPricing?: (lot: any) => void;
}

export function useLotPricingSimulator({
  lot,
  pricingData,
  suggestingPricing,
  sliderDays: propSliderDays,
  setSliderDays: propSetSliderDays,
  sliderQty: propSliderQty,
  setSliderQty: propSetSliderQty,
  onSlidersCommit,
  handleSuggestPricing,
}: UseLotPricingSimulatorParams) {
  const dispatch = useDispatch<AppDispatch>();

  const daysRemaining = useMemo(
    () => calculateDaysRemaining(lot?.expirationDate),
    [lot?.expirationDate]
  );

  const currentDays = propSliderDays ?? 30;
  const currentQty = propSliderQty ?? (lot?.quantityCases || 100);

  const handleSliderDaysChange = (val: number) => {
    if (propSetSliderDays) {
      propSetSliderDays(val);
    } else {
      dispatch(setReduxSliderDays(val));
    }
  };

  const handleSliderQtyChange = (val: number) => {
    if (propSetSliderQty) {
      propSetSliderQty(val);
    } else {
      dispatch(setReduxSliderQty(val));
    }
  };

  const handleSlidersCommit = (days: number, qty: number) => {
    if (onSlidersCommit) {
      onSlidersCommit(days, qty);
    } else if (lot?.opportunity?._id) {
      dispatch(
        fetchPricingThunk({
          opportunityId: lot.opportunity._id,
          daysRemaining: days,
          quantityCases: qty,
        }) as any
      );
    }
  };

  const handleSuggestPricingAction = () => {
    if (handleSuggestPricing) {
      handleSuggestPricing(lot);
    } else if (lot?.opportunity?._id) {
      dispatch(
        fetchPricingThunk({
          opportunityId: lot.opportunity._id,
          daysRemaining: typeof currentDays === 'number' ? currentDays : 30,
          quantityCases: typeof currentQty === 'number' ? currentQty : (lot?.quantityCases || 100),
        }) as any
      );
    }
  };

  const originalPrice = lot?.costPerCase || lot?.productId?.standardSellPrice || 0;
  const category = lot?.productId?.category || 'Dry Goods';

  const { points, maxRev } = useMemo(
    () => generatePricingPoints(currentQty, originalPrice, category, 45),
    [currentQty, originalPrice, category]
  );

  // SVG dimensions
  const svgDimensions = {
    width: 360,
    height: 150,
    paddingLeft: 45,
    paddingRight: 15,
    paddingTop: 15,
    paddingBottom: 25,
  };

  const plotWidth = svgDimensions.width - svgDimensions.paddingLeft - svgDimensions.paddingRight;
  const plotHeight = svgDimensions.height - svgDimensions.paddingTop - svgDimensions.paddingBottom;

  const getX = (t: number) => svgDimensions.paddingLeft + (t / 45) * plotWidth;
  const getYPrice = (price: number) =>
    svgDimensions.paddingBottom +
    plotHeight -
    (price / (originalPrice || 1)) * plotHeight +
    svgDimensions.paddingTop;
  const getYRev = (rev: number) =>
    svgDimensions.paddingBottom +
    plotHeight -
    (rev / maxRev) * plotHeight +
    svgDimensions.paddingTop;

  const { pricePath, revPath } = useMemo(() => {
    let pPath = '';
    let rPath = '';
    points.forEach((pt, idx) => {
      const x = getX(pt.t);
      const yP = getYPrice(pt.price);
      const yR = getYRev(pt.revenue);
      if (idx === 0) {
        pPath = `M ${x} ${yP}`;
        rPath = `M ${x} ${yR}`;
      } else {
        pPath += ` L ${x} ${yP}`;
        rPath += ` L ${x} ${yR}`;
      }
    });
    return { pricePath: pPath, revPath: rPath };
  }, [points, originalPrice, maxRev]);

  const currentX = getX(currentDays);

  return {
    daysRemaining,
    currentDays,
    currentQty,
    originalPrice,
    handleSliderDaysChange,
    handleSliderQtyChange,
    handleSlidersCommit,
    handleSuggestPricingAction,
    points,
    maxRev,
    svgDimensions,
    plotWidth,
    plotHeight,
    pricePath,
    revPath,
    currentX,
    getX,
    getYPrice,
    getYRev,
    suggestingPricing,
    pricingData,
  };
}
