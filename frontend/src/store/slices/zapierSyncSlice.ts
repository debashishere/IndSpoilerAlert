import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import zapierSyncService, {
  type ConnectedZapInfo,
  type ZapDeliveryLogInfo,
  type ZapierTestPingPayload,
  type ZapierDisconnectPayload,
  type ZapierSaveMappingPayload,
} from '../../services/zapierSyncService';

export interface ZapierSyncState {
  supplierId: string | null;
  ingressKey: string | null;
  webhookUrl: string | null;
  connectedZaps: ConnectedZapInfo[];
  deliveryLogs: ZapDeliveryLogInfo[];
  totalZaps: number;
  pingStatus: 'idle' | 'testing' | 'connected' | 'error';
  pingLatencyMs: number | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  disconnectStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: ZapierSyncState = {
  supplierId: null,
  ingressKey: null,
  webhookUrl: null,
  connectedZaps: [],
  deliveryLogs: [],
  totalZaps: 0,
  pingStatus: 'idle',
  pingLatencyMs: null,
  status: 'idle',
  error: null,
  disconnectStatus: 'idle',
};

export const fetchZapierRosterThunk = createAsyncThunk(
  'zapierSync/fetchRoster',
  async (params: { supplierId?: string; ingressKey?: string }, { rejectWithValue }) => {
    try {
      const res = await zapierSyncService.fetchRoster(params);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch Zapier roster.');
    }
  }
);

export const testZapierPingThunk = createAsyncThunk(
  'zapierSync/testPing',
  async (payload: ZapierTestPingPayload, { rejectWithValue }) => {
    try {
      const res = await zapierSyncService.testPing(payload);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Test ping failed');
    }
  }
);

export const disconnectZapierFeedThunk = createAsyncThunk(
  'zapierSync/disconnectFeed',
  async (payload: ZapierDisconnectPayload, { rejectWithValue }) => {
    try {
      const res = await zapierSyncService.disconnectFeed(payload);
      return { zapId: payload.zapId, res };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to disconnect Zap feed.');
    }
  }
);

export const saveZapierMappingThunk = createAsyncThunk(
  'zapierSync/saveMapping',
  async (payload: ZapierSaveMappingPayload, { rejectWithValue }) => {
    try {
      const res = await zapierSyncService.saveMapping(payload);
      return { zapId: payload.zapId, res };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to save Zapier column mapping.');
    }
  }
);

export const zapierSyncSlice = createSlice({
  name: 'zapierSync',
  initialState,
  reducers: {
    setZapierCredentials: (
      state,
      action: PayloadAction<{
        supplierId?: string;
        ingressKey?: string;
        webhookUrl?: string;
      }>
    ) => {
      if (action.payload.supplierId !== undefined) {
        state.supplierId = action.payload.supplierId;
      }
      if (action.payload.ingressKey !== undefined) {
        state.ingressKey = action.payload.ingressKey;
      }
      if (action.payload.webhookUrl !== undefined) {
        state.webhookUrl = action.payload.webhookUrl;
      }
    },
    resetZapierPingStatus: (state) => {
      state.pingStatus = 'idle';
      state.pingLatencyMs = null;
    },
  },
  extraReducers: (builder) => {
    // fetchZapierRosterThunk
    builder
      .addCase(fetchZapierRosterThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchZapierRosterThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload.supplierId) {
          state.supplierId = action.payload.supplierId;
        }
        if (action.payload.ingressKey) {
          state.ingressKey = action.payload.ingressKey;
        }
        state.connectedZaps = action.payload.connectedZaps || [];
        state.deliveryLogs = action.payload.deliveryLogs || [];
        state.totalZaps = action.payload.totalZaps ?? state.connectedZaps.length;
      })
      .addCase(fetchZapierRosterThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to fetch Zapier roster.';
      });

    // testZapierPingThunk
    builder
      .addCase(testZapierPingThunk.pending, (state) => {
        state.pingStatus = 'testing';
        state.error = null;
      })
      .addCase(testZapierPingThunk.fulfilled, (state, action) => {
        state.pingStatus = 'connected';
        state.pingLatencyMs = action.payload.latencyMs;
      })
      .addCase(testZapierPingThunk.rejected, (state, action) => {
        state.pingStatus = 'error';
        state.error = (action.payload as string) || 'Test ping failed';
      });

    // disconnectZapierFeedThunk
    builder
      .addCase(disconnectZapierFeedThunk.pending, (state) => {
        state.disconnectStatus = 'loading';
      })
      .addCase(disconnectZapierFeedThunk.fulfilled, (state, action) => {
        state.disconnectStatus = 'succeeded';
        state.connectedZaps = state.connectedZaps.filter(
          (zap) => zap.zapId !== action.payload.zapId
        );
        state.totalZaps = state.connectedZaps.length;
      })
      .addCase(disconnectZapierFeedThunk.rejected, (state, action) => {
        state.disconnectStatus = 'failed';
        state.error = (action.payload as string) || 'Failed to disconnect Zap feed.';
      });
  },
});

export const { setZapierCredentials, resetZapierPingStatus } = zapierSyncSlice.actions;
export default zapierSyncSlice.reducer;
