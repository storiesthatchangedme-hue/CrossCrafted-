/**
 * @module lib/api
 * @description Centralized API client for CrossCrafted frontend.
 *
 * <p>All backend HTTP requests <strong>MUST</strong> go through this module.
 * Do <strong>NOT</strong> import axios directly in page or component files.</p>
 *
 * <h3>Features</h3>
 * <ul>
 *   <li>Single source of truth for {@link BACKEND_URL}</li>
 *   <li>Automatic <code>withCredentials</code> on every request (cookie-based auth)</li>
 *   <li>Bearer token injection from Supabase session via request interceptor</li>
 *   <li>Unique {@link ApiRequestIds} request ID header (<code>X-Request-Id</code>) for log correlation</li>
 *   <li>Development-only request/response logging with timing</li>
 *   <li>Standardized timeout (15 s default, 30 s for uploads)</li>
 *   <li>Automatic retry on transient failures (408, 429, 5xx) for idempotent methods</li>
 *   <li>Centralized handling for 401 / 403 / 429 / 5xx responses</li>
 *   <li>{@link extractErrorMessage} helper for consistent user-facing error messages</li>
 *   <li>{@link uploadConfig} helper for file uploads with progress tracking</li>
 *   <li>Per-request {@link AbortController} support via <code>signal</code> option</li>
 * </ul>
 *
 * @example
 * // Basic GET
 * const { data } = await api.get('/api/users');
 *
 * @example
 * // POST with body
 * await api.post('/api/posts', { content_text: 'Hello' });
 *
 * @example
 * // File upload with progress
 * await api.post('/api/upload', formData, uploadConfig({
 *   onUploadProgress: (e) => console.log(e.loaded / e.total),
 * }));
 *
 * @example
 * // Cancellable request
 * const controller = new AbortController();
 * api.get('/api/feed', { signal: controller.signal });
 * // Later: controller.abort();
 */

import axios from 'axios';
import { supabase } from '@/lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration constants
// ═══════════════════════════════════════════════════════════════════════════

/** @type {string} Base URL for all API requests. Empty string = same origin. */
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/** @type {number} Default timeout in milliseconds for standard requests. */
const TIMEOUT_MS = 15_000;

/** @type {number} Timeout in milliseconds for file-upload requests. */
const UPLOAD_TIMEOUT_MS = 30_000;

/** @type {number} Maximum automatic retries for transient errors. */
const MAX_RETRIES = 1;

/**
 * HTTP status codes eligible for automatic retry.
 * Covers: request timeout (408), rate-limit (429), and server errors (5xx).
 * @type {number[]}
 */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/** @type {boolean} Development-only flag — controls request logging. */
const IS_DEV = process.env.NODE_ENV === 'development';

// ═══════════════════════════════════════════════════════════════════════════
// Request ID generation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @namespace ApiRequestIds
 * @description Generates unique request identifiers for log correlation.
 * Each ID has the format <code>cc-&lt;timestamp&gt;-&lt;random&gt;</code>.
 * @private
 */

/**
 * Generate a short unique request ID.
 * Format: `cc-<unix_ms_last_6>-<4_random_hex>`
 * @returns {string}
 * @private
 */
function generateRequestId() {
  const ts = Date.now().toString(36).slice(-6);
  const rand = Math.random().toString(16).slice(2, 6);
  return `cc-${ts}-${rand}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Development-only logging
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log a request to the console (development only).
 *
 * Outputs method, URL, request ID, and timing when the response arrives.
 *
 * @param {string}  method   - HTTP method (GET, POST, etc.)
 * @param {string}  url      - Fully resolved request URL
 * @param {string}  requestId - Unique request identifier
 * @param {object}  [data]   - Request body (logged for POST/PUT/PATCH only)
 * @returns {{ done: (response: object) => void }} An object with a
 *   <code>done</code> method to call when the response arrives.
 * @private
 */
function createRequestLogger(method, url, requestId, data) {
  if (!IS_DEV) return { done: () => {} };

  const start = performance.now();
  const bodyPreview =
    data && !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
      ? JSON.stringify(data).slice(0, 200)
      : undefined;

  console.groupCollapsed(
    `%c[API] %c${method} %c${url} %c${requestId}`,
    'color:#A855F7;font-weight:bold',
    'color:#38BDF8;font-weight:bold',
    'color:#94A3B8',
    'color:#64748B'
  );
  if (bodyPreview !== undefined) {
    console.log('%cBody:', 'color:#F59E0B', bodyPreview);
  }

  return {
    /** @param {object} response - Axios response or error */
    done(response) {
      const elapsed = Math.round(performance.now() - start);
      const status = response?.status ?? 'ERR';
      const color =
        status >= 200 && status < 300
          ? '#10B981'
          : status >= 400 && status < 500
            ? '#F59E0B'
            : '#EF4444';
      console.log(
        `%c${status} %c${elapsed}ms`,
        `color:${color};font-weight:bold`,
        'color:#94A3B8'
      );
      console.groupEnd();
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Centralized error classification
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Classify an Axios error into a semantic category.
 *
 * @typedef {'auth' | 'forbidden' | 'rate_limit' | 'server' | 'network' | 'timeout' | 'client' | 'unknown'} ErrorCategory
 *
 * @param {import('axios').AxiosError} error - The Axios error to classify.
 * @returns {ErrorCategory} A machine-readable category string.
 * @private
 */
function classifyError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') return 'timeout';
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error')
      return 'network';
    return 'network';
  }

  const status = error.response.status;
  if (status === 401) return 'auth';
  if (status === 403) return 'forbidden';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'server';
  return 'client';
}

// ═══════════════════════════════════════════════════════════════════════════
// Axios instance
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Shared Axios instance configured with base URL, credentials, and timeout.
 *
 * @type {import('axios').AxiosInstance}
 *
 * @example
 * import api from '@/lib/api';
 * const { data } = await api.get('/api/users');
 */
const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  timeout: TIMEOUT_MS,
});

// ═══════════════════════════════════════════════════════════════════════════
// Request interceptor — Bearer token + request ID + dev logging
// ═══════════════════════════════════════════════════════════════════════════

api.interceptors.request.use(
  /**
   * Injects the Supabase access token as a Bearer header, assigns a unique
   * request ID, and initializes a dev-mode request logger.
   *
   * @param {import('axios').InternalAxiosRequestConfig} config
   * @returns {Promise<import('axios').InternalAxiosRequestConfig>}
   */
  async (config) => {
    // --- Auth: Supabase Bearer token ---
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    // --- Request ID ---
    const requestId = generateRequestId();
    config.headers['X-Request-Id'] = requestId;
    config._requestId = requestId; // attach for response interceptor use

    // --- Dev logging ---
    config._logger = createRequestLogger(
      config.method?.toUpperCase() || 'GET',
      config.url || '',
      requestId,
      config.data
    );

    return config;
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// Response interceptor — centralized error handling + retry + logging
// ═══════════════════════════════════════════════════════════════════════════

api.interceptors.response.use(
  /**
   * Success path — logs and returns the response unchanged.
   * @param {import('axios').AxiosResponse} response
   * @returns {import('axios').AxiosResponse}
   */
  (response) => {
    response.config?._logger?.done(response);
    return response;
  },

  /**
   * Error path — classifies the error, applies centralized handling for
   * known status codes, attempts retry for transient failures, and logs.
   *
   * <h4>Centralized behavior by status code:</h4>
   * <table>
   *   <tr><th>401</th><td>Force-signs out via Supabase if an active session
   *     exists (stale cookie). The error is still rejected so callers can
   *     handle it, but the session is proactively cleared.</td></tr>
   *   <tr><th>403</th><td>Logs a warning. Error is rejected for caller handling.</td></tr>
   *   <tr><th>429</th><td>Logs a warning with <code>Retry-After</code> header if present.
   *     Error is rejected for caller handling.</td></tr>
   *   <tr><th>5xx</th><td>Logs an error. Subject to automatic retry (see retry logic).</td></tr>
   * </table>
   *
   * @param {import('axios').AxiosError} error
   * @returns {Promise<never>}
   */
  async (error) => {
    const config = error.config;
    const category = classifyError(error);

    // --- Dev logging ---
    config?._logger?.done(error.response);

    // --- Centralized 401 handling: clear stale session ---
    if (category === 'auth') {
      if (IS_DEV) {
        console.warn(
          `[API] 401 Unauthorized — clearing stale Supabase session (request ${config?._requestId})`
        );
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.signOut();
          window.location.href = '/login';
          return new Promise(() => {}); // prevent further error handling
        }
      } catch (_signOutError) {
        // If session cleanup fails, let the original error propagate
      }
    }

    // --- Centralized 403 handling: log warning ---
    if (category === 'forbidden') {
      if (IS_DEV) {
        console.warn(
          `[API] 403 Forbidden — ${config?.method?.toUpperCase()} ${config?.url} (request ${config?._requestId})`
        );
      }
    }

    // --- Centralized 429 handling: log with Retry-After ---
    if (category === 'rate_limit') {
      const retryAfter = error.response?.headers?.['retry-after'];
      if (IS_DEV) {
        console.warn(
          `[API] 429 Rate Limited — retry after: ${retryAfter || 'unknown'}s (request ${config?._requestId})`
        );
      }
    }

    // --- Centralized 5xx handling: log error ---
    if (category === 'server') {
      if (IS_DEV) {
        console.error(
          `[API] ${error.response?.status} Server Error — ${config?.method?.toUpperCase()} ${config?.url} (request ${config?._requestId})`
        );
      }
    }

    // --- Retry logic for transient errors (idempotent methods only) ---
    const isIdempotent = ['get', 'head', 'options', 'delete'].includes(
      config?.method?.toLowerCase()
    );
    const retryCount = config?._retryCount ?? 0;

    if (
      isIdempotent &&
      retryCount < MAX_RETRIES &&
      RETRYABLE_STATUS_CODES.includes(error.response?.status)
    ) {
      if (IS_DEV) {
        console.log(
          `[API] Retrying ${config?.method} ${config?.url} (attempt ${retryCount + 1}/${MAX_RETRIES}, request ${config?._requestId})`
        );
      }
      config._retryCount = retryCount + 1;
      return api(config);
    }

    // --- Attach category for caller use ---
    error._category = category;

    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// Exported helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract a human-readable error message from an Axios error.
 *
 * <p>Checks (in priority order):</p>
 * <ol>
 *   <li><code>error.response.data.detail</code></li>
 *   <li><code>error.response.data.error</code></li>
 *   <li><code>error.response.data.message</code></li>
 *   <li><code>error.response.statusText</code></li>
 *   <li>Client-side error translation (timeout, network)</li>
 *   <li>Fallback string</li>
 * </ol>
 *
 * @param {import('axios').AxiosError} error - The error to extract a message from.
 * @param {string} [fallback='Something went wrong'] - Message used when no
 *   structured error information is available.
 * @returns {string} A user-facing error message.
 *
 * @example
 * try {
 *   await api.get('/api/users');
 * } catch (err) {
 *   toast.error(extractErrorMessage(err));
 * }
 */
export function extractErrorMessage(error, fallback = 'Something went wrong') {
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.statusText) return error.response.statusText;
  if (error?.message) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout'))
      return 'Request timed out. Please try again.';
    if (error.message === 'Network Error')
      return 'Unable to connect to the server. Check your internet connection.';
    return error.message;
  }
  return fallback;
}

/**
 * Create an Axios config override for file uploads.
 *
 * <p>Sets a 30-second timeout and <code>multipart/form-data</code> content type.
 * Additional options (e.g. <code>onUploadProgress</code>) are merged in.</p>
 *
 * @param {object} [options={}] - Additional Axios request config to merge.
 * @param {number} [options.onUploadProgress] - Progress callback:
 *   <code>(event: { loaded: number, total?: number }) => void</code>
 * @returns {import('axios').RawAxiosRequestConfig} Config object to spread
 *   as the third argument to <code>api.post()</code>.
 *
 * @example
 * const { data } = await api.post('/api/upload', formData, uploadConfig({
 *   onUploadProgress: (e) => {
 *     if (e.total) console.log(Math.round((e.loaded / e.total) * 100) + '%');
 *   },
 * }));
 */
export function uploadConfig(options = {}) {
  return {
    timeout: UPLOAD_TIMEOUT_MS,
    headers: { 'Content-Type': 'multipart/form-data' },
    ...options,
  };
}

/**
 * Get the raw BACKEND_URL for non-axios use cases (e.g. WebSocket connections).
 *
 * <p><strong>Prefer using the {@linkcode api} instance for all HTTP requests.</strong></p>
 *
 * @returns {string} The configured backend URL (may be empty string for same-origin).
 *
 * @example
 * const ws = new WebSocket(getBackendUrl().replace(/^http/, 'ws') + '/ws');
 */
export function getBackendUrl() {
  return BACKEND_URL;
}

/**
 * Get the error category from a rejected Axios error.
 *
 * Useful for callers that want to branch on error type without inspecting
 * status codes directly.
 *
 * @param {import('axios').AxiosError} error
 * @returns {ErrorCategory} One of: <code>'auth'</code>, <code>'forbidden'</code>,
 *   <code>'rate_limit'</code>, <code>'server'</code>, <code>'network'</code>,
 *   <code>'timeout'</code>, <code>'client'</code>, <code>'unknown'</code>.
 *
 * @example
 * try {
 *   await api.get('/api/admin/users');
 * } catch (err) {
 *   const cat = getErrorCategory(err);
 *   if (cat === 'auth') navigate('/login');
 *   else if (cat === 'forbidden') toast.error('Insufficient permissions');
 * }
 */
export function getErrorCategory(error) {
  return error?._category || classifyError(error);
}

export default api;