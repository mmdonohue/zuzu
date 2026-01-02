// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { User } from '@/services/auth.service';
import { isLocalEnvironment } from '@/utils/environment';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try dev auto-login (only works in local environment with TEST_USER_EMAIL set)
    const tryDevLogin = async (): Promise<User | null> => {
      try {
        const response = await fetch('/api/auth/dev-login');
        if (response.ok) {
          const data = await response.json();
          if (data.data?.user) {
            // Store user data
            authService.setStoredUser(data.data.user);
            console.log('Dev auto-login successful:', data.data.user.email);
            return data.data.user;
          }
        }
        return null;
      } catch (error) {
        // Silently fail - dev login is optional
        return null;
      }
    };

    // Check for stored user on mount
    const initAuth = async () => {
      const storedUser = authService.getStoredUser();
      if (storedUser) {
        // Set user immediately from localStorage for instant UI update
        setUser(storedUser);
        setLoading(false);

        // Verify with backend in background
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          // Update with fresh data from server
          setUser(currentUser);
        } else {
          // Only clear user if backend explicitly rejected (401)
          // Keep storedUser on network errors/server restarts
          const isServerAvailable = await checkServerHealth();
          if (isServerAvailable) {
            // Server is up but user is not authenticated
            setUser(null);
          }
          // If server is down, keep the stored user
        }
      } else {
        // No stored user - try dev auto-login if in local environment
        if (isLocalEnvironment()) {
          const devUser = await tryDevLogin();
          if (devUser) {
            setUser(devUser);
          }
        }
        setLoading(false);
      }
    };

    const checkServerHealth = async () => {
      try {
        const response = await fetch('/health');
        return response.ok;
      } catch {
        return false;
      }
    };

    initAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
