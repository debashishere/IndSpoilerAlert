import React from 'react';
import { ArrowLeft, Award, HeartHandshake, Recycle } from 'lucide-react';

interface LotOperationsHeaderProps {
  lot: any;
  backButtonLabel: string;
  onBack: () => void;
  onPublishMarketplace?: (lot: any) => void;
  onEnableBidding: (lot: any) => void;
  onDonate: (lot: any) => void;
  onRecycle: (lot: any) => void;
}

export const LotOperationsHeader: React.FC<LotOperationsHeaderProps> = ({
  lot,
  backButtonLabel,
  onBack,
  onPublishMarketplace,
  onEnableBidding,
  onDonate,
  onRecycle,
}) => {
  let statusColor = 'hsl(var(--warning))';
  if (lot.status === 'active') statusColor = 'hsl(var(--primary))';
  if (lot.status === 'sold') statusColor = 'hsl(var(--success))';
  if (lot.status === 'donated' || lot.status === 'recycled') statusColor = 'hsl(var(--secondary))';
  if (lot.status === 'expired') statusColor = 'hsl(var(--error))';

  return (
    <div className="lot-hub-header">
      <div className="lot-hub-title-section">
        <button className="lot-hub-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> {backButtonLabel}
        </button>
        <div className="lot-hub-title-row">
          <h1 className="lot-hub-title">{lot.productId?.description || 'Unknown Product'}</h1>
          <span className="badge badge-outline-primary text-xs">
            {lot.productId?.sku}
          </span>
          <span
            className="badge uppercase font-bold text-xs"
            style={{
              backgroundColor: `${statusColor} / 15%`,
              color: statusColor,
              border: `1px solid ${statusColor} / 30%`,
            }}
          >
            {lot.status === 'active' ? 'Active List' : lot.status}
          </span>
          <span className="badge bg-[hsl(var(--border-color))] text-[hsl(var(--text-secondary))] text-xs">
            Lot #{lot.lotNumber}
          </span>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="lot-hub-actions">
        {(lot.status === 'pending' || lot.status === 'active') && (
          <button
            className="btn btn-emerald flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-colors"
            onClick={() => (onPublishMarketplace ? onPublishMarketplace(lot) : alert('Publishing to Marketplace...'))}
            title="Publish sanitized listing to public Buyer Marketplace"
          >
            <Award size={16} /> Publish to Marketplace
          </button>
        )}
        {lot.status === 'pending' && (
          <button className="btn btn-primary text-xs font-medium" onClick={() => onEnableBidding(lot)}>
            <Award size={16} /> Enable Bids
          </button>
        )}
        {(lot.status === 'pending' || lot.status === 'active') && (
          <>
            <button className="btn btn-secondary text-xs font-medium" onClick={() => onDonate(lot)} title="Divert to Charity Network">
              <HeartHandshake size={16} /> Donate
            </button>
            <button className="btn btn-secondary text-xs font-medium" onClick={() => onRecycle(lot)} title="Schedule Ecological Disposal">
              <Recycle size={16} /> Recycle
            </button>
          </>
        )}
      </div>
    </div>
  );
};
