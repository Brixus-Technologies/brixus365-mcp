/**
 * Thin HTTP client for the Brixus Email API.
 *
 * Responsibilities:
 *   1. Attach Authorization + User-Agent headers.
 *   2. Parse the unified ``{error: {...}}`` envelope into BrixusApiError.
 *   3. Never log or echo the API key.
 *
 * Out of scope: retries, caching. Callers should not retry on 5xx
 * automatically - the LLM can decide whether to retry.
 */

import { DEFAULT_API_BASE_URL, USER_AGENT_BASE } from "./constants.js";
import {
  BrixusApiError,
  type BrixusErrorEnvelope,
} from "./errors.js";

export interface AttachmentItem {
  filename: string;
  content: string;        // base64-encoded
  content_type: string;  // MIME type
}

export interface SendEmailParams {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  reply_to?: string;
  from_name?: string;
  from_address?: string;
  brand_name?: string;
  logo_url?: string;
  starter_template?: string;
  template_id?: string;
  subject?: string;
  html?: string;
  text?: string;
  variables?: Record<string, unknown>;
  attachments?: AttachmentItem[];
  scheduled_at?: string;
  idempotency_key?: string;
}

export interface SendEmailResponse {
  messageId: string;
  status: string;
  from: string;
}

// BatchMessage is SendEmailParams without the top-level idempotency_key
// (which is a single-request header concept; per-message keys go in the body
// as idempotency_key and are serialised as idempotencyKey by the client).
export type BatchMessage = SendEmailParams;

export interface SendBatchResponse {
  queued: number;
  failed: number;
  total: number;
  results: Array<{
    messageId?: string;
    status: string;
    to: string;
    error?: string;
  }>;
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

export interface KeysMeLimits {
  daily: number;
  monthly: number;
  ratePerMinute: number;
}

export interface GetApiKeyInfoResponse {
  tier: string;
  usageToday: number;
  usageMonth: number;
  limits: KeysMeLimits;
  allowedModes: string[];
}

export interface SendCampaignTestResponse {
  success: boolean;
  message: string;
  emailsSent: number;
  failedEmails: string[];
}

export interface BrixusClientOptions {
  apiKey: string;
  baseUrl?: string;
  version?: string;
  fetchFn?: typeof fetch;
  /**
   * Per-request timeout in milliseconds. Defaults to 30_000 (30 s).
   */
  timeoutMs?: number;
}

/**
 * Thrown when an HTTP request to the Brixus API exceeds the configured
 * timeout. Rendered as a user-friendly hint by the tool error mapper.
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
    this.fetchFn = options.fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  // ------------------------------------------------------------------
  // Starter templates (existing)
  // ------------------------------------------------------------------

  /** GET /v1/starter-templates */
  async listStarterTemplates(): Promise<ListStarterTemplatesResponse> {
    const templates = await this.request<StarterTemplateSummary[]>(
      "/starter-templates",
      { method: "GET" },
    );
    return { templates };
  }

  /** POST /v1/starter-templates/{slug}/preview */
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
  // Transactional email
  // ------------------------------------------------------------------

  /** POST /v1/emails */
  async sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
    const body: Record<string, unknown> = { to: params.to };
    if (params.cc) body.cc = params.cc;
    if (params.bcc) body.bcc = params.bcc;
    if (params.reply_to) body.replyTo = params.reply_to;
    if (params.from_name) body.fromName = params.from_name;
    if (params.from_address) body.from = params.from_address;
    if (params.brand_name) body.brandName = params.brand_name;
    if (params.logo_url) body.logoUrl = params.logo_url;
    if (params.starter_template) body.starterTemplate = params.starter_template;
    if (params.template_id) body.templateId = params.template_id;
    if (params.subject) body.subject = params.subject;
    if (params.html) body.html = params.html;
    if (params.text) body.text = params.text;
    if (params.variables) body.variables = params.variables;
    if (params.attachments) body.attachments = params.attachments;
    if (params.scheduled_at) body.scheduledAt = params.scheduled_at;

    const extraHeaders: Record<string, string> = {};
    if (params.idempotency_key) extraHeaders["Idempotency-Key"] = params.idempotency_key;

    return this.request<SendEmailResponse>("/emails", {
      method: "POST",
      body: JSON.stringify(body),
      headers: extraHeaders,
    });
  }

  /** POST /v1/emails/batch */
  async sendEmailBatch(messages: BatchMessage[]): Promise<SendBatchResponse> {
    const mapped = messages.map((m) => {
      const msg: Record<string, unknown> = { to: m.to };
      if (m.cc) msg.cc = m.cc;
      if (m.bcc) msg.bcc = m.bcc;
      if (m.reply_to) msg.replyTo = m.reply_to;
      if (m.from_name) msg.fromName = m.from_name;
      if (m.from_address) msg.from = m.from_address;
      if (m.brand_name) msg.brandName = m.brand_name;
      if (m.logo_url) msg.logoUrl = m.logo_url;
      if (m.starter_template) msg.starterTemplate = m.starter_template;
      if (m.template_id) msg.templateId = m.template_id;
      if (m.subject) msg.subject = m.subject;
      if (m.html) msg.html = m.html;
      if (m.text) msg.text = m.text;
      if (m.variables) msg.variables = m.variables;
      if (m.attachments) msg.attachments = m.attachments;
      if (m.scheduled_at) msg.scheduledAt = m.scheduled_at;
      if (m.idempotency_key) msg.idempotencyKey = m.idempotency_key;
      return msg;
    });
    return this.request<SendBatchResponse>("/emails/batch", {
      method: "POST",
      body: JSON.stringify({ messages: mapped }),
    });
  }

  /** GET /v1/emails/{message_id} */
  async getEmail(messageId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/emails/${encodeURIComponent(messageId)}`,
      { method: "GET" },
    );
  }

  /** GET /v1/emails */
  async listEmails(params: {
    from?: string;
    to?: string;
    status?: string;
    skip?: number;
    limit?: number;
    sort_by?: string;
  } = {}): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/emails", {
      method: "GET",
      query: {
        from: params.from,
        to: params.to,
        status: params.status,
        skip: params.skip,
        limit: params.limit,
        sort_by: params.sort_by,
      },
    });
  }

  /** GET /v1/emails/analytics */
  async getEmailAnalytics(params: {
    from?: string;
    to?: string;
    bucket?: "hour" | "day";
  } = {}): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/emails/analytics", {
      method: "GET",
      query: { from: params.from, to: params.to, bucket: params.bucket },
    });
  }

  /** DELETE /v1/emails/{message_id} — cancel a scheduled send (returns 204) */
  async cancelEmail(messageId: string): Promise<void> {
    return this.request<void>(
      `/emails/${encodeURIComponent(messageId)}`,
      { method: "DELETE" },
    );
  }

  // ------------------------------------------------------------------
  // API key introspection
  // ------------------------------------------------------------------

  /** GET /v1/settings/api-keys/me */
  async getApiKeyInfo(): Promise<GetApiKeyInfoResponse> {
    return this.request<GetApiKeyInfoResponse>("/settings/api-keys/me", {
      method: "GET",
    });
  }

  // ------------------------------------------------------------------
  // Email templates
  // ------------------------------------------------------------------

  /** POST /v1/templates/puck */
  async createTemplate(params: {
    name: string;
    subject: string;
    puck_data: Record<string, unknown>;
    category?: string;
  }): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = {
      name: params.name,
      subject: params.subject,
      channel: "email",
      body: "",
      puck_data: params.puck_data,
      category: params.category || "marketing",
    };
    return this.request<Record<string, unknown>>("/templates/puck", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /** PUT /v1/templates/{template_id} */
  async updateTemplate(
    templateId: string,
    params: {
      puck_data?: Record<string, unknown>;
      subject?: string;
      name?: string;
    },
  ): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = {};
    if (params.puck_data !== undefined) body.puck_data = params.puck_data;
    if (params.subject !== undefined) body.subject = params.subject;
    if (params.name !== undefined) body.name = params.name;
    return this.request<Record<string, unknown>>(
      `/templates/${encodeURIComponent(templateId)}`,
      { method: "PUT", body: JSON.stringify(body) },
    );
  }

  /** GET /v1/templates/{template_id} */
  async getTemplate(templateId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/templates/${encodeURIComponent(templateId)}`,
      { method: "GET" },
    );
  }

  /**
   * Derive the dashboard base URL by stripping `/api/v1` from the API base URL.
   * Used to construct editor URLs for templates.
   */
  getDashboardBaseUrl(): string {
    return this.baseUrl.replace(/\/api\/v1$/, "");
  }

  // ------------------------------------------------------------------
  // Marketing campaigns (read + send-test)
  // ------------------------------------------------------------------

  /** GET /v1/marketing/campaigns */
  async listCampaigns(params: {
    page?: number;
    limit?: number;
    status?: string;
    channel?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/marketing/campaigns", {
      method: "GET",
      query: {
        page: params.page,
        limit: params.limit,
        status: params.status,
        channel: params.channel,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
      },
    });
  }

  /** GET /v1/marketing/campaigns/{campaign_id} */
  async getCampaign(campaignId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/marketing/campaigns/${encodeURIComponent(campaignId)}`,
      { method: "GET" },
    );
  }

  /** POST /v1/marketing/campaigns/{campaign_id}/send-test */
  async sendCampaignTest(
    campaignId: string,
    testEmails: string[],
  ): Promise<SendCampaignTestResponse> {
    return this.request<SendCampaignTestResponse>(
      `/marketing/campaigns/${encodeURIComponent(campaignId)}/send-test`,
      {
        method: "POST",
        body: JSON.stringify({ testEmails }),
      },
    );
  }

  // ------------------------------------------------------------------
  // Contacts
  // ------------------------------------------------------------------

  /** GET /v1/contacts */
  async listContacts(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/contacts", {
      method: "GET",
      query: {
        page: params.page,
        limit: params.limit,
        search: params.search,
        status: params.status,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
      },
    });
  }

  /** GET /v1/contacts/{contact_id} */
  async getContact(contactId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/contacts/${encodeURIComponent(contactId)}`,
      { method: "GET" },
    );
  }

  /** GET /v1/contacts/stats */
  async getAudienceStats(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/contacts/stats", {
      method: "GET",
    });
  }

  /** POST /v1/contacts/bulk-create */
  async createContacts(recipients: Array<{
    email?: string;
    phone?: string;
    name?: string;
    variables?: Record<string, string>;
  }>, groupId?: string): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = { recipients };
    if (groupId) body.groupId = groupId;
    return this.request<Record<string, unknown>>("/contacts/bulk-create", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // ------------------------------------------------------------------
  // Template listing (API-key shape)
  // ------------------------------------------------------------------

  /** GET /v1/templates (API-key response: items/total/skip/limit) */
  async listTemplates(params: {
    skip?: number;
    limit?: number;
  } = {}): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/templates", {
      method: "GET",
      query: {
        skip: params.skip,
        limit: params.limit,
      },
    });
  }

  // ------------------------------------------------------------------
  // Email domains
  // ------------------------------------------------------------------

  /** GET /v1/settings/email-domains */
  async listDomains(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/settings/email-domains", {
      method: "GET",
    });
  }

  /** GET /v1/settings/email-domains/{domain_id} */
  async getDomain(domainId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/settings/email-domains/${encodeURIComponent(domainId)}`,
      { method: "GET" },
    );
  }

  /** POST /v1/settings/email-domains/{domain_id}/verify */
  async verifyDomain(domainId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/settings/email-domains/${encodeURIComponent(domainId)}/verify`,
      { method: "POST" },
    );
  }

  // ------------------------------------------------------------------
  // Developer webhooks
  // ------------------------------------------------------------------

  /** GET /v1/webhooks */
  async listWebhooks(params: {
    skip?: number;
    limit?: number;
  } = {}): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/webhooks", {
      method: "GET",
      query: {
        skip: params.skip,
        limit: params.limit,
      },
    });
  }

  /** POST /v1/webhooks */
  async createWebhook(params: {
    url: string;
    event_types: string[];
    description?: string;
  }): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = {
      url: params.url,
      eventTypes: params.event_types,
    };
    if (params.description) body.description = params.description;
    return this.request<Record<string, unknown>>("/webhooks", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /** DELETE /v1/webhooks/{subscription_id} */
  async deleteWebhook(subscriptionId: string): Promise<void> {
    return this.request<void>(
      `/webhooks/${encodeURIComponent(subscriptionId)}`,
      { method: "DELETE" },
    );
  }

  /** POST /v1/webhooks/{subscription_id}/test */
  async testWebhook(subscriptionId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/webhooks/${encodeURIComponent(subscriptionId)}/test`,
      { method: "POST" },
    );
  }

  // ------------------------------------------------------------------
  // Marketing analytics
  // ------------------------------------------------------------------

  /** GET /v1/marketing/analytics/dashboard */
  async getMarketingDashboard(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/marketing/analytics/dashboard", {
      method: "GET",
    });
  }

  /** GET /v1/marketing/analytics/campaigns/{campaign_id}/engagement */
  async getCampaignEngagement(campaignId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/marketing/analytics/campaigns/${encodeURIComponent(campaignId)}/engagement`,
      { method: "GET" },
    );
  }

  /** GET /v1/marketing/analytics/campaigns/{campaign_id}/links */
  async getCampaignLinkPerformance(campaignId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/marketing/analytics/campaigns/${encodeURIComponent(campaignId)}/links`,
      { method: "GET" },
    );
  }

  /** GET /v1/marketing/analytics/sending-health */
  async getSendingHealth(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/marketing/analytics/sending-health", {
      method: "GET",
    });
  }

  // ------------------------------------------------------------------
  // Marketing campaigns (create/update/send/pause/resume)
  // ------------------------------------------------------------------

  /** POST /v1/marketing/campaigns/ */
  async createCampaign(params: {
    name: string;
    channel: "email" | "sms" | "whatsapp";
    template_id?: string;
    recipient_group_ids?: string[];
    scheduled_at?: string;
  }): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = {
      name: params.name,
      channel: params.channel,
    };
    if (params.template_id) body.templateId = params.template_id;
    if (params.recipient_group_ids) body.recipientGroupIds = params.recipient_group_ids;
    if (params.scheduled_at) body.scheduledAt = params.scheduled_at;
    return this.request<Record<string, unknown>>("/marketing/campaigns/", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /** PATCH /v1/marketing/campaigns/{campaign_id} */
  async updateCampaign(
    campaignId: string,
    params: {
      name?: string;
      template_id?: string;
      recipient_group_ids?: string[];
      scheduled_at?: string;
    },
  ): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = {};
    if (params.name !== undefined) body.name = params.name;
    if (params.template_id !== undefined) body.templateId = params.template_id;
    if (params.recipient_group_ids !== undefined) body.recipientGroupIds = params.recipient_group_ids;
    if (params.scheduled_at !== undefined) body.scheduledAt = params.scheduled_at;
    return this.request<Record<string, unknown>>(
      `/marketing/campaigns/${encodeURIComponent(campaignId)}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
  }

  /** POST /v1/marketing/campaigns/{campaign_id}/send */
  async sendCampaign(campaignId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/marketing/campaigns/${encodeURIComponent(campaignId)}/send`,
      { method: "POST" },
    );
  }

  /** POST /v1/marketing/campaigns/{campaign_id}/pause */
  async pauseCampaign(campaignId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/marketing/campaigns/${encodeURIComponent(campaignId)}/pause`,
      { method: "POST" },
    );
  }

  /** POST /v1/marketing/campaigns/{campaign_id}/resume */
  async resumeCampaign(campaignId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/marketing/campaigns/${encodeURIComponent(campaignId)}/resume`,
      { method: "POST" },
    );
  }

  // ------------------------------------------------------------------
  // Sender addresses
  // ------------------------------------------------------------------

  /** GET /v1/settings/sender-addresses/ */
  async listSenderAddresses(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/settings/sender-addresses/", {
      method: "GET",
    });
  }

  // ------------------------------------------------------------------
  // Internal
  // ------------------------------------------------------------------

  private async request<T>(
    path: string,
    init: {
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: string;
      query?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (init.query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(init.query)) {
        if (v !== undefined && v !== null) params.set(k, String(v));
      }
      const qs = params.toString();
      if (qs) url = `${url}?${qs}`;
    }

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
          ...init.headers,
        },
        body: init.body,
        signal: controller.signal,
      });
    } catch (err) {
      if (
        err instanceof Error &&
        (err.name === "AbortError" || controller.signal.aborted)
      ) {
        throw new BrixusTimeoutError(this.timeoutMs);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    // DELETE /emails/{id} and similar return 204 with no body.
    if (response.status === 204) return undefined as unknown as T;

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
      if (parsed && typeof parsed === "object" && "error" in parsed) {
        throw new BrixusApiError(
          response.status,
          parsed as BrixusErrorEnvelope,
        );
      }
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
