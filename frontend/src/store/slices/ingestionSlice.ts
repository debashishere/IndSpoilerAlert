import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import ingestionService from '../../services/ingestionService';
import googleSheetsSyncService from '../../services/googleSheetsSyncService';

export type PipelineTab = 'inventory' | 'sales' | 'buyers';

export interface SemanticRule {
  sourceKey: string;
  targetKey: string;
  transform?: string;
}

export interface IngestionParsedResult {
  documentId?: string;
  _id?: string;
  ingestionJobId?: string;
  fileName: string;
  rawGrid: string[][];
  suggestedMapping: Record<string, string>;
  [key: string]: any;
}

export interface IngestionState {
  pipelineTab: PipelineTab;
  selectedSupplier: string;
  inventoryFile: { name: string; size: number } | null;
  inventoryDragActive: boolean;
  inventoryLoading: boolean;
  inventoryLoadingStep: string;
  inventoryError: string | null;
  inventoryParsedResult: IngestionParsedResult | null;
  inventoryMappings: Record<string, string>;
  inventorySemanticRules: SemanticRule[];
  inventoryIsImported: boolean;
  inventoryImportCount: number;
  inventoryImportedLotIds: string[];

  salesFile: { name: string; size: number } | null;
  salesDragActive: boolean;
  salesLoading: boolean;
  salesLoadingStep: string;
  salesError: string | null;
  salesParsedResult: IngestionParsedResult | null;
  salesMappings: Record<string, string>;
  salesSemanticRules: SemanticRule[];
  salesIsImported: boolean;
  salesImportCount: number;
  salesImportWarnings: string[];
  salesRecords: any[];
  salesRecordsLoading: boolean;

  buyerFile: { name: string; size: number } | null;
  buyerDragActive: boolean;
  buyerLoading: boolean;
  buyerLoadingStep: string;
  buyerParsedResult: IngestionParsedResult | null;
  buyerMappings: Record<string, string>;
  buyerIsImported: boolean;
  buyerImportCount: number;

  buyerSearch: string;
  buyerTierFilter: string;
  buyerNewName: string;
  buyerNewEmail: string;
  buyerNewTier: string;
  buyerSaving: boolean;
  buyerSuccess: string;
  buyerError: string;

  // Google Sheets Sync & Configuration State
  googleSheetsConfig: {
    spreadsheetId: string;
    sheetName: string;
    connectedEmail: string;
    oauthConnected: boolean;
    ingressKey?: string;
  };
  googleSheetsScript: string | null;
  googleSheetsScriptLoading: boolean;
  googleSheetsScriptError: string | null;
  googleSheetsPingStatus: 'idle' | 'testing' | 'connected' | 'error';
  googleSheetsPingLatencyMs: number | null;
  googleSheetsPingError: string | null;
  googleSheetsHandshakeLoading: boolean;

  // Dual-State Google Sheets Sync Health & Dispatch
  googleSheetsSync: {
    connectionStatus: 'unconnected' | 'connected' | 'error';
    lastSyncedAt: string | null;
    syncedLotCount: number;
    isSyncing: boolean;
    error: string | null;
  };
}

const initialState: IngestionState = {
  pipelineTab: 'inventory',
  selectedSupplier: '',
  inventoryFile: null,
  inventoryDragActive: false,
  inventoryLoading: false,
  inventoryLoadingStep: '',
  inventoryError: null,
  inventoryParsedResult: null,
  inventoryMappings: {},
  inventorySemanticRules: [],
  inventoryIsImported: false,
  inventoryImportCount: 0,
  inventoryImportedLotIds: [],

  salesFile: null,
  salesDragActive: false,
  salesLoading: false,
  salesLoadingStep: '',
  salesError: null,
  salesParsedResult: null,
  salesMappings: {},
  salesSemanticRules: [],
  salesIsImported: false,
  salesImportCount: 0,
  salesImportWarnings: [],
  salesRecords: [],
  salesRecordsLoading: false,

  buyerFile: null,
  buyerDragActive: false,
  buyerLoading: false,
  buyerLoadingStep: '',
  buyerParsedResult: null,
  buyerMappings: {},
  buyerIsImported: false,
  buyerImportCount: 0,

  buyerSearch: '',
  buyerTierFilter: 'all',
  buyerNewName: '',
  buyerNewEmail: '',
  buyerNewTier: 'tier1',
  buyerSaving: false,
  buyerSuccess: '',
  buyerError: '',

  googleSheetsConfig: {
    spreadsheetId: '',
    sheetName: 'Sheet1',
    connectedEmail: '',
    oauthConnected: false,
    ingressKey: '',
  },
  googleSheetsScript: null,
  googleSheetsScriptLoading: false,
  googleSheetsScriptError: null,
  googleSheetsPingStatus: 'idle',
  googleSheetsPingLatencyMs: null,
  googleSheetsPingError: null,
  googleSheetsHandshakeLoading: false,

  googleSheetsSync: {
    connectionStatus: 'unconnected',
    lastSyncedAt: null,
    syncedLotCount: 0,
    isSyncing: false,
    error: null,
  },
};


export const ingestionSlice = createSlice({
  name: 'ingestion',
  initialState,
  reducers: {
    setPipelineTab: (state, action: PayloadAction<PipelineTab>) => {
      state.pipelineTab = action.payload;
    },
    setSelectedSupplier: (state, action: PayloadAction<string>) => {
      state.selectedSupplier = action.payload;
    },
    setInventoryFile: (state, action: PayloadAction<{ name: string; size: number } | null>) => {
      state.inventoryFile = action.payload;
      state.inventoryParsedResult = null;
      state.inventoryIsImported = false;
      state.inventoryError = null;
    },
    setInventoryDragActive: (state, action: PayloadAction<boolean>) => {
      state.inventoryDragActive = action.payload;
    },
    setInventoryLoading: (state, action: PayloadAction<boolean>) => {
      state.inventoryLoading = action.payload;
    },
    setInventoryLoadingStep: (state, action: PayloadAction<string>) => {
      state.inventoryLoadingStep = action.payload;
    },
    setInventoryError: (state, action: PayloadAction<string | null>) => {
      state.inventoryError = action.payload;
    },
    setInventoryParsedResult: (state, action: PayloadAction<IngestionParsedResult | null>) => {
      state.inventoryParsedResult = action.payload;
      if (action.payload?.suggestedMapping) {
        state.inventoryMappings = { ...action.payload.suggestedMapping };
      }
    },
    updateInventoryMapping: (state, action: PayloadAction<{ dbField: string; headerName: string }>) => {
      const { dbField, headerName } = action.payload;
      const updated = { ...state.inventoryMappings };
      Object.keys(updated).forEach((key) => {
        if (updated[key] === headerName) {
          updated[key] = '';
        }
      });
      if (dbField) {
        updated[dbField] = headerName;
      }
      state.inventoryMappings = updated;
    },
    addSemanticRule: (state, action: PayloadAction<SemanticRule>) => {
      state.inventorySemanticRules.push(action.payload);
    },
    removeSemanticRule: (state, action: PayloadAction<number>) => {
      state.inventorySemanticRules.splice(action.payload, 1);
    },
    setInventoryImportSuccess: (state, action: PayloadAction<{ count: number; lotIds: string[] }>) => {
      state.inventoryIsImported = true;
      state.inventoryImportCount = action.payload.count;
      state.inventoryImportedLotIds = action.payload.lotIds;
      state.inventoryLoading = false;
      state.inventoryLoadingStep = '';
    },
    setSalesFile: (state, action: PayloadAction<{ name: string; size: number } | null>) => {
      state.salesFile = action.payload;
      state.salesParsedResult = null;
      state.salesIsImported = false;
      state.salesError = null;
    },
    setSalesDragActive: (state, action: PayloadAction<boolean>) => {
      state.salesDragActive = action.payload;
    },
    setSalesLoading: (state, action: PayloadAction<boolean>) => {
      state.salesLoading = action.payload;
    },
    setSalesLoadingStep: (state, action: PayloadAction<string>) => {
      state.salesLoadingStep = action.payload;
    },
    setSalesError: (state, action: PayloadAction<string | null>) => {
      state.salesError = action.payload;
    },
    setSalesParsedResult: (state, action: PayloadAction<IngestionParsedResult | null>) => {
      state.salesParsedResult = action.payload;
      if (action.payload?.suggestedMapping) {
        state.salesMappings = { ...action.payload.suggestedMapping };
      }
    },
    updateSalesMapping: (state, action: PayloadAction<{ dbField: string; headerName: string }>) => {
      const { dbField, headerName } = action.payload;
      const updated = { ...state.salesMappings };
      Object.keys(updated).forEach((key) => {
        if (updated[key] === headerName) {
          delete updated[key];
        }
      });
      if (dbField) {
        updated[dbField] = headerName;
      }
      state.salesMappings = updated;
    },
    addSalesSemanticRule: (state, action: PayloadAction<SemanticRule>) => {
      state.salesSemanticRules.push(action.payload);
    },
    removeSalesSemanticRule: (state, action: PayloadAction<number>) => {
      state.salesSemanticRules.splice(action.payload, 1);
    },
    setSalesImportSuccess: (state, action: PayloadAction<{ count: number; warnings?: string[] }>) => {
      state.salesIsImported = true;
      state.salesImportCount = action.payload.count;
      state.salesImportWarnings = action.payload.warnings || [];
      state.salesLoading = false;
      state.salesLoadingStep = '';
    },
    setSalesRecords: (state, action: PayloadAction<any[]>) => {
      state.salesRecords = action.payload;
    },
    setSalesRecordsLoading: (state, action: PayloadAction<boolean>) => {
      state.salesRecordsLoading = action.payload;
    },
    setBuyerSearch: (state, action: PayloadAction<string>) => {
      state.buyerSearch = action.payload;
    },
    setBuyerTierFilter: (state, action: PayloadAction<string>) => {
      state.buyerTierFilter = action.payload;
    },
    setBuyerNewName: (state, action: PayloadAction<string>) => {
      state.buyerNewName = action.payload;
    },
    setBuyerNewEmail: (state, action: PayloadAction<string>) => {
      state.buyerNewEmail = action.payload;
    },
    setBuyerNewTier: (state, action: PayloadAction<string>) => {
      state.buyerNewTier = action.payload;
    },
    setBuyerSaving: (state, action: PayloadAction<boolean>) => {
      state.buyerSaving = action.payload;
    },
    setBuyerStatusMessage: (state, action: PayloadAction<{ success?: string; error?: string }>) => {
      state.buyerSuccess = action.payload.success || '';
      state.buyerError = action.payload.error || '';
    },
    setBuyerFile: (state, action: PayloadAction<{ name: string; size: number } | null>) => {
      state.buyerFile = action.payload;
      state.buyerParsedResult = null;
      state.buyerIsImported = false;
      state.buyerError = '';
    },
    setBuyerDragActive: (state, action: PayloadAction<boolean>) => {
      state.buyerDragActive = action.payload;
    },
    setBuyerLoading: (state, action: PayloadAction<boolean>) => {
      state.buyerLoading = action.payload;
    },
    setBuyerLoadingStep: (state, action: PayloadAction<string>) => {
      state.buyerLoadingStep = action.payload;
    },
    setBuyerParsedResult: (state, action: PayloadAction<IngestionParsedResult | null>) => {
      state.buyerParsedResult = action.payload;
      if (action.payload?.suggestedMapping) {
        state.buyerMappings = { ...action.payload.suggestedMapping };
      }
    },
    updateBuyerMapping: (state, action: PayloadAction<{ dbField: string; headerName: string }>) => {
      const { dbField, headerName } = action.payload;
      const updated = { ...state.buyerMappings };
      Object.keys(updated).forEach((key) => {
        if (updated[key] === headerName) {
          delete updated[key];
        }
      });
      if (dbField) {
        updated[dbField] = headerName;
      }
      state.buyerMappings = updated;
    },
    setBuyerImportSuccess: (state, action: PayloadAction<{ count: number; updatedCount?: number }>) => {
      state.buyerIsImported = true;
      state.buyerImportCount = action.payload.count;
      state.buyerLoading = false;
      state.buyerLoadingStep = '';
    },
    setGoogleSheetsConfig: (
      state,
      action: PayloadAction<{
        spreadsheetId?: string;
        sheetName?: string;
        connectedEmail?: string;
        oauthConnected?: boolean;
        ingressKey?: string;
      }>
    ) => {
      state.googleSheetsConfig = {
        ...state.googleSheetsConfig,
        ...action.payload,
      };
    },
    setGoogleSheetsScript: (state, action: PayloadAction<string | null>) => {
      state.googleSheetsScript = action.payload;
    },
    setGoogleSheetsScriptLoading: (state, action: PayloadAction<boolean>) => {
      state.googleSheetsScriptLoading = action.payload;
    },
    setGoogleSheetsScriptError: (state, action: PayloadAction<string | null>) => {
      state.googleSheetsScriptError = action.payload;
    },
    setGoogleSheetsPingStatus: (
      state,
      action: PayloadAction<'idle' | 'testing' | 'connected' | 'error'>
    ) => {
      state.googleSheetsPingStatus = action.payload;
    },
    setGoogleSheetsPingResult: (
      state,
      action: PayloadAction<{ latencyMs: number | null; error?: string | null }>
    ) => {
      state.googleSheetsPingLatencyMs = action.payload.latencyMs;
      state.googleSheetsPingError = action.payload.error || null;
    },
    setGoogleSheetsHandshakeLoading: (state, action: PayloadAction<boolean>) => {
      state.googleSheetsHandshakeLoading = action.payload;
    },
    setGoogleSheetsSyncState: (
      state,
      action: PayloadAction<
        Partial<{
          connectionStatus: 'unconnected' | 'connected' | 'error';
          lastSyncedAt: string | null;
          syncedLotCount: number;
          isSyncing: boolean;
          error: string | null;
        }>
      >
    ) => {
      state.googleSheetsSync = {
        ...state.googleSheetsSync,
        ...action.payload,
      };
    },
    setGoogleSheetsSyncLoading: (state, action: PayloadAction<boolean>) => {
      state.googleSheetsSync.isSyncing = action.payload;
    },
    setGoogleSheetsSyncSuccess: (
      state,
      action: PayloadAction<{ lastSyncedAt: string; syncedLotCount: number }>
    ) => {
      state.googleSheetsSync.isSyncing = false;
      state.googleSheetsSync.connectionStatus = 'connected';
      state.googleSheetsSync.lastSyncedAt = action.payload.lastSyncedAt;
      state.googleSheetsSync.syncedLotCount = action.payload.syncedLotCount;
      state.googleSheetsSync.error = null;
    },
    setGoogleSheetsSyncError: (state, action: PayloadAction<string | null>) => {
      state.googleSheetsSync.isSyncing = false;
      state.googleSheetsSync.error = action.payload;
      if (action.payload) {
        state.googleSheetsSync.connectionStatus = 'error';
      }
    },
  },
});

export const {
  setPipelineTab,
  setSelectedSupplier,
  setInventoryFile,
  setInventoryDragActive,
  setInventoryLoading,
  setInventoryLoadingStep,
  setInventoryError,
  setInventoryParsedResult,
  updateInventoryMapping,
  addSemanticRule,
  removeSemanticRule,
  setInventoryImportSuccess,
  setSalesFile,
  setSalesDragActive,
  setSalesLoading,
  setSalesLoadingStep,
  setSalesError,
  setSalesParsedResult,
  updateSalesMapping,
  addSalesSemanticRule,
  removeSalesSemanticRule,
  setSalesImportSuccess,
  setSalesRecords,
  setSalesRecordsLoading,
  setBuyerSearch,
  setBuyerTierFilter,
  setBuyerNewName,
  setBuyerNewEmail,
  setBuyerNewTier,
  setBuyerSaving,
  setBuyerStatusMessage,
  setBuyerFile,
  setBuyerDragActive,
  setBuyerLoading,
  setBuyerLoadingStep,
  setBuyerParsedResult,
  updateBuyerMapping,
  setBuyerImportSuccess,
  setGoogleSheetsConfig,
  setGoogleSheetsScript,
  setGoogleSheetsScriptLoading,
  setGoogleSheetsScriptError,
  setGoogleSheetsPingStatus,
  setGoogleSheetsPingResult,
  setGoogleSheetsHandshakeLoading,
  setGoogleSheetsSyncState,
  setGoogleSheetsSyncLoading,
  setGoogleSheetsSyncSuccess,
  setGoogleSheetsSyncError,
} = ingestionSlice.actions;


export const uploadInventoryThunk = createAsyncThunk(
  'ingestion/uploadInventory',
  async (
    payload: { file: File; supplierId: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(setInventoryLoading(true));
      dispatch(setInventoryError(null));
      const result = await ingestionService.uploadInventoryFile(
        payload.file,
        payload.supplierId,
        (step) => dispatch(setInventoryLoadingStep(step))
      );
      dispatch(setInventoryParsedResult(result));
      dispatch(setInventoryLoading(false));
      dispatch(setInventoryLoadingStep(''));
      return result;
    } catch (err: any) {
      dispatch(setInventoryError(err.message || 'An error occurred during file processing.'));
      dispatch(setInventoryLoading(false));
      dispatch(setInventoryLoadingStep(''));
      return rejectWithValue(err.message);
    }
  }
);

export const confirmInventoryThunk = createAsyncThunk(
  'ingestion/confirmInventory',
  async (
    payload: {
      documentId: string;
      supplierId: string;
      mappings: Record<string, string>;
      saveTemplate: boolean;
      templateName?: string;
      semanticRules?: SemanticRule[];
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(setInventoryLoading(true));
      dispatch(setInventoryLoadingStep('Saving supplier templates and inserting inventory lots into MongoDB...'));
      const result = await ingestionService.confirmInventoryIngestion(payload);
      dispatch(
        setInventoryImportSuccess({
          count: result.countImported || 0,
          lotIds: result.importedLotIds || [],
        })
      );
      return result;
    } catch (err: any) {
      dispatch(setInventoryError(err.message || 'An error occurred during confirmation.'));
      dispatch(setInventoryLoading(false));
      dispatch(setInventoryLoadingStep(''));
      return rejectWithValue(err.message);
    }
  }
);

export const uploadSalesThunk = createAsyncThunk(
  'ingestion/uploadSales',
  async (
    payload: { file: File; supplierId: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(setSalesLoading(true));
      dispatch(setSalesError(null));
      const result = await ingestionService.uploadSalesFile(
        payload.file,
        payload.supplierId,
        (step) => dispatch(setSalesLoadingStep(step))
      );
      dispatch(setSalesParsedResult(result));
      dispatch(setSalesLoading(false));
      dispatch(setSalesLoadingStep(''));
      return result;
    } catch (err: any) {
      dispatch(setSalesError(err.message || 'An error occurred'));
      dispatch(setSalesLoading(false));
      dispatch(setSalesLoadingStep(''));
      return rejectWithValue(err.message);
    }
  }
);

export const confirmSalesThunk = createAsyncThunk(
  'ingestion/confirmSales',
  async (
    payload: {
      documentId: string;
      supplierId: string;
      mappings: Record<string, string>;
      saveTemplate: boolean;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(setSalesLoading(true));
      dispatch(setSalesLoadingStep('Importing sales records and reconciling with inventory (FEFO)...'));
      const result = await ingestionService.confirmSalesIngestion(payload);
      dispatch(
        setSalesImportSuccess({
          count: result.countImported || 0,
          warnings: result.warnings || [],
        })
      );
      return result;
    } catch (err: any) {
      dispatch(setSalesError(err.message || 'Sales import failed'));
      dispatch(setSalesLoading(false));
      dispatch(setSalesLoadingStep(''));
      return rejectWithValue(err.message);
    }
  }
);

export const fetchSalesRecordsThunk = createAsyncThunk(
  'ingestion/fetchSalesRecords',
  async (supplierId: string | undefined, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setSalesRecordsLoading(true));
      const records = await ingestionService.fetchSalesRecords(supplierId);
      dispatch(setSalesRecords(records));
      dispatch(setSalesRecordsLoading(false));
      return records;
    } catch (err: any) {
      dispatch(setSalesRecordsLoading(false));
      return rejectWithValue(err.message);
    }
  }
);

export const addBuyerThunk = createAsyncThunk(
  'ingestion/addBuyer',
  async (
    payload: { companyName: string; email: string; tier?: string; supplierId?: string },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      dispatch(setBuyerSaving(true));
      dispatch(setBuyerStatusMessage({ success: '', error: '' }));
      const state = getState() as any;
      const supplierId = payload.supplierId || state?.ingestion?.selectedSupplier;
      const result = await ingestionService.addBuyer({
        ...payload,
        ...(supplierId ? { supplierId } : {})
      });
      dispatch(
        setBuyerStatusMessage({
          success: `✓ ${payload.companyName} added successfully!`,
          error: '',
        })
      );
      dispatch(setBuyerSaving(false));
      return result;
    } catch (err: any) {
      dispatch(
        setBuyerStatusMessage({
          success: '',
          error: err.message || 'Error saving buyer',
        })
      );
      dispatch(setBuyerSaving(false));
      return rejectWithValue(err.message);
    }
  }
);

export const uploadBuyerThunk = createAsyncThunk(
  'ingestion/uploadBuyer',
  async (
    payload: { file: File; supplierId?: string },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      dispatch(setBuyerLoading(true));
      dispatch(setBuyerStatusMessage({ success: '', error: '' }));
      const state = getState() as any;
      const supplierId = payload.supplierId || state?.ingestion?.selectedSupplier || undefined;
      const result = await ingestionService.uploadBuyerFile(
        payload.file,
        supplierId,
        (step) => dispatch(setBuyerLoadingStep(step))
      );
      dispatch(setBuyerParsedResult(result));
      dispatch(setBuyerLoading(false));
      dispatch(setBuyerLoadingStep(''));
      return result;
    } catch (err: any) {
      dispatch(setBuyerStatusMessage({ success: '', error: err.message || 'An error occurred uploading buyer file.' }));
      dispatch(setBuyerLoading(false));
      dispatch(setBuyerLoadingStep(''));
      return rejectWithValue(err.message);
    }
  }
);

export const confirmBuyerThunk = createAsyncThunk(
  'ingestion/confirmBuyer',
  async (
    payload: {
      documentId: string;
      mappings: Record<string, string>;
      buyerListId?: string;
      supplierId?: string;
    },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      dispatch(setBuyerLoading(true));
      dispatch(setBuyerLoadingStep('Ingesting buyers and resolving duplicate records...'));
      const state = getState() as any;
      const supplierId = payload.supplierId || state?.ingestion?.selectedSupplier;
      const result = await ingestionService.confirmBuyerIngestion({
        ...payload,
        ...(supplierId ? { supplierId } : {})
      });
      dispatch(
        setBuyerImportSuccess({
          count: result.createdCount || 0,
          updatedCount: result.updatedCount || 0,
        })
      );
      const updatedText = result.updatedCount ? ` (${result.updatedCount} updated)` : '';
      dispatch(
        setBuyerStatusMessage({
          success: `✓ Successfully ingested ${result.createdCount || 0} new buyers${updatedText}!`,
          error: '',
        })
      );
      return result;
    } catch (err: any) {
      dispatch(
        setBuyerStatusMessage({
          success: '',
          error: err.message || 'Failed to confirm buyer ingestion.',
        })
      );
      dispatch(setBuyerLoading(false));
      dispatch(setBuyerLoadingStep(''));
      return rejectWithValue(err.message);
    }
  }
);

export const fetchGoogleSheetsScriptThunk = createAsyncThunk(
  'ingestion/fetchGoogleSheetsScript',
  async (supplierId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGoogleSheetsScriptLoading(true));
      dispatch(setGoogleSheetsScriptError(null));
      const res = await googleSheetsSyncService.fetchScriptTemplate(supplierId);
      dispatch(setGoogleSheetsScript(res.script));
      dispatch(
        setGoogleSheetsConfig({
          spreadsheetId: res.spreadsheetId,
          sheetName: res.sheetName,
          ingressKey: res.ingressKey,
        })
      );
      dispatch(setGoogleSheetsScriptLoading(false));
      return res;
    } catch (err: any) {
      dispatch(setGoogleSheetsScriptError(err.message || 'Failed to fetch script template.'));
      dispatch(setGoogleSheetsScriptLoading(false));
      return rejectWithValue(err.message);
    }
  }
);

export const testGoogleSheetsPingThunk = createAsyncThunk(
  'ingestion/testGoogleSheetsPing',
  async (
    payload: { ingressKey: string; spreadsheetId?: string; sheetName?: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(setGoogleSheetsPingStatus('testing'));
      dispatch(setGoogleSheetsPingResult({ latencyMs: null, error: null }));
      const res = await googleSheetsSyncService.testPing(payload);
      dispatch(setGoogleSheetsPingStatus('connected'));
      dispatch(setGoogleSheetsPingResult({ latencyMs: res.latencyMs }));
      return res;
    } catch (err: any) {
      dispatch(setGoogleSheetsPingStatus('error'));
      dispatch(setGoogleSheetsPingResult({ latencyMs: null, error: err.message || 'Ping failed' }));
      return rejectWithValue(err.message);
    }
  }
);

export const hydrateGoogleSheetsHandshakeThunk = createAsyncThunk(
  'ingestion/hydrateGoogleSheetsHandshake',
  async (
    payload: { supplierId: string; spreadsheetId: string; sheetName?: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(setGoogleSheetsHandshakeLoading(true));
      const result = await googleSheetsSyncService.fetchSampleRows(payload);
      dispatch(setInventoryParsedResult(result));
      if (result.suggestedMapping) {
        Object.entries(result.suggestedMapping).forEach(([dbField, headerName]) => {
          dispatch(updateInventoryMapping({ dbField, headerName }));
        });
      }
      dispatch(setGoogleSheetsHandshakeLoading(false));
      return result;
    } catch (err: any) {
      dispatch(setGoogleSheetsHandshakeLoading(false));
      return rejectWithValue(err.message);
    }
  }
);

export const hydrateGoogleSheetsHandshakeMappingThunk = hydrateGoogleSheetsHandshakeThunk;

export const syncGoogleSheetsNowThunk = createAsyncThunk(
  'ingestion/syncGoogleSheetsNow',
  async (
    payload: { supplierId?: string; ingressKey?: string; headers?: string[]; rows?: string[][] },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(setGoogleSheetsSyncLoading(true));
      dispatch(setGoogleSheetsSyncError(null));
      const res = await googleSheetsSyncService.syncNow(payload);
      dispatch(
        setGoogleSheetsSyncSuccess({
          lastSyncedAt: res.lastSyncedAt,
          syncedLotCount: res.syncedLotCount,
        })
      );
      return res;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to trigger on-demand sync.';
      dispatch(setGoogleSheetsSyncError(errorMsg));
      return rejectWithValue(errorMsg);
    }
  }
);

export default ingestionSlice.reducer;



