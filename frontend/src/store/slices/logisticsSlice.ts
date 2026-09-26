import { createSlice, createAsyncThunk, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import { LogisticsService, type ConfirmAppointmentPayload, type ColdChainLogPayload } from '../../services/logisticsService';
import type { RootState } from '../index';

export interface LogisticsState {
  shipments: any[];
  dockAppointments: any[];
  coldChainLogs: any[];
  coldChainMetrics: {
    tempComplianceSla: string;
    fsma204VerifiedCount: number;
    status: string;
    dockSla: string;
    logisticsLinkStatus: string;
  };
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
  dockAppointments: [],
  coldChainLogs: [],
  coldChainMetrics: {
    tempComplianceSla: '100% SLA',
    fsma204VerifiedCount: 0,
    status: 'Verified',
    dockSla: '< 45 Min',
    logisticsLinkStatus: 'Active',
  },
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
      const res = await LogisticsService.confirmAppointment(shipmentId, payload);
      return res;
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
  async ({ shipmentId, temperature }: { shipmentId: string; temperature: number }, { dispatch, rejectWithValue }) => {
    try {
      const res = await LogisticsService.addTemperatureLog(shipmentId, temperature);
      dispatch(createColdChainLogThunk({ shipmentId, temperature, unit: '°F' }));
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to add temperature log');
    }
  }
);

export const fetchDockAppointmentsThunk = createAsyncThunk(
  'logistics/fetchDockAppointments',
  async (_, { rejectWithValue }) => {
    try {
      return await LogisticsService.fetchDockAppointments();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch dock appointments');
    }
  }
);

export const createDockAppointmentThunk = createAsyncThunk(
  'logistics/createDockAppointment',
  async (payload: ConfirmAppointmentPayload, { rejectWithValue }) => {
    try {
      return await LogisticsService.createDockAppointment(payload);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to schedule dock appointment');
    }
  }
);

export const fetchColdChainLogsThunk = createAsyncThunk(
  'logistics/fetchColdChainLogs',
  async (_, { rejectWithValue }) => {
    try {
      return await LogisticsService.fetchColdChainLogs();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch cold chain logs');
    }
  }
);

export const createColdChainLogThunk = createAsyncThunk(
  'logistics/createColdChainLog',
  async (payload: ColdChainLogPayload, { dispatch, rejectWithValue }) => {
    try {
      const res = await LogisticsService.createColdChainLog(payload);
      dispatch(fetchColdChainLogsThunk());
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to record cold chain log');
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

    // fetchDockAppointments
    builder.addCase(fetchDockAppointmentsThunk.fulfilled, (state, action) => {
      state.dockAppointments = Array.isArray(action.payload) ? action.payload : [];
    });

    // createDockAppointment
    builder.addCase(createDockAppointmentThunk.fulfilled, (state, action) => {
      if (action.payload && action.payload._id) {
        state.dockAppointments.unshift(action.payload);
      }
    });

    // fetchColdChainLogs
    builder.addCase(fetchColdChainLogsThunk.fulfilled, (state, action) => {
      if (action.payload) {
        state.coldChainLogs = Array.isArray(action.payload.logs) ? action.payload.logs : [];
        if (action.payload.metrics) {
          state.coldChainMetrics = { ...state.coldChainMetrics, ...action.payload.metrics };
        }
      }
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

export const selectShipments = (state: RootState) => state.logistics?.shipments || [];
export const selectShipmentsLoading = (state: RootState) => state.logistics?.loading || false;
export const selectHasFetched = (state: RootState) => state.logistics?.hasFetched || false;
export const selectSelectedShipmentId = (state: RootState) => state.logistics?.selectedShipmentId || null;
export const selectSelectedShipment = createSelector(
  [selectShipments, selectSelectedShipmentId],
  (shipments, selectedId) => (selectedId ? shipments.find((s) => s._id === selectedId) || null : null)
);
export const selectShowAppointmentModal = (state: RootState) => state.logistics?.showAppointmentModal || false;
export const selectAppointmentForm = (state: RootState) => state.logistics?.appointmentForm || {
  pickupWindowStart: '',
  pickupWindowEnd: '',
  carrierName: '',
  carrierDotNumber: '',
};
export const selectNewTemperatureInput = (state: RootState) => state.logistics?.newTemperatureInput || '';
const defaultColdChainMetrics = {
  tempComplianceSla: '100% SLA',
  fsma204VerifiedCount: 0,
  status: 'Verified',
  dockSla: '< 45 Min',
  logisticsLinkStatus: 'Active',
};

export const selectDockAppointments = (state: RootState) => state.logistics?.dockAppointments || [];
export const selectColdChainLogs = (state: RootState) => state.logistics?.coldChainLogs || [];
export const selectColdChainMetrics = (state: RootState) => state.logistics?.coldChainMetrics || defaultColdChainMetrics;

export default logisticsSlice.reducer;
