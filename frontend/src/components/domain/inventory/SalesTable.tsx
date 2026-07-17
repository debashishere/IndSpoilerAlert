import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

export type SalesSortField = 'sku' | 'buyer' | 'dc' | 'quantity' | 'price' | 'revenue' | 'date' | 'status';

interface SalesTableProps {
  filteredRecords: any[];
  onRecordClick?: (record: any) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({ filteredRecords, onRecordClick }) => {
  const [sortField, setSortField] = useState<SalesSortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const handleSort = (field: SalesSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SalesSortField) => {
    if (sortField !== field) return <span style={{ opacity: 0.3 }}>↕</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  // Sort records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let aVal: any = '';
    let bVal: any = '';

    if (sortField === 'sku') {
      aVal = (a.description || a.productName || a.product || '').toLowerCase();
      bVal = (b.description || b.productName || b.product || '').toLowerCase();
    } else if (sortField === 'buyer') {
      aVal = (a.buyerId?.companyName || a.buyerName || a.buyerEmail || a.customer || a.channel || '').toLowerCase();
      bVal = (b.buyerId?.companyName || b.buyerName || b.buyerEmail || b.customer || b.channel || '').toLowerCase();
    } else if (sortField === 'dc') {
      aVal = (a.warehouse || a.dc || a.location || '').toLowerCase();
      bVal = (b.warehouse || b.dc || b.location || '').toLowerCase();
    } else if (sortField === 'quantity') {
      aVal = a.quantityCases || a.quantitySold || a.quantity || a.cases || 0;
      bVal = b.quantityCases || b.quantitySold || b.quantity || b.cases || 0;
    } else if (sortField === 'price') {
      aVal = a.pricePerCase || a.unitPrice || a.price || 0;
      bVal = b.pricePerCase || b.unitPrice || b.price || 0;
    } else if (sortField === 'revenue') {
      const qA = a.quantityCases || a.quantitySold || a.quantity || a.cases || 0;
      const pA = a.pricePerCase || a.unitPrice || a.price || 0;
      aVal = a.totalValue || a.revenue || (qA * pA);
      const qB = b.quantityCases || b.quantitySold || b.quantity || b.cases || 0;
      const pB = b.pricePerCase || b.unitPrice || b.price || 0;
      bVal = b.totalValue || b.revenue || (qB * pB);
    } else if (sortField === 'date') {
      aVal = new Date(a.saleDate || a.date || a.createdAt || 0).getTime();
      bVal = new Date(b.saleDate || b.date || b.createdAt || 0).getTime();
    } else if (sortField === 'status') {
      aVal = (a.status || 'reconciled').toLowerCase();
      bVal = (b.status || 'reconciled').toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const paginatedRecords = sortedRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (sortedRecords.length === 0) {
    return (
      <div className="card empty-state" style={{ padding: '40px', textAlign: 'center' }}>
        <DollarSign size={36} style={{ opacity: 0.3, marginBottom: '12px', color: 'hsl(var(--text-muted))' }} />
        <h4 style={{ margin: '0 0 6px', color: '#fff' }}>No Sales Records Found</h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
          No sales records match your current search query.
        </p>
      </div>
    );
  }

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
          <span>Sales Data Pipeline ({sortedRecords.length})</span>
          <span style={{ color: 'hsl(142, 76%, 46%)' }}>Product · Customer · Revenue</span>
        </div>
        <div className="premium-table-container">
          <table className="premium-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('sku')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Product / SKU {renderSortIcon('sku')}
              </th>
              <th onClick={() => handleSort('buyer')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Buyer / Customer {renderSortIcon('buyer')}
              </th>
              <th onClick={() => handleSort('dc')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Distribution Center {renderSortIcon('dc')}
              </th>
              <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                Quantity Sold {renderSortIcon('quantity')}
              </th>
              <th onClick={() => handleSort('price')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                Price Details {renderSortIcon('price')}
              </th>
              <th onClick={() => handleSort('revenue')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                Total Revenue {renderSortIcon('revenue')}
              </th>
              <th onClick={() => handleSort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Date Recorded {renderSortIcon('date')}
              </th>
              <th onClick={() => handleSort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Create Date
              </th>
              <th onClick={() => handleSort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Update Date
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Status {renderSortIcon('status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.map((record: any, idx: number) => {
              const recordId = record._id || record.id || `s-${idx}`;
              const qty = record.quantityCases || record.quantitySold || record.quantity || record.cases || 0;
              const price = record.pricePerCase || record.unitPrice || record.price || 0;
              const rev = record.totalValue || record.revenue || (qty * price);
              const inv = record.invoiceNumber || record.invoice || `INV-${1000 + idx}`;
              const prod = record.description || record.productName || record.product || 'Surplus Item';
              const sku = record.sku || record.productId || 'N/A';
              const buyer = record.buyerId?.companyName || record.buyerName || record.buyerEmail || record.customer || record.channel || 'Direct Buyer';
              const dc = record.warehouse || record.dc || record.location || 'Central DC';
              const dateStr = record.saleDate || record.date || record.createdAt 
                ? new Date(record.saleDate || record.date || record.createdAt).toLocaleDateString() 
                : 'Recent';
              const createDateStr = record.createdAt ? new Date(record.createdAt).toLocaleDateString() : dateStr;
              const updateDateStr = record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : dateStr;

              return (
                <tr
                  key={recordId}
                  data-testid={`sales-row-${recordId}`}
                  onClick={() => onRecordClick?.(record)}
                  style={{ cursor: onRecordClick ? 'pointer' : 'default', transition: 'background 0.15s' }}
                >
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                        {prod}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge badge-outline-primary" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          SKU: {sku}
                        </span>
                        {inv && (
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
                            {inv}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{buyer}</span>
                      {record.buyerEmail && record.buyerEmail !== buyer && (
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{record.buyerEmail}</span>
                      )}
                    </div>
                  </td>
                  <td>{dc}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>{qty.toLocaleString()} cs</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem' }}>${price.toFixed(2)}/cs</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'hsl(142, 76%, 46%)', fontSize: '0.85rem' }}>
                      ${rev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{dateStr}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{createDateStr}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{updateDateStr}</span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: 'hsl(142 76% 46% / 12%)',
                        color: 'hsl(142 76% 46%)',
                        border: '1px solid hsl(142 76% 46% / 30%)',
                        fontSize: '0.7rem',
                        textTransform: 'capitalize',
                      }}
                    >
                      {record.status || 'Reconciled'}
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
      {sortedRecords.length > 0 && (
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
            Showing <strong>{Math.min(sortedRecords.length, (currentPage - 1) * itemsPerPage + 1)}</strong> to{' '}
            <strong>{Math.min(sortedRecords.length, currentPage * itemsPerPage)}</strong> of{' '}
            <strong>{sortedRecords.length}</strong> sales records
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
                    backgroundColor: currentPage === page ? 'hsl(142, 76%, 36%)' : 'transparent',
                    color: currentPage === page ? '#ffffff' : 'hsl(var(--text-secondary))',
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
