import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectSelectedShipment,
  selectNewTemperatureInput,
  setNewTemperatureInput,
  addTemperatureLogThunk,
} from '../../store/slices/logisticsSlice';

export const ColdChainLogger: React.FC = () => {
  const dispatch = useDispatch();
  const selectedShipment = useSelector(selectSelectedShipment);
  const newTemperatureInput = useSelector(selectNewTemperatureInput);

  if (!selectedShipment) return null;

  const handleAddTemperatureLog = () => {
    if (newTemperatureInput === '') {
      alert('Please enter a temperature value.');
      return;
    }
    dispatch(
      addTemperatureLogThunk({
        shipmentId: selectedShipment._id,
        temperature: parseFloat(newTemperatureInput),
      }) as any
    );
  };

  return (
    <div style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '16px' }}>
      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>🌡️</span> HACCP Cold Chain Temperature Logging
      </h4>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div className="filter-input-group" style={{ flex: 1 }}>
          <input
            type="number"
            step="0.1"
            className="filter-search"
            placeholder="Log Temperature (°F)"
            value={newTemperatureInput}
            onChange={(e) => dispatch(setNewTemperatureInput(e.target.value))}
          />
        </div>
        <button className="btn btn-secondary" onClick={handleAddTemperatureLog}>
          Log Temp
        </button>
      </div>

      <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
              <th style={{ padding: '6px 8px' }}>Timestamp</th>
              <th style={{ padding: '6px 8px' }}>Recorded Temp</th>
            </tr>
          </thead>
          <tbody>
            {selectedShipment.temperatureLogs && selectedShipment.temperatureLogs.length > 0 ? (
              selectedShipment.temperatureLogs.map((log: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid hsl(var(--border-color) / 40%)' }}>
                  <td style={{ padding: '6px 8px' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                  </td>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                    {typeof log.temperature === 'number' ? `${log.temperature.toFixed(1)} °F` : `${log.temperature} °F`}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} style={{ padding: '12px 8px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                  No temperature logs recorded for this shipment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ColdChainLogger;
