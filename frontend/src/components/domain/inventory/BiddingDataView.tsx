import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tag, DollarSign, Award, Clock, Search, ChevronRight } from 'lucide-react';
import type { RootState } from '../../../store';
import { fetchAllBidsThunk } from '../../../services/inventoryService';
import { openAwardModal } from '../../../store/slices/inventorySlice';

export const BiddingDataView: React.FC<{ onOpenLotHub?: (lot: any) => void }> = ({ onOpenLotHub }) => {
  const dispatch = useDispatch();
  const { allBids, allBidsLoading, inventoryList } = useSelector((state: RootState) => state.inventory);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchAllBidsThunk() as any);
  }, [dispatch]);

  const filteredBids = (allBids || []).filter((bid: any) => {
    const lot = bid.listingId?.opportunityId?.lotId || bid.inventoryLotId;
    const prod = lot?.productId;
    const buyer = bid.buyerId;

    const matchesSearch =
      !searchTerm ||
      prod?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && (bid.status === 'pending' || bid.status === 'submitted')) ||
      (statusFilter === 'awarded' && (bid.status === 'awarded' || bid.status === 'fully_accepted')) ||
      (statusFilter === 'countered' && (bid.status === 'countered' || bid.status === 'partially_accepted')) ||
      (statusFilter === 'rejected' && bid.status === 'rejected');

    return matchesSearch && matchesStatus;
  });

  const totalBidsCount = (allBids || []).length;
  const totalBidsValue = (allBids || []).reduce((sum: number, b: any) => {
    const qty = b.quantity || b.quantityCases || 0;
    const price = b.price || b.proposedPrice || 0;
    return sum + qty * price;
  }, 0);

  const pendingBidsCount = (allBids || []).filter((b: any) => b.status === 'pending' || b.status === 'submitted' || b.status === 'countered').length;
  const awardedValue = (allBids || [])
    .filter((b: any) => b.status === 'awarded' || b.status === 'fully_accepted')
    .reduce((sum: number, b: any) => sum + (b.quantity || 0) * (b.price || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* KPI Cards Grid */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span>Total Bids Received</span>
            <Tag size={16} style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div className="kpi-card-value">{totalBidsCount}</div>
          <div className="kpi-card-footer">
            <span>Active marketplace offers</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span>Total Offer Pipeline Value</span>
            <DollarSign size={16} style={{ color: 'hsl(var(--warning))' }} />
          </div>
          <div className="kpi-card-value" style={{ color: 'hsl(var(--warning))' }}>
            ${totalBidsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-card-footer">
            <span>Gross bid dollar value</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span>Pending Evaluation</span>
            <Clock size={16} style={{ color: 'hsl(var(--secondary))' }} />
          </div>
          <div className="kpi-card-value" style={{ color: 'hsl(var(--secondary))' }}>
            {pendingBidsCount}
          </div>
          <div className="kpi-card-footer">
            <span>Awaiting award or counter-offer</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span>Awarded Revenue</span>
            <Award size={16} style={{ color: 'hsl(var(--success))' }} />
          </div>
          <div className="kpi-card-value" style={{ color: 'hsl(var(--success))' }}>
            ${awardedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-card-footer">
            <span>Accepted buyer closeout deals</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          backgroundColor: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border-color))',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <Search size={18} style={{ color: 'hsl(var(--text-muted))' }} />
          <input
            type="text"
            className="filter-search"
            placeholder="Search bids by product, SKU, buyer company, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'hsl(var(--text-primary))' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>Status:</label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid hsl(var(--border-color))' }}
          >
            <option value="all">All Bids</option>
            <option value="pending">Pending</option>
            <option value="countered">Countered</option>
            <option value="awarded">Awarded</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Bidding Records Table */}
      {allBidsLoading ? (
        <div className="loader-container" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="loader" />
          <p style={{ marginTop: '12px', color: 'hsl(var(--text-muted))' }}>Loading active bidding data...</p>
        </div>
      ) : filteredBids.length === 0 ? (
        <div className="card empty-state" style={{ padding: '60px', textAlign: 'center' }}>
          <Tag size={48} style={{ opacity: 0.3, marginBottom: '16px', color: 'hsl(var(--text-muted))' }} />
          <h3>No Bids Found</h3>
          <p style={{ maxWidth: '420px', margin: '0 auto 16px auto', color: 'hsl(var(--text-secondary))' }}>
            {searchTerm || statusFilter !== 'all'
              ? 'No buyer bids match your search and filter criteria.'
              : 'There are no active bids submitted yet. Enable bidding on inventory lots or list offerings in the Marketplace to receive buyer offers.'}
          </p>
        </div>
      ) : (
        <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Surplus Lot / SKU</th>
                <th>Buyer Company & Contact</th>
                <th>Bid Quantity</th>
                <th>Offered Price</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Date Placed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBids.map((bid: any) => {
                const lot = bid.listingId?.opportunityId?.lotId || bid.inventoryLotId || inventoryList.find((l: any) => l._id === bid.lotId);
                const prod = lot?.productId;
                const buyer = bid.buyerId;
                const qty = bid.quantity || bid.quantityCases || 0;
                const price = bid.price || bid.proposedPrice || 0;
                const total = qty * price;

                const statusStr = bid.status || 'pending';
                const isPending = statusStr === 'pending' || statusStr === 'submitted';
                const isAwarded = statusStr === 'awarded' || statusStr === 'fully_accepted';
                const isCountered = statusStr === 'countered' || statusStr === 'partially_accepted';
                const isRejected = statusStr === 'rejected';

                let badgeBg = 'hsl(var(--warning) / 12%)';
                let badgeColor = 'hsl(var(--warning))';
                let badgeBorder = 'hsl(var(--warning) / 30%)';

                if (isAwarded) {
                  badgeBg = 'hsl(var(--success) / 12%)';
                  badgeColor = 'hsl(var(--success))';
                  badgeBorder = 'hsl(var(--success) / 30%)';
                } else if (isCountered) {
                  badgeBg = 'hsl(var(--secondary) / 12%)';
                  badgeColor = 'hsl(var(--secondary))';
                  badgeBorder = 'hsl(var(--secondary) / 30%)';
                } else if (isRejected) {
                  badgeBg = 'hsl(var(--error) / 12%)';
                  badgeColor = 'hsl(var(--error))';
                  badgeBorder = 'hsl(var(--error) / 30%)';
                }

                return (
                  <tr key={bid._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                        {prod?.description || lot?.description || 'Surplus Inventory Lot'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                        SKU: {prod?.sku || 'N/A'} | Supplier: {lot?.supplierId?.name || 'CPG Supplier'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {buyer?.companyName || buyer?.name || 'Retail Buyer'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                        {buyer?.email || bid.buyerEmail || 'eveline94@ethereal.email'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{qty.toLocaleString()} cs</div>
                    </td>
                    <td>
                      <div>${price.toFixed(2)} / cs</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>
                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`, textTransform: 'capitalize' }}>
                        {statusStr.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                        {bid.submittedAt || bid.createdAt ? new Date(bid.submittedAt || bid.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isPending && lot && (
                          <button
                            type="button"
                            className="btn btn-success"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => dispatch(openAwardModal({ bid, lot }))}
                          >
                            🏆 Award Bid
                          </button>
                        )}
                        {lot && onOpenLotHub && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => onOpenLotHub(lot)}
                          >
                            Operations Hub <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
