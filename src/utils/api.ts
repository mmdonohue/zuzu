// src/utils/api.ts
// Fetch wrapper with automatic token refresh

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
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      return true;
    } catch (error) {
      // Refresh failed, redirect to login
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

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Ensure credentials are included
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
  };

  // Make the request
  let response = await fetch(url, fetchOptions);

  // If 401 and not already a refresh request, try to refresh token
  if (response.status === 401 && !url.includes('/auth/')) {
    const refreshed = await refreshToken();

    if (refreshed) {
      // Retry the original request
      response = await fetch(url, fetchOptions);
    }
  }

  return response;
}
