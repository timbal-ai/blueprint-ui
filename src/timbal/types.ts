/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TimbalConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  sessionToken?: string;
}

export interface TimbalApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  statusCode: number;
}

export interface QueryParams {
  orgId?: string;
  kbId?: string;
  sql: string;
}

export interface QueryResult {
  [key: string]: any;
}
