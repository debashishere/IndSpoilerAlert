import React from 'react';
import { Truck } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectShipments,
  selectSelectedShipmentId,
  setSelectedShipmentId,
  setAppointmentForm,
} from '../../store/slices/logisticsSlice';

export const getShipmentStatusBadge = (status: string) => {
  switch (status) {
    case 'scheduled':
      return { label: 'Scheduled', color: 'hsl(200, 100%, 40%)', bg: 'hsl(200, 100%, 40% / 10%)' };
    case 'confirmed':
      return { label: 'Confirmed', color: 'hsl(45, 100%, 35%)', bg: 'hsl(45, 100%, 35% / 10%)' };
    case 'in_transit':
      return { label: 'In Transit', color: 'hsl(280, 100%, 60%)', bg: 'hsl(280, 100%, 60% / 10%)' };
    case 'delivered':
      return { label: 'Delivered', color: 'hsl(150, 80%, 35%)', bg: 'hsl(150, 80%, 35% / 10%)' };
    default:
      return { label: status, color: 'hsl(var(--text-muted))', bg: 'hsl(var(--border-color))' };
  }
};

export const ShipmentTable: React.FC = () => {
  const dispatch = useDispatch();
  const shipments = useSelector(selectShipments);
  const selectedShipmentId = useSelector(selectSelectedShipmentId);

  const handleSelectShipment = (ship: any) => {
    dispatch(setSelectedShipmentId(ship._id));
    dispatch(
      setAppointmentForm({
        carrierName: ship.carrierName || '',
        carrierDotNumber: ship.carrierDotNumber || '',
        pickupWindowStart: ship.pickupWindowStart
          ? new Date(ship.pickupWindowStart).toISOString().slice(0, 16)
          : '',
        pickupWindowEnd: ship.pickupWindowEnd
          ? new Date(ship.pickupWindowEnd).toISOString().slice(0, 16)
          : '',
      })
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
          <Truck size={20} style={{ color: 'hsl(var(--primary))' }} />
          <span>Active Dispatches ({shipments.length})</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
          {shipments.map((ship) => {
            const badge = getShipmentStatusBadge(ship.status);
            const isSelected = selectedShipmentId === ship._id;
            const buyerName = ship.awardId?.buyerId?.companyName || 'Retail Buyer';
            const productSku = ship.awardId?.listingId?.opportunityId?.lotId?.productId?.sku || 'SKU';
            const productDesc = ship.awardId?.listingId?.opportunityId?.lotId?.productId?.description || 'Item';
            const awardedQty = ship.awardId?.awardedQty || 0;
            return (
              <div
                key={ship._id}
                onClick={() => handleSelectShipment(ship)}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border-color))',
                  backgroundColor: isSelected ? 'hsl(var(--primary) / 4%)' : 'hsl(var(--bg-card))',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                    BOL ID: {ship.bolNumber || `TBD (${ship._id.slice(-6)})`}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      color: badge.color,
                      backgroundColor: badge.bg,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{buyerName}</div>

                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                  <strong>Cargo:</strong> {awardedQty} cases of {productDesc} ({productSku})
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'hsl(var(--text-muted))',
                    borderTop: '1px solid hsl(var(--border-color))',
                    paddingTop: '8px',
                    marginTop: '4px',
                  }}
                >
                  <span>🚚 {ship.carrierName || 'No Carrier Assigned'}</span>
                  <span>📍 {ship.deliveryLocation ? ship.deliveryLocation.split(' ')[0] : 'DC'} Warehouse</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShipmentTable;
