// Global Type Definitions

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  lastActive?: string;
}

// Authentication types
export interface AuthResponse {
  user: User | null;
  session: {
    access_token: string;
    expires_at?: number;
    refresh_token?: string;
  } | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: string;
  statusCode?: number;
}

// Item types (for example REST API)
export interface Item {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

// Notification types
export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// Query hook types
export interface QueryConfig<TData = unknown, TError = Error> {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  retry?: boolean | number;
  staleTime?: number;
  cacheTime?: number;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

// Redux state types
export interface RootState {
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  };
  ui: {
    isDarkMode: boolean;
    sidebarOpen: boolean;
    notifications: Notification[];
    loading: {
      [key: string]: boolean;
    };
  };
}