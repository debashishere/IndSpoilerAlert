import React from 'react';
import { Users, RotateCw, Send } from 'lucide-react';

interface LotBuyerMatchesProps {
  recommendedBuyers: any[];
  buyersLoading?: boolean;
  onRefreshFeed?: () => void;
  onExecuteBroadcast?: () => void;
  onDirectPitch?: (buyer: any) => void;
}

const DEFAULT_STITCH_BUYERS = [
  {
    name: 'Kroger Mid-Atlantic Hub',
    matchScore: 94,
    autoDispatched: true,
    category: 'Beverages & Dry',
    sla: '48h SLA Priority',
    logistics: 'Direct Rail',
    isDonation: false,
  },
  {
    name: "Trader Joe's Northeast Distribution",
    matchScore: 89,
    autoDispatched: false,
    category: 'High Volume Buyer',
    sla: 'Tea Category Lead',
    logistics: 'Refrigerated Fleet',
    isDonation: false,
  },
  {
    name: 'HEB Texas Central Supply',
    matchScore: 86,
    autoDispatched: false,
    category: 'Proximity: 42 mi',
    sla: 'Same-day Pick Up',
    logistics: 'Dock 4 Direct',
    isDonation: false,
  },
  {
    name: 'Albertsons Pacific Northwest',
    matchScore: 80,
    autoDispatched: false,
    category: 'Regular Surplus Bidder',
    sla: 'Bulk Freight',
    logistics: 'Intermodal',
    isDonation: false,
  },
  {
    name: 'North Texas Food Bank (NTFB)',
    matchScore: 78,
    autoDispatched: false,
    category: '100% Tax Write-Off Route',
    sla: 'Zero-Waste',
    logistics: 'Charity Escort',
    isDonation: true,
  },
];

export const LotBuyerMatches: React.FC<LotBuyerMatchesProps> = ({
  recommendedBuyers = [],
  buyersLoading,
  onRefreshFeed,
  onExecuteBroadcast,
  onDirectPitch,
}) => {
  const displayBuyers =
    recommendedBuyers.length > 0
      ? recommendedBuyers.map((b: any) => ({
          name: b.buyer?.companyName || b.name || 'Verified Partner Buyer',
          matchScore: Math.round((b.score || 0.85) * (b.score > 1 ? 1 : 100)),
          autoDispatched: b.autoDispatched || false,
          category: b.buyer?.preferredCategory || b.category || 'Surplus Inventory',
          sla: b.reason || b.sla || 'Priority Route',
          logistics: b.logistics || 'Standard Freight',
          isDonation: b.isDonation || false,
          raw: b,
        }))
      : DEFAULT_STITCH_BUYERS;

  return (
    <article
      className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle-card font-sans"
      data-purpose="ai-buyer-matches"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4 flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              AI Buyer Match Engine &amp; Execution Queue
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-100 text-brand-900 font-bold">
                {displayBuyers.length} VERIFIED
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Autonomous routing active (Radius 300mi, SLA Priority)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefreshFeed}
          className="text-xs font-mono text-brand-700 hover:text-brand-900 font-semibold transition flex items-center space-x-1 cursor-pointer bg-transparent border-none p-0"
        >
          <RotateCw className="w-3 h-3 text-brand-600" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {buyersLoading ? (
        <div className="p-8 text-center font-mono">
          <div className="loader mx-auto mb-2.5" />
          <p className="text-xs text-slate-400">Scanning real-time demand ledger &amp; pricing preferences...</p>
        </div>
      ) : (
        <>
          {/* Buyer Rows */}
          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
            {displayBuyers.map((buyer, idx) => (
              <div
                key={idx}
                className={`py-3 flex items-center justify-between group px-2 rounded-lg transition ${
                  buyer.isDonation ? 'hover:bg-rose-50/50' : 'hover:bg-slate-50/60'
                }`}
                data-agent-action="route-lead"
              >
                <div className="space-y-1 min-w-0 pr-3">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span
                      className={`text-xs font-bold text-slate-900 font-sans truncate ${
                        buyer.isDonation ? 'group-hover:text-rose-700' : 'group-hover:text-brand-900'
                      }`}
                    >
                      {buyer.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                        buyer.isDonation
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : buyer.matchScore >= 85
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-brand-50 text-brand-900 border-brand-200'
                      }`}
                    >
                      {buyer.matchScore}% Match
                    </span>
                    {buyer.autoDispatched && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-50 text-brand-800 font-semibold border border-brand-200">
                        Auto-Dispatched
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-2 truncate">
                    <span>{buyer.category}</span>
                    <span>•</span>
                    <span className="text-brand-700 font-medium">{buyer.sla}</span>
                    <span>•</span>
                    <span>{buyer.logistics}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDirectPitch?.(buyer)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition whitespace-nowrap shadow-2xs cursor-pointer shrink-0 ${
                    buyer.isDonation
                      ? 'bg-white hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-200'
                      : idx === 0
                      ? 'bg-brand-500 hover:bg-brand-600 text-white'
                      : 'bg-white hover:bg-brand-500 hover:text-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {buyer.isDonation ? 'Donation Claim' : 'Direct Pitch'}
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Agent Action Bar */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot"></span>
                <span>
                  Autonomous RFQ Dispatch: <strong>{displayBuyers.length} of {displayBuyers.length} Routed</strong>
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Policy: No Human Ack Required</span>
            </div>
            <button
              type="button"
              onClick={onExecuteBroadcast}
              className="w-full py-2.5 rounded-lg bg-brand-900 hover:bg-brand-800 text-white text-xs font-mono font-bold transition flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
            >
              <Send className="w-4 h-4 text-brand-300" />
              <span>Execute Multi-Buyer Broadcast RFQ</span>
            </button>
          </div>
        </>
      )}
    </article>
  );
};
