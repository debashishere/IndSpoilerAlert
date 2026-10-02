import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  Zap, 
  Table, 
  AlertCircle,
  Layers,
  Info,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Play,
  Edit2,
  ArrowLeft,
  ChevronRight,
  Save,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchGoogleSheetsScriptThunk,
  fetchGoogleSheetsRosterThunk,
  testGoogleSheetsPingThunk,
  hydrateGoogleSheetsHandshakeThunk,
  syncGoogleSheetsNowThunk,
  disconnectGoogleSheetThunk,
  saveGoogleSheetsMappingThunk,
  updateInventoryMapping,
} from '../../../store/slices/ingestionSlice';
import { INGESTION_CONSTANTS } from './constants/ingestionConstants';
import type { IngestionParsedResult } from '../../../store/slices/ingestionSlice';
import type { ConnectedSheetInfo } from '../../../services/googleSheetsSyncService';

export interface GoogleSheetsConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId?: string;
  supplierName?: string;
  onMappingHandoff?: (sampleResult: IngestionParsedResult) => void;
}

export const GoogleSheetsConfigDrawer: React.FC<GoogleSheetsConfigDrawerProps> = ({
  isOpen,
  onClose,
  supplierId,
  supplierName,
  onMappingHandoff,
}) => {
  const dispatch = useAppDispatch();

  const googleSheetsConfig = useAppSelector((state) => state.ingestion.googleSheetsConfig);
  const scriptContent = useAppSelector((state) => state.ingestion.googleSheetsScript);
  const scriptLoading = useAppSelector((state) => state.ingestion.googleSheetsScriptLoading);
  const connectedSheets = useAppSelector((state) => state.ingestion.connectedSheets);
  const pingStatus = useAppSelector((state) => state.ingestion.googleSheetsPingStatus);
  const pingLatencyMs = useAppSelector((state) => state.ingestion.googleSheetsPingLatencyMs);
  const pingError = useAppSelector((state) => state.ingestion.googleSheetsPingError);
  const handshakeLoading = useAppSelector((state) => state.ingestion.googleSheetsHandshakeLoading);

  const connectedSheetsLoading = useAppSelector((state) => state.ingestion.connectedSheetsLoading);
  const connectedSheetsError = useAppSelector((state) => state.ingestion.connectedSheetsError);
  const syncState = useAppSelector((state) => state.ingestion.googleSheetsSync);

  const [copied, setCopied] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);
  const [sheetToDisconnect, setSheetToDisconnect] = useState<ConnectedSheetInfo | null>(null);
  const [activeSyncingSheetId, setActiveSyncingSheetId] = useState<string | null>(null);
  const [activeMappingSheet, setActiveMappingSheet] = useState<ConnectedSheetInfo | null>(null);
  const [mappingSampleResult, setMappingSampleResult] = useState<IngestionParsedResult | null>(null);
  const [currentSheetMappings, setCurrentSheetMappings] = useState<Record<string, string>>({});
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingSaving, setMappingSaving] = useState(false);

  const ingressKey = googleSheetsConfig?.ingressKey || 'spoileralert_sec_live_key_999';
  const webhookUrl =
    googleSheetsConfig?.webhookUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/api/v1/ingestion/google-sheets/webhook`
      : 'http://localhost:5000/api/v1/ingestion/google-sheets/webhook');

  // Load script template and multi-sheet roster when drawer opens
  useEffect(() => {
    if (isOpen && supplierId) {
      if (!scriptContent) {
        dispatch(fetchGoogleSheetsScriptThunk(supplierId));
      }
      dispatch(fetchGoogleSheetsRosterThunk(supplierId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, supplierId, dispatch]);

  // Reset mapping workbench when drawer closes or reopens
  useEffect(() => {
    if (!isOpen) {
      setActiveMappingSheet(null);
      setMappingSampleResult(null);
      setCurrentSheetMappings({});
      setLocalFeedback(null);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeMappingSheet) {
          setActiveMappingSheet(null);
          setMappingSampleResult(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, activeMappingSheet]);

  if (!isOpen) return null;

  const handleOpenSheetMapping = async (sheet: ConnectedSheetInfo) => {
    if (!supplierId) {
      setLocalFeedback('Supplier context missing.');
      return;
    }

    setActiveMappingSheet(sheet);
    setMappingLoading(true);
    setLocalFeedback(null);

    try {
      const res = await dispatch(
        hydrateGoogleSheetsHandshakeThunk({
          supplierId,
          spreadsheetId: sheet.spreadsheetId,
          sheetName: sheet.sheetName || 'Sheet1',
        })
      ).unwrap();

      const parsed = res as IngestionParsedResult;
      setMappingSampleResult(parsed);
      setCurrentSheetMappings(parsed.suggestedMapping || {});
    } catch (err: any) {
      setLocalFeedback(err.message || 'Failed to load sample rows for mapping.');
    } finally {
      setMappingLoading(false);
    }
  };

  const handleSaveSheetMapping = async () => {
    if (!activeMappingSheet || !supplierId) return;
    setMappingSaving(true);
    setLocalFeedback(null);

    const sheetTitle = activeMappingSheet.spreadsheetTitle || activeMappingSheet.spreadsheetId;
    const templateName = `${sheetTitle} - ${activeMappingSheet.sheetName || 'Sheet1'} Mapping`;

    try {
      await dispatch(
        saveGoogleSheetsMappingThunk({
          supplierId,
          spreadsheetId: activeMappingSheet.spreadsheetId,
          sheetName: activeMappingSheet.sheetName,
          templateName,
          columnMappings: currentSheetMappings,
        })
      ).unwrap();

      setLocalFeedback('Column mapping saved successfully.');
      setActiveMappingSheet(null);
      setMappingSampleResult(null);
      // Refresh roster to reflect any template bindings
      dispatch(fetchGoogleSheetsRosterThunk(supplierId));
    } catch (err: any) {
      setLocalFeedback(err.message || 'Failed to save sheet column mapping.');
    } finally {
      setMappingSaving(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyScript = async () => {
    const textToCopy =
      scriptContent ||
      `// SpoilerAlert OS Google Sheets Sync Script\n// Supplier ID: ${supplierId || ''}\nfunction onEdit(e) {\n  // Auto Sync Handler\n}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTestPing = async () => {
    const targetSpreadsheetId = connectedSheets?.[0]?.spreadsheetId || googleSheetsConfig?.spreadsheetId;
    const targetSheetName = connectedSheets?.[0]?.sheetName || googleSheetsConfig?.sheetName;
    await dispatch(
      testGoogleSheetsPingThunk({
        ingressKey,
        spreadsheetId: targetSpreadsheetId,
        sheetName: targetSheetName,
      })
    );
  };

  const handleSyncSheetNow = async (sheet: ConnectedSheetInfo) => {
    setActiveSyncingSheetId(sheet.spreadsheetId);
    setLocalFeedback(null);
    try {
      await dispatch(
        syncGoogleSheetsNowThunk({
          supplierId,
          ingressKey,
        })
      ).unwrap();
      // Refresh roster to get updated timestamps and lot counts
      if (supplierId) {
        dispatch(fetchGoogleSheetsRosterThunk(supplierId));
      }
    } catch (err: any) {
      setLocalFeedback(err.message || 'On-demand sync failed');
    } finally {
      setActiveSyncingSheetId(null);
    }
  };

  const handleConfirmDisconnect = async () => {
    if (!sheetToDisconnect) return;
    try {
      await dispatch(
        disconnectGoogleSheetThunk({
          supplierId,
          ingressKey,
          spreadsheetId: sheetToDisconnect.spreadsheetId,
          sheetName: sheetToDisconnect.sheetName,
        })
      ).unwrap();
      setSheetToDisconnect(null);
    } catch (err: any) {
      setLocalFeedback(err.message || 'Failed to disconnect spreadsheet');
    }
  };

  const handleFetchSampleRows = async () => {
    if (!supplierId) {
      setLocalFeedback('Supplier context missing.');
      return;
    }

    const targetSpreadsheetId =
      connectedSheets?.[0]?.spreadsheetId || googleSheetsConfig?.spreadsheetId || 'spreadsheet';
    const targetSheetName =
      connectedSheets?.[0]?.sheetName || googleSheetsConfig?.sheetName || 'Sheet1';

    const res = await dispatch(
      hydrateGoogleSheetsHandshakeThunk({
        supplierId,
        spreadsheetId: targetSpreadsheetId,
        sheetName: targetSheetName,
      })
    );

    if (hydrateGoogleSheetsHandshakeThunk.fulfilled.match(res)) {
      if (onMappingHandoff) {
        onMappingHandoff(res.payload as IngestionParsedResult);
      }
      onClose();
    }
  };

  const formatRelativeTime = (timestamp?: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDays}d ago`;
  };

  const isConnected = pingStatus === 'connected';
  const hasError = pingStatus === 'error';
  const isTesting = pingStatus === 'testing';

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden font-sans"
      aria-labelledby="google-sheets-drawer-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        data-testid="drawer-backdrop"
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 transition-transform duration-200">
          {/* Drawer Header */}
          {/* Drawer Header with Breadcrumb Navigation */}
          <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Table className="w-5 h-5" />
              </div>
              <div>
                {activeMappingSheet ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMappingSheet(null);
                        setMappingSampleResult(null);
                      }}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium cursor-pointer"
                    >
                      Connected Sheets Roster
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {activeMappingSheet.spreadsheetTitle || activeMappingSheet.spreadsheetId} Mapping
                    </span>
                  </div>
                ) : (
                  <h2
                    id="google-sheets-drawer-title"
                    className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight"
                  >
                    Google Sheets Integration &amp; Sync
                  </h2>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeMappingSheet ? (
                    <span>
                      Mapping worksheet tab: <strong className="text-slate-700 dark:text-slate-300 font-mono">{activeMappingSheet.sheetName || 'Sheet1'}</strong>
                    </span>
                  ) : (
                    <>
                      Configure live bidirectional spreadsheet synchronization for{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {supplierName || 'Verified Supplier'}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {activeMappingSheet ? (
              /* In-Situ Mapping Workbench */
              <div className="space-y-5">
                {/* Workbench Top Action Bar */}
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMappingSheet(null);
                      setMappingSampleResult(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    aria-label="Back to Roster"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Roster</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSheetMapping}
                    disabled={mappingSaving || mappingLoading}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    aria-label="Save Sheet Mapping"
                  >
                    {mappingSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Mapping...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Sheet Mapping</span>
                      </>
                    )}
                  </button>
                </div>

                {mappingLoading ? (
                  <div className="p-12 text-center space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                    <p className="text-xs text-slate-500">Loading headers and sample rows for this sheet...</p>
                  </div>
                ) : mappingSampleResult ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Auto-Discovered Spreadsheet Headers</span>
                      </div>
                      <p className="text-[11px] text-blue-800 dark:text-blue-300/90 leading-relaxed">
                        Adjust canonical field alignments below. Saving stores this mapping to this spreadsheet's bound template, ensuring subsequent webhooks parse correctly.
                      </p>
                    </div>

                    {/* Preview Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs max-h-96">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                          <tr>
                            {(mappingSampleResult.rawGrid?.[0] || []).map((header: string, colIdx: number) => {
                              const mappedField = Object.entries(currentSheetMappings).find(([, h]) => h === header)?.[0] || '';
                              return (
                                <th key={colIdx} className={`p-3 border-r border-slate-200 dark:border-slate-800 min-w-[150px] ${mappedField ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''}`}>
                                  <div className="flex flex-col gap-1.5">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate" title={header}>{header}</span>
                                    <select
                                      className="text-[11px] p-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
                                      value={mappedField}
                                      onChange={(e) => {
                                        const newDbField = e.target.value;
                                        setCurrentSheetMappings((prev) => {
                                          const next = { ...prev };
                                          // remove old mapping pointing to this header
                                          Object.keys(next).forEach((key) => {
                                            if (next[key] === header) delete next[key];
                                          });
                                          if (newDbField) {
                                            next[newDbField] = header;
                                          }
                                          return next;
                                        });
                                      }}
                                    >
                                      <option value="">Unmapped</option>
                                      {INGESTION_CONSTANTS.INVENTORY_MAPPING_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                    {mappedField && (
                                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-medium inline-block w-fit">
                                        {INGESTION_CONSTANTS.INVENTORY_MAPPING_OPTIONS.find((o) => o.value === mappedField)?.label || mappedField}
                                      </span>
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {(mappingSampleResult.rawGrid?.slice(1) || []).map((row: string[], rowIdx: number) => (
                            <tr key={rowIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                              {row.map((cell: string, cellIdx: number) => {
                                const header = mappingSampleResult.rawGrid?.[0]?.[cellIdx];
                                const mappedField = header ? Object.entries(currentSheetMappings).find(([, h]) => h === header)?.[0] : '';
                                return (
                                  <td key={cellIdx} className={`p-2.5 border-r border-slate-100 dark:border-slate-800 font-mono text-[11px] ${mappedField ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''}`}>
                                    {cell || <span className="text-slate-400 italic">empty</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
            {/* 1. Master Apps Script Setup Hero */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 text-white shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Multi-Sheet Ingress Engine
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Master Apps Script Setup Guide
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Paste this single master script into any supplier Google Sheet to register and stream inventory directly into SpoilerAlert OS.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>

              {/* Ingress Credentials Hero Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">
                    Master Ingress Key
                  </div>
                  <div className="font-mono text-xs text-emerald-400 font-bold truncate select-all">
                    {ingressKey}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">
                    Webhook Endpoint URL
                  </div>
                  <div className="font-mono text-xs text-slate-300 truncate select-all">
                    {webhookUrl}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 3-Step Setup Instructions Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Quick 3-Step Setup</span>
              </div>
              <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Open Google Sheet &gt; <strong>Extensions &gt; Apps Script</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    <strong>Paste &amp; Save (💾)</strong> the copied Master Apps Script into the editor.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Reload your spreadsheet and click <strong>SpoilerAlert OS ⚡ &gt; Sync to Platform Now</strong>.
                  </span>
                </li>
              </ol>
            </div>

            {/* 3. Connected Sheets Roster Table / Empty State */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-600" />
                    <span>Connected Sheets Roster</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Actively synced spreadsheets streaming inventory for this supplier.
                  </p>
                </div>
                {connectedSheetsLoading && (
                  <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                )}
              </div>

              {/* Roster Error Banner */}
              {connectedSheetsError && (
                <div className="p-3 rounded-lg bg-[#fef2f2] dark:bg-red-950/40 border border-[#b91c1c]/20 dark:border-red-800 flex items-center gap-2 text-xs text-[#b91c1c] dark:text-red-300 font-medium">
                  <AlertCircle className="w-4 h-4 text-[#b91c1c] dark:text-red-400 shrink-0" />
                  <span>{connectedSheetsError}</span>
                </div>
              )}

              {/* Sync Health & Error Feedback Banner */}
              {syncState?.error && (
                <div className="p-3 rounded-lg bg-[#fef2f2] dark:bg-red-950/40 border border-[#b91c1c]/20 dark:border-red-800 flex items-center gap-2 text-xs text-[#b91c1c] dark:text-red-300 font-medium">
                  <AlertCircle className="w-4 h-4 text-[#b91c1c] dark:text-red-400 shrink-0" />
                  <span>{syncState.error}</span>
                </div>
              )}

              {/* Empty State */}
              {(!connectedSheets || connectedSheets.length === 0) ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    No spreadsheets connected yet
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Follow the 3-step setup guide above to link your first Google Sheet. As soon as you trigger a sync from Apps Script, it will appear here automatically.
                  </p>
                </div>
              ) : (
                /* Roster Table */
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-3.5 py-2.5">Spreadsheet</th>
                          <th className="px-3 py-2.5">Tab</th>
                          <th className="px-3 py-2.5">Lots</th>
                          <th className="px-3 py-2.5">Last Synced</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3.5 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {connectedSheets.map((sheet) => {
                          const isSyncing =
                            activeSyncingSheetId === sheet.spreadsheetId ||
                            sheet.syncStatus === 'syncing';
                          const isError =
                            sheet.syncStatus === 'error' ||
                            (sheet.lastSyncMetrics?.errors &&
                              sheet.lastSyncMetrics.errors.length > 0);

                          return (
                            <tr
                              key={`${sheet.spreadsheetId}-${sheet.sheetName || 'default'}`}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="px-3.5 py-3">
                                <div className="font-medium text-slate-900 dark:text-slate-100 max-w-[140px] truncate" title={sheet.spreadsheetTitle || sheet.spreadsheetId}>
                                  {sheet.spreadsheetTitle || sheet.spreadsheetId}
                                </div>
                                <div className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title={sheet.spreadsheetId}>
                                  {sheet.spreadsheetId}
                                </div>
                              </td>

                              <td className="px-3 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {sheet.sheetName || 'Sheet1'}
                                </span>
                              </td>

                              <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {sheet.lotCount ?? 0} lots
                              </td>

                              <td className="px-3 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                <div className="flex items-center gap-1 text-[11px]">
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{formatRelativeTime(sheet.lastSyncedAt)}</span>
                                </div>
                              </td>

                              <td className="px-3 py-3 whitespace-nowrap">
                                {isSyncing ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                    <span>Syncing</span>
                                  </span>
                                ) : isError ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    <span>Error</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Live</span>
                                  </span>
                                )}
                              </td>

                              <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSheetMapping(sheet)}
                                    className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                    title="Edit Column Mapping"
                                    aria-label="Edit Column Mapping"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSyncSheetNow(sheet)}
                                    disabled={isSyncing}
                                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                                    title="Sync Sheet Now"
                                    aria-label="Sync Sheet Now"
                                  >
                                    <Play className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSheetToDisconnect(sheet)}
                                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                                    title="Disconnect Sheet"
                                    aria-label="Disconnect Sheet"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Local Development Tunnel Notice Callout */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-800 dark:text-amber-300">
                  Local Development Tunnel Notice
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                  Google Apps Script executes on Google Cloud infrastructure and cannot reach <code>localhost</code> directly. When testing locally, start a public tunnel using <strong>ngrok</strong> (e.g. <code>ngrok http 5000</code>) or an authorized tunnel proxy to route webhooks back to your local development environment.
                </p>
              </div>
            </div>

            {/* 5. Script Code Viewer Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Master Script Preview
                </h4>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                <pre className="p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed selection:bg-emerald-800">
                  {scriptLoading ? (
                    <span className="text-slate-400 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating supplier master script...
                    </span>
                  ) : (
                    scriptContent ||
                    `// SpoilerAlert OS Master Multi-Sheet Apps Script\nconst INGRESS_KEY = "${ingressKey}";\nfunction onEdit(e) {\n  // Multi-sheet auto-sync\n}`
                  )}
                </pre>
              </div>
            </div>

            {/* 6. Interactive Test Connection Ping */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Connectivity Verification
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Dispatch an instant test handshake to verify webhook routes and API keys.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Pinging...' : 'Test Connection Ping'}</span>
                </button>
              </div>

              {/* Status and Telemetry feedback */}
              {isConnected && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-semibold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Connected: Google Sheets webhook ready</span>
                  </div>
                  {pingLatencyMs !== null && (
                    <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                      {pingLatencyMs}ms latency
                    </span>
                  )}
                </div>
              )}

              {hasError && (
                <div className="p-2.5 rounded-lg bg-[#fef2f2] dark:bg-red-950/40 border border-[#b91c1c]/20 dark:border-red-800 flex items-center gap-2 text-xs text-[#b91c1c] dark:text-red-300 font-medium">
                  <AlertCircle className="w-4 h-4 text-[#b91c1c] dark:text-red-400 shrink-0" />
                  <span>{pingError || 'Connection ping failed. Please verify your credentials.'}</span>
                </div>
              )}
            </div>

            {localFeedback && (
              <div className="p-2 text-xs text-[#b91c1c] dark:text-red-300 font-medium bg-[#fef2f2] dark:bg-red-950/40 border border-[#b91c1c]/20 rounded-lg">
                {localFeedback}
              </div>
            )}
              </>
            )}
          </div>

          {/* Drawer Footer / Primary Action Handshake (hidden during in-situ mapping) */}
          {!activeMappingSheet && (
            <footer className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFetchSampleRows}
                disabled={handshakeLoading}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#0f4cc9] hover:bg-[#1a42a0] text-white shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {handshakeLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Fetching Spreadsheet Sample...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Fetch Sample Rows &amp; Open Column Mapper</span>
                  </>
                )}
              </button>
            </footer>
          )}
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {sheetToDisconnect && (
        <div
          className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Disconnect Spreadsheet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action removes automated sync passes for this sheet.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to disconnect{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {sheetToDisconnect.spreadsheetTitle || sheetToDisconnect.spreadsheetId}
              </strong>{' '}
              {sheetToDisconnect.sheetName ? `(tab: ${sheetToDisconnect.sheetName})` : ''}? Future edits in Google Sheets will no longer sync lots to your inventory.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSheetToDisconnect(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                Confirm Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsConfigDrawer;
