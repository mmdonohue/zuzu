// src/utils/api.ts
// Fetch wrapper with automatic token refresh

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  // If already refreshing, wait for that promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      // console.log('[refreshToken] Attempting to refresh token at:', `${API_URL}/auth/refresh-token`);
      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
      });

      // console.log('[refreshToken] Refresh response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
       // console.error('[refreshToken] Refresh failed with status:', response.status, 'Response:', errorText);
        throw new Error(`Refresh failed: ${response.status}`);
      }

      // console.log('[refreshToken] Token refresh successful');
      return true;
    } catch (error) {
      // console.error('[refreshToken] Error during refresh:', error);
      // Refresh failed, clear user and redirect to login
      localStorage.removeItem('user');
      window.location.href = '/login';
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Helper to build full API URL
function buildUrl(path: string): string {
  // If path already starts with http, return as-is
  if (path.startsWith('http')) {
    return path;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // If path starts with 'api/', remove it since API_URL already includes /api
  const finalPath = cleanPath.startsWith('api/') ? cleanPath.substring(4) : cleanPath;

  return `${API_URL}/${finalPath}`;
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Build full URL
  const fullUrl = buildUrl(url);

  // Ensure credentials are included
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
  };

  // Make the request
  let response = await fetch(fullUrl, fetchOptions);

  // If 401 and not already a refresh request, try to refresh token
  const not_authorized_status = 401
  if (response.status === not_authorized_status && !url.includes('/auth/')) {
    // console.log(`[apiFetch] Got ${not_authorized_status}, attempting token refresh for:`, fullUrl);
    const refreshed = await refreshToken();

    if (refreshed) {
      // console.log('[apiFetch] Token refresh successful, retrying request');
      // Retry the original request
      response = await fetch(fullUrl, fetchOptions);
    } else {
      // console.error('[apiFetch] Token refresh failed, redirecting to login');
    }
  }

  return response;
}
