import React, { useEffect, useState } from 'react';
import {
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
  Webhook,
  FileJson,
  Edit2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchZapierRosterThunk,
  testZapierPingThunk,
  disconnectZapierFeedThunk,
  saveZapierMappingThunk,
} from '../../../../store/slices/zapierSyncSlice';
import { setInventoryParsedResult } from '../../../../store/slices/ingestionSlice';
import { GridMapperTable } from '../GridMapperTable';
import type { ConnectedZapInfo } from '../../../../services/zapierSyncService';

export interface ZapierIntegrationViewProps {
  supplierId?: string;
  supplierName?: string;
}

export const ZapierIntegrationView: React.FC<ZapierIntegrationViewProps> = ({
  supplierId,
  supplierName,
}) => {
  const dispatch = useAppDispatch();

  const zapierState = useAppSelector((state) => state.zapierSync);
  const connectedZaps = zapierState?.connectedZaps || [];
  const deliveryLogs = zapierState?.deliveryLogs || [];
  const pingStatus = zapierState?.pingStatus || 'idle';
  const pingLatencyMs = zapierState?.pingLatencyMs ?? null;
  const inventoryParsedResult = useAppSelector((state) => state.ingestion.inventoryParsedResult);
  const inventoryMappings = useAppSelector((state) => state.ingestion.inventoryMappings);

  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [zapToDisconnect, setZapToDisconnect] = useState<ConnectedZapInfo | null>(null);
  const [activeMappingZap, setActiveMappingZap] = useState<ConnectedZapInfo | null>(null);
  const [mappingSaving, setMappingSaving] = useState(false);
  const [mappingSaveSuccess, setMappingSaveSuccess] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);
  const [expandedLogIndices, setExpandedLogIndices] = useState<Set<number>>(new Set());

  const toggleLogExpanded = (idx: number) => {
    setExpandedLogIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleOpenZapMapping = (zap: ConnectedZapInfo) => {
    setActiveMappingZap(zap);
    setLocalFeedback(null);

    // Look for matching sample payload in delivery logs
    const matchingLog =
      deliveryLogs.find(
        (l) => l.samplePayload && (l.samplePayload.zapId === zap.zapId || l.samplePayload.lots)
      ) || deliveryLogs.find((l) => l.samplePayload);

    let rawLots: any[] = [];
    if (matchingLog?.samplePayload) {
      const sp = matchingLog.samplePayload;
      if (Array.isArray(sp.lots)) rawLots = sp.lots;
      else if (Array.isArray(sp)) rawLots = sp;
      else if (typeof sp === 'object' && sp !== null) {
        const candidate = sp.lots || sp.items || sp.data || sp.rows;
        if (Array.isArray(candidate)) rawLots = candidate;
        else rawLots = [sp];
      }
    }

    if (rawLots.length === 0) {
      rawLots = [
        {
          sku: 'ORG-APPL-101',
          description: 'Honeycrisp Apples Grade A',
          category: 'Produce',
          quantity: 120,
          unit: 'cases',
          expirationDate: '2026-11-15',
          warehouseLocation: 'Bay-4-Cooler',
          standardSellPrice: 34.5,
          unitCost: 18.0,
        },
      ];
    }

    const keys = Array.from(new Set(rawLots.flatMap((r) => Object.keys(r))));
    const rows = rawLots.map((r) =>
      keys.map((k) => (r[k] !== undefined && r[k] !== null ? String(r[k]) : ''))
    );
    const rawGrid = [keys, ...rows];

    const suggestedMapping: Record<string, string> = {};
    keys.forEach((k) => {
      const lower = k.toLowerCase();
      if (lower === 'sku' || lower === 'item_code' || lower.includes('sku')) suggestedMapping['sku'] = k;
      else if (lower === 'description' || lower.includes('desc') || lower.includes('title')) suggestedMapping['description'] = k;
      else if (lower === 'quantity' || lower.includes('qty') || lower.includes('quantity') || lower.includes('cases')) suggestedMapping['quantity'] = k;
      else if (lower === 'price' || lower.includes('price') || lower.includes('sell')) suggestedMapping['standardSellPrice'] = k;
      else if (lower === 'expirationdate' || lower.includes('exp') || lower.includes('date')) suggestedMapping['expirationDate'] = k;
      else if (lower.includes('cost')) suggestedMapping['costPerCase'] = k;
      else if (lower.includes('lot') || lower.includes('batch')) suggestedMapping['lotNumber'] = k;
      else if (lower.includes('brand')) suggestedMapping['brand'] = k;
      else if (lower.includes('cat')) suggestedMapping['category'] = k;
      else if (lower.includes('warehouse') || lower.includes('loc')) suggestedMapping['warehouse'] = k;
    });

    dispatch(
      setInventoryParsedResult({
        documentId: zap.zapId,
        fileName: zap.zapName || zap.zapId,
        rawGrid,
        suggestedMapping,
      })
    );
  };

  const handleCloseZapMapping = () => {
    setActiveMappingZap(null);
    dispatch(setInventoryParsedResult(null));
  };

  const handleSaveZapMapping = async () => {
    if (!activeMappingZap || !supplierId) return;
    setMappingSaving(true);
    setMappingSaveSuccess(false);
    setLocalFeedback(null);

    const zapTitle = activeMappingZap.zapName || activeMappingZap.zapId;
    const templateName = `${zapTitle} Mapping`;

    try {
      await dispatch(
        saveZapierMappingThunk({
          supplierId,
          zapId: activeMappingZap.zapId,
          zapName: activeMappingZap.zapName,
          templateName,
          columnMappings: inventoryMappings,
          ingressKey,
        })
      ).unwrap();

      setMappingSaveSuccess(true);
      setTimeout(() => setMappingSaveSuccess(false), 3000);
      dispatch(fetchZapierRosterThunk({ supplierId, ingressKey }));
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || 'Failed to save Zapier column mapping.';
      setLocalFeedback(msg);
    } finally {
      setMappingSaving(false);
    }
  };

  const ingressKey = zapierState?.ingressKey || 'zap_sec_live_key_999';
  const webhookUrl =
    zapierState?.webhookUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/api/v1/ingestion/zapier/webhook`
      : 'http://localhost:5000/api/v1/ingestion/zapier/webhook');

  // Fetch roster on mount or when supplierId changes
  useEffect(() => {
    if (supplierId) {
      dispatch(fetchZapierRosterThunk({ supplierId, ingressKey }));
    }
  }, [supplierId, ingressKey, dispatch]);

  const handleTestPing = () => {
    dispatch(testZapierPingThunk({ ingressKey }));
  };

  const isTestingPing = pingStatus === 'testing';

  // Derived metrics
  const totalIngestedLots = connectedZaps.reduce(
    (acc, zap) => acc + (zap.lotCount || 0),
    0
  );

  const latestSyncTimestamp = connectedZaps.reduce((latest, zap) => {
    if (!zap.lastSyncedAt) return latest;
    if (!latest) return zap.lastSyncedAt;
    return new Date(zap.lastSyncedAt) > new Date(latest) ? zap.lastSyncedAt : latest;
  }, null as string | null);

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

  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(webhookUrl);
      }
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const samplePayloadJson = JSON.stringify(
    {
      zapId: 'my-custom-zap-feed',
      zapName: 'Shopify / ERP Inbound Inventory',
      triggerEvent: 'new_inventory_lot',
      lots: [
        {
          sku: 'ORG-APPL-101',
          description: 'Honeycrisp Apples Grade A',
          category: 'Produce',
          quantity: 120,
          unit: 'cases',
          expirationDate: '2026-11-15',
          warehouseLocation: 'Bay-4-Cooler',
          standardSellPrice: 34.5,
          unitCost: 18.0,
        },
      ],
    },
    null,
    2
  );

  const handleCopyPayload = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(samplePayloadJson);
      }
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  const handleConfirmDisconnect = async () => {
    if (!zapToDisconnect) return;
    try {
      await dispatch(
        disconnectZapierFeedThunk({
          zapId: zapToDisconnect.zapId,
          supplierId,
          ingressKey,
        })
      ).unwrap();
      setZapToDisconnect(null);
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || 'Failed to disconnect Zap feed';
      setLocalFeedback(msg);
    }
  };

  return (
    <div className="space-y-6 w-full" id="zapier-integration-suite">
      {/* Quadrant 1: Header & Health Telemetry */}
      <section
        data-testid="zapier-quadrant-1-telemetry"
        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                Zapier Ingestion Suite
              </h2>
              {/* Connection Status Pill */}
              {isTestingPing ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  <Wifi className="w-3 h-3 animate-pulse" />
                  Testing...
                </span>
              ) : pingStatus === 'connected' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Trigger
                </span>
              ) : pingStatus === 'error' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                  <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  Error
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Clock className="w-3 h-3" />
                  Idle
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Event-driven surplus lot ingestion via Zapier Catch Hook webhooks for{' '}
              {supplierName || 'current supplier'}.
            </p>
          </div>

          {/* Action triggers */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTestPing}
              disabled={isTestingPing}
              aria-label="Test Ping"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
            >
              <Wifi
                className={`w-3.5 h-3.5 ${isTestingPing ? 'animate-pulse text-amber-500' : ''}`}
              />
              {isTestingPing ? 'Testing...' : 'Test Ping'}
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
              {pingLatencyMs !== null && pingLatencyMs !== undefined
                ? `${pingLatencyMs} ms`
                : '—'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              Last Inbound Webhook
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {formatRelativeTime(latestSyncTimestamp)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-500" />
              Ingested Lots Count
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {totalIngestedLots}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-amber-500" />
              Active Zaps Registered
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {connectedZaps.length}
            </div>
          </div>
        </div>
      </section>

      {/* Quadrant 2: Credentials & Catch Hook Setup Guide */}
      <section
        data-testid="zapier-quadrant-2-credentials"
        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              Ingress Credentials &amp; Zapier Catch Hook Guide
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure Webhooks by Zapier to forward events directly to this endpoint with cryptographic verification.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Ingress Webhook URL */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                Ingress Webhook URL
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                aria-label="Copy Webhook URL"
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedUrl ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copiedUrl ? 'Copied' : 'Copy URL'}
              </button>
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
                aria-label="Copy Key"
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copiedKey ? 'Copied' : 'Copy Key'}
              </button>
            </div>
            <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
              {ingressKey}
            </div>
          </div>
        </div>

        {/* Expandable Zapier Catch Hook Setup Guide */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setIsGuideExpanded(!isGuideExpanded)}
              aria-label={
                isGuideExpanded
                  ? 'Hide Zapier Catch Hook Setup Guide'
                  : 'View Zapier Catch Hook Setup Guide'
              }
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-amber-500" />
              <span>
                {isGuideExpanded
                  ? 'Hide Zapier Catch Hook Setup Guide'
                  : 'View Zapier Catch Hook Setup Guide'}
              </span>
              {isGuideExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyPayload}
              aria-label="Copy Sample Payload"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition cursor-pointer"
            >
              {copiedPayload ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedPayload ? 'Copied!' : 'Copy Sample Payload'}
            </button>
          </div>

          {isGuideExpanded && (
            <div className="p-4 bg-slate-950 text-slate-200 space-y-4 border-t border-slate-800">
              {/* Step 1 & 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Webhook className="w-3.5 h-3.5" />
                    Step 1: Zapier Action Setup
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    <li>Choose App: <strong>Webhooks by Zapier</strong></li>
                    <li>Action Event: <strong>POST</strong> or <strong>Custom Request</strong></li>
                    <li>URL: Paste the <strong>Ingress Webhook URL</strong> above</li>
                    <li>Payload Type: <strong>JSON</strong></li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-blue-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Step 2: Required Headers
                  </div>
                  <div className="font-mono text-[11px] space-y-1 bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                    <div>
                      <span className="text-amber-400">X-Ingress-Key:</span> {ingressKey}
                    </div>
                    <div>
                      <span className="text-blue-400">Content-Type:</span> application/json
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Sample JSON Payload */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5 font-sans">
                  <FileJson className="w-3.5 h-3.5 text-emerald-400" />
                  Step 3: Sample JSON Request Body (Single or Batch Lots)
                </div>
                <pre className="font-mono text-xs overflow-x-auto max-h-64 p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-100 whitespace-pre">
                  {samplePayloadJson}
                </pre>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quadrant 3: Connected Zaps Roster */}
      <section
        data-testid="zapier-quadrant-3-roster"
        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Table className="w-4 h-4 text-amber-500" />
                Connected Zaps Roster
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {connectedZaps.length} {connectedZaps.length === 1 ? 'Zap' : 'Zaps'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live event triggers dynamically registered via inbound Zapier webhooks.
            </p>
          </div>
        </div>

        {localFeedback && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{localFeedback}</span>
          </div>
        )}

        {connectedZaps.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <Webhook className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No Connected Zaps Yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Configure a Zapier Catch Hook webhook pointing to the URL above with your ingress key. When your Zap triggers, it will automatically register here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3">Zap Feed Name &amp; ID</th>
                  <th scope="col" className="px-4 py-3">Trigger Origin</th>
                  <th scope="col" className="px-4 py-3">Synchronized Lots</th>
                  <th scope="col" className="px-4 py-3">Last Active</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
                {connectedZaps.map((zap) => (
                  <tr
                    key={zap.zapId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {zap.zapName || 'Zapier Inbound Feed'}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        {zap.zapId}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {zap.triggerEvent || 'catch_hook'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {zap.lotCount ?? 0}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatRelativeTime(zap.lastSyncedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {zap.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : zap.status === 'paused' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          Paused
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenZapMapping(zap)}
                          aria-label="Edit Mapping"
                          title="Configure Column Mapping"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-amber-500" />
                          <span className="hidden sm:inline">Edit Mapping</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setZapToDisconnect(zap)}
                          aria-label="Disconnect Zap"
                          title="Disconnect Zap Feed"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span className="sr-only">Disconnect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Payload Ingress Log */}
      <section
        data-testid="zapier-recent-payload-log"
        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileJson className="w-4 h-4 text-amber-500" />
                Recent Payload Ingress Log
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {deliveryLogs.length} {deliveryLogs.length === 1 ? 'Delivery' : 'Deliveries'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live audit trail of inbound Zapier Catch Hook webhook deliveries, latencies, and execution traces.
            </p>
          </div>
        </div>

        {deliveryLogs.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <FileJson className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No Webhook Deliveries Recorded Yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              When Zapier executes a POST to your Ingress Webhook URL, the raw payload and response metadata will appear here for audit inspection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3">Timestamp</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Latency</th>
                  <th scope="col" className="px-4 py-3">Message</th>
                  <th scope="col" className="px-4 py-3 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
                {deliveryLogs.map((log, idx) => {
                  const isExpanded = expandedLogIndices.has(idx);
                  return (
                    <React.Fragment key={idx}>
                      <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatRelativeTime(log.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          {log.httpStatus === 200 || log.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              200 OK
                            </span>
                          ) : log.httpStatus === 422 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                              <AlertCircle className="w-2.5 h-2.5" />
                              422 ERR
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {log.httpStatus || 'ERR'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {log.latencyMs !== undefined && log.latencyMs !== null
                            ? `${log.latencyMs} ms`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          {log.message || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => toggleLogExpanded(idx)}
                            aria-label={isExpanded ? 'Hide Payload' : 'View Payload'}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-3 bg-slate-950 border-t border-slate-800">
                            <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-400 font-mono">
                              <span>Raw Inbound JSON Payload Preview</span>
                              <span>Timestamp: {log.timestamp}</span>
                            </div>
                            <pre className="font-mono text-xs overflow-x-auto max-h-64 p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-100 whitespace-pre">
                              {JSON.stringify(log.samplePayload || {}, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quadrant 4: In-Situ Schema Field Mapper */}
      <section
        data-testid="zapier-quadrant-4-mapper"
        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Table className="w-4 h-4 text-amber-500" />
                In-Situ Schema Field Mapper
              </h3>
              {activeMappingZap && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                  {activeMappingZap.zapName || activeMappingZap.zapId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeMappingZap ? (
                <span>
                  Active schema mapping configuration for{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {activeMappingZap.zapName || activeMappingZap.zapId}
                  </strong>{' '}
                  (feed id:{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {activeMappingZap.zapId}
                  </strong>
                  ).
                </span>
              ) : (
                'Select a connected Zap from the Connected Zaps Roster above to inspect and configure column bindings.'
              )}
            </p>
          </div>

          {activeMappingZap && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCloseZapMapping}
                aria-label="Close Mapper"
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close Mapper
              </button>
            </div>
          )}
        </div>

        {localFeedback && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{localFeedback}</span>
          </div>
        )}

        {activeMappingZap && inventoryParsedResult ? (
          <div className="space-y-4">
            <GridMapperTable
              pipelineType="inventory"
              mode="template"
              title={`${activeMappingZap.zapName || activeMappingZap.zapId} Mapping`}
              subtitle={`Zap Feed: ${activeMappingZap.zapId}. Adjust canonical field alignments below. Saving stores this mapping to this zap's bound template.`}
              saveButtonText="Save Zapier Mapping"
              onSave={handleSaveZapMapping}
              isSaving={mappingSaving}
              saveSuccess={mappingSaveSuccess}
            />
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <FileJson className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Select a Connected Zap to Configure Mapping
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Click &quot;Edit Mapping&quot; on any connected zap feed in the roster above to preview fields, assign canonical database targets, and persist schema bindings directly.
            </p>
          </div>
        )}
      </section>

      {/* Disconnect Confirmation Modal */}
      {zapToDisconnect && (
        <div
          role="dialog"
          aria-label="Disconnect Zap Feed"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Disconnect Zap Feed
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Are you sure you want to disconnect{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {zapToDisconnect.zapName || zapToDisconnect.zapId}
              </span>
              ? Inbound automatic synchronization for this zap will be stopped.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setZapToDisconnect(null)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition cursor-pointer"
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

export default ZapierIntegrationView;
