import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { registerEmailAnalyticsTool } from "../../src/tools/email_analytics.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

function makeFakeClient(getEmailAnalytics: BrixusClient["getEmailAnalytics"]): BrixusClient {
  return { getEmailAnalytics } as unknown as BrixusClient;
}

describe("brixus_get_email_analytics handler", () => {
  it("happy path returns analytics data", async () => {
    const mock = makeMockServer();
    const payload = {
      buckets: [{ timestamp: "2024-01-01", sent: 100, delivered: 95 }],
      totals: { sent: 100, delivered: 95, opened: 40, clicked: 10, bounced: 5, failed: 0 },
    };
    const getEmailAnalytics = vi.fn(async () => payload);
    registerEmailAnalyticsTool(
      mock as unknown as Parameters<typeof registerEmailAnalyticsTool>[0],
      makeFakeClient(getEmailAnalytics),
    );
    const result = await mock.lastHandler()({ bucket: "day" });
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.totals.sent).toBe(100);
  });

  it("forwards bucket and date range params", async () => {
    const mock = makeMockServer();
    const getEmailAnalytics = vi.fn(async () => ({ buckets: [], totals: {} }));
    registerEmailAnalyticsTool(
      mock as unknown as Parameters<typeof registerEmailAnalyticsTool>[0],
      makeFakeClient(getEmailAnalytics),
    );
    await mock.lastHandler()({
      from: "2024-01-01T00:00:00Z",
      to: "2024-01-31T23:59:59Z",
      bucket: "hour",
    });
    expect(getEmailAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ bucket: "hour" }),
    );
  });
});
