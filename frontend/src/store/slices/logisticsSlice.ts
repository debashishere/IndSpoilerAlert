import { createSlice, createAsyncThunk, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import { LogisticsService, type ConfirmAppointmentPayload } from '../../services/logisticsService';
import type { RootState } from '../index';

export interface LogisticsState {
  shipments: any[];
  loading: boolean;
  hasFetched: boolean;
  error: string | null;
  selectedShipmentId: string | null;
  showAppointmentModal: boolean;
  appointmentForm: {
    pickupWindowStart: string;
    pickupWindowEnd: string;
    carrierName: string;
    carrierDotNumber: string;
  };
  newTemperatureInput: string;
}

const initialState: LogisticsState = {
  shipments: [],
  loading: false,
  hasFetched: false,
  error: null,
  selectedShipmentId: null,
  showAppointmentModal: false,
  appointmentForm: {
    pickupWindowStart: '',
    pickupWindowEnd: '',
    carrierName: '',
    carrierDotNumber: '',
  },
  newTemperatureInput: '',
};

export const fetchShipmentsThunk = createAsyncThunk(
  'logistics/fetchShipments',
  async (_, { rejectWithValue }) => {
    try {
      return await LogisticsService.fetchShipments();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch shipments');
    }
  }
);

export const confirmAppointmentThunk = createAsyncThunk(
  'logistics/confirmAppointment',
  async ({ shipmentId, payload }: { shipmentId: string; payload: ConfirmAppointmentPayload }, { rejectWithValue }) => {
    try {
      return await LogisticsService.confirmAppointment(shipmentId, payload);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to confirm appointment');
    }
  }
);

export const updateShipmentStatusThunk = createAsyncThunk(
  'logistics/updateShipmentStatus',
  async ({ shipmentId, status }: { shipmentId: string; status: string }, { rejectWithValue }) => {
    try {
      return await LogisticsService.updateShipmentStatus(shipmentId, status);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update shipment status');
    }
  }
);

export const addTemperatureLogThunk = createAsyncThunk(
  'logistics/addTemperatureLog',
  async ({ shipmentId, temperature }: { shipmentId: string; temperature: number }, { rejectWithValue }) => {
    try {
      return await LogisticsService.addTemperatureLog(shipmentId, temperature);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to add temperature log');
    }
  }
);

const logisticsSlice = createSlice({
  name: 'logistics',
  initialState,
  reducers: {
    setSelectedShipmentId(state, action: PayloadAction<string | null>) {
      state.selectedShipmentId = action.payload;
    },
    openAppointmentModal(state) {
      state.showAppointmentModal = true;
    },
    closeAppointmentModal(state) {
      state.showAppointmentModal = false;
    },
    setAppointmentForm(state, action: PayloadAction<Partial<LogisticsState['appointmentForm']>>) {
      state.appointmentForm = { ...state.appointmentForm, ...action.payload };
    },
    setNewTemperatureInput(state, action: PayloadAction<string>) {
      state.newTemperatureInput = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchShipments
    builder.addCase(fetchShipmentsThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchShipmentsThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.hasFetched = true;
      state.shipments = Array.isArray(action.payload) ? action.payload : [];
      if (state.shipments.length > 0 && !state.selectedShipmentId) {
        state.selectedShipmentId = state.shipments[0]._id;
      }
    });
    builder.addCase(fetchShipmentsThunk.rejected, (state, action) => {
      state.loading = false;
      state.hasFetched = true;
      state.error = action.payload as string;
    });

    // confirmAppointment
    builder.addCase(confirmAppointmentThunk.fulfilled, (state, action) => {
      const updated = action.payload;
      const index = state.shipments.findIndex((s) => s._id === updated._id);
      if (index !== -1) {
        state.shipments[index] = updated;
      } else {
        state.shipments.push(updated);
      }
      state.showAppointmentModal = false;
      state.appointmentForm = {
        pickupWindowStart: '',
        pickupWindowEnd: '',
        carrierName: '',
        carrierDotNumber: '',
      };
    });

    // updateShipmentStatus
    builder.addCase(updateShipmentStatusThunk.fulfilled, (state, action) => {
      const updated = action.payload;
      const index = state.shipments.findIndex((s) => s._id === updated._id);
      if (index !== -1) {
        state.shipments[index] = updated;
      }
    });

    // addTemperatureLog
    builder.addCase(addTemperatureLogThunk.fulfilled, (state, action) => {
      const updated = action.payload;
      const index = state.shipments.findIndex((s) => s._id === updated._id);
      if (index !== -1) {
        state.shipments[index] = updated;
      }
      state.newTemperatureInput = '';
    });
  },
});

export const {
  setSelectedShipmentId,
  openAppointmentModal,
  closeAppointmentModal,
  setAppointmentForm,
  setNewTemperatureInput,
} = logisticsSlice.actions;

export const selectShipments = (state: RootState) => state.logistics.shipments;
export const selectShipmentsLoading = (state: RootState) => state.logistics.loading;
export const selectHasFetched = (state: RootState) => state.logistics.hasFetched;
export const selectSelectedShipmentId = (state: RootState) => state.logistics.selectedShipmentId;
export const selectSelectedShipment = createSelector(
  [selectShipments, selectSelectedShipmentId],
  (shipments, selectedId) => (selectedId ? shipments.find((s) => s._id === selectedId) || null : null)
);
export const selectShowAppointmentModal = (state: RootState) => state.logistics.showAppointmentModal;
export const selectAppointmentForm = (state: RootState) => state.logistics.appointmentForm;
export const selectNewTemperatureInput = (state: RootState) => state.logistics.newTemperatureInput;

export default logisticsSlice.reducer;
