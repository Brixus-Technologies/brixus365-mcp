/**
 * Default handler for authorization UI and consent callback.
 *
 * Handles two routes:
 * 1. /oauth/authorize -- redirect to SPA consent page with HMAC-signed authRequest
 * 2. /oauth/callback  -- verify HMAC, exchange nonce for API key, completeAuthorization()
 *
 * Security measures:
 * - oauth_state is HMAC-signed to prevent callback forgery.
 * - API key is never in a URL. The SPA passes a nonce; the Worker
 *   exchanges it server-to-server via POST /auth/mcp/exchange-nonce.
 * - Nonce is single-use (Redis GETDEL) with 30s TTL.
 */

import type { Env } from "./worker.js";

// --- HMAC helpers ---

async function hmacSign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  return base64urlEncode(new Uint8Array(signature));
}

async function hmacVerify(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const expected = await hmacSign(payload, secret);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

// --- base64url encode/decode (no padding) ---

function base64urlEncode(data: string | Uint8Array): string {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(encoded: string): string {
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export const oauthDefaultHandler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // --- /oauth/authorize ---
    // OAuthProvider routes authorization requests here.
    // Parse the request, HMAC-sign the state, redirect to SPA.
    if (url.pathname === "/oauth/authorize") {
      const oauthReqInfo = await env.OAUTH_PROVIDER.parseAuthRequest(request);
      const clientInfo = await env.OAUTH_PROVIDER.lookupClient(
        oauthReqInfo.clientId,
      );

      // Serialize + HMAC-sign the authRequest
      const payload = base64urlEncode(JSON.stringify(oauthReqInfo));
      const signature = await hmacSign(payload, env.OAUTH_STATE_HMAC_SECRET);
      const signedState = `${payload}.${signature}`;

      const consentParams = new URLSearchParams({
        client_name: clientInfo?.clientName || oauthReqInfo.clientId,
        scope: oauthReqInfo.scope.join(" "),
        worker_callback: `${env.WORKER_URL}/oauth/callback`,
        oauth_state: signedState,
      });

      return Response.redirect(
        `${env.BRIXUS_FRONTEND_URL}/oauth/consent?${consentParams}`,
        302,
      );
    }

    // --- /oauth/callback ---
    // SPA redirects here after the user approves (or denies).
    // Carries nonce + oauth_state. NO API key in URL.
    if (url.pathname === "/oauth/callback") {
      const approved = url.searchParams.get("approved");
      const nonce = url.searchParams.get("nonce");
      const oauthStateSigned = url.searchParams.get("oauth_state");

      if (approved !== "true" || !nonce || !oauthStateSigned) {
        // Denied or missing params. Return error to OAuth client.
        return new Response("Authorization denied.", { status: 403 });
      }

      // Verify HMAC on oauth_state
      const dotIndex = oauthStateSigned.lastIndexOf(".");
      if (dotIndex === -1) {
        return new Response("Invalid oauth_state format.", { status: 400 });
      }
      const payload = oauthStateSigned.substring(0, dotIndex);
      const signature = oauthStateSigned.substring(dotIndex + 1);

      const valid = await hmacVerify(
        payload,
        signature,
        env.OAUTH_STATE_HMAC_SECRET,
      );
      if (!valid) {
        return new Response("oauth_state signature verification failed.", {
          status: 400,
        });
      }

      // Deserialize the original authRequest
      let oauthReqInfo: any;
      try {
        oauthReqInfo = JSON.parse(base64urlDecode(payload));
      } catch {
        return new Response("Invalid oauth_state payload.", { status: 400 });
      }

      // Exchange nonce for API key (server-to-server)
      const exchangeResponse = await fetch(
        `${env.BRIXUS_API_BASE_URL}/auth/mcp/exchange-nonce`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Worker-Secret": env.WORKER_SHARED_SECRET,
          },
          body: JSON.stringify({ nonce }),
        },
      );

      if (!exchangeResponse.ok) {
        const errorText = await exchangeResponse.text();
        console.error("Nonce exchange failed", {
          status: exchangeResponse.status,
          error: errorText,
        });
        return new Response(
          "Authorization failed: could not exchange nonce. " +
            "The authorization may have expired. Please try again.",
          { status: 500 },
        );
      }

      const { api_key: apiKey, user_id: userId, scopes } =
        (await exchangeResponse.json()) as {
          api_key: string;
          user_id: string;
          scopes: string[];
        };

      // Complete the OAuth flow. The library issues an auth code,
      // redirects to the client's callback, and later exchanges the
      // code for tokens. api_key is stored as a token prop in KV.
      const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
        request: oauthReqInfo,
        userId,
        metadata: { source: "mcp_consent" },
        scope: scopes,
        props: {
          api_key: apiKey,
        },
      });

      return Response.redirect(redirectTo, 302);
    }

    return new Response("Not found", { status: 404 });
  },
};
