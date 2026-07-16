import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, FileCheck, Upload } from 'lucide-react';
import type { RootState, AppDispatch } from '../../../store';
import { closeComplianceModal } from '../../../store/slices/inventorySlice';
import { uploadComplianceDocThunk, updateLotComplianceThunk } from '../../../services/inventoryService';

export const ComplianceModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showComplianceModal } = useSelector((state: RootState) => state.inventory.modals);
  const selectedLotForCompliance = useSelector(
    (state: RootState) => state.inventory.modals.selectedLotForCompliance || state.inventory.selectedLot
  );
  const { uploading: complianceUploading, error: complianceError } = useSelector(
    (state: RootState) => state.inventory.compliance
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>('COA');

  if (!showComplianceModal || !selectedLotForCompliance) return null;

  const handleUpload = async () => {
    if (!selectedFile) return;
    await dispatch(
      uploadComplianceDocThunk({
        lotId: selectedLotForCompliance._id,
        docType,
        file: selectedFile,
      })
    );
    await dispatch(
      updateLotComplianceThunk({
        lotId: selectedLotForCompliance._id,
        updates: { fdaRegulated: true, complianceDocs: [...(selectedLotForCompliance.complianceDocs || []), { docType, fileName: selectedFile.name }] },
      })
    );
    setSelectedFile(null);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={20} style={{ color: 'hsl(var(--primary))' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Lot Compliance Vault & Documentation</h3>
          </div>
          <button className="drawer-close" onClick={() => dispatch(closeComplianceModal())}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedLotForCompliance.productId?.description}</div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
              Lot #: {selectedLotForCompliance.lotNumber} | SKU: {selectedLotForCompliance.productId?.sku}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.8rem' }}>
              <strong>FDA Regulated:</strong> {selectedLotForCompliance.fdaRegulated ? 'Yes' : 'No'}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Attached Documents</h4>
            {selectedLotForCompliance.complianceDocs && selectedLotForCompliance.complianceDocs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedLotForCompliance.complianceDocs.map((doc: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'hsl(var(--bg-card-hover) / 20%)',
                      border: '1px solid hsl(var(--border-color))',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      <strong>[{doc.docType}]</strong> {doc.fileName || doc.url}
                    </span>
                    <span style={{ color: 'hsl(var(--success))', fontSize: '0.75rem' }}>✓ Verified</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
                No compliance documents uploaded yet. Regulated lots require a Certificate of Analysis (COA).
              </div>
            )}
          </div>

          <div className="filter-input-group" style={{ marginBottom: '12px' }}>
            <label>Document Type</label>
            <select className="filter-select" value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="COA">Certificate of Analysis (COA)</option>
              <option value="BATCH_RECORD">Batch Production Record</option>
              <option value="TEMP_LOG">Temperature Transit Log</option>
              <option value="INSPECTION">Quality Inspection Certificate</option>
            </select>
          </div>

          <div className="filter-input-group">
            <label>Select File</label>
            <input
              type="file"
              className="filter-search"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
          </div>

          {complianceError && (
            <div style={{ color: 'hsl(var(--error))', fontSize: '0.8rem', marginTop: '8px' }}>
              ⚠️ {complianceError}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => dispatch(closeComplianceModal())} disabled={complianceUploading}>
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || complianceUploading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Upload size={16} />
            {complianceUploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>
    </div>
  );
};
