/**
 * Error handling for the Brixus MCP server.
 *
 * The Brixus API emits a unified envelope:
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
    const { code: _c, message: _m, type: _t, ...rest } = envelope.error;
    this.extras = rest;
  }
}

/**
 * Map a caught error to the text body of an MCP tool error response.
 */
export function mapToolErrorMessage(error: unknown): string {
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

      case "message_not_found":
        return (
          `Error (${error.code}): ${error.message}\n\n` +
          "Fix: check the message ID. Use `brixus_list_emails` to find valid IDs."
        );

      case "message_already_dispatched":
        return (
          `Error (${error.code}): ${error.message}\n\n` +
          "Fix: only emails in 'scheduled' status can be cancelled."
        );

      case "attachment_type_not_allowed":
      case "attachment_too_large":
      case "too_many_attachments":
        return `Error (${error.code}): ${error.message}`;

      case "campaign_not_found":
        return (
          `Error (${error.code}): ${error.message}\n\n` +
          "Fix: use `brixus_list_campaigns` to find valid campaign IDs."
        );

      case "scope_required": {
        const details = error.extras.details as { required_scope?: string } | undefined;
        const required = details?.required_scope;
        return (
          `Error (${error.code}): ${error.message}` +
          (required ? ` Required permission: ${required}.` : "") +
          "\n\nFix: create an API key with the appropriate scope at " +
          "https://app.brixus365.com/settings/api-keys. " +
          "For campaign read access use `marketing:read`; for campaign " +
          "test-send use `marketing:write`. Marketing scopes require a " +
          "Pro or Enterprise account."
        );
      }

      case "api_key_required":
        return (
          `Error (${error.code}): ${error.message}\n\n` +
          "Fix: this endpoint requires API key auth, not a JWT session."
        );

      case "jwt_required":
        return (
          `Error (${error.code}): ${error.message}\n\n` +
          "Fix: this endpoint requires JWT (dashboard) auth, not an API key."
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

  if (error instanceof Error) {
    return `Error (network): ${error.message}`;
  }
  return `Error: ${String(error)}`;
}
