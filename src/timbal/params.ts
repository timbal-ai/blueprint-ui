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

/**
 * Parameters for upload requests
 */
export interface UploadParams {
  /**
   * Organization ID (optional, defaults to env var)
   */
  orgId?: string;

  /**
   * The file to upload (Blob or File)
   */
  file: Blob | File;

  /**
   * Optional custom name for the file
   */
  name?: string;
}

/**
 * Result from an upload request
 */
export interface UploadResult {
  /**
   * Unique identifier for the file
   */
  id: number;

  /**
   * The name of the file
   */
  name: string;

  /**
   * The URL where the file can be accessed
   */
  url: string;

  /**
   * The content type of the file
   */
  content_type: string;

  /**
   * The content length of the file in bytes
   */
  content_length: number;

  /**
   * The time the file was created
   */
  created_at: string;

  /**
   * The time the file expires at (optional)
   */
  expires_at?: string | null;
}
