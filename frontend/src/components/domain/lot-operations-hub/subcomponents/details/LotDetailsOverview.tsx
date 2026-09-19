import React from 'react';
import { Box, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { calculateDaysRemaining, calculateRslRatio } from '../../constants/lotPricingCalculations';

interface LotDetailsOverviewProps {
  lot: any;
  onUpdateProductAllergens: (productId: string, newAllergens: string[]) => Promise<void>;
}

export const LotDetailsOverview: React.FC<LotDetailsOverviewProps> = ({
  lot,
  onUpdateProductAllergens,
}) => {
  const daysRemaining = calculateDaysRemaining(lot?.expirationDate);
  const totalValue = (lot?.availableQty ?? 0) * (lot?.costPerCase ?? 0);
  const rslRatio = calculateRslRatio(daysRemaining, lot?.productId?.shelfLifeDays || 30);

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Card */}
      <div className="lot-hub-card">
        <div className="lot-hub-card-header">
          <div className="lot-hub-card-title flex items-center gap-2 font-semibold">
            <Box size={18} className="text-[hsl(var(--primary))]" />
            <span>Inventory Lot Overview</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[hsl(var(--text-muted))] text-xs">Supplier</span>
            <div className="font-semibold">{lot.supplierId?.name || 'N/A'}</div>
          </div>
          <div>
            <span className="text-[hsl(var(--text-muted))] text-xs">Distribution Center</span>
            <div className="font-semibold">{lot.distributionCenterId?.name || 'N/A'}</div>
          </div>
          <div>
            <span className="text-[hsl(var(--text-muted))] text-xs">Available Cases</span>
            <div className="font-semibold text-[hsl(var(--primary))]">
              {lot.availableQty} / {lot.quantityCases} cases
            </div>
          </div>
          <div>
            <span className="text-[hsl(var(--text-muted))] text-xs">Total Lot Value</span>
            <div className="font-semibold">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${lot.costPerCase?.toFixed(2)}/cs)
            </div>
          </div>
          <div>
            <span className="text-[hsl(var(--text-muted))] text-xs">Create Date</span>
            <div className="font-semibold flex items-center gap-1.5">
              <Calendar size={14} className="text-[hsl(var(--text-secondary))]" />
              {lot.createdAt ? new Date(lot.createdAt).toLocaleString() : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-[hsl(var(--text-muted))] text-xs">Update Date</span>
            <div className="font-semibold flex items-center gap-1.5">
              <Clock size={14} className="text-[hsl(var(--text-secondary))]" />
              {lot.updatedAt
                ? new Date(lot.updatedAt).toLocaleString()
                : lot.createdAt
                ? new Date(lot.createdAt).toLocaleString()
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Expiration Decay Bar */}
        <div className="mt-2 p-3 bg-[hsl(var(--bg-main))] rounded-lg border border-[hsl(var(--border-color))]">
          <div className="flex justify-between mb-1.5 text-xs">
            <span>
              Expiration Date: <strong>{new Date(lot.expirationDate).toLocaleDateString()}</strong>
            </span>
            <strong
              className={
                daysRemaining < 10 ? 'text-[hsl(var(--error))]' : 'text-[hsl(var(--text-secondary))]'
              }
            >
              {daysRemaining === 0 ? '❌ Expired' : `${daysRemaining} Days Remaining (${rslRatio}% RSL)`}
            </strong>
          </div>
          <div className="w-full h-2 bg-[hsl(var(--border-color))] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                rslRatio < 25
                  ? 'bg-[hsl(var(--error))]'
                  : rslRatio < 50
                  ? 'bg-[hsl(var(--warning))]'
                  : 'bg-[hsl(var(--success))]'
              }`}
              style={{ width: `${rslRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* Product Allergens & Traceability Card */}
      <div className="lot-hub-card">
        <div className="lot-hub-card-header">
          <div className="lot-hub-card-title flex items-center gap-2 font-semibold">
            <AlertTriangle size={18} className="text-[hsl(var(--warning))]" />
            <span>Product Allergens & Traceability</span>
          </div>
        </div>
        <div className="text-sm">
          <div className="mb-2.5">
            <strong className="block mb-1.5 text-xs font-semibold">Active Allergens:</strong>
            {lot.productId?.allergens && lot.productId.allergens.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {lot.productId.allergens.map((allergen: string) => (
                  <span
                    key={allergen}
                    className="badge inline-flex items-center gap-1 text-xs px-2 py-0.5 capitalize cursor-pointer rounded bg-[hsl(var(--warning)/10%)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/30%)] hover:opacity-80 transition-opacity"
                    title="Click to remove allergen"
                    onClick={() => {
                      if (lot.productId) {
                        const newAllergens = lot.productId.allergens.filter((a: string) => a !== allergen);
                        onUpdateProductAllergens(lot.productId._id, newAllergens);
                      }
                    }}
                  >
                    {allergen} ✕
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[hsl(var(--text-muted))] text-xs italic">None declared</span>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <input
              type="text"
              placeholder="Add allergen (e.g. milk, soy) + Enter..."
              className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-[hsl(var(--border-color))] bg-[hsl(var(--bg-main))] text-[hsl(var(--text-main))]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  const allergen = input.value.trim().toLowerCase();
                  if (allergen && lot.productId) {
                    const currentAllergens = lot.productId.allergens || [];
                    if (!currentAllergens.includes(allergen)) {
                      const newAllergens = [...currentAllergens, allergen];
                      onUpdateProductAllergens(lot.productId._id, newAllergens);
                      input.value = '';
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
