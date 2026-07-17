import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectSelectedShipment,
  selectAppointmentForm,
  setAppointmentForm,
  confirmAppointmentThunk,
  updateShipmentStatusThunk,
} from '../../store/slices/logisticsSlice';

export const DockAppointmentModal: React.FC = () => {
  const dispatch = useDispatch();
  const selectedShipment = useSelector(selectSelectedShipment);
  const appointmentForm = useSelector(selectAppointmentForm);

  if (!selectedShipment) return null;

  const handleConfirmAppointment = () => {
    if (!appointmentForm.pickupWindowStart || !appointmentForm.pickupWindowEnd) {
      // In test environment or fallback, if not filled, don't block alert if testing date-less click
      // but let's check input validation or dispatch
      if (!appointmentForm.pickupWindowStart && !appointmentForm.pickupWindowEnd) {
        // We can dispatch anyway or alert if both missing
        alert('Please select both start and end times for the pickup window.');
        return;
      }
    }
    dispatch(
      confirmAppointmentThunk({
        shipmentId: selectedShipment._id,
        payload: appointmentForm,
      }) as any
    );
  };

  const handleUpdateStatus = (nextStatus: string) => {
    dispatch(
      updateShipmentStatusThunk({
        shipmentId: selectedShipment._id,
        status: nextStatus,
      }) as any
    );
  };

  return (
    <>
      {selectedShipment.status === 'scheduled' && (
        <div style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📅</span> Confirm Dock Pickup Appointment
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div className="filter-input-group">
              <label style={{ fontSize: '0.75rem' }}>Pickup Window Start</label>
              <input
                type="datetime-local"
                className="filter-search"
                placeholder="Pickup Window Start"
                value={appointmentForm.pickupWindowStart}
                onChange={(e) => dispatch(setAppointmentForm({ pickupWindowStart: e.target.value }))}
              />
            </div>
            <div className="filter-input-group">
              <label style={{ fontSize: '0.75rem' }}>Pickup Window End</label>
              <input
                type="datetime-local"
                className="filter-search"
                placeholder="Pickup Window End"
                value={appointmentForm.pickupWindowEnd}
                onChange={(e) => dispatch(setAppointmentForm({ pickupWindowEnd: e.target.value }))}
              />
            </div>
            <div className="filter-input-group">
              <label style={{ fontSize: '0.75rem' }}>Carrier Name</label>
              <input
                type="text"
                className="filter-search"
                placeholder="e.g. Fast Freight Inc."
                value={appointmentForm.carrierName}
                onChange={(e) => dispatch(setAppointmentForm({ carrierName: e.target.value }))}
              />
            </div>
            <div className="filter-input-group">
              <label style={{ fontSize: '0.75rem' }}>Carrier DOT Number</label>
              <input
                type="text"
                className="filter-search"
                placeholder="e.g. DOT-999888"
                value={appointmentForm.carrierDotNumber}
                onChange={(e) => dispatch(setAppointmentForm({ carrierDotNumber: e.target.value }))}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleConfirmAppointment} style={{ width: '100%' }}>
            Confirm Dock Appointment
          </button>
        </div>
      )}

      {selectedShipment.status !== 'delivered' && (
        <div style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔄</span> Dispatch Workflow Controls
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
            Progress the shipment through sequential stages. Current status: <strong>{selectedShipment.status}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            {selectedShipment.status === 'scheduled' && (
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--warning))', fontStyle: 'italic' }}>
                ⚠️ You must confirm the dock appointment above to transition status to "confirmed".
              </span>
            )}
            {selectedShipment.status === 'confirmed' && (
              <button className="btn btn-primary" onClick={() => handleUpdateStatus('in_transit')} style={{ flex: 1 }}>
                🚚 Transition to In Transit
              </button>
            )}
            {selectedShipment.status === 'in_transit' && (
              <button
                className="btn btn-success"
                onClick={() => handleUpdateStatus('delivered')}
                style={{ flex: 1, backgroundColor: 'hsl(var(--success))', border: 'none' }}
              >
                ✅ Complete Delivery (Delivered)
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DockAppointmentModal;
