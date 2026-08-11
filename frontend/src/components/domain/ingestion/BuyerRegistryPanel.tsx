import { useEffect, useRef, useState } from 'react';
import { Users, CheckCircle2, AlertTriangle, UploadCloud, Check, X, Maximize2, Minimize2, ListFilter } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  setBuyerSearch,
  setBuyerTierFilter,
  setBuyerNewName,
  setBuyerNewEmail,
  setBuyerNewTier,
  setBuyerFile,
  setBuyerParsedResult,
  updateBuyerMapping,
  addBuyerThunk,
  uploadBuyerThunk,
  confirmBuyerThunk,
} from '../../../store/slices/ingestionSlice';
import { fetchCoreReferenceData, fetchBuyerLists, type Buyer } from '../../../store/slices/coreSlice';
import { BuyerDetailDrawer } from './BuyerDetailDrawer';
import { BuyerListManagerModal } from './BuyerListManagerModal';
import { BuyerTable } from '../inventory/BuyerTable';

const BUYER_OPTIONS = [
  { value: 'companyName', label: 'Company / Buyer Name' },
  { value: 'email', label: 'Email Address' },
  { value: 'tier', label: 'Buyer Tier' },
  { value: 'acceptsShortDated', label: 'Accepts Short-Dated' },
  { value: 'minShelfLife', label: 'Min Shelf Life (Days)' },
  { value: 'categories', label: 'Categories' },
  { value: 'transportRadius', label: 'Transport Radius (Miles)' },
];

export const BuyerRegistryPanel = () => {
  const dispatch = useAppDispatch();
  const buyers = useAppSelector((state) => state.core.buyers);

  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedModalListId, setSelectedModalListId] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(fetchCoreReferenceData({ all: showInactive }));
    dispatch(fetchBuyerLists());
  }, [dispatch, showInactive]);

  const search = useAppSelector((state) => state.ingestion.buyerSearch);
  const tierFilter = useAppSelector((state) => state.ingestion.buyerTierFilter);
  const newName = useAppSelector((state) => state.ingestion.buyerNewName);
  const newEmail = useAppSelector((state) => state.ingestion.buyerNewEmail);
  const newTier = useAppSelector((state) => state.ingestion.buyerNewTier);
  const saving = useAppSelector((state) => state.ingestion.buyerSaving);
  const success = useAppSelector((state) => state.ingestion.buyerSuccess);
  const error = useAppSelector((state) => state.ingestion.buyerError);

  const buyerParsedResult = useAppSelector((state) => state.ingestion.buyerParsedResult);
  const buyerMappings = useAppSelector((state) => state.ingestion.buyerMappings);
  const buyerLoading = useAppSelector((state) => state.ingestion.buyerLoading);
  const buyerLoadingStep = useAppSelector((state) => state.ingestion.buyerLoadingStep);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddBuyerModalOpen, setIsAddBuyerModalOpen] = useState(false);
  const [isBuyerListModalOpen, setIsBuyerListModalOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const getMappedField = (headerName: string): string => {
    const found = Object.entries(buyerMappings).find(([, h]) => h === headerName)?.[0] || '';
    if (found === 'name') return 'companyName';
    return found;
  };

  const getFieldNameLabel = (fieldValue: string): string => {
    const norm = fieldValue === 'name' ? 'companyName' : fieldValue;
    const found = BUYER_OPTIONS.find((o) => o.value === norm);
    return found ? found.label : fieldValue;
  };

  const handleMappingChange = (dbField: string, headerName: string) => {
    dispatch(updateBuyerMapping({ dbField, headerName }));
    if (dbField === 'companyName') {
      dispatch(updateBuyerMapping({ dbField: 'name', headerName }));
    }
  };

  const filteredBuyers = buyers.filter((b) => {
    const isInactive = b.isActive === false;
    if (!showInactive && isInactive) return false;
    const q = search.toLowerCase();
    const nm = (b.companyName || b.name || '').toLowerCase();
    const em = (b.email || '').toLowerCase();
    const matchSearch = !search || nm.includes(q) || em.includes(q);
    const matchTier = tierFilter === 'all' || b.tier === tierFilter;

    let matchStatus = true;
    if (statusFilter === 'active') matchStatus = !isInactive;
    else if (statusFilter === 'inactive') matchStatus = isInactive;
    else if (statusFilter === 'no-bidding') matchStatus = b.optInBidding === false;
    else if (statusFilter === 'no-sales') matchStatus = b.optInSales === false;

    return matchSearch && matchTier && matchStatus;
  });





  const handleAddBuyer = async () => {
    if (!newName || !newEmail) return;
    await dispatch(addBuyerThunk({ companyName: newName, email: newEmail, tier: newTier }));
    dispatch(setBuyerNewName(''));
    dispatch(setBuyerNewEmail(''));
    // Automatically re-fetch buyers into core slice
    dispatch(fetchCoreReferenceData());
  };

  const handleCsvSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setIsImportModalOpen(false);
    dispatch(setBuyerFile({ name: f.name, size: f.size }));
    await dispatch(uploadBuyerThunk({ file: f }));
    if (e.target) e.target.value = '';
  };

  const handleConfirmBuyerImport = async () => {
    if (!buyerParsedResult) return;
    const documentId = buyerParsedResult.documentId || buyerParsedResult._id || buyerParsedResult.ingestionJobId || '';
    const res = await dispatch(
      confirmBuyerThunk({
        documentId,
        mappings: buyerMappings,
      })
    );
    if (confirmBuyerThunk.fulfilled.match(res)) {
      dispatch(fetchCoreReferenceData());
      dispatch(setBuyerParsedResult(null));
      dispatch(setBuyerFile(null));
      setIsFullscreen(false);
    }
  };

  const handleCancelBuyerImport = () => {
    dispatch(setBuyerParsedResult(null));
    dispatch(setBuyerFile(null));
    setIsFullscreen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Ingestion Actions */}
      <div className="card" style={{ borderLeft: '4px solid hsl(262, 83%, 63%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <Users size={20} style={{ color: 'hsl(262, 83%, 63%)' }} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Buyer List Ingestion</h3>
              <span
                style={{
                  background: 'hsl(262, 83%, 63% / 0.15)',
                  color: 'hsl(262, 83%, 63%)',
                  border: '1px solid hsl(262, 83%, 63% / 0.3)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '10px',
                }}
              >
                {buyers.length} Registered Buyers
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
              Manage your registered buyer network. Add individual buyers manually or bulk-import via CSV. Buyers added here are available across all workflows.
            </p>
          </div>

          {/* Action Buttons in Place */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid hsl(262, 83%, 63% / 0.4)',
                background: 'hsl(262, 83%, 63% / 0.12)',
                color: 'hsl(262, 83%, 73%)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <UploadCloud size={16} /> Bulk Import via CSV
            </button>

            <button
              type="button"
              onClick={() => setIsAddBuyerModalOpen(true)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, hsl(262, 83%, 53%), hsl(221, 83%, 53%))',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px hsl(262, 83%, 53% / 0.35)',
              }}
            >
              <Users size={16} /> Add Buyer Manually
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedModalListId(undefined);
                setIsBuyerListModalOpen(true);
              }}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid hsl(160, 84%, 39% / 0.4)',
                background: 'hsl(160, 84%, 39% / 0.15)',
                color: 'hsl(160, 84%, 45%)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <ListFilter size={16} /> Buyer Lists
            </button>
          </div>
        </div>
      </div>



      <BuyerListManagerModal 
        isOpen={isBuyerListModalOpen} 
        onClose={() => setIsBuyerListModalOpen(false)}
        initialSelectedListId={selectedModalListId}
      />

      {/* Hidden File Input (Always in DOM for ref & tests) */}
      <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvSelect} />

      {/* Ingestion Mapping State OR Processing State */}
      {buyerLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <div className="loader" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>Processing Buyer CSV...</p>
          <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', margin: 0 }}>{buyerLoadingStep || 'Analyzing columns...'}</p>
        </div>
      ) : buyerParsedResult ? (
        <div
          className="card"
          style={{
            border: '1px solid hsl(262, 83%, 63% / 0.5)',
            background: 'hsl(223, 47%, 10%)',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            ...(isFullscreen
              ? {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9999,
                  background: 'hsl(223, 47%, 9%)',
                  padding: '24px',
                  borderRadius: 0,
                  overflow: 'hidden',
                }
              : {}),
          }}
        >
          <div className="preview-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            <div className="preview-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <CheckCircle2 size={20} style={{ color: 'hsl(262, 83%, 63%)' }} />
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#fff', fontWeight: 700 }}>
                    Confirm Buyer CSV Mapping
                  </h3>
                  <span
                    style={{
                      fontSize: '11px',
                      background: 'hsl(262, 83%, 63% / 0.2)',
                      color: 'hsl(262, 83%, 73%)',
                      border: '1px solid hsl(262, 83%, 63% / 0.4)',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {buyerParsedResult.fileName}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                  Map CSV columns to database fields before importing into buyer registry. Scroll horizontally to review raw grid extraction.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border-color))',
                    background: 'hsl(223, 47%, 14%)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBuyerImport}
                  disabled={buyerLoading}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: buyerLoading ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg, hsl(262, 83%, 53%), hsl(221, 83%, 53%))',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px hsl(262, 83%, 53% / 0.3)',
                  }}
                >
                  <Check size={16} /> Confirm & Ingest Buyers
                </button>
                <button
                  type="button"
                  onClick={handleCancelBuyerImport}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border-color))',
                    background: 'hsl(223, 47%, 14%)',
                    color: 'hsl(var(--text-muted))',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              className="preview-grid-wrapper"
              style={{
                maxHeight: isFullscreen ? 'calc(100vh - 180px)' : '550px',
                overflow: 'auto',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border-color))',
              }}
            >
              <table className="preview-table">
                <thead>
                  <tr>
                    {(buyerParsedResult.rawGrid?.[0] || []).map((header: string, colIdx: number) => {
                      const mappedField = getMappedField(header);
                      return (
                        <th key={colIdx} className={mappedField ? 'mapping-highlight' : ''}>
                          <div className="mapping-badge-container">
                            <span style={{ fontWeight: 'bold' }}>{header}</span>
                            <select
                              className="mapping-select"
                              value={mappedField}
                              onChange={(e) => handleMappingChange(e.target.value, header)}
                            >
                              <option value="">Unmapped</option>
                              {BUYER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {mappedField && (
                              <span className="badge badge-info" style={{ marginTop: '4px', fontSize: '0.65rem' }}>
                                {getFieldNameLabel(mappedField)}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {(buyerParsedResult.rawGrid?.slice(1) || []).map((row: string[], rowIdx: number) => (
                    <tr key={rowIdx}>
                      {row.map((cell: string, cellIdx: number) => {
                        const header = buyerParsedResult.rawGrid[0]?.[cellIdx];
                        const mappedField = header ? getMappedField(header) : '';
                        return (
                          <td key={cellIdx} className={mappedField ? 'mapping-highlight' : ''}>
                            {cell || <span style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>empty</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal 1: Bulk Import via CSV Modal */}
      {isImportModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(10, 14, 26, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setIsImportModalOpen(false)}
        >
          <div
            style={{
              background: 'hsl(223, 47%, 10%)',
              border: '1px solid hsl(262, 83%, 63% / 0.35)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              padding: '28px',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 20px hsl(262, 83%, 63% / 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'hsl(262, 83%, 63% / 0.15)',
                    border: '1px solid hsl(262, 83%, 63% / 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'hsl(262, 83%, 73%)',
                  }}
                >
                  <UploadCloud size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    Bulk Import Buyers via CSV
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
                    Upload a structured CSV file to import multiple buyers into your registry.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                style={{
                  background: 'hsl(223, 47%, 14%)',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: '8px',
                  color: 'hsl(var(--text-muted))',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const f = e.dataTransfer.files?.[0];
                if (!f) return;
                setIsImportModalOpen(false);
                dispatch(setBuyerFile({ name: f.name, size: f.size }));
                await dispatch(uploadBuyerThunk({ file: f }));
              }}
              style={{
                border: '2px dashed hsl(262, 83%, 63% / 0.4)',
                borderRadius: '12px',
                background: 'hsl(262, 83%, 63% / 0.04)',
                padding: '32px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <UploadCloud size={38} style={{ color: 'hsl(262, 83%, 73%)', marginBottom: '10px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                Select or drag your CSV file here
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                Supports <code style={{ color: 'hsl(262, 83%, 73%)' }}>.csv</code> files up to 500 records per import
              </p>
            </div>

            {/* Header info */}
            <div
              style={{
                background: 'hsl(223, 47%, 8%)',
                borderRadius: '10px',
                padding: '12px 16px',
                border: '1px solid hsl(var(--border-color))',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ fontWeight: 600, color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                Supported CSV Column Format:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: 'hsl(262, 83%, 63% / 0.15)', color: 'hsl(262, 83%, 73%)', padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                  name / companyName
                </span>
                <span style={{ background: 'hsl(262, 83%, 63% / 0.15)', color: 'hsl(262, 83%, 73%)', padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                  email
                </span>
                <span style={{ background: 'hsl(262, 83%, 63% / 0.15)', color: 'hsl(262, 83%, 73%)', padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                  tier
                </span>
              </div>
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border-color))',
                  background: 'hsl(223, 47%, 14%)',
                  color: 'hsl(var(--text-muted))',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, hsl(262, 83%, 53%), hsl(221, 83%, 53%))',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px hsl(262, 83%, 53% / 0.3)',
                }}
              >
                <UploadCloud size={16} /> Select CSV File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add Buyer Manually Modal */}
      {isAddBuyerModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(10, 14, 26, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setIsAddBuyerModalOpen(false)}
        >
          <div
            style={{
              background: 'hsl(223, 47%, 10%)',
              border: '1px solid hsl(262, 83%, 63% / 0.35)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              padding: '28px',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 20px hsl(262, 83%, 63% / 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'hsl(262, 83%, 63% / 0.15)',
                    border: '1px solid hsl(262, 83%, 63% / 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'hsl(262, 83%, 73%)',
                  }}
                >
                  <Users size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    Add Buyer Manually
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
                    Register a new buyer into your global network.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBuyerModalOpen(false)}
                style={{
                  background: 'hsl(223, 47%, 14%)',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: '8px',
                  color: 'hsl(var(--text-muted))',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {success && (
              <div
                style={{
                  background: 'hsl(var(--success) / 0.1)',
                  border: '1px solid hsl(var(--success) / 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: 'hsl(var(--success))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} /> {success}
              </div>
            )}
            {error && (
              <div
                style={{
                  background: 'hsl(var(--error) / 0.1)',
                  border: '1px solid hsl(var(--error) / 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: 'hsl(var(--error))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '6px' }}>
                  Company / Buyer Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => dispatch(setBuyerNewName(e.target.value))}
                  placeholder="e.g. Costco Wholesale"
                  style={{
                    width: '100%',
                    background: 'hsl(223, 47%, 8%)',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => dispatch(setBuyerNewEmail(e.target.value))}
                  placeholder="buyer@company.com"
                  style={{
                    width: '100%',
                    background: 'hsl(223, 47%, 8%)',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '6px' }}>
                  Buyer Tier
                </label>
                <select
                  value={newTier}
                  onChange={(e) => dispatch(setBuyerNewTier(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'hsl(223, 47%, 8%)',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="tier1">Tier 1 — Primary Retailer</option>
                  <option value="tier2">Tier 2 — Regional Retailer</option>
                  <option value="liquidator">Liquidator / Secondary Market</option>
                  <option value="custom">Custom / Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsAddBuyerModalOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border-color))',
                  background: 'hsl(223, 47%, 14%)',
                  color: 'hsl(var(--text-muted))',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newName || !newEmail || saving}
                onClick={handleAddBuyer}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: newName && newEmail && !saving ? 'pointer' : 'not-allowed',
                  background:
                    newName && newEmail
                      ? 'linear-gradient(135deg, hsl(262, 83%, 53%), hsl(221, 83%, 53%))'
                      : 'hsl(var(--border-color))',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: newName && newEmail ? '0 4px 14px hsl(262, 83%, 53% / 0.3)' : 'none',
                }}
              >
                {saving ? '⏳ Saving...' : '+ Add to Buyer Registry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section: Buyer Data List Section with Migrated Filter Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          className="collapsible-filters-panel"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}
        >
          <div className="filter-input-group">
            <label>Search Buyer</label>
            <input
              className="filter-search"
              placeholder="Search by name, company, email..."
              type="text"
              value={search}
              onChange={(e) => dispatch(setBuyerSearch(e.target.value))}
            />
          </div>

          <div className="filter-input-group">
            <label>Buyer Tier</label>
            <select
              className="filter-select"
              value={tierFilter}
              onChange={(e) => dispatch(setBuyerTierFilter(e.target.value))}
            >
              <option value="all">All Tiers</option>
              <option value="tier1">Tier 1 Retailer</option>
              <option value="tier2">Tier 2 Regional</option>
              <option value="liquidator">Liquidator</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="filter-input-group">
            <label>Status & Channel</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Buyers</option>
              <option value="inactive">Inactive Buyers</option>
              <option value="no-bidding">Opt-Out Bidding</option>
              <option value="no-sales">Opt-Out Sales</option>
            </select>
          </div>

          <div className="filter-input-group" style={{ justifyContent: 'center' }}>
            <label style={{ visibility: 'hidden' }}>Inactive</label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'hsl(var(--text-secondary))',
                cursor: 'pointer',
                userSelect: 'none',
                height: '38px',
              }}
            >
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              Show inactive buyers
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'flex-end' }}>
            {(search || tierFilter !== 'all' || statusFilter || showInactive) && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  dispatch(setBuyerSearch(''));
                  dispatch(setBuyerTierFilter('all'));
                  setStatusFilter('');
                  setShowInactive(false);
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <BuyerTable
          filteredBuyers={filteredBuyers}
          onBuyerClick={(buyer) => {
            setSelectedBuyer(buyer);
            setIsDrawerOpen(true);
          }}
          showInactive={showInactive}
        />
      </div>

      {/* Slide-over Buyer Detail Drawer */}
      <BuyerDetailDrawer
        buyer={selectedBuyer}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedBuyer(null);
          dispatch(fetchCoreReferenceData({ all: showInactive }));
        }}
        onBuyerUpdated={(updatedBuyer) => {
          setSelectedBuyer(updatedBuyer);
          dispatch(fetchCoreReferenceData({ all: showInactive }));
        }}
      />
    </div>
  );
};
