import React, { useEffect } from 'react';
import { Truck } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectShipments,
  selectShipmentsLoading,
  selectHasFetched,
  selectSelectedShipment,
  fetchShipmentsThunk,
} from '../store/slices/logisticsSlice';
import ShipmentTable, { getShipmentStatusBadge } from '../components/logistics/ShipmentTable';
import DockAppointmentModal from '../components/logistics/DockAppointmentModal';
import ColdChainLogger from '../components/logistics/ColdChainLogger';

export const LogisticsView: React.FC = () => {
  const dispatch = useDispatch();
  const shipments = useSelector(selectShipments);
  const shipmentsLoading = useSelector(selectShipmentsLoading);
  const hasFetched = useSelector(selectHasFetched);
  const selectedShipment = useSelector(selectSelectedShipment);

  useEffect(() => {
    if (!hasFetched && !shipmentsLoading) {
      dispatch(fetchShipmentsThunk() as any);
    }
  }, [dispatch, hasFetched, shipmentsLoading]);

  const handleRefresh = () => {
    dispatch(fetchShipmentsThunk() as any);
  };

  return (
    <>
      <header className="header">
        <div>
          <h1 className="header-title">Freight Logistics & Dock Coordination</h1>
          <p className="header-subtitle">
            Confirm dock appointments, track temperature logs, manage freight statuses, and download Bills of Lading (BOL).
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={shipmentsLoading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span>🔄</span> {shipmentsLoading ? 'Refreshing...' : 'Refresh Shipments'}
        </button>
      </header>

      {shipmentsLoading && !hasFetched ? (
        <div
          className="card empty-state"
          style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="loader"
            style={{ width: '24px', height: '24px', border: '3px solid currentColor', borderTopColor: 'transparent', marginBottom: '16px' }}
          />
          <p>Loading Freight Logistics Data...</p>
        </div>
      ) : shipments.length === 0 ? (
        <div className="card empty-state" style={{ padding: '60px' }}>
          <Truck size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3>No Shipments Found</h3>
          <p style={{ maxWidth: '350px' }}>
            No shipments have been scheduled yet. Create an award for an active bid in the Inventory tab to schedule a shipment.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Left Column: Shipments List */}
          <ShipmentTable />

          {/* Right Column: Details & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {selectedShipment ? (() => {
              const badge = getShipmentStatusBadge(selectedShipment.status);
              const buyerName = selectedShipment.awardId?.buyerId?.companyName || 'Retail Buyer';
              const productSku = selectedShipment.awardId?.listingId?.opportunityId?.lotId?.productId?.sku || 'N/A';
              const productDesc = selectedShipment.awardId?.listingId?.opportunityId?.lotId?.productId?.description || 'N/A';
              const awardedQty = selectedShipment.awardId?.awardedQty || 0;

              return (
                <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Shipment Details</h3>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: 600,
                          color: badge.color,
                          backgroundColor: badge.bg,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                      Shipment Mongo ID: {selectedShipment._id}
                    </span>
                  </div>

                  {/* Shipment timeline milestone visualization */}
                  <div style={{ padding: '16px', backgroundColor: 'hsl(var(--bg-main) / 30%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>Logistics Timeline</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 8px' }}>
                      {/* Connector line */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '20px',
                          right: '20px',
                          height: '2px',
                          backgroundColor: 'hsl(var(--border-color))',
                          zIndex: 1,
                        }}
                      />

                      {/* Scheduled Step */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 2 }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'hsl(var(--success))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        >
                          ✓
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Scheduled</span>
                      </div>

                      {/* Confirmed Step */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 2 }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: ['confirmed', 'in_transit', 'delivered'].includes(selectedShipment.status)
                              ? 'hsl(var(--success))'
                              : 'hsl(var(--border-color))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        >
                          {['confirmed', 'in_transit', 'delivered'].includes(selectedShipment.status) ? '✓' : '2'}
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Confirmed</span>
                      </div>

                      {/* In Transit Step */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 2 }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: ['in_transit', 'delivered'].includes(selectedShipment.status)
                              ? 'hsl(var(--success))'
                              : 'hsl(var(--border-color))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        >
                          {['in_transit', 'delivered'].includes(selectedShipment.status) ? '✓' : '3'}
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>In Transit</span>
                      </div>

                      {/* Delivered Step */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 2 }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: selectedShipment.status === 'delivered' ? 'hsl(var(--success))' : 'hsl(var(--border-color))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        >
                          {selectedShipment.status === 'delivered' ? '✓' : '4'}
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Delivered</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipment metadata info block */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem' }}>
                    <div style={{ gridColumn: 'span 2', borderBottom: '1px solid hsl(var(--border-color) / 40%)', paddingBottom: '8px' }}>
                      <strong>Cargo Quantity & Description:</strong>
                      <div style={{ color: 'hsl(var(--text-secondary))', marginTop: '2px', fontWeight: 600 }}>
                        {awardedQty} cases of {productDesc} ({productSku})
                      </div>
                    </div>
                    <div>
                      <strong>Consignee:</strong>
                      <div style={{ color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>{buyerName}</div>
                    </div>
                    <div>
                      <strong>Pickup DC Address:</strong>
                      <div style={{ color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>{selectedShipment.pickupLocation}</div>
                    </div>
                    <div>
                      <strong>Delivery Address:</strong>
                      <div style={{ color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>{selectedShipment.deliveryLocation}</div>
                    </div>
                    <div>
                      <strong>BOL PDF Document:</strong>
                      <div style={{ marginTop: '2px' }}>
                        {selectedShipment.bolPdfUrl ? (
                          <a
                            href={selectedShipment.bolPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'hsl(var(--primary))', textDecoration: 'underline', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span>📄</span> Download BOL PDF
                          </a>
                        ) : (
                          <span style={{ color: 'hsl(var(--text-muted))' }}>Not Generated</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <strong>Carrier DOT Number:</strong>
                      <div style={{ color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>{selectedShipment.carrierDotNumber || 'Pending'}</div>
                    </div>
                    <div>
                      <strong>Temperature Constraint:</strong>
                      <div style={{ color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>{selectedShipment.temperature || 'Ambient'}</div>
                    </div>
                    {selectedShipment.pickupWindowStart && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <strong>Scheduled Dock Window:</strong>
                        <div style={{ color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>
                          {new Date(selectedShipment.pickupWindowStart).toLocaleString()} — {selectedShipment.pickupWindowEnd ? new Date(selectedShipment.pickupWindowEnd).toLocaleString() : ''}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 1 & 2: Dock Appointment Scheduling & Workflow Controls */}
                  <DockAppointmentModal />

                  {/* Section 3: Cold Chain Temperature Logger & Logs History */}
                  <ColdChainLogger />
                </div>
              );
            })() : (
              <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                <p>Select a dispatch from the list to view dock window, temperature records, and actions.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LogisticsView;
