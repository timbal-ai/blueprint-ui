/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Timbal client configuration
 */
export interface TimbalConfig {
  /**
   * API key for authentication (alternative to session token)
   */
  apiKey?: string;

  /**
   * Base URL for the Timbal API
   */
  baseUrl?: string;

  /**
   * When running in dev mode locally
   */
  fsPort?: number;

  /**
   * Default headers to include in all requests
   */
  defaultHeaders?: Record<string, string>;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Number of retry attempts for failed requests
   */
  retryAttempts?: number;

  /**
   * Delay between retries in milliseconds
   */
  retryDelay?: number;

  /**
   * Session token for IAM authentication
   */
  sessionToken?: string;
}

/**
 * Standard API response wrapper
 */
export interface TimbalApiResponse<T = any> {
  /**
   * The response data
   */
  data: T;

  /**
   * Whether the request was successful
   */
  success: boolean;

  /**
   * Optional message from the server
   */
  message?: string;

  /**
   * Optional error message
   */
  error?: string;

  /**
   * HTTP status code
   */
  statusCode: number;
}
