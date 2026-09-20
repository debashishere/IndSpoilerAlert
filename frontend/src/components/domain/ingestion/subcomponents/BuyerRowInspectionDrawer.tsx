import React from 'react';
import { 
  Send, 
  Share2, 
  HeartHandshake, 
  Truck, 
  Building2, 
  Tag, 
  User, 
  Edit3 
} from 'lucide-react';
import type { BuyerRowInspectionDrawerProps } from '../types/ingestion.types';

export const BuyerRowInspectionDrawer: React.FC<BuyerRowInspectionDrawerProps> = ({
  buyer,
  onEditBuyerProfile,
  onSendLotTender,
  onForwardShortDatedOffers,
  onRouteZeroWasteDonation,
}) => {
  const tenderType = buyer.tenderActionType || 'Send Lot Tender';

  const renderTenderButton = () => {
    if (tenderType === 'Route Zero-Waste Donation' || buyer.tier === 'Custom') {
      return (
        <button
          type="button"
          onClick={() => onRouteZeroWasteDonation?.(buyer)}
          className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Route Zero-Waste Donation</span>
        </button>
      );
    }

    if (tenderType === 'Forward Short-Dated Offers' || buyer.tier === 'Tier 2') {
      return (
        <button
          type="button"
          onClick={() => onForwardShortDatedOffers?.(buyer)}
          className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Forward Short-Dated Offers</span>
        </button>
      );
    }

    if (tenderType === 'Push Multi-Truckload Batch' || buyer.tier === 'Liquidator') {
      return (
        <button
          type="button"
          onClick={() => onSendLotTender?.(buyer)}
          className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <Truck className="w-4 h-4" />
          <span>Push Multi-Truckload Batch</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onSendLotTender?.(buyer)}
        className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
      >
        <Send className="w-4 h-4" />
        <span>Send Lot Tender</span>
      </button>
    );
  };

  return (
    <div
      className="inspection-drawer px-4 pb-4 pt-1 bg-slate-50/80 border-t border-slate-100"
      id={`drawer-${buyer._id}`}
      data-testid={`inspection-drawer-${buyer._id}`}
    >
      <div className="p-4 rounded-xl bg-white shadow-xs border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Column 1: Procurement Officers */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-slate-500">
            <User className="w-3.5 h-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">
              Procurement Officers
            </p>
          </div>
          <div className="text-xs space-y-1 mt-0.5">
            {buyer.procurementOfficers && buyer.procurementOfficers.length > 0 ? (
              buyer.procurementOfficers.map((officer, i) => (
                <div key={i} className="leading-tight">
                  <div className="font-semibold text-slate-800">
                    {officer.name}
                    {officer.title ? ` • ${officer.title}` : ''}
                  </div>
                  <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                    {officer.email}
                  </div>
                </div>
              ))
            ) : (
              <div className="leading-tight">
                <div className="font-semibold text-slate-800">
                  {buyer.name || buyer.companyName}
                </div>
                <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                  {buyer.email}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Categories / Specialty Criteria */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Tag className="w-3.5 h-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">
              Categories & Criteria
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {buyer.categories && buyer.categories.length > 0 ? (
              buyer.categories.map((cat, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                >
                  {cat}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">General Catalog Acceptance</span>
            )}
            {buyer.excludedAllergens && buyer.excludedAllergens.length > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Allergen Filter: {buyer.excludedAllergens.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Column 3: Hub Facilities */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Building2 className="w-3.5 h-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">
              Hub Facilities
            </p>
          </div>
          <div className="text-xs space-y-1 mt-0.5">
            {buyer.hubFacilities && buyer.hubFacilities.length > 0 ? (
              buyer.hubFacilities.map((hub, i) => (
                <div key={i} className="font-medium text-slate-700">
                  {hub}
                </div>
              ))
            ) : (
              <div className="text-slate-500">Global Logistics Assignment</div>
            )}
            {buyer.address && (
              <div className="text-[11px] text-slate-400 font-mono">
                {buyer.address}
              </div>
            )}
          </div>
        </div>

        {/* Column 4: Actions & Explicit Edit Profile Button (ADR 0043) */}
        <div className="flex flex-col justify-between gap-2.5">
          {renderTenderButton()}

          <button
            type="button"
            onClick={() => onEditBuyerProfile?.(buyer)}
            className="w-full py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Buyer Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
