import React, { useState } from 'react';
import { Users, ShieldAlert, Mail } from 'lucide-react';
import type { Buyer } from '../../../store/slices/coreSlice';

export type BuyerSortField = 'companyName' | 'email' | 'tier' | 'preferences' | 'createDate' | 'updateDate' | 'status';

interface BuyerTableProps {
  filteredBuyers: Buyer[];
  onBuyerClick?: (buyer: Buyer) => void;
  showInactive?: boolean;
}

export const BuyerTable: React.FC<BuyerTableProps> = ({ filteredBuyers, onBuyerClick }) => {
  const [sortField, setSortField] = useState<BuyerSortField>('companyName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const handleSort = (field: BuyerSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: BuyerSortField) => {
    if (sortField !== field) return <span style={{ opacity: 0.3 }}>↕</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  // Sort buyers
  const sortedBuyers = [...filteredBuyers].sort((a, b) => {
    let aVal: any = '';
    let bVal: any = '';

    if (sortField === 'companyName') {
      aVal = (a.companyName || a.name || a.email || '').toLowerCase();
      bVal = (b.companyName || b.name || b.email || '').toLowerCase();
    } else if (sortField === 'email') {
      aVal = (a.email || '').toLowerCase();
      bVal = (b.email || '').toLowerCase();
    } else if (sortField === 'tier') {
      aVal = (a.tier || '').toLowerCase();
      bVal = (b.tier || '').toLowerCase();
    } else if (sortField === 'preferences') {
      aVal = `${a.optInBidding !== false ? 1 : 0}-${a.optInSales !== false ? 1 : 0}`;
      bVal = `${b.optInBidding !== false ? 1 : 0}-${b.optInSales !== false ? 1 : 0}`;
    } else if (sortField === 'createDate') {
      aVal = new Date(a.createdAt || 0).getTime();
      bVal = new Date(b.createdAt || 0).getTime();
    } else if (sortField === 'updateDate') {
      aVal = new Date(a.updatedAt || 0).getTime();
      bVal = new Date(b.updatedAt || 0).getTime();
    } else if (sortField === 'status') {
      aVal = a.isActive === false ? 'inactive' : 'active';
      bVal = b.isActive === false ? 'inactive' : 'active';
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedBuyers.length / itemsPerPage);
  const paginatedBuyers = sortedBuyers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (sortedBuyers.length === 0) {
    return (
      <div className="card empty-state" style={{ padding: '40px', textAlign: 'center' }}>
        <Users size={36} style={{ opacity: 0.3, marginBottom: '12px', color: 'hsl(var(--text-muted))' }} />
        <h4 style={{ margin: '0 0 6px', color: 'white' }}>No Registered Buyers Found</h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
          No buyers match your current filter and search criteria.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            background: 'hsl(var(--bg-card))',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 600,
            color: 'hsl(var(--text-secondary))',
            borderBottom: '1px solid hsl(var(--border-color))',
          }}
        >
          <span>Buyer Data Pipeline ({sortedBuyers.length})</span>
          <span style={{ color: 'hsl(var(--primary))' }}>Company · Contact · Tier & Preferences</span>
        </div>
        <div className="premium-table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('companyName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Company / Buyer Name {renderSortIcon('companyName')}
                </th>
                <th onClick={() => handleSort('email')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Contact Email {renderSortIcon('email')}
                </th>
                <th onClick={() => handleSort('tier')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Buyer Tier {renderSortIcon('tier')}
                </th>
                <th onClick={() => handleSort('preferences')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Preferences & Channel {renderSortIcon('preferences')}
                </th>
                <th onClick={() => handleSort('createDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Create Date {renderSortIcon('createDate')}
                </th>
                <th onClick={() => handleSort('updateDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Update Date {renderSortIcon('updateDate')}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Status {renderSortIcon('status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedBuyers.map((buyer: Buyer, idx: number) => {
                const buyerId = buyer._id || buyer.id || `b-${idx}`;
                const isBuyerInactive = buyer.isActive === false;

                const name = buyer.companyName || buyer.name || buyer.email;
                const dateStr = buyer.createdAt ? new Date(buyer.createdAt).toLocaleDateString() : 'N/A';
                const updateStr = buyer.updatedAt ? new Date(buyer.updatedAt).toLocaleDateString() : 'N/A';

                return (
                  <tr
                    key={buyerId}
                    data-testid={`buyer-row-${buyerId}`}
                    onClick={() => onBuyerClick?.(buyer)}
                    style={{
                      cursor: onBuyerClick ? 'pointer' : 'default',
                      transition: 'background 0.15s',
                      opacity: isBuyerInactive ? 0.6 : 1,
                      filter: isBuyerInactive ? 'grayscale(40%)' : 'none',
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background:
                              buyer.tier === 'tier1'
                                ? 'hsl(221, 83%, 53% / 0.2)'
                                : buyer.tier === 'liquidator'
                                ? 'hsl(38, 92%, 50% / 0.2)'
                                : 'hsl(var(--primary) / 0.2)',
                            border: `1px solid ${
                              buyer.tier === 'tier1'
                                ? 'hsl(221, 83%, 53% / 0.4)'
                                : buyer.tier === 'liquidator'
                                ? 'hsl(38, 92%, 50% / 0.4)'
                                : 'hsl(var(--primary) / 0.4)'
                            }`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '13px',
                            color:
                              buyer.tier === 'tier1'
                                ? 'hsl(221, 83%, 63%)'
                                : buyer.tier === 'liquidator'
                                ? 'hsl(38, 92%, 60%)'
                                : 'hsl(var(--primary))',
                            flexShrink: 0,
                          }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{name}</span>
                            {isBuyerInactive && (
                              <span
                                data-testid={`inactive-badge-${buyerId}`}
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  background: 'hsl(var(--error) / 0.15)',
                                  color: 'hsl(var(--error))',
                                  border: '1px solid hsl(var(--error) / 0.3)',
                                }}
                              >
                                Inactive
                              </span>
                            )}
                          </div>
                          {buyer.companyName && buyer.name && buyer.companyName !== buyer.name && (
                            <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>{buyer.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem' }}>{buyer.email}</span>
                      </div>
                    </td>
                    <td>
                      {buyer.tier && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: '10px',
                            background:
                              buyer.tier === 'tier1'
                                ? 'hsl(221, 83%, 53% / 0.15)'
                                : buyer.tier === 'liquidator'
                                ? 'hsl(38, 92%, 50% / 0.15)'
                                : 'hsl(var(--primary) / 0.15)',
                            color:
                              buyer.tier === 'tier1'
                                ? 'hsl(221, 83%, 63%)'
                                : buyer.tier === 'liquidator'
                                ? 'hsl(38, 92%, 60%)'
                                : 'hsl(var(--primary))',
                            border: `1px solid ${
                              buyer.tier === 'tier1'
                                ? 'hsl(221, 83%, 53% / 0.3)'
                                : buyer.tier === 'liquidator'
                                ? 'hsl(38, 92%, 50% / 0.3)'
                                : 'hsl(var(--primary) / 0.3)'
                            }`,
                          }}
                        >
                          {buyer.tier === 'tier1'
                            ? 'Tier 1'
                            : buyer.tier === 'tier2'
                            ? 'Tier 2'
                            : buyer.tier === 'liquidator'
                            ? 'Liquidator'
                            : 'Custom'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {!isBuyerInactive && buyer.optInBidding === false && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: 'hsl(var(--warning) / 0.15)',
                              color: 'hsl(var(--warning))',
                              border: '1px solid hsl(var(--warning) / 0.3)',
                            }}
                          >
                            No Bidding
                          </span>
                        )}
                        {!isBuyerInactive && buyer.optInSales === false && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: 'hsl(var(--warning) / 0.15)',
                              color: 'hsl(var(--warning))',
                              border: '1px solid hsl(var(--warning) / 0.3)',
                            }}
                          >
                            No Sales
                          </span>
                        )}
                        {!isBuyerInactive && buyer.optInBidding !== false && buyer.optInSales !== false && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: 'hsl(142 76% 46% / 0.15)',
                              color: 'hsl(142 76% 46%)',
                              border: '1px solid hsl(142 76% 46% / 0.3)',
                            }}
                          >
                            Full Opt-In
                          </span>
                        )}
                        {(buyer.excludedAllergens?.length ?? 0) > 0 && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'hsl(var(--warning))',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <ShieldAlert size={11} /> Allergen Filter
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{dateStr}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{updateStr}</span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: isBuyerInactive ? 'hsl(var(--error) / 12%)' : 'hsl(var(--success) / 12%)',
                          color: isBuyerInactive ? 'hsl(var(--error))' : 'hsl(142 76% 46%)',
                          border: `1px solid ${isBuyerInactive ? 'hsl(var(--error) / 30%)' : 'hsl(var(--success) / 30%)'}`,
                          fontSize: '0.7rem',
                          textTransform: 'capitalize',
                        }}
                      >
                        {isBuyerInactive ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {sortedBuyers.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: 'hsl(var(--bg-card-hover) / 10%)',
            borderRadius: '8px',
            border: '1px solid hsl(var(--border-color))',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
            Showing <strong>{Math.min(sortedBuyers.length, (currentPage - 1) * itemsPerPage + 1)}</strong> to{' '}
            <strong>{Math.min(sortedBuyers.length, currentPage * itemsPerPage)}</strong> of{' '}
            <strong>{sortedBuyers.length}</strong> registered buyers
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="btn btn-sm btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid hsl(var(--border-color))',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: currentPage === page ? 'hsl(var(--primary))' : 'transparent',
                    color: currentPage === page ? 'white' : 'hsl(var(--text-secondary))',
                    transition: 'all 0.2s',
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages || totalPages === 0}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className="btn btn-sm btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
