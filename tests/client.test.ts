/**
 * Unit tests for BrixusClient.
 *
 * No real network calls: every test passes a stub `fetchFn` into the
 * client constructor and asserts on the URL/method/body/headers that
 * the client would have sent, plus on how it parses the mock Response.
 */

import { describe, expect, it, vi } from "vitest";

import { BrixusClient, BrixusTimeoutError } from "../src/client.js";
import { BrixusApiError } from "../src/errors.js";

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function errResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function plainErrResponse(status: number, text: string): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}

function makeClient(fetchFn: typeof fetch, version = "1.2.3") {
  return new BrixusClient({
    apiKey: "bx_preview_test_key",
    baseUrl: "https://api.example.test/api/v1",
    version,
    fetchFn,
  });
}

describe("BrixusClient constructor", () => {
  it("throws when apiKey is empty string", () => {
    expect(
      () =>
        new BrixusClient({
          apiKey: "",
          fetchFn: vi.fn() as unknown as typeof fetch,
        }),
    ).toThrow(/BRIXUS365_API_KEY is required/);
  });

  it("throws when apiKey is whitespace only", () => {
    expect(
      () =>
        new BrixusClient({
          apiKey: "   ",
          fetchFn: vi.fn() as unknown as typeof fetch,
        }),
    ).toThrow(/BRIXUS365_API_KEY is required/);
  });
});

describe("BrixusClient.sendEmail", () => {
  it("posts to /emails with Bearer auth and camelCase JSON body", async () => {
    const fetchFn = vi.fn(async () =>
      okResponse({
        messageId: "msg_preview_01J",
        status: "queued",
        from: "Alice <noreply@preview.brixus365.com>",
      }),
    ) as unknown as typeof fetch;

    const client = makeClient(fetchFn);
    const resp = await client.sendEmail({
      to: "alice@example.com",
      starter_template: "auth-reset",
      variables: { userName: "Alice", resetLink: "https://x.y/z" },
      from_name: "Alice Bot",
    });

    expect(resp.messageId).toBe("msg_preview_01J");
    expect(resp.status).toBe("queued");

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const call = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const [url, init] = call as [string, RequestInit];
    expect(url).toBe("https://api.example.test/api/v1/emails");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer bx_preview_test_key");
    expect(headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      to: "alice@example.com",
      starterTemplate: "auth-reset",
      variables: { userName: "Alice", resetLink: "https://x.y/z" },
      fromName: "Alice Bot",
    });
  });

  it("maps unified error envelope to BrixusApiError", async () => {
    const fetchFn = vi.fn(async () =>
      errResponse(401, {
        error: {
          code: "invalid_api_key",
          message: "API key is invalid or revoked.",
          type: "authentication",
        },
      }),
    ) as unknown as typeof fetch;

    const client = makeClient(fetchFn);
    await expect(
      client.sendEmail({ to: "a@b.co", starter_template: "x" }),
    ).rejects.toMatchObject({
      name: "BrixusApiError",
      code: "invalid_api_key",
      status: 401,
      type: "authentication",
    });
  });

  it("preserves extras like upgrade_url", async () => {
    const fetchFn = vi.fn(async () =>
      errResponse(403, {
        error: {
          code: "upgrade_required",
          message: "Preview tier exhausted.",
          type: "subscription",
          upgrade_url: "https://app.example.test/upgrade",
        },
      }),
    ) as unknown as typeof fetch;

    const client = makeClient(fetchFn);
    try {
      await client.sendEmail({ to: "a@b.co", starter_template: "x" });
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(BrixusApiError);
      const bx = err as BrixusApiError;
      expect(bx.code).toBe("upgrade_required");
      expect(bx.extras.upgrade_url).toBe("https://app.example.test/upgrade");
    }
  });

  it("wraps non-envelope 5xx as synthetic unknown_error", async () => {
    const fetchFn = vi.fn(async () =>
      plainErrResponse(500, "internal server error\n"),
    ) as unknown as typeof fetch;

    const client = makeClient(fetchFn);
    try {
      await client.sendEmail({ to: "a@b.co", starter_template: "x" });
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(BrixusApiError);
      const bx = err as BrixusApiError;
      expect(bx.code).toBe("unknown_error");
      expect(bx.type).toBe("api_error");
      expect(bx.status).toBe(500);
      expect(bx.message).toContain("HTTP 500");
    }
  });

  it("surfaces network errors untouched", async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;

    const client = makeClient(fetchFn);
    await expect(
      client.sendEmail({ to: "a@b.co", starter_template: "x" }),
    ).rejects.toThrow(/fetch failed/);
  });
});

describe("BrixusClient.listStarterTemplates", () => {
  it("wraps bare-array response into {templates:[...]}", async () => {
    const fetchFn = vi.fn(async () =>
      okResponse([
        {
          slug: "auth-reset",
          name: "Password reset",
          description: "Send a reset link.",
          variables: ["userName", "resetLink"],
        },
        {
          slug: "welcome-email",
          name: "Welcome",
          description: null,
          variables: ["userName"],
        },
      ]),
    ) as unknown as typeof fetch;

    const client = makeClient(fetchFn);
    const resp = await client.listStarterTemplates();
    expect(resp.templates).toHaveLength(2);
    expect(resp.templates[0]?.slug).toBe("auth-reset");

    const call = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const [url, init] = call as [string, RequestInit];
    expect(url).toBe("https://api.example.test/api/v1/starter-templates");
    expect(init.method).toBe("GET");
  });
});

describe("BrixusClient.previewStarterTemplate", () => {
  it("rejects invalid slug before calling fetch", async () => {
    const fetchFn = vi.fn(async () => okResponse({})) as unknown as typeof fetch;
    const client = makeClient(fetchFn);
    await expect(
      client.previewStarterTemplate("Bad_Slug"),
    ).rejects.toThrow(/Invalid starter-template slug/);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("POSTs variables as a JSON body when supplied", async () => {
    const fetchFn = vi.fn(async () =>
      okResponse({
        slug: "auth-reset",
        subject: "Reset",
        html: "<p>hi</p>",
        sampleVariables: {},
      }),
    ) as unknown as typeof fetch;

    const client = makeClient(fetchFn);
    await client.previewStarterTemplate("auth-reset", { x: "a/b?" });

    const call = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const [url, init] = call as [string, RequestInit];
    expect(url).toBe(
      "https://api.example.test/api/v1/starter-templates/auth-reset/preview",
    );
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ variables: { x: "a/b?" } }));
  });

  it("POSTs an empty body when no variables are supplied", async () => {
    const fetchFn = vi.fn(async () =>
      okResponse({
        slug: "auth-reset",
        subject: "Reset",
        html: "<p>hi</p>",
        sampleVariables: {},
      }),
    ) as unknown as typeof fetch;

    const client = makeClient(fetchFn);
    await client.previewStarterTemplate("auth-reset");

    const call = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const [url, init] = call as [string, RequestInit];
    expect(url).toBe(
      "https://api.example.test/api/v1/starter-templates/auth-reset/preview",
    );
    expect(init.method).toBe("POST");
    expect(init.body).toBe("{}");
  });
});

describe("BrixusClient request timeout", () => {
  it("aborts the in-flight fetch and throws BrixusTimeoutError", async () => {
    // fetchFn resolves only when the AbortSignal fires, simulating a
    // backend that is hung indefinitely. Without timeout plumbing the
    // promise would never settle and the test would hang.
    const fetchFn = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        signal?.addEventListener("abort", () => {
          // Emulate undici/native fetch: reject with an AbortError.
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    }) as unknown as typeof fetch;

    const client = new BrixusClient({
      apiKey: "bx_preview_test_key",
      baseUrl: "https://api.example.test/api/v1",
      fetchFn,
      timeoutMs: 20, // tight so the test finishes quickly
    });

    await expect(
      client.sendEmail({ to: "a@b.co", starter_template: "x" }),
    ).rejects.toBeInstanceOf(BrixusTimeoutError);

    // Also assert the abort signal actually fired on the request init so we
    // know the timer wired through to fetch rather than throwing locally.
    const call = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const [, init] = call as [string, RequestInit];
    expect((init.signal as AbortSignal).aborted).toBe(true);
  });

  it("respects a custom timeoutMs and surfaces it in the error message", async () => {
    // Custom 15ms timeout — if the default (30s) were used the test would
    // time out instead of completing in milliseconds.
    const fetchFn = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    }) as unknown as typeof fetch;

    const client = new BrixusClient({
      apiKey: "bx_preview_test_key",
      baseUrl: "https://api.example.test/api/v1",
      fetchFn,
      timeoutMs: 15,
    });

    const start = Date.now();
    let caught: unknown = null;
    try {
      await client.sendEmail({ to: "a@b.co", starter_template: "x" });
    } catch (err) {
      caught = err;
    }
    const elapsed = Date.now() - start;

    expect(caught).toBeInstanceOf(BrixusTimeoutError);
    expect((caught as BrixusTimeoutError).timeoutMs).toBe(15);
    // Sanity check: we aborted well before the 30s default. Generous
    // upper bound to avoid flakes on a slow CI box.
    expect(elapsed).toBeLessThan(1_000);
  });
});

describe("BrixusClient headers", () => {
  it("sets User-Agent header to brixus365-mcp-server/<version>", async () => {
    const fetchFn = vi.fn(async () =>
      okResponse({
        messageId: "m",
        status: "queued",
        from: "x",
      }),
    ) as unknown as typeof fetch;

    const client = makeClient(fetchFn, "9.9.9");
    await client.sendEmail({ to: "a@b.co", starter_template: "x" });
    const call = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const [, init] = call as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["User-Agent"]).toBe("brixus365-mcp-server/9.9.9");
  });

  it("strips trailing slash from baseUrl", async () => {
    const fetchFn = vi.fn(async () =>
      okResponse({ messageId: "m", status: "queued", from: "x" }),
    ) as unknown as typeof fetch;
    const client = new BrixusClient({
      apiKey: "bx_preview_k",
      baseUrl: "https://api.example.test/api/v1/",
      fetchFn,
    });
    await client.sendEmail({ to: "a@b.co", starter_template: "x" });
    const call = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const [url] = call as [string, RequestInit];
    expect(url).toBe("https://api.example.test/api/v1/emails");
  });
});
