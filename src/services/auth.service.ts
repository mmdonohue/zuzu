// src/services/auth.service.ts
import axios from 'axios';
import { csrfService } from './csrf.service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyCodeData {
  userId: string;
  code: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: User;
    requiresVerification?: boolean;
    userId?: string;
  };
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Include cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include CSRF token
api.interceptors.request.use(
  async (config) => {
    // For state-changing requests, include CSRF token
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        const csrfToken = await csrfService.getToken();
        config.headers['X-CSRF-Token'] = csrfToken;
      } catch (error) {
        console.error('Failed to get CSRF token:', error);
        // Continue without CSRF token (request will likely fail, but that's expected)
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle CSRF token validation failures
    if (error.response?.status === 403 &&
        error.response?.data?.code === 'CSRF_VALIDATION_FAILED' &&
        !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;

      console.warn('CSRF token invalid, refreshing...');
      try {
        // Refresh CSRF token and retry the request
        await csrfService.refreshToken();
        return api(originalRequest);
      } catch (csrfError) {
        console.error('Failed to refresh CSRF token:', csrfError);
        return Promise.reject(error);
      }
    }

    // Allow refresh for /me endpoint, but not for login/signup/refresh itself
    const isLoginOrSignup = originalRequest?.url?.includes('/auth/login') ||
                           originalRequest?.url?.includes('/auth/signup') ||
                           originalRequest?.url?.includes('/auth/verify-code');
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh-token');

    // Retry with refresh for 401 errors, except during login/signup/refresh
    if (error.response?.status === 401 && !isLoginOrSignup && !isRefreshRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      try {
        await api.post('/auth/refresh-token');
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth state
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

class AuthService {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await api.post('/auth/signup', data);
    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  }

  async verifyCode(data: VerifyCodeData): Promise<AuthResponse> {
    const response = await api.post('/auth/verify-code', data);
    if (response.data.success && response.data.data?.user) {
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  }

  async resendCode(userId: string): Promise<AuthResponse> {
    const response = await api.post('/auth/resend-code', { userId });
    return response.data;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        const user = response.data.data;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
      return null;
    } catch (error) {
      // Only clear localStorage if we get a 401 (unauthorized)
      // Don't clear on network errors or server restarts
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('user');
      }
      return null;
    }
  }

  async requestPasswordReset(email: string): Promise<AuthResponse> {
    const response = await api.post('/auth/password-reset-request', { email });
    return response.data;
  }

  async confirmPasswordReset(token: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/password-reset-confirm', { token, password });
    return response.data;
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.getStoredUser() !== null;
  }
}

export default new AuthService();
