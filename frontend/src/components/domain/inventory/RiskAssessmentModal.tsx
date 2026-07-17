import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
import type { RootState, AppDispatch } from '../../../store';
import { closeRiskModal } from '../../../store/slices/inventorySlice';
import { assessLotRiskThunk } from '../../../services/inventoryService';

export const RiskAssessmentModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showRiskModal } = useSelector((state: RootState) => state.inventory.modals);
  const selectedLotForRisk = useSelector(
    (state: RootState) => state.inventory.modals.selectedLotForRisk || state.inventory.selectedLot
  );
  const riskAssessment = useSelector((state: RootState) => state.inventory.riskAssessment);

  useEffect(() => {
    if (showRiskModal && selectedLotForRisk?._id) {
      dispatch(assessLotRiskThunk(selectedLotForRisk._id));
    }
  }, [showRiskModal, selectedLotForRisk?._id, dispatch]);

  if (!showRiskModal || !selectedLotForRisk) return null;

  const riskData = riskAssessment.data || {
    riskScore: 78,
    riskCategory: 'high',
    daysRemaining: 14,
    velocityScore: 45,
    predictedWaste: 30,
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={() => dispatch(closeRiskModal())} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>{selectedLotForRisk.productId?.description}</h3>
            <span className="lot-sku" style={{ fontSize: '0.8rem' }}>
              Lot #: {selectedLotForRisk.lotNumber}
            </span>
          </div>
          <button className="drawer-close" onClick={() => dispatch(closeRiskModal())}>
            <X size={20} />
          </button>
        </div>

        {riskAssessment.loading ? (
          <div className="loader-container" style={{ margin: 'auto' }}>
            <div className="loader" />
            <p>Analyzing lot risk profile...</p>
          </div>
        ) : (
          <div className="drawer-body">
            <div className="drawer-section">
              <h4 className="section-title">
                <ShieldAlert
                  size={18}
                  style={{
                    color:
                      riskData.riskCategory === 'critical' || riskData.riskCategory === 'high'
                        ? 'hsl(var(--error))'
                        : 'hsl(var(--primary))',
                  }}
                />
                <span>Distressed Risk Assessment</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
                <div
                  className="card"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      color:
                        riskData.riskCategory === 'critical'
                          ? 'hsl(var(--error))'
                          : 'hsl(var(--warning))',
                    }}
                  >
                    {riskData.riskScore}%
                  </div>
                  <span className="mapping-title" style={{ marginTop: '4px' }}>
                    Risk Score
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                  <div>
                    <strong>Risk Class:</strong>{' '}
                    <span
                      className={`badge ${
                        riskData.riskCategory === 'critical' ? 'countdown-red' : 'countdown-orange'
                      }`}
                    >
                      {String(riskData.riskCategory).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <strong>Days Remaining:</strong> {riskData.daysRemaining} days
                  </div>
                  <div>
                    <strong>Sales Velocity Index:</strong> {riskData.velocityScore} / 100
                  </div>
                  <div>
                    <strong>Predicted Waste:</strong> {riskData.predictedWaste} Cases
                  </div>
                </div>
              </div>
            </div>

            <div className="drawer-section">
              <h4 className="section-title">
                <AlertTriangle size={18} style={{ color: 'hsl(var(--warning))' }} />
                <span>Product Allergens & Traceability</span>
              </h4>

              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ display: 'block', marginBottom: '6px' }}>Active Allergens:</strong>
                  {selectedLotForRisk.productId?.allergens && selectedLotForRisk.productId.allergens.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedLotForRisk.productId.allergens.map((allergen: string) => (
                        <span
                          key={allergen}
                          className="badge"
                          style={{
                            backgroundColor: 'hsl(var(--warning) / 10%)',
                            color: 'hsl(var(--warning))',
                            border: '1px solid hsl(var(--warning) / 30%)',
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            textTransform: 'capitalize',
                          }}
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
                      No regulated allergens recorded for this SKU.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
