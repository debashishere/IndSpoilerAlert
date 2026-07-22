import { configureStore } from '@reduxjs/toolkit';
import coreReducer from './slices/coreSlice';
import ingestionReducer from './slices/ingestionSlice';
import inventoryReducer from './slices/inventorySlice';
import workflowReducer from './slices/workflowSlice';
import logisticsReducer from './slices/logisticsSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    core: coreReducer,
    ingestion: ingestionReducer,
    inventory: inventoryReducer,
    workflow: workflowReducer,
    logistics: logisticsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
