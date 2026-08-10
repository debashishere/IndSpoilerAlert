// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './inventorySlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values if needed (e.g., editor instances)
        ignoredActions: [],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;