import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabase';

// Define the User type
type User = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during login';
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password, name }: { email: string; password: string; name: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during registration';
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during logout';
      return rejectWithValue(message);
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      // Fix: Don't assign the payload directly, copy the properties
      if (action.payload) {
        state.isAuthenticated = true;
        // Create a new user object with the correct properties
        state.user = {
          id: action.payload.id,
          email: action.payload.email,
          name: action.payload.name,
          avatar_url: action.payload.avatar_url
        };
      } else {
        state.isAuthenticated = false;
        state.user = null;
      }
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login cases
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      
      // Fix: Transform the supabase user format to our User interface
      if (action.payload.user) {
        state.user = {
          id: action.payload.user.id,
          email: action.payload.user.email || '',
          // Get name and avatar from user metadata if available
          name: action.payload.user.user_metadata?.name,
          avatar_url: action.payload.user.user_metadata?.avatar_url
        };
      }
      
      state.token = action.payload.session?.access_token || null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Register cases
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      
      // Fix: Transform the supabase user format to our User interface
      if (action.payload.user) {
        state.user = {
          id: action.payload.user.id,
          email: action.payload.user.email || '',
          // Get name from user metadata if available
          name: action.payload.user.user_metadata?.name,
          avatar_url: action.payload.user.user_metadata?.avatar_url
        };
      }
      
      state.token = action.payload.session?.access_token || null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout cases
    builder.addCase(logoutUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      return initialState;
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setUser, setToken, clearError } = authSlice.actions;

export default authSlice.reducer;