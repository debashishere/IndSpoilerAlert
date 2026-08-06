import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../store';
import { setSort, setPage, openRiskModal, openComplianceModal, setSelectedLot } from '../../../store/slices/inventorySlice';
import type { SortField } from '../../../store/slices/inventorySlice';

interface InventoryTableProps {
  filteredLots: any[];
  onOpenLotHub?: (lot: any) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ filteredLots, onOpenLotHub }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { sortField, sortDirection, currentPage, itemsPerPage } = useSelector(
    (state: RootState) => state.inventory
  );

  const calculateDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isComplianceMissing = (lot: any) => {
    const docs = lot.complianceDocs || [];
    return lot.fdaRegulated && docs.length === 0;
  };

  const handleSort = (field: SortField) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    dispatch(setSort({ field, direction: isAsc ? 'desc' : 'asc' }));
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <span style={{ opacity: 0.3 }}>↕</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  const totalPages = Math.ceil(filteredLots.length / itemsPerPage);
  const paginatedLots = filteredLots.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            background: 'hsl(223, 47%, 12%)',
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
          <span>Registered Inventory ({filteredLots.length})</span>
          <span style={{ color: 'hsl(var(--primary))' }}>SKU · Distribution Center · Expiration & RSL</span>
        </div>
        <div className="premium-table-container">
          <table className="premium-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('sku')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Product / SKU {renderSortIcon('sku')}
              </th>
              <th onClick={() => handleSort('supplier')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Supplier {renderSortIcon('supplier')}
              </th>
              <th onClick={() => handleSort('warehouse')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Distribution Center {renderSortIcon('warehouse')}
              </th>
              <th onClick={() => handleSort('expirationDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Expiration & RSL {renderSortIcon('expirationDate')}
              </th>
              <th onClick={() => handleSort('availableQty')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                Quantity Cases {renderSortIcon('availableQty')}
              </th>
              <th onClick={() => handleSort('costPerCase')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                Price Details {renderSortIcon('costPerCase')}
              </th>
              <th onClick={() => handleSort('expirationDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Create Date
              </th>
              <th onClick={() => handleSort('expirationDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Update Date
              </th>
              <th onClick={() => handleSort('sku')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedLots.map((lot) => {
              const daysRemaining = calculateDaysRemaining(lot.expirationDate);
              
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
                : Math.max(0, Math.min(100, Math.round((daysRemaining / totalShelfDays) * 100)));
              
              const totalValue = lot.availableQty * (lot.costPerCase ?? 0);

              let statusColor = 'hsl(var(--warning))';
              if (lot.status === 'active') statusColor = 'hsl(var(--primary))';
              if (lot.status === 'sold') statusColor = 'hsl(var(--success))';
              if (lot.status === 'donated' || lot.status === 'recycled') statusColor = 'hsl(var(--secondary))';
              if (lot.status === 'expired') statusColor = 'hsl(var(--error))';

              return (
                <tr
                  key={lot._id}
                  onClick={() => {
                    dispatch(setSelectedLot(lot));
                    if (onOpenLotHub) onOpenLotHub(lot);
                  }}
                  style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                  title="Click to open Lot details"
                >
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                        {lot.productId?.description || lot.description || lot.productName || 'Surplus Item'}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge badge-outline-primary" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          {lot.productId?.sku || lot.sku || 'N/A'}
                        </span>
                        {(lot.productId?.category || lot.category) && (
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 6px',
                              backgroundColor: 'hsl(var(--border-color))',
                              color: 'hsl(var(--text-secondary))',
                            }}
                          >
                            {lot.productId?.category || lot.category}
                          </span>
                        )}
                        {(lot.lotNumber || lot.batchNumber) && (
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 6px',
                              backgroundColor: 'hsl(223, 47%, 16%)',
                              color: 'hsl(var(--text-muted))',
                              fontFamily: 'monospace',
                            }}
                          >
                            Lot: {lot.lotNumber || lot.batchNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{lot.supplierId?.name || lot.supplierName || '—'}</td>
                  <td>{lot.distributionCenterId?.name || lot.warehouse || lot.location || 'Central DC'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span>{lot.expirationDate ? new Date(lot.expirationDate).toLocaleDateString() : 'N/A'}</span>
                        <strong
                          style={{
                            color:
                              daysRemaining < 10 &&
                              lot.status !== 'sold' &&
                              lot.status !== 'donated' &&
                              lot.status !== 'recycled'
                                ? 'hsl(var(--error))'
                                : 'hsl(var(--text-muted))',
                          }}
                        >
                          {daysRemaining === 0 ? '❌ Expired' : `${daysRemaining}d left`}
                        </strong>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: 'hsl(var(--border-color))',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${rslRatio}%`,
                            height: '100%',
                            backgroundColor:
                              rslRatio < 25
                                ? 'hsl(var(--error))'
                                : rslRatio < 50
                                ? 'hsl(var(--warning))'
                                : 'hsl(var(--success))',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontWeight: 600 }}>{lot.availableQty ?? lot.quantityCases ?? lot.quantity ?? 0} cases</span>
                      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                        of {lot.quantityCases ?? lot.availableQty ?? 0} cs total
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem' }}>
                      <span>
                        Cost: <strong>${(lot.costPerCase ?? 0).toFixed(2)}</strong>/cs
                      </span>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>
                        Total:{' '}
                        <strong>
                          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                        {lot.createdAt ? new Date(lot.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                        {lot.updatedAt ? new Date(lot.updatedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: `${statusColor} / 12%`,
                          color: statusColor,
                          border: `1px solid ${statusColor} / 20%`,
                          textTransform: 'uppercase',
                          fontSize: '0.7rem',
                        }}
                      >
                        {lot.status === 'active' ? 'Active List' : lot.status}
                      </span>
                      {isComplianceMissing(lot) && (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: 'hsl(var(--error) / 10%)',
                            color: 'hsl(var(--error))',
                            border: '1px solid hsl(var(--error) / 30%)',
                            fontSize: '0.65rem',
                            padding: '1px 6px',
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                          }}
                          title="Regulated lot is missing required COA or Batch Record documents"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(openComplianceModal(lot));
                          }}
                        >
                          ⚠️ Missing Docs
                        </span>
                      )}
                      <button
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '0.68rem', padding: '2px 6px', marginTop: '4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(openRiskModal(lot));
                        }}
                      >
                        Risk Details
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

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
          Showing <strong>{Math.min(filteredLots.length, (currentPage - 1) * itemsPerPage + 1)}</strong> to{' '}
          <strong>{Math.min(filteredLots.length, currentPage * itemsPerPage)}</strong> of{' '}
          <strong>{filteredLots.length}</strong> lots
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => dispatch(setPage(Math.max(1, currentPage - 1)))}
              className="btn btn-sm btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => dispatch(setPage(page))}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid hsl(var(--border-color))',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: currentPage === page ? 'hsl(var(--primary))' : 'transparent',
                  color: currentPage === page ? '#ffffff' : 'hsl(var(--text-secondary))',
                  transition: 'all 0.2s',
                }}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage >= totalPages || totalPages === 0}
              onClick={() => dispatch(setPage(Math.min(totalPages, currentPage + 1)))}
              className="btn btn-sm btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
