/**
 * CSRF Token Service
 *
 * Manages CSRF token fetching and storage for API requests.
 * The token is required for all state-changing operations (POST, PUT, DELETE, PATCH).
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class CsrfService {
  private csrfToken: string | null = null;
  private fetchPromise: Promise<string> | null = null;

  /**
   * Fetch CSRF token from the server
   */
  private async fetchToken(): Promise<string> {
    try {
      const response = await fetch(`${API_URL}/csrf-token`, {
        method: 'GET',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      this.csrfToken = data.csrfToken;
      return data.csrfToken;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      throw error;
    }
  }

  /**
   * Get the current CSRF token, fetching it if necessary
   */
  async getToken(): Promise<string> {
    // If we already have a token, return it
    if (this.csrfToken) {
      return this.csrfToken;
    }

    // If a fetch is already in progress, wait for it
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Otherwise, start a new fetch
    this.fetchPromise = this.fetchToken();

    try {
      const token = await this.fetchPromise;
      return token;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Clear the stored token (e.g., on logout or token expiration)
   */
  clearToken(): void {
    this.csrfToken = null;
  }

  /**
   * Refresh the CSRF token
   */
  async refreshToken(): Promise<string> {
    this.clearToken();
    return this.getToken();
  }

  /**
   * Check if we have a CSRF token
   */
  hasToken(): boolean {
    return this.csrfToken !== null;
  }
}

// Export a singleton instance
export const csrfService = new CsrfService();
