// store/inventorySlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// ─── Domain Model ───────────────────────────────────────────────
export interface SurplusLot {
  id: string;
  sku: string;
  description: string;
  quantity: number;
  pricePerCase: number;
}

interface InventoryState {
  lots: SurplusLot[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// ─── Async Thunk ────────────────────────────────────────────────
export const fetchSelectedLots = createAsyncThunk<
  SurplusLot[],
  string,
  { rejectValue: string }
>(
  'inventory/fetchLots',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<SurplusLot[]>(
        `/api/v1/campaigns/${campaignId}/inventory`
      );
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to fetch inventory lots'
      );
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────────
const initialState: InventoryState = {
  lots: [],
  status: 'idle',
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearInventoryError: (state) => {
      state.error = null;
    },
    resetInventory: (state) => {
      state.lots = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSelectedLots.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(
        fetchSelectedLots.fulfilled,
        (state, action: PayloadAction<SurplusLot[]>) => {
          state.lots = action.payload;
          state.status = 'succeeded';
          state.error = null;
        }
      )
      .addCase(fetchSelectedLots.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error occurred';
      });
  },
});

export const { clearInventoryError, resetInventory } = inventorySlice.actions;
export default inventorySlice.reducer;