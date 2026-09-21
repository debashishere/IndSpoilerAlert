import { ensureDefaultBuyerLists } from '../../../../../store/slices/coreSlice';
import type { Stage } from '../types/studio.types';

export function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const formatWaitTime = (hours: number): string => {
  if (!hours || hours <= 0) return '0m';
  const totalMins = Math.round(hours * 60);
  if (totalMins >= 1440) {
    const d = Math.floor(totalMins / 1440);
    const remMins = totalMins % 1440;
    if (remMins === 0) return `${d}d`;
    const h = Math.floor(remMins / 60);
    const m = remMins % 60;
    if (h > 0 && m > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${d}d ${h}h`;
    return `${d}d ${m}m`;
  }
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const compileFrontendCron = (timeOfDay: string, daysOfWeek: number[]): string => {
  let timeStr = String(timeOfDay || '09:00').trim();
  let isPM = false;
  let isAM = false;
  if (/pm/i.test(timeStr)) { isPM = true; timeStr = timeStr.replace(/pm/i, '').trim(); }
  if (/am/i.test(timeStr)) { isAM = true; timeStr = timeStr.replace(/am/i, '').trim(); }

  const parts = timeStr.split(':');
  let hour = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;

  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;

  const daysStr = daysOfWeek && daysOfWeek.length > 0 ? daysOfWeek.join(',') : '*';
  return `${minute} ${hour} * * ${daysStr}`;
};

export const format12HourTime = (timeStr: string): string => {
  if (!timeStr) return '09:00 AM';
  let t = String(timeStr).trim();
  let isPM = false;
  let isAM = false;
  if (/pm/i.test(t)) { isPM = true; t = t.replace(/pm/i, '').trim(); }
  if (/am/i.test(t)) { isAM = true; t = t.replace(/am/i, '').trim(); }

  const parts = t.split(':');
  let h = parseInt(parts[0], 10);
  if (isNaN(h)) return timeStr;
  let m = (parts[1] || '00').replace(/[^0-9]/g, '');
  if (m.length < 2) m = m.padStart(2, '0');

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  const ampm = h >= 12 ? 'PM' : 'AM';
  let displayHour = h % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${m} ${ampm}`;
};

export function getStageBuyerCount(stage: Stage, buyerListsOrBuyers: any[] = [], allBuyersFallback: any[] = []): number {
  if (stage.buyerMode === 'custom') {
    return stage.customBuyers ? stage.customBuyers.length : 0;
  }
  const targetId = stage.buyerListId || stage.buyerSegment || (stage.stageIndex === 1 || stage.stageIndex === 2 || stage.stageNumber === 2 ? 'secondary' : 'primary');
  if (!targetId || targetId === 'empty_segment') {
    return 0;
  }

  const isListArray = buyerListsOrBuyers && buyerListsOrBuyers.some(b => b && Array.isArray(b.buyerIds));
  const effectiveLists = ensureDefaultBuyerLists(isListArray ? buyerListsOrBuyers : []);

  let matched = effectiveLists.find((l: any) => l._id === targetId || l.type === targetId || l.id === targetId);
  if (!matched && (targetId === 'primary' || targetId === 'tier1' || targetId === 'tier1_retailers')) {
    matched = effectiveLists.find((l: any) => l.type === 'primary') || effectiveLists[0];
  }
  if (!matched && (targetId === 'secondary' || targetId === 'all_liquidators' || targetId === 'liquidator')) {
    matched = effectiveLists.find((l: any) => l.type === 'secondary') || effectiveLists[1] || effectiveLists[0];
  }

  if (matched && Array.isArray(matched.buyerIds)) {
    return matched.buyerIds.length;
  }

  const candidateBuyers = !isListArray && buyerListsOrBuyers && buyerListsOrBuyers.length > 0
    ? buyerListsOrBuyers
    : allBuyersFallback;

  if (candidateBuyers && candidateBuyers.length > 0) {
    const isSec = targetId === 'secondary' || (matched && matched.type === 'secondary');
    const filtered = candidateBuyers.filter((b: any) => {
      const t = String(b.tier ?? '').toLowerCase();
      if (isSec) return t === 'tier2' || t === 'secondary' || t === 'liquidator' || t === 'all_liquidators' || t === '2';
      return !t || t === 'tier1' || t === 'primary' || t === 'tier1_retailers' || t === '1';
    });
    if (filtered.length > 0) return filtered.length;
    if (!isListArray) return candidateBuyers.length;
  }

  if (matched && matched.buyerIds?.length === 0) {
    return 0;
  }

  return 0;
}

export function getStageValidationErrors(
  stage: Stage,
  stageIndex: number,
  reduxBuyerLists: any[] = [],
  buyers: any[] = []
): string[] {
  const errors: string[] = [];
  const sType = stage.stageType || 'liquidation';
  const sNum = stage.stageNumber || (stage.stageIndex != null ? (stage.stageIndex === 0 || stage.stageIndex > 0 && stage.stageIndex <= stageIndex ? stage.stageIndex + 1 : stage.stageIndex) : stageIndex + 1);
  const buyerCount = getStageBuyerCount(stage, reduxBuyerLists, buyers);

  if (sType === 'donation') {
    if (buyerCount === 0) {
      errors.push(`Donation Stage ${sNum} requires at least 1 targeted charity or non-profit partner.`);
    }
    if (stage.allocatedLotIds !== undefined && Array.isArray(stage.allocatedLotIds) && stage.allocatedLotIds.length === 0) {
      errors.push(`Donation Stage ${sNum} requires at least 1 allocated inventory lot.`);
    }
    if (typeof stage.waitHours !== 'number' || stage.waitHours <= 0) {
      errors.push(`Donation Stage ${sNum} requires a valid response window (> 0 hours).`);
    }
  } else if (sType === 'landfill') {
    if (buyerCount === 0) {
      errors.push(`Landfill Stage ${sNum} requires at least 1 disposal contact or partner.`);
    }
    if (stage.allocatedLotIds !== undefined && Array.isArray(stage.allocatedLotIds) && stage.allocatedLotIds.length === 0) {
      errors.push(`Landfill Stage ${sNum} requires at least 1 allocated inventory lot.`);
    }
    if (!stage.disposalDeadline || !stage.disposalDeadline.trim()) {
      errors.push(`Landfill Stage ${sNum} requires a valid disposal deadline date.`);
    }
  } else {
    // Liquidation
    if (buyerCount === 0) {
      errors.push(`Liquidation Stage ${sNum} requires at least 1 targeted buyer.`);
    }
    if (stage.discountType === 'fixed' || stage.discountType === 'floor') {
      if (typeof stage.discountValue !== 'number' || stage.discountValue <= 0 || isNaN(stage.discountValue)) {
        errors.push(`Liquidation Stage ${sNum} requires a valid discount value (> 0).`);
      }
    }
    if (typeof stage.waitHours !== 'number' || stage.waitHours <= 0) {
      errors.push(`Liquidation Stage ${sNum} requires a valid response window (> 0 hours).`);
    }
    if (stage.allocatedLotIds !== undefined && Array.isArray(stage.allocatedLotIds) && stage.allocatedLotIds.length === 0) {
      errors.push(`Liquidation Stage ${sNum} requires at least 1 allocated inventory lot.`);
    }
  }

  return errors;
}

export function resolveStagesWithBuyerLists(stages: Stage[], buyerLists: any[]): Stage[] {
  if (!buyerLists || buyerLists.length === 0) return stages;
  const primaryList = buyerLists.find((l: any) => l.type === 'primary');
  const secondaryList = buyerLists.find((l: any) => l.type === 'secondary');

  return stages.map(s => {
    if (s.buyerMode === 'list' || s.buyerMode === 'segment') {
      let targetId = s.buyerListId || s.buyerSegment;
      let matched = buyerLists.find((l: any) => l._id === targetId || l.type === targetId);
      if (!matched && (targetId === 'primary' || targetId === 'tier1' || targetId === 'tier1_retailers')) {
        matched = primaryList || buyerLists[0];
      }
      if (!matched && (targetId === 'secondary' || targetId === 'all_liquidators' || targetId === 'liquidator')) {
        matched = secondaryList || buyerLists[1] || buyerLists[0];
      }
      if (matched) {
        return {
          ...s,
          buyerMode: 'list',
          buyerListId: matched._id,
          buyerListName: matched.name,
          buyerSegment: matched._id,
        };
      }
    }
    return s;
  });
}
