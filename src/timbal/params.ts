/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Parameters for query requests
 */
export interface QueryParams {
  /**
   * Organization ID (optional, defaults to env var)
   */
  orgId?: string;

  /**
   * Knowledge base ID (optional, defaults to env var)
   */
  kbId?: string;

  /**
   * SQL query to execute
   */
  sql: string;
}

/**
 * Result from a query request
 */
export interface QueryResult {
  [key: string]: any;
}

/**
 * Parameters for run requests
 */
export interface RunParams {
  /**
   * Organization ID (optional, defaults to env var)
   */
  orgId?: string;

  /**
   * Application ID to run
   */
  appId: string;

  /**
   * Optional version ID to use
   */
  versionId?: string;

  /**
   * Input data for the run
   */
  input: Record<string, any>;
}
