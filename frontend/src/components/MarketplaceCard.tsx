import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, X } from 'lucide-react';

interface MarketplaceCardProps {
  lot: any;
  activeBuyer: any;
  txLoading: boolean;
  handleBuyerBuyItNow: (lot: any, pricingInfo: any, qty: number) => void;
  handlePlaceBid: (listingId: string, qty: number, price: number) => Promise<void>;
  API_BASE_URL: string;
}

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  lot,
  activeBuyer,
  txLoading,
  handleBuyerBuyItNow,
  handlePlaceBid,
  API_BASE_URL
}) => {
  const [isBiddingOpen, setIsBiddingOpen] = useState(false);
  const [bidQuantityInput, setBidQuantityInput] = useState(lot.availableQty);
  const [bidPriceInput, setBidPriceInput] = useState(0);
  const [bids, setBids] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const calculateDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getPricingForDay = (t: number, qty: number, originalPrice: number, category: string) => {
    const elasticities: Record<string, number> = {
      "Dairy": -1.8,
      "Produce": -2.2,
      "Meat": -2.0,
      "Dry Goods": -1.2,
      "Beverages": -1.5
    };
    const elasticity = elasticities[category] || -1.5;
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
  };

  const daysRem = calculateDaysRemaining(lot.expirationDate);
  const pricingInfo = getPricingForDay(daysRem, lot.availableQty, lot.costPerCase, lot.productId?.category || 'Dry Goods');
  let totalShelfDays = lot.productId?.shelfLifeDays || lot.shelfLifeDays;
  if (!totalShelfDays && lot.productionDate) {
    const totalDiff = new Date(lot.expirationDate).getTime() - new Date(lot.productionDate).getTime();
    totalShelfDays = Math.max(1, Math.ceil(totalDiff / (1000 * 60 * 60 * 24)));
  }
  if (!totalShelfDays) {
    const categoryDefaults: Record<string, number> = {
      'Dairy': 45, 'Produce': 30, 'Meat': 90, 'Beverages': 120, 'Dry Goods': 180
    };
    totalShelfDays = categoryDefaults[lot.productId?.category || lot.category || 'Dry Goods'] || 120;
  }
  const rslRatio = typeof lot.remainingShelfLife === 'number'
    ? Math.round(lot.remainingShelfLife <= 1 ? lot.remainingShelfLife * 100 : lot.remainingShelfLife)
    : Math.max(0, Math.min(100, Math.round((daysRem / totalShelfDays) * 100)));

  // Check buyer match recommendation
  const matchesCategory = activeBuyer ? activeBuyer.categories.includes(lot.productId?.category) : true;
  const matchesShelfLife = activeBuyer ? daysRem >= activeBuyer.minShelfLife : true;
  const isHighlyRecommended = matchesCategory && matchesShelfLife;

  // Initialize bid price input based on recommended discount
  useEffect(() => {
    setBidPriceInput(Math.round(pricingInfo.price * 0.9));
    setBidQuantityInput(lot.availableQty);
  }, [lot.availableQty, pricingInfo.price]);

  // Fetch bids and activities when card mounts or when a bid is placed
  const fetchData = async () => {
    setLoadingBids(true);
    try {
      // Fetch Bids
      const bidsRes = await fetch(`${API_BASE_URL}/inventory/${lot._id}/bids`);
      if (bidsRes.ok) {
        const bidsData = await bidsRes.json();
        setBids(bidsData.bids || bidsData || []);
      }

      // Fetch Activities
      const actRes = await fetch(`${API_BASE_URL}/inventory/${lot._id}/activities`);
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivities(actData);
      }
    } catch (err) {
      console.error("Error fetching card details:", err);
    } finally {
      setLoadingBids(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lot._id]);

  return (
    <div className="marketplace-card" style={{ borderTop: isHighlyRecommended ? '3px solid hsl(var(--secondary))' : '' }}>
      {isHighlyRecommended && (
        <span className="badge badge-outline-secondary" style={{ alignSelf: 'flex-start', fontSize: '0.65rem', fontWeight: 600 }}>
          ⭐ HIGH MATCH RECOMMENDATION
        </span>
      )}
      <div className="marketplace-card-header">
        <div>
          <h3 className="marketplace-card-title">{lot.productId?.description}</h3>
          <span className="lot-sku">{lot.productId?.sku} ({lot.productId?.category})</span>
        </div>
        <div className="marketplace-price-tag">
          <span>${pricingInfo.price.toFixed(2)}</span>
          <span className="marketplace-price-label">Buy It Now</span>
        </div>
      </div>

      <div className="kanban-card-details" style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '10px' }}>
        <div className="kanban-card-detail-item">
          <span className="kanban-card-detail-label">Supplier</span>
          <span className="kanban-card-detail-value">{lot.supplierId?.name}</span>
        </div>
        <div className="kanban-card-detail-item">
          <span className="kanban-card-detail-label">Location</span>
          <span className="kanban-card-detail-value">{lot.distributionCenterId?.name}</span>
        </div>
        <div className="kanban-card-detail-item">
          <span className="kanban-card-detail-label">Cases Available</span>
          <span className="kanban-card-detail-value">{lot.availableQty} Cs</span>
        </div>
        <div className="kanban-card-detail-item">
          <span className="kanban-card-detail-label">Original Price</span>
          <span className="kanban-card-detail-value" style={{ textDecoration: 'line-through' }}>${(lot.costPerCase ?? 0).toFixed(2)}</span>
        </div>
      </div>

      {/* Shelf Life Countdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
          <span>Remaining Shelf Life (RSL)</span>
          <strong>{daysRem} days left</strong>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'hsl(var(--border-color))', borderRadius: '3px', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${rslRatio}%`, 
              height: '100%', 
              backgroundColor: rslRatio < 25 ? 'hsl(var(--error))' : rslRatio < 50 ? 'hsl(var(--warning))' : 'hsl(var(--success))' 
            }} 
          />
        </div>
      </div>

      {/* View Bids & Activity Trigger */}
      <div style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '10px', display: 'flex', justifyContent: 'center' }}>
        <button
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.75rem', padding: '8px 12px' }}
          onClick={() => setIsModalOpen(true)}
        >
          <TrendingUp size={12} color="hsl(var(--primary))" />
          <span>Active Bids ({bids.length}) &amp; Activity Log ({activities.length})</span>
        </button>
      </div>

      {/* Active Bids & Activity Log Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="hsl(var(--primary))" />
                <span>Bids &amp; Activity Log: {lot.productId?.description}</span>
              </h3>
              <button 
                className="drawer-close" 
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {/* Active Bids */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '6px' }}>
                  <TrendingUp size={16} color="hsl(var(--primary))" />
                  <span>Active Bids ({bids.length})</span>
                </h4>
                {loadingBids ? (
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>Syncing active bids...</p>
                ) : bids.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>No bids placed yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {bids.map((bid) => (
                      <div 
                        key={bid._id} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          fontSize: '0.85rem', 
                          backgroundColor: 'hsl(var(--bg-main) / 50%)', 
                          padding: '10px 12px', 
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border-color))'
                        }}
                      >
                        <span>
                          <strong>{bid.buyerId?.companyName || 'Buyer'}</strong>
                          <span style={{ color: 'hsl(var(--text-muted))', marginLeft: '8px' }}>({bid.quantity} cs @ ${bid.price.toFixed(2)}/cs)</span>
                        </span>
                        <span className={`badge ${bid.status === 'awarded' ? 'badge-success' : bid.status === 'rejected' ? 'countdown-red' : 'badge-secondary'}`} style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '4px' }}>
                          {bid.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity History */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '6px' }}>
                  <Activity size={16} color="hsl(var(--secondary))" />
                  <span>Activity Log ({activities.length})</span>
                </h4>
                {loadingBids ? (
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>Fetching activity logs...</p>
                ) : activities.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>No activities recorded.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activities.map((act, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          fontSize: '0.85rem', 
                          color: 'hsl(var(--text-secondary))', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '4px',
                          backgroundColor: 'hsl(var(--bg-main) / 20%)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid hsl(var(--border-color) / 40%)'
                        }}
                      >
                        <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>{new Date(act.timestamp).toLocaleString()}</span>
                        <span>{act.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bid form / Actions */}
      <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid hsl(var(--border-color))' }}>
        {isBiddingOpen ? (
          <div className="marketplace-bid-form">
            <h5 style={{ fontSize: '0.8rem', fontWeight: 700 }}>Submit Competitive Bid</h5>
            <div className="marketplace-bid-row">
              <div className="marketplace-bid-col">
                <label>Cases</label>
                <input 
                  type="number" 
                  className="marketplace-bid-input"
                  min="1"
                  max={lot.availableQty}
                  value={bidQuantityInput}
                  onChange={(e) => setBidQuantityInput(Math.min(lot.availableQty, Math.max(1, Number(e.target.value))))}
                />
              </div>
              <div className="marketplace-bid-col">
                <label>Price / Cs</label>
                <input 
                  type="number" 
                  step="1"
                  className="marketplace-bid-input"
                  min="1"
                  value={bidPriceInput}
                  onChange={(e) => setBidPriceInput(Math.max(1, Math.round(Number(e.target.value))))}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginBottom: '8px' }}>
              <span>Est. Total Bid:</span>
              <strong>${(bidQuantityInput * bidPriceInput).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-sm btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setIsBiddingOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-sm btn-primary" 
                style={{ flex: 1 }}
                onClick={async () => {
                  await handlePlaceBid(lot.listing._id, bidQuantityInput, bidPriceInput);
                  setIsBiddingOpen(false);
                  fetchData(); // Refresh local bids
                }}
              >
                Submit Bid
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              id={`place-bid-${lot._id}`}
              className="btn btn-outline-secondary" 
              style={{ flex: 1, padding: '8px' }}
              onClick={() => {
                setIsBiddingOpen(true);
              }}
            >
              Place Bid
            </button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, padding: '8px', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', border: 'none' }}
              onClick={() => handleBuyerBuyItNow(lot, pricingInfo, lot.availableQty)}
              disabled={txLoading}
            >
              Buy It Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
