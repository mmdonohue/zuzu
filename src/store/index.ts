import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './slices/authSlice';
import { uiSlice } from './slices/uiSlice';
import { templatesSlice } from './slices/templatesSlice';
import { openRouterSlice } from './slices/openRouterSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
    templates: templatesSlice.reducer,
    openRouter: openRouterSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;