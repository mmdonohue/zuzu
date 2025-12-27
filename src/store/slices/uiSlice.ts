import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Notification = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

type UiState = {
  isDarkMode: boolean;
  sidebarOpen: boolean;
  notifications: Notification[];
  loading: {
    [key: string]: boolean;
  };
}

const initialState: UiState = {
  isDarkMode: false,
  sidebarOpen: true,
  notifications: [],
  loading: {},
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarState: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({
        id,
        ...action.payload,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      const { key, isLoading } = action.payload;
      state.loading[key] = isLoading;
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleDarkMode,
  toggleSidebar,
  setSidebarState,
  addNotification,
  removeNotification,
  setLoading,
  clearAllNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;