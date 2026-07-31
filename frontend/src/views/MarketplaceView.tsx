import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag } from 'lucide-react';
import type { RootState, AppDispatch } from '../store';
import { selectActiveMarketplaceListings, setSelectedBuyerEmail } from '../store/slices/inventorySlice';
import { setBuyers } from '../store/slices/coreSlice';
import { MarketplaceCard } from '../components/MarketplaceCard';
import { API_BASE_URL } from '../services/coreService';
import { InventoryService } from '../services/inventoryService';
import { useAuth } from '../context/AuthContext';

export const MarketplaceView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { buyers } = useSelector((state: RootState) => state.core);
  const { selectedBuyerEmail, loading } = useSelector((state: RootState) => state.inventory);
  const activeListings = useSelector(selectActiveMarketplaceListings);

  let authUser = null;
  let updateProfiles: ((profiles: any) => Promise<any>) | null = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
    updateProfiles = auth?.updateProfiles || null;
  } catch {
    // optional fallback outside provider
  }

  const isBuyerProfileActive = authUser ? Boolean(authUser.profiles?.buyer) : true;

  const activeBuyer = buyers.find((b: any) => b.email === selectedBuyerEmail);

  const handleBuyerExclusionRemove = async (allergen: string) => {
    if (!activeBuyer) return;
    const newExclusions = (activeBuyer.excludedAllergens || []).filter((a: string) => a !== allergen);
    const updatedBuyer = { ...activeBuyer, excludedAllergens: newExclusions };
    const updatedBuyers = buyers.map((b: any) => (b._id === activeBuyer._id ? updatedBuyer : b));
    dispatch(setBuyers(updatedBuyers));
    // Also call API if available
    try {
      await fetch(`${API_BASE_URL}/marketplace/buyer/${activeBuyer._id}/exclusions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludedAllergens: newExclusions }),
      });
    } catch {
      // Ignore API error in test or disconnected state
    }
  };

  const handleBuyerExclusionAdd = async (allergen: string) => {
    if (!activeBuyer || !allergen) return;
    const currentExclusions = activeBuyer.excludedAllergens || [];
    if (currentExclusions.includes(allergen)) return;
    const newExclusions = [...currentExclusions, allergen];
    const updatedBuyer = { ...activeBuyer, excludedAllergens: newExclusions };
    const updatedBuyers = buyers.map((b: any) => (b._id === activeBuyer._id ? updatedBuyer : b));
    dispatch(setBuyers(updatedBuyers));
    try {
      await fetch(`${API_BASE_URL}/marketplace/buyer/${activeBuyer._id}/exclusions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludedAllergens: newExclusions }),
      });
    } catch {
      // Ignore API error
    }
  };

  const handlePlaceBid = async (listingId: string, qty: number, price: number) => {
    if (!activeBuyer) return;
    await InventoryService.submitBid(listingId, {
      buyerId: activeBuyer._id || 'mock-buyer',
      bidPrice: price,
      quantityRequested: qty,
    });
  };

  const handleBuyerBuyItNow = async (lot: any, pricingInfo: any, qty: number) => {
    if (!activeBuyer || !lot.listing) return;
    await handlePlaceBid(lot.listing._id, qty, pricingInfo.price);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {!isBuyerProfileActive && (
        <div
          className="card"
          style={{
            padding: '20px',
            backgroundColor: 'hsl(var(--warning) / 10%)',
            border: '1px solid hsl(var(--warning) / 40%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--text-main))' }}>
              Become a Buyer to Bid
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
              You are currently in Supplier mode. Activate your Buyer profile to submit bids and purchase surplus inventory directly.
            </p>
          </div>
          <button
            className="btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={async () => {
              if (updateProfiles) {
                await updateProfiles({ buyer: true });
              }
            }}
          >
            Activate Buyer Profile
          </button>
        </div>
      )}

      <header className="buyer-marketplace-header">
        <div>
          <h1 className="header-title">B2B Surplus Buyer Marketplace</h1>
          <p className="header-subtitle">
            Browse surplus CPG listings, inspect remaining shelf life decay curves, and secure stock immediately.
          </p>
        </div>
        <div className="filter-input-group" style={{ flex: '0 0 420px' }}>
          <label>Acting as Retail Buyer (Email):</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="filter-select"
              value={selectedBuyerEmail}
              onChange={(e) => dispatch(setSelectedBuyerEmail(e.target.value))}
              style={{ border: '1px solid hsl(var(--secondary) / 40%)', flex: 1.5 }}
            >
              <option value="">Select Buyer Profile...</option>
              {buyers.map((b: any) => (
                <option key={b.email} value={b.email}>
                  {b.companyName} ({b.email})
                </option>
              ))}
            </select>
            <input
              type="email"
              className="filter-search"
              placeholder="Or enter custom email..."
              value={selectedBuyerEmail}
              onChange={(e) => dispatch(setSelectedBuyerEmail(e.target.value))}
              style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="loader-container" style={{ minHeight: '300px' }}>
          <div className="loader" />
          <p>Retrieving active marketplace listings...</p>
        </div>
      ) : (
        <>
          {activeBuyer && (
            <div
              className="card"
              style={{
                padding: '16px',
                marginBottom: '20px',
                backgroundColor: 'hsl(var(--bg-main) / 30%)',
                border: '1px solid hsl(var(--border-color))',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                    Buyer Profile: {activeBuyer.companyName}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                    Interested Categories: {activeBuyer.categories?.join(', ') || 'None'} | Transport Radius:{' '}
                    {activeBuyer.transportRadius || 500} miles
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Allergen Exclusions:</span>
                  {activeBuyer.excludedAllergens && activeBuyer.excludedAllergens.length > 0 ? (
                    activeBuyer.excludedAllergens.map((allergen: string) => (
                      <span
                        key={allergen}
                        className="badge"
                        style={{
                          backgroundColor: 'hsl(var(--error) / 10%)',
                          color: 'hsl(var(--error))',
                          border: '1px solid hsl(var(--error) / 30%)',
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleBuyerExclusionRemove(allergen)}
                        title="Click to remove exclusion"
                      >
                        {allergen} ✕
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>No exclusions</span>
                  )}

                  <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '8px' }}>
                    <input
                      type="text"
                      placeholder="Add exclusion..."
                      style={{
                        padding: '2px 6px',
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid hsl(var(--border-color))',
                        backgroundColor: 'hsl(var(--bg-main))',
                        color: 'hsl(var(--text-main))',
                        width: '120px',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.currentTarget;
                          const val = input.value.trim().toLowerCase();
                          if (val) {
                            handleBuyerExclusionAdd(val);
                            input.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeListings.length === 0 ? (
            <div className="card empty-state" style={{ padding: '60px' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '16px', color: 'hsl(var(--secondary))' }} />
              <h3>No Active Listings Available</h3>
              <p style={{ maxWidth: '380px' }}>
                There are no active surplus offerings currently listed for bidding (or active listings are excluded by
                your allergen filters). Go to the Supplier Inventory Dashboard, click a pending lot, and toggle "Enable
                Accept Bids" to publish a listing.
              </p>
            </div>
          ) : (
            <div className="buyer-marketplace-grid">
              {activeListings.map((lot: any) => (
                <MarketplaceCard
                  key={lot._id}
                  lot={lot}
                  activeBuyer={activeBuyer}
                  txLoading={loading}
                  handleBuyerBuyItNow={handleBuyerBuyItNow}
                  handlePlaceBid={handlePlaceBid}
                  API_BASE_URL={API_BASE_URL}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
