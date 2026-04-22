/**
 * Thin HTTP client for the Brixus Email API.
 *
 * Responsibilities:
 *   1. Attach Authorization + User-Agent headers.
 *   2. Parse the unified ``{error: {...}}`` envelope into BrixusApiError.
 *   3. Never log or echo the API key.
 *
 * Out of scope: retries, caching, idempotency-key generation (the backend
 * handles idempotency internally for POST /v1/emails). Callers should not
 * retry on 5xx automatically - Claude can decide whether to retry.
 */

import { DEFAULT_API_BASE_URL, USER_AGENT_BASE } from "./constants.js";
import {
  BrixusApiError,
  type BrixusErrorEnvelope,
} from "./errors.js";

export interface SendEmailParams {
  to: string;
  starter_template: string;
  variables?: Record<string, unknown>;
  from_name?: string;
}

export interface SendEmailResponse {
  messageId: string;
  status: string;
  from: string;
}

export interface StarterTemplateSummary {
  slug: string;
  name: string;
  description: string | null;
  variables: string[];
}

export interface ListStarterTemplatesResponse {
  templates: StarterTemplateSummary[];
}

export interface PreviewStarterTemplateResponse {
  slug: string;
  subject: string;
  html: string;
  sampleVariables: Record<string, unknown>;
}

export interface BrixusClientOptions {
  apiKey: string;
  baseUrl?: string;
  version?: string; // injected by index.ts from package.json at startup
  fetchFn?: typeof fetch; // test seam
  /**
   * Per-request timeout in milliseconds. If the Brixus API does not respond
   * within this window the request is aborted and a timeout error is raised.
   * Defaults to 30_000 (30 seconds).
   */
  timeoutMs?: number;
}

/**
 * Thrown when an HTTP request to the Brixus API exceeds the configured
 * timeout. The tool-error mapper renders this as a user-friendly hint so
 * the LLM can decide whether to retry or give up.
 */
export class BrixusTimeoutError extends Error {
  public readonly timeoutMs: number;
  constructor(timeoutMs: number) {
    super(
      `Brixus API request timed out after ${Math.round(timeoutMs / 1000)} seconds. ` +
        "The service may be slow or unreachable.",
    );
    this.name = "BrixusTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export class BrixusClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly fetchFn: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: BrixusClientOptions) {
    if (!options.apiKey || options.apiKey.trim() === "") {
      throw new Error(
        "BRIXUS365_API_KEY is required. Set it in your MCP server environment.",
      );
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
    const version = options.version ?? "0.0.0";
    this.userAgent = `${USER_AGENT_BASE}/${version}`;
    this.fetchFn = options.fetchFn ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  /** POST /v1/emails */
  async sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
    return this.request<SendEmailResponse>("/emails", {
      method: "POST",
      body: JSON.stringify({
        to: params.to,
        starterTemplate: params.starter_template,
        ...(params.variables ? { variables: params.variables } : {}),
        ...(params.from_name ? { fromName: params.from_name } : {}),
      }),
    });
  }

  /** GET /v1/starter-templates */
  async listStarterTemplates(): Promise<ListStarterTemplatesResponse> {
    // Endpoint returns a top-level array; wrap so the caller always
    // receives an object (future-proofs for pagination envelope).
    const templates = await this.request<StarterTemplateSummary[]>(
      "/starter-templates",
      { method: "GET" },
    );
    return { templates };
  }

  /** POST /v1/starter-templates/{slug}/preview
   *
   * Uses POST + JSON body rather than GET + query string because starter
   * templates commonly take reset links, OTP codes, and email addresses
   * as variables, and query strings are logged by proxies / CDNs /
   * browser history. The body is always sent (even when `variables` is
   * omitted, we POST `{}`) so the server path is uniform.
   */
  async previewStarterTemplate(
    slug: string,
    variables?: Record<string, unknown>,
  ): Promise<PreviewStarterTemplateResponse> {
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      throw new Error(
        `Invalid starter-template slug '${slug}'. Expected kebab-case.`,
      );
    }
    const body = variables ? { variables } : {};
    return this.request<PreviewStarterTemplateResponse>(
      `/starter-templates/${encodeURIComponent(slug)}/preview`,
      { method: "POST", body: JSON.stringify(body) },
    );
  }

  // ------------------------------------------------------------------

  private async request<T>(
    path: string,
    init: { method: "GET" | "POST"; body?: string },
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchFn(url, {
        method: init.method,
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": this.userAgent,
        },
        body: init.body,
        signal: controller.signal,
      });
    } catch (err) {
      // AbortController.abort() causes fetch to reject with a DOMException
      // named "AbortError" (native fetch) or an Error with name === "AbortError"
      // (undici/node-fetch). Normalise either shape into BrixusTimeoutError
      // so tool handlers can render a deterministic message.
      if (
        err instanceof Error
        && (err.name === "AbortError" || controller.signal.aborted)
      ) {
        throw new BrixusTimeoutError(this.timeoutMs);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    const raw = await response.text();
    let parsed: unknown = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      if (
        parsed
        && typeof parsed === "object"
        && "error" in parsed
      ) {
        throw new BrixusApiError(
          response.status,
          parsed as BrixusErrorEnvelope,
        );
      }
      // Non-envelope 4xx/5xx - surface as a synthetic envelope so the
      // error-mapping path in `errors.ts` still renders something useful.
      throw new BrixusApiError(response.status, {
        error: {
          code: "unknown_error",
          type: "api_error",
          message: `HTTP ${response.status}: ${raw || response.statusText}`,
        },
      });
    }

    return parsed as T;
  }
}
