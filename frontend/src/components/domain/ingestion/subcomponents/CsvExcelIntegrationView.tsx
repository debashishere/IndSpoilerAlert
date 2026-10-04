import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Layers, 
  Activity, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud,
  Table
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  uploadInventoryThunk,
  uploadSalesThunk,
  uploadBuyerThunk,
  setInventoryParsedResult,
  setSalesParsedResult,
  setBuyerParsedResult,
  setInventoryFile,
  setSalesFile,
  setBuyerFile,
  setPipelineTab,
} from '../../../../store/slices/ingestionSlice';
import { INGESTION_CONSTANTS } from '../constants/ingestionConstants';
import { GridMapperTable } from '../GridMapperTable';
import type { IngestionTarget } from '../types/ingestion.types';

export interface IngestionBatchRecord {
  id: string;
  fileName: string;
  target: IngestionTarget;
  recordCount: number;
  status: 'Completed' | 'Staged' | 'Failed';
  timestamp: string;
  createdLotIds?: string[];
  rawHeaders?: string[];
  rawGrid?: string[][];
  suggestedMapping?: Record<string, string>;
}

export const INITIAL_BATCH_HISTORY: IngestionBatchRecord[] = [
  {
    id: 'batch-inv-01',
    fileName: 'q3_inventory_manifest.csv',
    target: 'inventory',
    recordCount: 420,
    status: 'Completed',
    timestamp: '2026-10-02 14:30',
    createdLotIds: ['LOT-INV-8821', 'LOT-INV-8822', 'LOT-INV-8823'],
    rawHeaders: ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'],
    rawGrid: [
      ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'],
      ['Organic Fuji Apples', 'LOT-AP-99', '120', '18.50'],
    ],
    suggestedMapping: {
      description: 'Item Description',
      lotNumber: 'Lot Code',
      quantity: 'Quantity Cases',
      originalPrice: 'Price / Case',
    },
  },
  {
    id: 'batch-sales-01',
    fileName: 'sept_sales_closeout.xlsx',
    target: 'sales',
    recordCount: 156,
    status: 'Completed',
    timestamp: '2026-10-01 09:15',
    createdLotIds: ['SALE-REC-401', 'SALE-REC-402'],
    rawHeaders: ['Invoice', 'Amount', 'Date'],
    rawGrid: [
      ['Invoice', 'Amount', 'Date'],
      ['INV-001', '1200', '2026-10-01'],
    ],
    suggestedMapping: {
      invoiceNumber: 'Invoice',
      revenue: 'Amount',
      saleDate: 'Date',
    },
  },
  {
    id: 'batch-buyers-01',
    fileName: 'southeast_buyer_network.csv',
    target: 'buyers',
    recordCount: 38,
    status: 'Completed',
    timestamp: '2026-09-28 16:45',
    createdLotIds: ['BUYER-REC-101', 'BUYER-REC-102'],
    rawHeaders: ['Company Name', 'Contact Email'],
    rawGrid: [
      ['Company Name', 'Contact Email'],
      ['Discount Mart', 'buyer@dm.com'],
    ],
    suggestedMapping: {
      companyName: 'Company Name',
      email: 'Contact Email',
    },
  },
];

export interface CsvExcelIntegrationViewProps {
  supplierId?: string;
  supplierName?: string;
  initialTarget?: IngestionTarget;
  initialSubtab?: 'upload' | 'history';
  onTargetChange?: (target: IngestionTarget) => void;
  onNavigateToPipeline?: (target: IngestionTarget) => void;
  className?: string;
}

export const CsvExcelIntegrationView: React.FC<CsvExcelIntegrationViewProps> = ({
  supplierId,
  supplierName,
  initialTarget = 'inventory',
  initialSubtab = 'upload',
  onTargetChange,
  onNavigateToPipeline,
  className = '',
}) => {
  const dispatch = useAppDispatch();
  const suppliers = useAppSelector((state) => state.core?.suppliers || []);
  const selectedSupplierId = useAppSelector((state) => state.ingestion?.selectedSupplier);
  const effectiveSupplierId = supplierId || selectedSupplierId || (suppliers[0]?._id ?? '');

  const inventoryParsedResult = useAppSelector((state) => state.ingestion?.inventoryParsedResult);
  const salesParsedResult = useAppSelector((state) => state.ingestion?.salesParsedResult);
  const buyerParsedResult = useAppSelector((state) => state.ingestion?.buyerParsedResult);
  const inventoryMappings = useAppSelector((state) => state.ingestion?.inventoryMappings);
  const salesMappings = useAppSelector((state) => state.ingestion?.salesMappings);
  const buyerMappings = useAppSelector((state) => state.ingestion?.buyerMappings);

  const [target, setTarget] = useState<IngestionTarget>(initialTarget);
  const [activeSubtab, setActiveSubtab] = useState<'upload' | 'history'>(initialSubtab);
  const [isMapperClosed, setIsMapperClosed] = useState<boolean>(false);

  const activeParsedResult = target === 'inventory' ? inventoryParsedResult : target === 'sales' ? salesParsedResult : buyerParsedResult;
  const activeMappings = target === 'inventory' ? inventoryMappings : target === 'sales' ? salesMappings : buyerMappings;

  const prevInitialTargetRef = React.useRef(initialTarget);

  const handleTargetChange = (newTarget: IngestionTarget) => {
    setTarget(newTarget);
    prevInitialTargetRef.current = newTarget;
    setIsMapperClosed(false);
    onTargetChange?.(newTarget);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('target', newTarget);
      window.history.pushState({}, '', url.toString());
    }
  };

  React.useEffect(() => {
    if (initialTarget && initialTarget !== prevInitialTargetRef.current) {
      prevInitialTargetRef.current = initialTarget;
      setTarget(initialTarget);
    }
  }, [initialTarget]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchHistory, setBatchHistory] = useState<IngestionBatchRecord[]>(INITIAL_BATCH_HISTORY);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState<{
    count: number;
    lotIds?: string[];
    warnings?: string[];
    fileName?: string;
    target: IngestionTarget;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const activeFileName = selectedFile?.name || activeParsedResult?.fileName || `${target}_batch.csv`;
  const hasUploadedDocument = Boolean(
    (selectedFile && submitSuccess) ||
    activeParsedResult ||
    activeBatchId ||
    completionData
  );
  const totalBatchesCount = batchHistory.length;
  const totalRowsProcessed = batchHistory.reduce((sum, b) => sum + (b.recordCount || 0), 0);

  const handleConfirmSuccess = (result: any) => {
    const count = result?.countImported || result?.createdCount || result?.count || 0;
    const lotIds = result?.importedLotIds || result?.lotIds || [];
    const fileName = activeFileName;

    const newRecord: IngestionBatchRecord = {
      id: `batch-${Date.now()}`,
      fileName,
      target,
      recordCount: count,
      status: 'Completed',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      createdLotIds: lotIds,
      rawHeaders: activeParsedResult?.rawHeaders || [],
      rawGrid: activeParsedResult?.rawGrid || [],
      suggestedMapping: (activeParsedResult?.suggestedMapping || activeMappings || {}) as Record<string, string>,
    };

    setCompletionData({
      count,
      lotIds,
      warnings: result?.warnings || [],
      fileName,
      target,
    });

    setBatchHistory((prev) => [newRecord, ...prev]);
  };

  // Clean up staged parsed results upon unmount to ensure mapping windows don't linger
  React.useEffect(() => {
    return () => {
      dispatch(setInventoryParsedResult(null));
      dispatch(setSalesParsedResult(null));
      dispatch(setBuyerParsedResult(null));
      dispatch(setInventoryFile(null));
      dispatch(setSalesFile(null));
      dispatch(setBuyerFile(null));
    };
  }, [dispatch]);

  const handleViewPipeline = () => {
    const activeDest = completionData?.target || target;
    dispatch(setPipelineTab(activeDest));
    dispatch(setInventoryParsedResult(null));
    dispatch(setSalesParsedResult(null));
    dispatch(setBuyerParsedResult(null));
    dispatch(setInventoryFile(null));
    dispatch(setSalesFile(null));
    dispatch(setBuyerFile(null));
    if (onNavigateToPipeline) {
      onNavigateToPipeline(activeDest);
    } else if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('connector');
      url.searchParams.set('pipeline', activeDest);
      window.history.pushState({}, '', url.toString());
      window.dispatchEvent(new CustomEvent('pipeline-tab-changed', { detail: { target: activeDest } }));
    }
  };

  const handleIngestAnother = () => {
    setSelectedFile(null);
    setCompletionData(null);
    setSubmitSuccess(false);
    setErrorMessage(null);
    setActiveBatchId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    dispatch(setInventoryParsedResult(null));
    dispatch(setSalesParsedResult(null));
    dispatch(setBuyerParsedResult(null));
  };

  const handleCloseCsvMapping = () => {
    setSelectedFile(null);
    setActiveBatchId(null);
    setCompletionData(null);
    setSubmitSuccess(false);
    setErrorMessage(null);
    setIsMapperClosed(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (target === 'inventory') {
      dispatch(setInventoryParsedResult(null));
      dispatch(setInventoryFile(null));
    } else if (target === 'sales') {
      dispatch(setSalesParsedResult(null));
      dispatch(setSalesFile(null));
    } else if (target === 'buyers') {
      dispatch(setBuyerParsedResult(null));
      dispatch(setBuyerFile(null));
    }
  };

  const handleRestageBatch = (batch: IngestionBatchRecord) => {
    setActiveBatchId(batch.id);
    handleTargetChange(batch.target);
    setActiveSubtab('upload');
    setIsMapperClosed(false);

    const defaultHeaders =
      batch.target === 'sales'
        ? ['Invoice', 'Amount', 'Date']
        : batch.target === 'buyers'
        ? ['Company Name', 'Contact Email']
        : ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'];

    const defaultGrid =
      batch.target === 'sales'
        ? [
            ['Invoice', 'Amount', 'Date'],
            ['INV-001', '1200', '2026-10-01'],
          ]
        : batch.target === 'buyers'
        ? [
            ['Company Name', 'Contact Email'],
            ['Discount Mart', 'buyer@dm.com'],
          ]
        : [
            ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'],
            ['Organic Fuji Apples', 'LOT-AP-99', '120', '18.50'],
          ];

    const defaultMapping =
      batch.target === 'sales'
        ? { invoiceNumber: 'Invoice', revenue: 'Amount', saleDate: 'Date' }
        : batch.target === 'buyers'
        ? { companyName: 'Company Name', email: 'Contact Email' }
        : {
            description: 'Item Description',
            lotNumber: 'Lot Code',
            quantity: 'Quantity Cases',
            originalPrice: 'Price / Case',
          };

    const payload = {
      documentId: batch.id,
      fileName: batch.fileName,
      rawHeaders: batch.rawHeaders && batch.rawHeaders.length > 0 ? batch.rawHeaders : defaultHeaders,
      rawGrid: batch.rawGrid && batch.rawGrid.length > 0 ? batch.rawGrid : defaultGrid,
      suggestedMapping: batch.suggestedMapping && Object.keys(batch.suggestedMapping).length > 0 ? batch.suggestedMapping : defaultMapping,
    };

    if (batch.target === 'inventory') {
      dispatch(setInventoryParsedResult(payload as any));
    } else if (batch.target === 'sales') {
      dispatch(setSalesParsedResult(payload as any));
    } else if (batch.target === 'buyers') {
      dispatch(setBuyerParsedResult(payload as any));
    }
  };

  const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

  const validateAndStageFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    const isValidExtension = fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isValidExtension) {
      setErrorMessage('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.');
      setSelectedFile(null);
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File size exceeds 100 MB limit.');
      setSelectedFile(null);
      return false;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setIsMapperClosed(false);
    return true;
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndStageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndStageFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const targetLabels: Record<IngestionTarget, string> = {
    inventory: 'Inventory Data',
    sales: 'Sales Data',
    buyers: 'Buyer Data',
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSubmitSuccess(false);

    try {
      if (target === 'inventory') {
        await dispatch(uploadInventoryThunk({ file: selectedFile, supplierId: effectiveSupplierId })).unwrap();
      } else if (target === 'sales') {
        await dispatch(uploadSalesThunk({ file: selectedFile, supplierId: effectiveSupplierId })).unwrap();
      } else if (target === 'buyers') {
        await dispatch(uploadBuyerThunk({ file: selectedFile, supplierId: effectiveSupplierId || undefined })).unwrap();
      }
      setSubmitSuccess(true);
    } catch (err: any) {
      setErrorMessage(err?.message || (typeof err === 'string' ? err : 'Failed to parse file.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="csv-excel-integration-view"
      id="csv-excel-integration-view"
      className={`w-full space-y-6 ${className}`}
    >
      {/* Quadrant 1: Header & Operational Health Telemetry */}
      <section
        data-testid="csv-quadrant-1-telemetry"
        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="material-symbols-outlined text-[22px]">upload_file</span>
              <FileSpreadsheet className="w-5 h-5 hidden" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  CSV &amp; Excel Batch Ingress Suite
                </h2>
                <span
                  data-testid="csv-ingress-status-pill"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Manual Ingress Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-pipeline intake, automated column schema mapping, and historical batch telemetry for {supplierName || 'Verified Supplier'}.
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div
            data-testid="kpi-total-batches"
            className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/80"
          >
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-500" />
              Total Batches Ingested
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
              {totalBatchesCount}
            </div>
          </div>

          <div
            data-testid="kpi-total-rows"
            className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/80"
          >
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-500" />
              Total Rows Processed
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
              {totalRowsProcessed.toLocaleString()}
            </div>
          </div>

          <div
            data-testid="kpi-active-target"
            className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/80"
          >
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-500" />
              Active Pipeline Target
            </div>
            <div className="text-lg font-bold text-[#0f4cc9] dark:text-blue-400 mt-0.5">
              {targetLabels[target]}
            </div>
          </div>

          <div
            data-testid="kpi-parse-latency"
            className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/80"
          >
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              Avg Parse Latency
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
              124 ms
            </div>
          </div>
        </div>
      </section>

      {/* Subtab Navigation: New Upload vs History */}
      <div
        role="tablist"
        aria-label="CSV Ingress Workspace Subtabs"
        className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 w-fit"
      >
        <button
          type="button"
          role="tab"
          id="csv-subtab-upload"
          aria-selected={activeSubtab === 'upload'}
          aria-controls="csv-panel-upload"
          onClick={() => setActiveSubtab('upload')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubtab === 'upload'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>New Upload</span>
        </button>

        <button
          type="button"
          role="tab"
          id="csv-subtab-history"
          aria-selected={activeSubtab === 'history'}
          aria-controls="csv-panel-history"
          onClick={() => setActiveSubtab('history')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubtab === 'history'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>History</span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {batchHistory.length}
          </span>
        </button>
      </div>

      {/* Subtab Panel 1: New Upload (Target Selector + Dropzone + Deferred Mapper) */}
      <div
        id="csv-panel-upload"
        role="tabpanel"
        aria-labelledby="csv-subtab-upload"
        className={`space-y-4 ${activeSubtab === 'upload' ? 'block' : 'hidden'}`}
      >
        {/* Quadrant 2: Resized Destination Pipeline Target & Compact Dropzone */}
        <section
          data-testid="csv-quadrant-2-intake"
          className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
        >
          {/* Step 1: Destination Pipeline Selection (Compact Height) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Select Destination Pipeline Target
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Schema: <strong className="text-slate-700 dark:text-slate-300">{targetLabels[target]}</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {INGESTION_CONSTANTS.MODAL.DESTINATIONS.map((dest) => {
                const isSelected = target === dest.id;
                return (
                  <div
                    key={dest.id}
                    data-testid={`target-card-${dest.id}`}
                    data-active={isSelected ? 'true' : 'false'}
                    onClick={() => handleTargetChange(dest.id as IngestionTarget)}
                    className={`px-3 py-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'border-[#0f4cc9] bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-[#0f4cc9]/30 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#0f4cc9] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{dest.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {dest.title}
                        </h3>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {dest.badge}
                        </span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="csv-pipeline-target"
                      id={`target-radio-${dest.id}`}
                      aria-label={dest.title}
                      checked={isSelected}
                      onChange={() => handleTargetChange(dest.id as IngestionTarget)}
                      className="w-3.5 h-3.5 text-[#0f4cc9] border-slate-300 dark:border-slate-700 focus:ring-[#0f4cc9] cursor-pointer shrink-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Resized Institutional Dropzone & File Browser */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Upload Spreadsheet or Tabular Manifest
              </label>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                .CSV • .XLSX • .XLS (max 100MB)
              </span>
            </div>

            <input
              type="file"
              data-testid="csv-file-input"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />

            <div
              data-testid="csv-intake-dropzone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`p-4 border-2 border-dashed rounded-xl flex items-center justify-center text-center cursor-pointer transition-all min-h-[90px] ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                  : selectedFile
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20 hover:bg-emerald-50/30'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center gap-3 text-left w-full justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[280px]">
                        {selectedFile.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {formatFileSize(selectedFile.size)} • Click or drop to replace
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Ready for Ingestion
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Drag &amp; drop spreadsheet or click to browse
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Select or drop .csv, .xlsx, or .xls file to stage for mapping
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Notice */}
            {errorMessage && (
              <div
                data-testid="dropzone-error-notice"
                className="mt-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Step 3: Parser Ingestion Action Bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              {submitSuccess && (
                <span
                  data-testid="csv-parse-success-pill"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Dataset parsed successfully. Schema mapping staged below.
                </span>
              )}
            </div>
            <button
              type="button"
              data-testid="csv-submit-button"
              onClick={handleSubmit}
              disabled={!selectedFile || isSubmitting}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all ${
                selectedFile && !isSubmitting
                  ? 'bg-[#0f4cc9] hover:bg-[#1a42a0] text-white cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300/40 dark:border-slate-700/40'
              }`}
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-bounce' : ''}`} />
              <span>{isSubmitting ? 'Processing File...' : 'Ingest Dataset'}</span>
            </button>
          </div>
        </section>

        {/* Quadrant 4: In-Situ Schema Field Mapper (Deferred until document is selected and uploaded) */}
        <section
          data-testid="csv-quadrant-4-mapper"
          className={`p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 ${
            hasUploadedDocument ? 'block' : 'hidden'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Table className="w-4 h-4 text-blue-500" />
                  In-Situ Schema Field Mapper
                </h3>
                <span
                  data-testid="csv-mapper-target-pill"
                  className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60"
                >
                  Target: {targetLabels[target]}
                </span>
                {activeFileName && (
                  <span
                    data-testid="csv-mapper-file-badge"
                    className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {activeFileName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bind parsed column headers to target schema attributes with semantic translation rules.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isMapperClosed ? (
                <button
                  type="button"
                  data-testid="csv-close-mapper-button"
                  onClick={handleCloseCsvMapping}
                  aria-label="Close Mapper"
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Close Mapper
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="csv-open-mapper-button"
                  onClick={() => setIsMapperClosed(false)}
                  aria-label="Open Mapper"
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer"
                >
                  Open Mapper
                </button>
              )}
            </div>
          </div>

          {completionData && (
            <div
              data-testid="csv-ingestion-success-banner"
              className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                      Ingestion Completed: {completionData.count} records ingested successfully!
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Target: <strong className="capitalize">{targetLabels[completionData.target]}</strong> | Source: {completionData.fileName}
                    </p>
                  </div>
                </div>
              </div>

              {completionData.lotIds && completionData.lotIds.length > 0 && (
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    Generated IDs ({completionData.lotIds.length}):
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {completionData.lotIds.map((id) => (
                      <span
                        key={id}
                        className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-white dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* In-Situ Action CTAs */}
              <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  data-testid="cta-ingest-another"
                  onClick={handleIngestAnother}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Ingest Another File</span>
                </button>

                <button
                  type="button"
                  data-testid="cta-view-pipeline"
                  onClick={handleViewPipeline}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <span>View in Pipeline Table &rarr;</span>
                </button>
              </div>
            </div>
          )}

          {!isMapperClosed ? (
            <GridMapperTable
              pipelineType={target}
              mode="import"
              title={`${targetLabels[target]} Schema Mapping`}
              subtitle={`Map source columns to standardized ${targetLabels[target].toLowerCase()} attributes. Adjust overrides and click Confirm to commit.`}
              saveButtonText={`Confirm & Ingest ${targetLabels[target]}`}
              onConfirmSuccess={handleConfirmSuccess}
              onClose={handleCloseCsvMapping}
            />
          ) : (
            <div
              data-testid="csv-mapper-empty-state"
              className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                <Table className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Schema Mapper Closed
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                  The mapping interface is currently closed. Re-stage a batch or click Open Mapper to view and configure schema alignments.
                </p>
              </div>
              <button
                type="button"
                data-testid="csv-open-mapper-button-empty"
                onClick={() => setIsMapperClosed(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
              >
                Open Mapper
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Subtab Panel 2: History (Batch Ingestion History & Audit Roster) */}
      <div
        id="csv-panel-history"
        role="tabpanel"
        aria-labelledby="csv-subtab-history"
        className={activeSubtab === 'history' ? 'block' : 'hidden'}
      >
        {/* Quadrant 3: Batch Ingestion History & Audit Roster */}
        <section
          data-testid="csv-quadrant-3-roster"
          className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-[20px]">history</span>
                Batch Ingestion History &amp; Audit Roster
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Historical ledger of staged and completed batch ingress jobs. Re-stage any previous manifest to inspect schema alignments.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {batchHistory.length} batches recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Pipeline Target</th>
                  <th className="py-2.5 px-3">Records Ingested</th>
                  <th className="py-2.5 px-3">Ingestion Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batchHistory.map((batch) => {
                  const isSelected = activeBatchId === batch.id;
                  return (
                    <tr
                      key={batch.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="truncate max-w-[240px]">{batch.fileName}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            batch.target === 'inventory'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60'
                              : batch.target === 'sales'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                          }`}
                        >
                          {targetLabels[batch.target]}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {batch.recordCount.toLocaleString()} records
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {batch.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono">
                        {batch.timestamp}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          data-testid={`restage-batch-${batch.id}`}
                          onClick={() => handleRestageBatch(batch)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#0f4cc9] text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isSelected ? 'Active Batch' : 'Re-stage'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};


export default CsvExcelIntegrationView;
