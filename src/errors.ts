/**
 * Error handling for the Brixus MCP server.
 *
 * The Brixus API emits a unified envelope (see
 * `backend/app/core/developer_api_errors.py`):
 *
 *   { "error": { "code": "<machine_code>",
 *                "message": "<human>",
 *                "type": "<category>",
 *                ...optional extras
 *              } }
 *
 * We parse it into ``BrixusApiError`` with the original ``code`` and
 * ``extras`` preserved so tool handlers can produce actionable messages
 * for the LLM.
 */

export interface BrixusErrorEnvelope {
  error: {
    code: string;
    message: string;
    type: string;
    upgrade_url?: string;
    dashboard_url?: string;
    retry_after_seconds?: number;
    details?: unknown;
    [key: string]: unknown;
  };
}

export class BrixusApiError extends Error {
  public readonly code: string;
  public readonly type: string;
  public readonly status: number;
  public readonly extras: Record<string, unknown>;

  constructor(
    status: number,
    envelope: BrixusErrorEnvelope,
  ) {
    super(envelope.error.message);
    this.name = "BrixusApiError";
    this.status = status;
    this.code = envelope.error.code;
    this.type = envelope.error.type;
    // Preserve everything except the three well-known fields.
    const { code: _c, message: _m, type: _t, ...rest } = envelope.error;
    this.extras = rest;
  }
}

/**
 * Map a caught error to the text body of an MCP tool error response.
 *
 * Returns a string that includes:
 *   - The Brixus error code (so the LLM can match on it deterministically).
 *   - A human-readable message tuned for the specific code.
 *   - A pointer to the fix where one exists (dashboard URL, upgrade URL,
 *     retry timing, etc.).
 *
 * Fallbacks:
 *   - Timeout (BrixusTimeoutError): "Error (timeout): ...".
 *   - Non-BrixusApiError (network, parse): "Error (network): <message>".
 *   - Unknown Brixus code: echo code + message verbatim.
 */
export function mapToolErrorMessage(error: unknown): string {
  // Timeout: surface a dedicated, actionable message so the LLM does not
  // treat it as a generic network blip and immediately retry forever.
  // Matched by name rather than `instanceof` to avoid a circular import
  // between errors.ts and client.ts.
  if (error instanceof Error && error.name === "BrixusTimeoutError") {
    return (
      `Error (timeout): ${error.message}\n\n` +
      "Fix: wait a moment and retry. If this persists, check " +
      "https://status.brixus365.com for incidents."
    );
  }

  if (error instanceof BrixusApiError) {
    switch (error.code) {
      case "invalid_api_key":
      case "missing_api_key":
        return (
          `Error (${error.code}): ${error.message}\n\n` +
          "Fix: set BRIXUS365_API_KEY in your MCP server config. Get a key " +
          "at https://brixus365.com/developers."
        );

      case "key_revoked_upgrade": {
        const url = (error.extras.dashboard_url as string | undefined)
          ?? "https://app.brixus365.com/settings/api-keys";
        return (
          `Error (${error.code}): Your preview-tier API key was revoked ` +
          `when the account upgraded.\n\nFix: visit ${url} and copy the ` +
          "new bx_live_ key into your BRIXUS365_API_KEY env var."
        );
      }

      case "upgrade_required": {
        const url = (error.extras.upgrade_url as string | undefined)
          ?? "https://app.brixus365.com/auth/upgrade";
        return (
          `Error (${error.code}): ${error.message}\n\n` +
          `Fix: upgrade your preview account to the free tier at ${url}.`
        );
      }

      case "tier_suspended":
        return (
          `Error (${error.code}): ${error.message}\n\n` +
          "Fix: your tenant has been auto-suspended for abuse-signal " +
          "violations. Contact support@brixus365.com to review."
        );

      case "rate_limit_exceeded":
      case "daily_limit_exceeded":
      case "monthly_limit_exceeded": {
        const wait = error.extras.retry_after_seconds as number | undefined;
        const waitHint = wait ? ` Retry after ${wait}s.` : "";
        return (
          `Error (${error.code}): ${error.message}${waitHint}\n\n` +
          "Fix: reduce send rate, or upgrade your tier for higher limits."
        );
      }

      case "template_not_found":
        return (
          `Error (${error.code}): ${error.message}\n\n` +
          "Fix: use `brixus_list_starter_templates` to see valid slugs."
        );

      case "invalid_recipient":
      case "missing_field":
      case "multiple_modes":
      case "variable_validation_failed":
        return `Error (${error.code}): ${error.message}`;

      default:
        return `Error (${error.code}, ${error.type}): ${error.message}`;
    }
  }

  // Non-API error (network, DNS, parse).
  if (error instanceof Error) {
    return `Error (network): ${error.message}`;
  }
  return `Error: ${String(error)}`;
}
