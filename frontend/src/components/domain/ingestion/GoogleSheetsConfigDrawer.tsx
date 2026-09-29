import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Zap, 
  Table, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  setGoogleSheetsConfig,
  fetchGoogleSheetsScriptThunk,
  testGoogleSheetsPingThunk,
  hydrateGoogleSheetsHandshakeThunk,
} from '../../../store/slices/ingestionSlice';
import type { IngestionParsedResult } from '../../../store/slices/ingestionSlice';

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
  const pingStatus = useAppSelector((state) => state.ingestion.googleSheetsPingStatus);
  const pingLatencyMs = useAppSelector((state) => state.ingestion.googleSheetsPingLatencyMs);
  const pingError = useAppSelector((state) => state.ingestion.googleSheetsPingError);
  const handshakeLoading = useAppSelector((state) => state.ingestion.googleSheetsHandshakeLoading);

  const [spreadsheetId, setSpreadsheetId] = useState(googleSheetsConfig?.spreadsheetId || '');
  const [sheetName, setSheetName] = useState(googleSheetsConfig?.sheetName || 'Sheet1');
  const [copied, setCopied] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  // Sync state if config in redux changes
  useEffect(() => {
    if (googleSheetsConfig?.spreadsheetId) {
      setSpreadsheetId(googleSheetsConfig.spreadsheetId);
    }
    if (googleSheetsConfig?.sheetName) {
      setSheetName(googleSheetsConfig.sheetName);
    }
  }, [googleSheetsConfig]);

  // Load script when drawer opens if supplierId is available and script is missing
  useEffect(() => {
    if (isOpen && supplierId && !scriptContent) {
      dispatch(fetchGoogleSheetsScriptThunk(supplierId));
    }
  }, [isOpen, supplierId, scriptContent, dispatch]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    const key = googleSheetsConfig?.ingressKey || 'spoileralert_sec_live_key_999';
    await dispatch(
      testGoogleSheetsPingThunk({
        ingressKey: key,
        spreadsheetId,
        sheetName,
      })
    );
  };

  const handleFetchSampleRows = async () => {
    if (!supplierId) {
      setLocalFeedback('Supplier context missing.');
      return;
    }

    dispatch(
      setGoogleSheetsConfig({
        spreadsheetId,
        sheetName,
      })
    );

    const res = await dispatch(
      hydrateGoogleSheetsHandshakeThunk({
        supplierId,
        spreadsheetId: spreadsheetId || 'spreadsheet',
        sheetName: sheetName || 'Sheet1',
      })
    );

    if (hydrateGoogleSheetsHandshakeThunk.fulfilled.match(res)) {
      if (onMappingHandoff) {
        onMappingHandoff(res.payload as IngestionParsedResult);
      }
      onClose();
    }
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
          <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="google-sheets-drawer-title"
                  className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight"
                >
                  Google Sheets Integration &amp; Sync
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure live bidirectional spreadsheet synchronization for{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {supplierName || 'Verified Supplier'}
                  </span>
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
            {/* 1. Account & OAuth Delegation Status */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Google Workspace Identity
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    googleSheetsConfig?.oauthConnected
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      googleSheetsConfig?.oauthConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {googleSheetsConfig?.oauthConnected ? 'OAuth Active' : 'OAuth Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Connected: {googleSheetsConfig?.connectedEmail || (googleSheetsConfig?.oauthConnected ? 'Connected Google Account' : 'Not Connected')}
                  </span>
                </div>
                <a
                  href="/api/oauth/start"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold inline-flex items-center gap-1"
                >
                  Manage Account <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* 2. Spreadsheet Targeting Inputs */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Target Spreadsheet Coordinates
              </h3>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="sheets-id-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Spreadsheet ID or URL
                  </label>
                  <input
                    id="sheets-id-input"
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sheet-tab-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Worksheet Tab Name
                  </label>
                  <input
                    id="sheet-tab-input"
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="Sheet1"
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 3. Personalized Google Apps Script Snippet Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Google Apps Script Trigger
                </h3>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>

              {/* Step-by-step setup instructions */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl space-y-1.5 text-xs text-blue-900 dark:text-blue-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>30-Second Setup Instructions:</span>
                </div>
                <ol className="list-decimal list-inside pl-1 space-y-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    Open your Google Sheet and navigate to <strong>Extensions &gt; Apps Script</strong>.
                  </li>
                  <li>Clear any default code in the editor and paste this personalized snippet.</li>
                  <li>Click the <strong>Save</strong> disk icon, then reload your spreadsheet.</li>
                  <li>
                    Use the newly appeared <strong>SpoilerAlert OS ⚡ &gt; Sync Now</strong> menu to test.
                  </li>
                </ol>
              </div>

              {/* Script code viewer box */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                <pre className="p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed selection:bg-emerald-800">
                  {scriptLoading ? (
                    <span className="text-slate-400 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating supplier script...
                    </span>
                  ) : (
                    scriptContent ||
                    `// SpoilerAlert OS Google Sheets Sync Trigger\nconst INGRESS_KEY = "${
                      googleSheetsConfig?.ingressKey || 'spoileralert_sec_live_key_999'
                    }";\nfunction onEdit(e) {\n  // Debounced auto-sync trigger\n}`
                  )}
                </pre>
              </div>
            </div>

            {/* 4. Interactive Test Connection Ping */}
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
          </div>

          {/* Drawer Footer / Primary Action Handshake */}
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
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsConfigDrawer;
