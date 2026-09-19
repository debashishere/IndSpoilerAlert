import React from 'react';
import { Users } from 'lucide-react';

interface LotBuyerMatchesProps {
  recommendedBuyers: any[];
  buyersLoading?: boolean;
}

export const LotBuyerMatches: React.FC<LotBuyerMatchesProps> = ({
  recommendedBuyers = [],
  buyersLoading,
}) => {
  return (
    <div className="lot-hub-card">
      <div className="lot-hub-card-header">
        <div className="lot-hub-card-title flex items-center gap-2 font-semibold">
          <Users size={18} className="text-[hsl(var(--success))]" />
          <span>AI Recommended Buyer Matches ({recommendedBuyers.length})</span>
        </div>
      </div>
      {buyersLoading ? (
        <div className="p-5 text-center">
          <div className="loader mx-auto mb-2.5" />
          <p className="text-xs text-[hsl(var(--text-muted))]">Matching buyer preferences from Sidecar AI...</p>
        </div>
      ) : recommendedBuyers.length > 0 ? (
        <div className="flex flex-col gap-2.5 max-h-[280px] overflow-y-auto pr-1">
          {recommendedBuyers.map((match: any, idx: number) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-[hsl(var(--bg-main))] rounded-lg border border-[hsl(var(--border-color))]"
            >
              <div>
                <div className="font-semibold text-sm">{match.buyer?.companyName || 'Verified Buyer'}</div>
                <div className="text-xs text-[hsl(var(--text-muted))]">
                  {match.buyer?.preferredCategory || 'All Categories'} • Match Score:{' '}
                  <strong className="text-[hsl(var(--success))]">{Math.round((match.score || 0) * 100)}%</strong>
                </div>
              </div>
              <span className="badge badge-outline-primary text-xs">
                {match.reason || 'Strong category synergy'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[hsl(var(--text-muted))] italic">
          No exact demand matches found yet. Activate lot on marketplace to broadcast to buyer network.
        </p>
      )}
    </div>
  );
};
