/**
 * Environment detection utilities
 */

/**
 * Check if the application is running in local development environment
 */
export const isLocalEnvironment = (): boolean => {
  // Check for explicit environment variable
  if (process.env.REACT_APP_ENVIRONMENT === 'local' || process.env.REACT_APP_ENVIRONMENT === 'development') {
    return true;
  }

  // Check if running on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  }

  // Default to false for server-side rendering or when window is not available
  return false;
};

/**
 * Check if the application is running in production environment
 */
export const isProductionEnvironment = (): boolean => {
  return !isLocalEnvironment();
};

/**
 * Get the current environment name
 */
export const getEnvironment = (): 'local' | 'production' => {
  return isLocalEnvironment() ? 'local' : 'production';
};
