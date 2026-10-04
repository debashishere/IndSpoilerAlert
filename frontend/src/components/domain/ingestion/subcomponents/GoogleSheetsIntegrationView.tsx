import React, { useEffect, useState } from 'react';
import { 
  RefreshCw, 
  Activity, 
  Clock, 
  Layers, 
  Zap, 
  Wifi, 
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  Key,
  Globe,
  ChevronDown,
  ChevronUp,
  Table,
  Trash2,
  Play,
  FileSpreadsheet,
  Edit2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchGoogleSheetsScriptThunk,
  fetchGoogleSheetsRosterThunk,
  testGoogleSheetsPingThunk,
  syncGoogleSheetsNowThunk,
  disconnectGoogleSheetThunk,
  hydrateGoogleSheetsHandshakeThunk,
  saveGoogleSheetsMappingThunk,
  setInventoryParsedResult,
} from '../../../../store/slices/ingestionSlice';
import { GridMapperTable } from '../GridMapperTable';
import type { ConnectedSheetInfo } from '../../../../services/googleSheetsSyncService';

export interface GoogleSheetsIntegrationViewProps {
  supplierId?: string;
  supplierName?: string;
}

export const GoogleSheetsIntegrationView: React.FC<GoogleSheetsIntegrationViewProps> = ({
  supplierId,
  supplierName,
}) => {
  const dispatch = useAppDispatch();

  const googleSheetsConfig = useAppSelector((state) => state.ingestion.googleSheetsConfig);
  const scriptContent = useAppSelector((state) => state.ingestion.googleSheetsScript);
  const connectedSheets = useAppSelector((state) => state.ingestion.connectedSheets);
  const pingStatus = useAppSelector((state) => state.ingestion.googleSheetsPingStatus);
  const pingLatencyMs = useAppSelector((state) => state.ingestion.googleSheetsPingLatencyMs);
  const syncState = useAppSelector((state) => state.ingestion.googleSheetsSync);
  const inventoryParsedResult = useAppSelector((state) => state.ingestion.inventoryParsedResult);
  const inventoryMappings = useAppSelector((state) => state.ingestion.inventoryMappings);

  const [isScriptExpanded, setIsScriptExpanded] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [sheetToDisconnect, setSheetToDisconnect] = useState<ConnectedSheetInfo | null>(null);
  const [activeSyncingSheetId, setActiveSyncingSheetId] = useState<string | null>(null);
  const [activeMappingSheet, setActiveMappingSheet] = useState<ConnectedSheetInfo | null>(null);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingSaving, setMappingSaving] = useState(false);
  const [mappingSaveSuccess, setMappingSaveSuccess] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  // Clean up staged parsed results upon unmount to ensure mapping windows don't linger
  useEffect(() => {
    return () => {
      dispatch(setInventoryParsedResult(null));
    };
  }, [dispatch]);

  const ingressKey = googleSheetsConfig?.ingressKey || 'spoileralert_sec_live_key_999';
  const webhookUrl =
    googleSheetsConfig?.webhookUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/api/v1/ingestion/google-sheets/webhook`
      : 'http://localhost:5000/api/v1/ingestion/google-sheets/webhook');

  // Hydrate script and multi-sheet roster on mount or when supplierId changes
  useEffect(() => {
    if (supplierId) {
      if (!scriptContent) {
        dispatch(fetchGoogleSheetsScriptThunk(supplierId));
      }
      dispatch(fetchGoogleSheetsRosterThunk(supplierId));
    }
  }, [supplierId, scriptContent, dispatch]);

  const handleTestPing = () => {
    const targetSpreadsheetId = connectedSheets?.[0]?.spreadsheetId || googleSheetsConfig?.spreadsheetId;
    const targetSheetName = connectedSheets?.[0]?.sheetName || googleSheetsConfig?.sheetName;
    dispatch(
      testGoogleSheetsPingThunk({
        ingressKey,
        spreadsheetId: targetSpreadsheetId,
        sheetName: targetSheetName,
      })
    );
  };

  const handleGlobalSyncNow = async () => {
    await dispatch(
      syncGoogleSheetsNowThunk({
        supplierId,
        ingressKey,
      })
    );
    if (supplierId) {
      dispatch(fetchGoogleSheetsRosterThunk(supplierId));
    }
  };

  const safeConnectedSheets = connectedSheets || [];

  // Derive aggregated metrics
  const totalSyncedLots = safeConnectedSheets.reduce(
    (acc, sheet) => acc + (sheet.lotCount || 0),
    0
  );

  const latestSyncTimestamp = safeConnectedSheets.reduce((latest, sheet) => {
    if (!sheet.lastSyncedAt) return latest;
    if (!latest) return sheet.lastSyncedAt;
    return new Date(sheet.lastSyncedAt) > new Date(latest) ? sheet.lastSyncedAt : latest;
  }, syncState?.lastSyncedAt || null);

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

  const handleCopyKey = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(ingressKey);
      }
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyScript = async () => {
    const textToCopy =
      scriptContent ||
      `// SpoilerAlert OS Google Sheets Sync Script\n// Supplier ID: ${supplierId || ''}\nfunction onEdit(e) {\n  // Auto Sync Handler\n}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
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

  const handleOpenSheetMapping = async (sheet: ConnectedSheetInfo) => {
    if (!supplierId) {
      setLocalFeedback('Supplier context missing.');
      return;
    }
    setActiveMappingSheet(sheet);
    setMappingLoading(true);
    setLocalFeedback(null);
    try {
      await dispatch(
        hydrateGoogleSheetsHandshakeThunk({
          supplierId,
          spreadsheetId: sheet.spreadsheetId,
          sheetName: sheet.sheetName || 'Sheet1',
        })
      ).unwrap();
    } catch (err: any) {
      setLocalFeedback(err.message || 'Failed to load sample rows for mapping.');
    } finally {
      setMappingLoading(false);
    }
  };

  const handleSaveSheetMapping = async () => {
    if (!activeMappingSheet || !supplierId) return;
    setMappingSaving(true);
    setMappingSaveSuccess(false);
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
          columnMappings: inventoryMappings,
        })
      ).unwrap();

      setMappingSaveSuccess(true);
      setTimeout(() => setMappingSaveSuccess(false), 3000);
      dispatch(fetchGoogleSheetsRosterThunk(supplierId));
    } catch (err: any) {
      setLocalFeedback(err.message || 'Failed to save sheet column mapping.');
    } finally {
      setMappingSaving(false);
    }
  };

  const isSyncing = Boolean(syncState?.isSyncing);
  const isTestingPing = pingStatus === 'testing';

  return (
    <div className="space-y-6 w-full" id="google-sheets-integration-suite">
      {/* Quadrant 1: Header & Health Telemetry */}
      <section
        data-testid="gsheet-quadrant-1-telemetry"
        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Google Sheets Ingestion Suite
              </h2>
              {/* Connection Status Pill */}
              {isSyncing ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Syncing
                </span>
              ) : pingStatus === 'connected' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Trigger
                </span>
              ) : pingStatus === 'error' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                  <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  Trigger Error
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Clock className="w-3 h-3" />
                  Idle
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time inbound synchronization and dynamic spreadsheet roster for {supplierName || 'current supplier'}.
            </p>
          </div>

          {/* Action triggers */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTestPing}
              disabled={isTestingPing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              <Wifi className={`w-3.5 h-3.5 ${isTestingPing ? 'animate-pulse text-indigo-500' : ''}`} />
              {isTestingPing ? 'Testing...' : 'Test Ping'}
            </button>
            <button
              type="button"
              onClick={handleGlobalSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-500" />
              Round-Trip Ping Latency
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {pingLatencyMs !== null && pingLatencyMs !== undefined ? `${pingLatencyMs} ms` : '—'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              Last Successful Sync
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {formatRelativeTime(latestSyncTimestamp)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-500" />
              Synchronized Lots
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {totalSyncedLots}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-amber-500" />
              Active Sheets Registered
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {safeConnectedSheets.length}
            </div>
          </div>
        </div>
      </section>

      {/* Quadrant 2: Credentials & Setup Guide */}
      <section
        data-testid="gsheet-quadrant-2-credentials"
        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              Ingress Credentials &amp; Apps Script Setup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Authorize incoming Google Sheets webhooks using your supplier cryptographic ingress key.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Webhook Endpoint URL */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                Ingress Webhook URL
              </span>
            </div>
            <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
              {webhookUrl}
            </div>
          </div>

          {/* Supplier X-Ingress-Key */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Master Ingress Key (X-Ingress-Key)
              </span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {copiedKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copiedKey ? 'Copied' : 'Copy Key'}
              </button>
            </div>
            <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
              {ingressKey}
            </div>
          </div>
        </div>

        {/* Expandable Google Apps Script Code Block */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setIsScriptExpanded(!isScriptExpanded)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <Code2 className="w-4 h-4 text-indigo-500" />
              <span>{isScriptExpanded ? 'Hide Google Apps Script' : 'View Google Apps Script'}</span>
              {isScriptExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyScript}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedScript ? 'Copied!' : 'Copy Script'}
            </button>
          </div>

          {isScriptExpanded && (
            <div className="p-3 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-72 border-t border-slate-800">
              <pre className="whitespace-pre">{scriptContent || '// Loading Google Apps Script template...'}</pre>
            </div>
          )}
        </div>
      </section>

      {/* Quadrant 3: Connected Sheets Roster */}
      <section
        data-testid="gsheet-quadrant-3-roster"
        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-500" />
                Connected Sheets Roster
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {safeConnectedSheets.length} {safeConnectedSheets.length === 1 ? 'Sheet' : 'Sheets'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live spreadsheet tabs dynamically discovered through webhook ingestion.
            </p>
          </div>
        </div>

        {localFeedback && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{localFeedback}</span>
          </div>
        )}

        {safeConnectedSheets.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No Connected Spreadsheets Yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Add the Apps Script code above to your Google Spreadsheet and run it once to register and stream inventory batches directly into this roster.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3">Spreadsheet Title &amp; ID</th>
                  <th scope="col" className="px-4 py-3">Worksheet Tab</th>
                  <th scope="col" className="px-4 py-3">Synchronized Lots</th>
                  <th scope="col" className="px-4 py-3">Last Synced</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
                {safeConnectedSheets.map((sheet) => {
                  const isThisSyncing = activeSyncingSheetId === sheet.spreadsheetId;
                  return (
                    <tr
                      key={`${sheet.spreadsheetId}-${sheet.sheetName}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {sheet.spreadsheetTitle || 'Google Spreadsheet'}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                          {sheet.spreadsheetId}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {sheet.sheetName || 'Sheet1'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        {sheet.lotCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(sheet.lastSyncedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {isThisSyncing ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            Syncing
                          </span>
                        ) : sheet.syncStatus === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : sheet.syncStatus === 'error' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Error
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Idle
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenSheetMapping(sheet)}
                            aria-label="Edit Mapping"
                            title="Edit Column Mapping"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit Mapping</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSyncSheetNow(sheet)}
                            disabled={isThisSyncing}
                            aria-label="Sync Sheet"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                          >
                            <Play className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Sync</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSheetToDisconnect(sheet)}
                            aria-label="Disconnect"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="sr-only">Disconnect</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quadrant 4: In-Situ Schema Field Mapper */}
      <section
        data-testid="gsheet-quadrant-4-mapper"
        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Table className="w-4 h-4 text-blue-500" />
                In-Situ Schema Field Mapper
              </h3>
              {activeMappingSheet && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {activeMappingSheet.sheetName || 'Sheet1'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeMappingSheet ? (
                <span>
                  Active mapping configuration for{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {activeMappingSheet.spreadsheetTitle || activeMappingSheet.spreadsheetId}
                  </strong>{' '}
                  (tab:{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {activeMappingSheet.sheetName || 'Sheet1'}
                  </strong>
                  ).
                </span>
              ) : (
                'Select a spreadsheet tab from the Connected Sheets Roster above to inspect and configure column bindings.'
              )}
            </p>
          </div>

          {activeMappingSheet && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveMappingSheet(null);
                  dispatch(setInventoryParsedResult(null));
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close Mapper
              </button>
            </div>
          )}
        </div>

        {mappingLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading headers and sample rows for this sheet...</p>
          </div>
        ) : activeMappingSheet && inventoryParsedResult ? (
          <div className="space-y-4">
            <GridMapperTable
              pipelineType="inventory"
              mode="template"
              title={`${activeMappingSheet.spreadsheetTitle || activeMappingSheet.spreadsheetId} Mapping`}
              subtitle={`Worksheet tab: ${activeMappingSheet.sheetName || 'Sheet1'}. Adjust canonical field alignments below. Saving stores this mapping to this spreadsheet's bound template.`}
              saveButtonText="Save Sheet Mapping"
              onSave={handleSaveSheetMapping}
              isSaving={mappingSaving}
              saveSuccess={mappingSaveSuccess}
              onClose={() => {
                setActiveMappingSheet(null);
                dispatch(setInventoryParsedResult(null));
              }}
            />
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Select a Connected Sheet to Configure Mapping
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Click &quot;Edit Mapping&quot; on any connected sheet in the roster above to preview auto-discovered columns, assign canonical database targets, and persist schema bindings directly.
            </p>
          </div>
        )}
      </section>

      {/* Disconnect Confirmation Modal */}
      {sheetToDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Disconnect Spreadsheet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Are you sure you want to disconnect{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {sheetToDisconnect.spreadsheetTitle || sheetToDisconnect.spreadsheetId} (
                {sheetToDisconnect.sheetName})
              </span>
              ? Inbound automatic synchronization for this sheet will be ceased.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setSheetToDisconnect(null)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition"
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

export default GoogleSheetsIntegrationView;
