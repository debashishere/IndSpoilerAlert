import React, { useState, useEffect } from 'react';
import { Users, Filter, Package, Check, Sparkles } from 'lucide-react';

export interface BuyerSegmentOption {
  key: string;
  name: string;
  badge: string;
  description: string;
}

export const BUYER_SEGMENTS: BuyerSegmentOption[] = [
  { key: 'short_dated_grocers', name: 'Short-Dated Grocers', badge: 'High Match', description: 'Grocers accepting lots with 5-15 days remaining shelf life.' },
  { key: 'discount_retailers', name: 'Discount Retailers', badge: 'Bulk Off-Take', description: 'Secondary & outlet liquidators specializing in bulk case buys.' },
  { key: 'food_banks', name: 'Food Banks & Rescues', badge: 'Tax Attestation', description: '501(c)(3) verified non-profit partners for donation diversion.' },
  { key: 'all_buyers', name: 'All Registered Buyers', badge: 'Broad Broadcast', description: 'Broadcast offer sheet to all active buyers in the network.' }
];

export interface SmartAudienceLotSelectorProps {
  supplierId: string;
  initialSegment?: string;
  initialLotIds?: string[];
  onAudienceChange?: (data: { buyerSegment: string; explicitBuyerIds: string[]; selectedLotIds: string[]; recipientCount: number; totalCases: number }) => void;
  apiBaseUrl?: string;
}

export function SmartAudienceLotSelector({
  supplierId,
  initialSegment = 'short_dated_grocers',
  initialLotIds = [],
  onAudienceChange,
  apiBaseUrl = '/api'
}: SmartAudienceLotSelectorProps) {
  const [buyerSegment, setBuyerSegment] = useState<string>(initialSegment);
  const [explicitBuyerIds, setExplicitBuyerIds] = useState<string[]>([]);
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>(initialLotIds);

  const [availableLots, setAvailableLots] = useState<any[]>([
    { _id: 'lot-880', lotNumber: 'LOT-880', description: 'Organic Milk 1L', quantityCases: 240, remainingShelfLife: 0.15 },
    { _id: 'lot-881', lotNumber: 'LOT-881', description: 'Greek Yogurt 500g', quantityCases: 150, remainingShelfLife: 0.22 },
    { _id: 'lot-882', lotNumber: 'LOT-882', description: 'Cheddar Cheese 200g', quantityCases: 300, remainingShelfLife: 0.18 }
  ]);

  const [previewMetrics, setPreviewMetrics] = useState<{ recipientCount: number; totalCases: number }>({
    recipientCount: 4,
    totalCases: 690
  });

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Fetch live preview metrics from REST API
  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const res = await fetch(`${apiBaseUrl}/emails/broadcast-preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierId,
            buyerSegment,
            explicitBuyerIds,
            lotIds: selectedLotIds
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setPreviewMetrics({
              recipientCount: data.recipientCount || 0,
              totalCases: data.totalCases || 0
            });
            if (onAudienceChange) {
              onAudienceChange({
                buyerSegment,
                explicitBuyerIds,
                selectedLotIds,
                recipientCount: data.recipientCount || 0,
                totalCases: data.totalCases || 0
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch broadcast preview:', err);
      } finally {
        if (isMounted) setIsLoadingPreview(false);
      }
    };

    fetchPreview();
    return () => { isMounted = false; };
  }, [supplierId, buyerSegment, explicitBuyerIds, selectedLotIds, apiBaseUrl, onAudienceChange]);

  const toggleLotSelection = (lotId: string) => {
    setSelectedLotIds(prev =>
      prev.includes(lotId) ? prev.filter(id => id !== lotId) : [...prev, lotId]
    );
  };

  return (
    <div className="space-y-6" data-testid="smart-audience-lot-selector">
      {/* Target Buyer Segment Controls */}
      <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Smart Audience Targeting
          </h4>
          <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5" data-testid="recipient-count-badge">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            {isLoadingPreview ? 'Calculating...' : `${previewMetrics.recipientCount} Matched Buyer Accounts`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BUYER_SEGMENTS.map(seg => {
            const isSelected = buyerSegment === seg.key;
            return (
              <button
                key={seg.key}
                type="button"
                onClick={() => setBuyerSegment(seg.key)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    {seg.name}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                    {seg.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{seg.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Surplus Inventory Lot Picker */}
      <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            Surplus Inventory Lot Picker
          </h4>
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-xs font-semibold" data-testid="total-cases-badge">
            {previewMetrics.totalCases} Total Targeted Cases
          </span>
        </div>

        <div className="space-y-2">
          {availableLots.map(lot => {
            const isChecked = selectedLotIds.includes(lot._id);
            return (
              <div
                key={lot._id}
                onClick={() => toggleLotSelection(lot._id)}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  isChecked
                    ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      {lot.lotNumber} — {lot.description}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      RSL: <span className="text-amber-400 font-mono">{(lot.remainingShelfLife * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded-lg text-xs font-mono font-bold">
                    {lot.quantityCases} Cases
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
