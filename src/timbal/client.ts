import { authConfig } from "@/auth/config";
import { sleep } from "@/lib/utils";
import { TimbalConfig, TimbalApiResponse, TimbalSession } from "./types";
import {
  QueryParams,
  QueryResult,
  RunParams,
  UploadParams,
  UploadResult,
} from "./params";
import { TimbalApiError } from "./errors";
import { TimbalEvent, OutputEvent, parseEvent } from "./events";

export class Timbal {
  config: TimbalConfig;
  private _ready: Promise<void>;
  private _resolveReady!: () => void;
  private _isReady: boolean = false;
  private _session: TimbalSession | null = null;
  private _sessionPromise: Promise<TimbalSession> | null = null;

  constructor(config: TimbalConfig = {}) {
    // Create the ready promise that will be resolved when auth is synced
    this._ready = new Promise<void>((resolve) => {
      this._resolveReady = resolve;
    });
    const apiKey = config.apiKey ?? import.meta.env.VITE_TIMBAL_API_KEY;
    const baseUrl = config.baseUrl ?? import.meta.env.VITE_TIMBAL_BASE_URL;
    const fsPort = config.fsPort ?? import.meta.env.VITE_TIMBAL_FS_PORT;

    // Validate that either timbalIAM is enabled or apiKey is provided
    if (!authConfig.timbalIAM && !apiKey) {
      throw new Error("API key is required when Timbal IAM is not enabled");
    }

    // Validate that baseUrl is provided
    if (!baseUrl) {
      throw new Error(
        "Base URL is required. Set VITE_TIMBAL_BASE_URL in your .env file or pass it in config.",
      );
    }

    this.config = {
      ...config,
      apiKey,
      baseUrl,
      fsPort,
      defaultHeaders: config.defaultHeaders ?? {},
    };
  }

  /**
   * Update the session token
   * This should be called by the SessionProvider when the session changes
   */
  updateSessionToken(token: string | undefined) {
    this.config.sessionToken = token;
    // Clear cached session when token changes
    this._session = null;
    // Mark as ready once the token has been synced (even if undefined - means auth checked)
    if (!this._isReady) {
      this._isReady = true;
      this._resolveReady();
    }
  }

  private buildUrl(endpoint: string, baseUrlOverride?: string): string {
    let baseUrl: string;
    if (baseUrlOverride) {
      baseUrl = baseUrlOverride.endsWith("/")
        ? baseUrlOverride.slice(0, -1)
        : baseUrlOverride;
    } else {
      baseUrl = this.config.baseUrl.endsWith("/")
        ? this.config.baseUrl.slice(0, -1)
        : this.config.baseUrl;
    }
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${baseUrl}${path}`;
  }

  private buildHeaders(options: RequestInit = {}): Headers {
    const headers = new Headers();

    if (this.config.defaultHeaders) {
      Object.entries(this.config.defaultHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    // Set authorization header based on available auth method (priority: apiKey > sessionToken)
    if (this.config.apiKey) {
      headers.set("Authorization", `Bearer ${this.config.apiKey}`);
    } else if (this.config.sessionToken) {
      headers.set("Authorization", `Bearer ${this.config.sessionToken}`);
    }

    if (options.headers) {
      const optHeaders =
        options.headers instanceof Headers
          ? options.headers
          : new Headers(options.headers as Record<string, string>);
      optHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    return headers;
  }

  private async _fetch(
    endpoint: string,
    options: RequestInit = {},
    baseUrlOverride?: string,
  ): Promise<Response> {
    // Wait for auth to be ready before making any request
    await this._ready;

    const url = this.buildUrl(endpoint, baseUrlOverride);
    const headers = this.buildHeaders(options);
    const requestOptions: RequestInit = { ...options, headers };

    const controller = new AbortController();
    const timeoutId = this.config.timeout
      ? setTimeout(() => controller.abort(), this.config.timeout)
      : null;

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        throw await TimbalApiError.fromResponse(response);
      }

      return response;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new TimbalApiError("Request timeout", 0, "TIMEOUT_ERROR");
      }

      if (error instanceof TypeError) {
        throw new TimbalApiError(
          `Network error: ${error.message}`,
          0,
          "NETWORK_ERROR",
        );
      }

      if (error instanceof TimbalApiError) {
        throw error;
      }

      throw new TimbalApiError(
        `Unknown error occurred: ${error}`,
        0,
        "SERVER_ERROR",
      );
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
    baseUrlOverride?: string,
  ): Promise<TimbalApiResponse<T>> {
    // Set default Content-Type for JSON if body is present and no Content-Type is set
    if (options.body && typeof options.body === "string") {
      options.headers = options.headers || {};
      const headers = options.headers as Record<string, string>;
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
    }
    try {
      const response = await this._fetch(endpoint, options, baseUrlOverride);
      const data = (await response.json()) as T;
      return {
        data,
        success: true,
        statusCode: response.status,
      };
    } catch (error) {
      if (error instanceof TimbalApiError) {
        const shouldRetry =
          (error.code === "TIMEOUT_ERROR" ||
            error.code === "NETWORK_ERROR" ||
            error.statusCode >= 500) &&
          retryCount < this.config.retryAttempts;

        if (shouldRetry) {
          await sleep(this.config.retryDelay * (retryCount + 1));
          return this.request<T>(
            endpoint,
            options,
            retryCount + 1,
            baseUrlOverride,
          );
        }
      }
      throw error;
    }
  }

  async *stream(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
    baseUrlOverride?: string,
  ): AsyncGenerator<string, void, unknown> {
    try {
      const response = await this._fetch(endpoint, options, baseUrlOverride);
      if (!response.body) {
        throw new TimbalApiError(
          "Response body is null",
          response.status,
          "NO_BODY",
        );
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          yield chunk;
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof TimbalApiError) {
        const shouldRetry =
          (error.code === "TIMEOUT_ERROR" ||
            error.code === "NETWORK_ERROR" ||
            error.statusCode >= 500) &&
          retryCount < this.config.retryAttempts;

        if (shouldRetry) {
          await sleep(this.config.retryDelay * (retryCount + 1));
          yield* this.stream(
            endpoint,
            options,
            retryCount + 1,
            baseUrlOverride,
          );
          return;
        }
      }
      throw error;
    }
  }

  async query(params: QueryParams): Promise<TimbalApiResponse<QueryResult>> {
    const orgId = params.orgId ?? import.meta.env.VITE_TIMBAL_ORG_ID;
    const kbId = params.kbId ?? import.meta.env.VITE_TIMBAL_KB_ID;

    if (!orgId || !kbId) {
      throw new Error("orgId and kbId are required for query");
    }

    return this.request<QueryResult>(`/orgs/${orgId}/kbs/${kbId}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql: params.sql }),
    });
  }

  async run(params: RunParams): Promise<TimbalApiResponse<OutputEvent>> {
    const orgId = params.orgId ?? import.meta.env.VITE_TIMBAL_ORG_ID;

    if (!orgId) {
      throw new Error("orgId is required for run");
    }

    let baseUrlOverride: string | undefined;
    if (this.config.fsPort) {
      baseUrlOverride = `http://localhost:${this.config.fsPort}`;
    }

    // TODO We need to generate the context in here

    return this.request<OutputEvent>(
      `/orgs/${orgId}/apps/${params.appId}/runs/collect`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId: params.versionId ?? null,
          input: params.input,
        }),
      },
      0,
      baseUrlOverride,
    );
  }

  /**
   * Get the current user's session
   * Returns cached data if available, otherwise fetches from GET /me
   * Deduplicates concurrent requests to prevent multiple API calls
   *
   * @param forceRefresh - If true, fetches fresh data even if cached
   *
   * @example
   * ```ts
   * const session = await timbal.getSession();
   * console.log('Current user:', session.user_email);
   * ```
   */
  async getSession(forceRefresh = false): Promise<TimbalSession> {
    if (this._session && !forceRefresh) {
      return this._session;
    }

    // Deduplicate concurrent requests
    if (this._sessionPromise && !forceRefresh) {
      return this._sessionPromise;
    }

    this._sessionPromise = this.request<{ session: TimbalSession }>("/me", {
      method: "GET",
    }).then((response) => {
      this._session = response.data.session;
      this._sessionPromise = null;
      return this._session;
    });

    return this._sessionPromise;
  }

  /**
   * Upload a file to an organization
   *
   * @example
   * ```ts
   * // Upload from a File input
   * const fileInput = document.querySelector('input[type="file"]');
   * const file = fileInput.files[0];
   * const result = await timbal.upload({ file });
   * console.log('Uploaded:', result.data.url);
   *
   * // Upload with custom name
   * const result = await timbal.upload({ file: myBlob, name: 'custom-image.png' });
   * ```
   */
  async upload(params: UploadParams): Promise<TimbalApiResponse<UploadResult>> {
    const orgId = params.orgId ?? import.meta.env.VITE_TIMBAL_ORG_ID;

    if (!orgId) {
      throw new Error("orgId is required for upload");
    }

    const formData = new FormData();

    if (params.name && params.file instanceof Blob) {
      formData.append("file", params.file, params.name);
    } else {
      formData.append("file", params.file);
    }

    return this.requestFormData<UploadResult>(`/orgs/${orgId}/files`, formData);
  }

  /**
   * Make a request with FormData (multipart/form-data)
   * Note: Content-Type header is intentionally not set to let the browser handle it
   */
  private async requestFormData<T>(
    endpoint: string,
    formData: FormData,
    retryCount = 0,
  ): Promise<TimbalApiResponse<T>> {
    try {
      const response = await this._fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as T;
      return {
        data,
        success: true,
        statusCode: response.status,
      };
    } catch (error) {
      if (error instanceof TimbalApiError) {
        const shouldRetry =
          (error.code === "TIMEOUT_ERROR" ||
            error.code === "NETWORK_ERROR" ||
            error.statusCode >= 500) &&
          retryCount < this.config.retryAttempts;

        if (shouldRetry) {
          await sleep(this.config.retryDelay * (retryCount + 1));
          return this.requestFormData<T>(endpoint, formData, retryCount + 1);
        }
      }
      throw error;
    }
  }

  /**
   * Stream events from a run execution
   * Parses Server-Sent Events (SSE) or newline-delimited JSON events
   *
   * @example
   * ```ts
   * for await (const event of timbal.streamRun({ appId: 'my-app', input: { query: 'hello' } })) {
   *   if (event.type === 'START') {
   *     console.log('Step started:', event.status_text);
   *   } else if (event.type === 'OUTPUT') {
   *     console.log('Step completed:', event.output);
   *   }
   * }
   * ```
   */
  async *streamRun(
    params: RunParams,
  ): AsyncGenerator<TimbalEvent, void, unknown> {
    const orgId = params.orgId ?? import.meta.env.VITE_TIMBAL_ORG_ID;

    if (!orgId) {
      throw new Error("orgId is required for run");
    }

    let baseUrlOverride: string | undefined;
    if (this.config.fsPort) {
      baseUrlOverride = `http://localhost:${this.config.fsPort}`;
    }

    // TODO Generate the context from here

    const endpoint = `/orgs/${orgId}/apps/${params.appId}/runs/stream`;
    const options: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionId: params.versionId ?? null,
        input: params.input,
      }),
    };

    let buffer = "";

    // Use the existing stream() method and parse events from chunks
    for await (const chunk of this.stream(
      endpoint,
      options,
      0,
      baseUrlOverride,
    )) {
      // Append new data to buffer
      buffer += chunk;

      // Process complete lines
      const lines = buffer.split("\n");
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Skip SSE comments and metadata fields (lines starting with :, id:, event:, retry:)
        if (
          trimmed.startsWith(":") ||
          trimmed.startsWith("id:") ||
          trimmed.startsWith("event:") ||
          trimmed.startsWith("retry:")
        ) {
          continue;
        }

        // Handle SSE format (data: {...})
        if (trimmed.startsWith("data: ")) {
          const jsonData = trimmed.substring(6).trim(); // Remove "data: " prefix
          if (!jsonData || jsonData === "[DONE]") continue; // Skip empty or done marker

          try {
            const event = parseEvent(jsonData);
            yield event;
          } catch (error) {
            console.warn("Failed to parse SSE event:", error, "Raw:", jsonData);
          }
        } else {
          // Handle plain newline-delimited JSON - must start with {
          if (!trimmed.startsWith("{")) {
            // Skip non-JSON lines
            continue;
          }

          try {
            const event = parseEvent(trimmed);
            yield event;
          } catch (error) {
            console.warn("Failed to parse event:", error, "Raw:", trimmed);
          }
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.trim()) {
      try {
        const event = parseEvent(buffer.trim());
        yield event;
      } catch (error) {
        console.warn("Failed to parse final event:", error, buffer);
      }
    }
  }
}

/**
 * Singleton Timbal client instance
 * Can be imported and used anywhere in the application, including service files
 *
 * @example
 * ```ts
 * import { timbal } from '@/timbal/client';
 *
 * // In any service file
 * const result = await timbal.query({ sql: 'SELECT * FROM users' });
 * ```
 */
export const timbal = new Timbal();
