import { useRef, type ChangeEvent, type DragEvent } from 'react';
import { 
  Sparkles, 
  FileSpreadsheet, 
  FileText, 
  UploadCloud, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { DEFAULT_SUPPLIERS } from '../../../services/coreService';
import { 
  setSelectedSupplier,
  setInventoryFile,
  setInventoryDragActive,
  setInventoryError,
  setSalesFile,
  setSalesDragActive,
  setSalesError,
  uploadInventoryThunk,
  uploadSalesThunk
} from '../../../store/slices/ingestionSlice';

export interface UploadDropzoneProps {
  pipelineType: 'inventory' | 'sales';
}

export const UploadDropzone = ({ pipelineType }: UploadDropzoneProps) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Holds the actual File object — can't be stored in Redux (not serializable)
  const actualFileRef = useRef<File | null>(null);

  const suppliers = useAppSelector((state) => state.core.suppliers);
  const selectedSupplier = useAppSelector((state) => state.ingestion.selectedSupplier);

  const file = useAppSelector((state) => 
    pipelineType === 'inventory' ? state.ingestion.inventoryFile : state.ingestion.salesFile
  );
  const dragActive = useAppSelector((state) => 
    pipelineType === 'inventory' ? state.ingestion.inventoryDragActive : state.ingestion.salesDragActive
  );
  const loading = useAppSelector((state) => 
    pipelineType === 'inventory' ? state.ingestion.inventoryLoading : state.ingestion.salesLoading
  );
  const error = useAppSelector((state) => 
    pipelineType === 'inventory' ? state.ingestion.inventoryError : state.ingestion.salesError
  );
  const isImported = useAppSelector((state) => 
    pipelineType === 'inventory' ? state.ingestion.inventoryIsImported : state.ingestion.salesIsImported
  );
  const importCount = useAppSelector((state) => 
    pipelineType === 'inventory' ? state.ingestion.inventoryImportCount : state.ingestion.salesImportCount
  );
  const importedLotIds = useAppSelector((state) => state.ingestion.inventoryImportedLotIds);
  const salesImportWarnings = useAppSelector((state) => state.ingestion.salesImportWarnings);

  // Default select first supplier if empty and available
  const availableSuppliers = suppliers.length > 0 ? suppliers : DEFAULT_SUPPLIERS;
  const effectiveSupplierId = selectedSupplier || (availableSuppliers.length > 0 ? (availableSuppliers[0]._id || '') : '');

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      if (pipelineType === 'inventory') dispatch(setInventoryDragActive(true));
      else dispatch(setSalesDragActive(true));
    } else if (e.type === 'dragleave') {
      if (pipelineType === 'inventory') dispatch(setInventoryDragActive(false));
      else dispatch(setSalesDragActive(false));
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (pipelineType === 'inventory') dispatch(setInventoryDragActive(false));
    else dispatch(setSalesDragActive(false));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      // Persist real File in ref; dispatch only serializable metadata to Redux
      actualFileRef.current = droppedFile;
      if (pipelineType === 'inventory') {
        dispatch(setInventoryFile({ name: droppedFile.name, size: droppedFile.size }));
      } else {
        dispatch(setSalesFile({ name: droppedFile.name, size: droppedFile.size }));
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Persist real File in ref; dispatch only serializable metadata to Redux
      actualFileRef.current = selectedFile;
      if (pipelineType === 'inventory') {
        dispatch(setInventoryFile({ name: selectedFile.name, size: selectedFile.size }));
      } else {
        dispatch(setSalesFile({ name: selectedFile.name, size: selectedFile.size }));
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleRunExtraction = () => {
    // Read actual File from ref — never from Redux (Redux only holds { name, size })
    const actualFile = actualFileRef.current;
    if (!effectiveSupplierId) {
      if (pipelineType === 'inventory') {
        dispatch(setInventoryError('Please select a CPG Supplier Company.'));
      } else {
        dispatch(setSalesError('Please select a CPG Supplier Company.'));
      }
      return;
    }

    if (!actualFile) {
      if (pipelineType === 'inventory') {
        dispatch(setInventoryError('File reference missing. Please select your file again.'));
      } else {
        dispatch(setSalesError('File reference missing. Please select your sales report file again.'));
      }
      return;
    }

    if (pipelineType === 'inventory') {
      dispatch(uploadInventoryThunk({ file: actualFile, supplierId: effectiveSupplierId }));
    } else {
      dispatch(uploadSalesThunk({ file: actualFile, supplierId: effectiveSupplierId }));
    }
  };

  const isInventory = pipelineType === 'inventory';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div className="card upload-source-card">
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isInventory ? (
            <Sparkles size={18} style={{ color: 'hsl(var(--primary))' }} />
          ) : (
            <DollarSign size={18} style={{ color: 'hsl(142, 76%, 46%)' }} />
          )}
          <span>{isInventory ? 'Document Source' : 'Sales Report Source'}</span>
        </h3>

        <div className="select-group">
          <label className="select-label">CPG Supplier Company</label>
          <select
            className="select-control"
            value={effectiveSupplierId}
            onChange={(e) => dispatch(setSelectedSupplier(e.target.value))}
          >
            {availableSuppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s.companyCode ? `(${s.companyCode})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div
          className={`dropzone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".pdf,.csv"
          />

          {file ? (
            <>
              {file.name.endsWith('.csv') ? (
                <FileSpreadsheet
                  className="dropzone-icon"
                  style={{ color: isInventory ? 'hsl(var(--primary))' : 'hsl(142, 76%, 46%)' }}
                />
              ) : (
                <FileText
                  className="dropzone-icon"
                  style={{ color: isInventory ? 'hsl(var(--primary))' : 'hsl(142, 76%, 46%)' }}
                />
              )}
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{file.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                  {(file.size / 1024).toFixed(1)} KB {isInventory ? '' : '• Sales Report'}
                </p>
              </div>
            </>
          ) : (
            <>
              <UploadCloud className="dropzone-icon" />
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {isInventory ? 'Drag & Drop Invoice File' : 'Drag & Drop Sales Report'}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                  {isInventory
                    ? 'Supports PDF (Docling OCR) or CSV tables'
                    : 'Upload distributor closeout sales sheets (CSV or PDF)'}
                </p>
              </div>
            </>
          )}
        </div>

        {file && (
          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: '20px',
              ...(isInventory
                ? {}
                : { background: 'linear-gradient(135deg, hsl(142, 76%, 36%), hsl(142, 76%, 46%))' }),
            }}
            onClick={handleRunExtraction}
            disabled={loading}
          >
            {loading ? 'Processing...' : isInventory ? 'Run Extraction' : 'Run Sales Extraction'}
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {error && (
        <div
          className="card"
          style={{
            borderLeft: '4px solid hsl(var(--error))',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <AlertTriangle size={20} style={{ color: 'hsl(var(--error))', flexShrink: 0 }} />
          <div>
            <h4 style={{ color: 'hsl(var(--error))', marginBottom: '4px' }}>
              {isInventory ? 'Extraction Error' : 'Sales Extraction Error'}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>{error}</p>
          </div>
        </div>
      )}

      {isImported && isInventory && (
        <div
          className="card"
          style={{
            borderLeft: '4px solid hsl(var(--success))',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <CheckCircle2 size={20} style={{ color: 'hsl(var(--success))', flexShrink: 0 }} />
          <div>
            <h4 style={{ color: 'hsl(var(--success))', marginBottom: '4px' }}>Ingestion Complete</h4>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
              Successfully imported <strong>{importCount}</strong> product lots to inventory database.
            </p>
            <div style={{ marginTop: '8px', maxHeight: '100px', overflowY: 'auto' }}>
              {importedLotIds.map((id) => (
                <span
                  key={id}
                  style={{
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    backgroundColor: 'hsl(var(--primary-glow) / 20%)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    margin: '2px',
                    color: 'hsl(var(--primary))',
                    cursor: 'pointer',
                    border: '1px solid hsl(var(--primary) / 20%)',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  title="Click to view details & upload compliance docs"
                >
                  🔍 {id}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {isImported && !isInventory && (
        <div
          className="card"
          style={{
            borderLeft: '4px solid hsl(142, 76%, 46%)',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <CheckCircle2 size={20} style={{ color: 'hsl(142, 76%, 46%)', flexShrink: 0 }} />
          <div>
            <h4 style={{ color: 'hsl(142, 76%, 46%)', marginBottom: '4px' }}>
              Sales Reconciliation Complete
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
              Successfully reconciled <strong>{importCount}</strong> sales records against surplus inventory (FEFO allocation applied).
            </p>
            {salesImportWarnings.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <p style={{ fontSize: '0.8rem', color: 'hsl(45, 93%, 47%)', fontWeight: 600 }}>
                  ⚠️ Reconciliation Warnings:
                </p>
                {salesImportWarnings.map((w, i) => (
                  <p
                    key={i}
                    style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}
                  >
                    • {w}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
