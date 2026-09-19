import { CATEGORY_ELASTICITIES, DEFAULT_BID_STATUS_INFO } from './lotOperationsConstants';
import type { BidStatusInfo, PricingDataPoint } from '../types/lotOperations.types';

export function calculateDaysRemaining(dateStr: string): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function calculateRslRatio(daysRemaining: number, shelfLifeDays: number = 30): number {
  return Math.max(0, Math.min(100, Math.round((daysRemaining / (shelfLifeDays || 30)) * 100)));
}

export function getPricingForDay(
  t: number,
  qty: number,
  originalPrice: number,
  category: string
): { discount: number; price: number; revenue: number } {
  const elasticity = CATEGORY_ELASTICITIES[category] ?? -1.5;
  const k = 4.0 * Math.abs(elasticity);

  let bestDiscount = 0.05;
  let maxRev = -1;
  const d_half = Math.max(0.1, Math.min(0.8, 0.8 - 0.7 * (t / 30.0)));

  for (let d = 0; d <= 0.95; d += 0.01) {
    const price = originalPrice * (1.0 - d);
    let sellThrough = 1.0 / (1.0 + Math.exp(-k * (d - d_half)));
    if (qty > 500) sellThrough *= 0.90;
    else if (qty > 100) sellThrough *= 0.95;
    sellThrough = Math.min(0.99, Math.max(0.01, sellThrough));
    const revenue = qty * price * sellThrough;
    if (revenue > maxRev) {
      maxRev = revenue;
      bestDiscount = d;
    }
  }

  const price = originalPrice * (1.0 - bestDiscount);
  return { discount: bestDiscount, price, revenue: maxRev };
}

export function generatePricingPoints(
  currentQty: number,
  originalPrice: number,
  category: string,
  maxDays: number = 45
): { points: PricingDataPoint[]; maxRev: number } {
  const points: PricingDataPoint[] = [];
  let maxRev = 0.01;

  for (let t = 0; t <= maxDays; t += 5) {
    const res = getPricingForDay(t, currentQty, originalPrice, category);
    points.push({ t, price: res.price, revenue: res.revenue });
    if (res.revenue > maxRev) {
      maxRev = res.revenue;
    }
  }

  return { points, maxRev };
}

export function getBidStatusInfo(rawStatus?: string, bid?: any): BidStatusInfo {
  const s = (rawStatus || '').toLowerCase();
  if (s === 'countered') {
    return DEFAULT_BID_STATUS_INFO.countered;
  }
  if (s === 'fully_accepted' || s === 'partially_accepted' || s === 'awarded' || s === 'accepted') {
    return DEFAULT_BID_STATUS_INFO.awarded;
  }
  if (s === 'rejected' || s === 'declined') {
    return DEFAULT_BID_STATUS_INFO.declined;
  }
  const msgs = bid?.messages || [];
  if (msgs.length > 0) {
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg?.sender === 'buyer' && (msgs.length > 1 || lastMsg?.proposedPrice !== undefined)) {
      return DEFAULT_BID_STATUS_INFO.buyer_countered;
    }
  }
  return DEFAULT_BID_STATUS_INFO.pending;
}
