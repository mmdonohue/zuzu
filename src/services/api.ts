// API service for making requests to the backend

import { API_CONFIG } from '../config/api';
import { csrfService } from './csrf.service';

// Base API URL
const API_URL =  API_CONFIG.API_URL;

// Helper for handling response status
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    // If CSRF token is invalid, refresh it and let the caller retry
    if (response.status === 403 && errorData?.code === 'CSRF_VALIDATION_FAILED') {
      console.warn('CSRF token invalid, refreshing...');
      await csrfService.refreshToken();
    }

    throw new Error(
      errorData?.message || `API error: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};

/**
 * Enhanced fetch that includes CSRF token for state-changing requests
 *
 * Usage:
 * - For GET requests: Works like normal fetch
 * - For POST/PUT/DELETE/PATCH: Automatically includes CSRF token in X-CSRF-Token header
 * - Always includes credentials for cookie-based authentication
 *
 * @example
 * const response = await fetchWithCsrf('/api/users', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: 'John' })
 * });
 */
export const fetchWithCsrf = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const method = options.method?.toUpperCase() || 'GET';

  // For state-changing requests, include CSRF token
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      const csrfToken = await csrfService.getToken();

      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken
      };
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      // Continue without CSRF token (request will likely fail, but that's expected)
    }
  }

  // Always include credentials for cookie-based auth
  options.credentials = options.credentials || 'include';

  try{
    return await fetch(url, options);
  } catch (error) {
    console.error('Fetch error:', error);
    return Promise.reject(error);
  }
};

// Example API function to fetch a hello message
export const fetchHello = async () => {
  try {
    const response = await fetch(`${API_URL}/hello`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching hello message:', error);
    throw error;
  }
};

// Code Review API functions
export const fetchCodeReviewSummary = async () => {
  try {
    const response = await fetch(`${API_URL}/review/summary`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching code review summary:', error);
    throw error;
  }
};

export const fetchCodeReviewDetails = async (category: string) => {
  try {
    const response = await fetch(`${API_URL}/review/details/${category}`);
    return handleResponse(response);
  } catch (error) {
    console.error(`Error fetching code review details for ${category}:`, error);
    throw error;
  }
};

// Add more API functions as needed