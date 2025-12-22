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

  return fetch(url, options);
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

// Mock users for the dashboard example
// In a real app, you would fetch this from the API
export const fetchUsers = async () => {
  // Simulate API call with timeout
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock users data
  return [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      lastActive: '2025-03-30',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Editor',
      lastActive: '2025-03-29',
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      role: 'User',
      lastActive: '2025-03-28',
    },
    {
      id: 4,
      name: 'Sarah Williams',
      email: 'sarah.williams@example.com',
      role: 'User',
      lastActive: '2025-03-27',
    },
    {
      id: 5,
      name: 'Alex Brown',
      email: 'alex.brown@example.com',
      role: 'Editor',
      lastActive: '2025-03-26',
    },
  ];
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