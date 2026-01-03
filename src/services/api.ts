// API service for making requests to the backend

import { API_CONFIG } from "../config/api";
import { csrfService } from "./csrf.service";
import type { TemplateVariable } from "../store/slices/templatesSlice";

// Base API URL
const API_URL = API_CONFIG.API_URL;

// Helper for handling response status
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    // If CSRF token is invalid, refresh it and let the caller retry
    if (
      response.status === 403 &&
      errorData?.code === "CSRF_VALIDATION_FAILED"
    ) {
      console.warn("CSRF token invalid, refreshing...");
      await csrfService.refreshToken();
    }

    throw new Error(
      errorData?.message ||
        `API error: ${response.status} ${response.statusText}`,
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
export const fetchWithCsrf = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const method = options.method?.toUpperCase() || "GET";

  // For state-changing requests, include CSRF token
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    try {
      const csrfToken = await csrfService.getToken();

      options.headers = {
        ...options.headers,
        "X-CSRF-Token": csrfToken,
      };
    } catch (error) {
      console.error("Failed to get CSRF token:", error);
      // Continue without CSRF token (request will likely fail, but that's expected)
    }
  }

  // Always include credentials for cookie-based auth
  options.credentials = options.credentials || "include";

  try {
    return await fetch(url, options);
  } catch (error) {
    console.error("Fetch error:", error);
    return Promise.reject(error);
  }
};

// Example API function to fetch a hello message
export const fetchHello = async () => {
  try {
    const response = await fetch(`${API_URL}/hello`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching hello message:", error);
    throw error;
  }
};

// Code Review API functions
export const fetchCodeReviewSummary = async (useExample = false) => {
  try {
    const url = useExample
      ? `${API_URL}/review/summary?example=true`
      : `${API_URL}/review/summary`;
    const response = await fetch(url);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching code review summary:", error);
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

// Template API functions
export const fetchTemplates = async (filters?: {
  category?: string;
  tag?: string;
  search?: string;
}) => {
  try {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.tag) params.append("tag", filters.tag);
    if (filters?.search) params.append("search", filters.search);

    const queryString = params.toString();
    const url = queryString
      ? `${API_URL}/templates?${queryString}`
      : `${API_URL}/templates`;

    const response = await fetch(url, {
      credentials: "include",
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw error;
  }
};

export const fetchTemplateById = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/templates/${id}`, {
      credentials: "include",
    });
    return handleResponse(response);
  } catch (error) {
    console.error(`Error fetching template ${id}:`, error);
    throw error;
  }
};

export const createTemplate = async (templateData: {
  name: string;
  description?: string;
  category: string;
  content: string;
  variables?: TemplateVariable[];
  style_guide_id?: string;
  is_public?: boolean;
  tags?: string[];
}) => {
  try {
    const response = await fetchWithCsrf(`${API_URL}/templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(templateData),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error creating template:", error);
    throw error;
  }
};

export const updateTemplate = async (
  id: string,
  updates: {
    name?: string;
    description?: string;
    category?: string;
    content?: string;
    variables?: TemplateVariable[];
    style_guide_id?: string;
    is_public?: boolean;
    tags?: string[];
    active?: boolean;
  },
) => {
  try {
    const response = await fetchWithCsrf(`${API_URL}/templates/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  } catch (error) {
    console.error(`Error updating template ${id}:`, error);
    throw error;
  }
};

export const deleteTemplate = async (id: string) => {
  try {
    const response = await fetchWithCsrf(`${API_URL}/templates/${id}`, {
      method: "DELETE",
    });
    return handleResponse(response);
  } catch (error) {
    console.error(`Error deleting template ${id}:`, error);
    throw error;
  }
};

export const trackTemplateUsage = async (
  templateId: string,
  modelUsed?: string,
) => {
  try {
    const response = await fetchWithCsrf(`${API_URL}/templates/usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: templateId,
        model_used: modelUsed,
      }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error tracking template usage:", error);
    throw error;
  }
};

// Style Guide API functions
export const fetchStyleGuides = async () => {
  try {
    const response = await fetch(`${API_URL}/style-guides`, {
      credentials: "include",
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching style guides:", error);
    throw error;
  }
};

export const fetchStyleGuideById = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/style-guides/${id}`, {
      credentials: "include",
    });
    return handleResponse(response);
  } catch (error) {
    console.error(`Error fetching style guide ${id}:`, error);
    throw error;
  }
};

// Prompt Enhancement API functions
export const enhancePrompt = async (data: {
  prompt: string;
  style_guide_id?: string;
  context?: string;
}) => {
  try {
    const response = await fetchWithCsrf(`${API_URL}/openrouter/enhance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    throw error;
  }
};

// Add more API functions as needed
