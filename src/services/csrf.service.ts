/**
 * CSRF Token Service
 *
 * Manages CSRF token fetching and storage for API requests.
 * The token is required for all state-changing operations (POST, PUT, DELETE, PATCH).
 */

class CsrfService {
  private csrfToken: string | null = null;
  private fetchPromise: Promise<string> | null = null;
  private lastFetchTime: number = 0;

  // Token is considered stale after 25 minutes (cookie expires at 30 min)
  private static readonly TOKEN_STALE_TIME_MS = 25 * 60 * 1000;

  /**
   * Fetch CSRF token from the server
   */
  private async fetchToken(): Promise<string> {
    try {
      // Use relative URL to go through webpack dev server proxy
      // This ensures the CSRF cookie is set on the same domain as our requests
      const response = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include", // Important: include cookies
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      this.csrfToken = data.csrfToken;
      this.lastFetchTime = Date.now();
      console.log("CSRF token refreshed successfully");
      return data.csrfToken;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      throw error;
    }
  }

  /**
   * Check if the current token is stale (approaching expiration)
   */
  private isTokenStale(): boolean {
    if (!this.csrfToken || !this.lastFetchTime) {
      return true;
    }
    const elapsed = Date.now() - this.lastFetchTime;
    return elapsed > CsrfService.TOKEN_STALE_TIME_MS;
  }

  /**
   * Get the current CSRF token, fetching it if necessary
   * Also refreshes if the token is approaching expiration
   */
  async getToken(): Promise<string> {
    // If we have a token and it's not stale, return it
    if (this.csrfToken && !this.isTokenStale()) {
      return this.csrfToken;
    }

    // If token is stale, log it
    if (this.csrfToken && this.isTokenStale()) {
      console.log("CSRF token is stale, refreshing...");
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
    this.lastFetchTime = 0;
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
