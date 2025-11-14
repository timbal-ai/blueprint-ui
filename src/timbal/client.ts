import { authConfig } from "@/auth/provider";
import { sleep } from "@/lib/utils";
import { TimbalConfig, TimbalApiResponse, QueryParams, QueryResult } from './types';
import { TimbalApiError } from './errors';


export class Timbal {
    config: TimbalConfig;

    constructor(config: TimbalConfig = {}) {
        const apiKey = config.apiKey ?? import.meta.env.VITE_TIMBAL_API_KEY;
        const baseUrl = config.baseUrl ?? import.meta.env.VITE_TIMBAL_BASE_URL;

        // Validate that either timbalIAM is enabled or apiKey is provided
        if (!authConfig.timbalIAM && !apiKey) {
            throw new Error('API key is required when Timbal IAM is not enabled');
        }

        // Validate that baseUrl is provided
        if (!baseUrl) {
            throw new Error('Base URL is required. Set VITE_TIMBAL_BASE_URL in your .env file or pass it in config.');
        }

        this.config = {
            ...config,
            apiKey,
            baseUrl,
            defaultHeaders: config.defaultHeaders ?? {},
        };
    }

    private buildUrl(endpoint: string): string {
        const baseUrl = this.config.baseUrl.endsWith('/')
            ? this.config.baseUrl.slice(0, -1)
            : this.config.baseUrl;
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
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
            headers.set('Authorization', `Bearer ${this.config.apiKey}`);
        } else if (this.config.sessionToken) {
            headers.set('x-auth-token', this.config.sessionToken);
        }

        if (options.headers) {
            const optHeaders = options.headers instanceof Headers
                ? options.headers
                : new Headers(options.headers as Record<string, string>);
            optHeaders.forEach((value, key) => {
                headers.set(key, value);
            });
        }

        return headers;
    }

    private async _fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
        const url = this.buildUrl(endpoint);
        const headers = this.buildHeaders(options);
        console.log(url)
        console.log(headers)
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
            
            if (error instanceof Error && error.name === 'AbortError') {
                throw new TimbalApiError('Request timeout', 0, 'TIMEOUT_ERROR');
            }

            if (error instanceof TypeError) {
                throw new TimbalApiError(`Network error: ${error.message}`, 0, 'NETWORK_ERROR');
            }

            if (error instanceof TimbalApiError) {
                throw error;
            }

            throw new TimbalApiError(`Unknown error occurred: ${error}`, 0, 'SERVER_ERROR');
        }
    }

    async request<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<TimbalApiResponse<T>> {
        // Set default Content-Type for JSON if body is present and no Content-Type is set
        if (options.body && typeof options.body === 'string') {
            options.headers = options.headers || {};
            const headers = options.headers as Record<string, string>;
            if (!headers['Content-Type'] && !headers['content-type']) {
                headers['Content-Type'] = 'application/json';
            }
        }
        try {
            const response = await this._fetch(endpoint, options);
            const data = (await response.json()) as T;
            return {
                data,
                success: true,
                statusCode: response.status,
            };
        } catch (error) {
            if (error instanceof TimbalApiError) {
                const shouldRetry = 
                    (error.code === 'TIMEOUT_ERROR' || 
                     error.code === 'NETWORK_ERROR' || 
                     error.statusCode >= 500) &&
                    retryCount < this.config.retryAttempts;

                if (shouldRetry) {
                    await sleep(this.config.retryDelay * (retryCount + 1));
                    return this.request<T>(endpoint, options, retryCount + 1);
                }
            }
            throw error;
        }
    }

    async *stream(endpoint: string, options: RequestInit = {}, retryCount = 0): AsyncGenerator<string, void, unknown> {
        try {
            const response = await this._fetch(endpoint, options);
            if (!response.body) {
                throw new TimbalApiError('Response body is null', response.status, 'NO_BODY');
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
                    (error.code === 'TIMEOUT_ERROR' || 
                     error.code === 'NETWORK_ERROR' || 
                     error.statusCode >= 500) &&
                    retryCount < this.config.retryAttempts;

                if (shouldRetry) {
                    await sleep(this.config.retryDelay * (retryCount + 1));
                    yield* this.stream(endpoint, options, retryCount + 1);
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
            throw new Error('orgId and kbId are required for query');
        }

        return this.request<QueryResult>(`/orgs/${orgId}/kbs/${kbId}/query`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ sql: params.sql }),
        });
    }
}
