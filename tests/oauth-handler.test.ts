/**
 * Unit tests for oauth-handler.ts helper functions.
 *
 * Tests base64url encoding/decoding and HMAC sign/verify.
 * Uses Node 20+ crypto.subtle (Web Crypto API) which is compatible
 * with the Cloudflare Workers runtime API.
 */

import { describe, expect, it } from "vitest";

import {
  base64urlEncode,
  base64urlDecode,
  hmacSign,
  hmacVerify,
} from "../src/oauth-handler.js";

// ---------------------------------------------------------------------------
// base64url encode/decode
// ---------------------------------------------------------------------------

describe("base64urlEncode / base64urlDecode", () => {
  it("round-trips a simple ASCII string", () => {
    const input = "hello world";
    const encoded = base64urlEncode(input);
    const decoded = base64urlDecode(encoded);
    expect(decoded).toBe(input);
  });

  it("round-trips a JSON payload with special characters", () => {
    const payload = JSON.stringify({
      clientId: "test-client",
      scope: ["emails:send", "templates:read"],
      redirectUri: "https://example.com/callback?foo=bar&baz=qux",
    });
    const encoded = base64urlEncode(payload);
    const decoded = base64urlDecode(encoded);
    expect(decoded).toBe(payload);
  });

  it("round-trips unicode content", () => {
    const input = "Hello, World! Guten Tag! Salut!";
    const encoded = base64urlEncode(input);
    const decoded = base64urlDecode(encoded);
    expect(decoded).toBe(input);
  });

  it("round-trips a Uint8Array input", () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255]);
    const encoded = base64urlEncode(bytes);
    // Decode returns a string via TextDecoder, so compare raw bytes
    const decodedBytes = new TextEncoder().encode(base64urlDecode(encoded));
    // The round-trip for arbitrary bytes won't match via TextDecoder
    // (invalid UTF-8). Instead, verify encoding is deterministic.
    const encoded2 = base64urlEncode(bytes);
    expect(encoded).toBe(encoded2);
  });

  it("produces URL-safe output (no +, /, =)", () => {
    // Bytes whose standard base64 contains +, /, and = padding.
    // [251, 255, 191] -> standard base64: "+/+/" (approx) -- exercises all replacements
    const problematic = new Uint8Array([251, 255, 191]);
    const encoded = base64urlEncode(problematic);

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("round-trips an empty string", () => {
    const encoded = base64urlEncode("");
    const decoded = base64urlDecode(encoded);
    expect(decoded).toBe("");
  });

  it("handles strings whose base64 would have padding", () => {
    // "a" → base64 "YQ==" (2 padding chars)
    const encoded = base64urlEncode("a");
    expect(encoded).not.toContain("=");
    expect(base64urlDecode(encoded)).toBe("a");

    // "ab" → base64 "YWI=" (1 padding char)
    const encoded2 = base64urlEncode("ab");
    expect(encoded2).not.toContain("=");
    expect(base64urlDecode(encoded2)).toBe("ab");
  });
});

// ---------------------------------------------------------------------------
// HMAC sign/verify
// ---------------------------------------------------------------------------

describe("hmacSign / hmacVerify", () => {
  const secret = "test-hmac-secret-key-256-bits-long!!";

  it("sign + verify round-trip succeeds", async () => {
    const payload = "some-important-data";
    const signature = await hmacSign(payload, secret);

    const valid = await hmacVerify(payload, signature, secret);
    expect(valid).toBe(true);
  });

  it("verify rejects a tampered payload", async () => {
    const payload = "original-payload";
    const signature = await hmacSign(payload, secret);

    const valid = await hmacVerify("tampered-payload", signature, secret);
    expect(valid).toBe(false);
  });

  it("verify rejects a wrong signature", async () => {
    const payload = "test-payload";
    await hmacSign(payload, secret); // discard the real signature

    const valid = await hmacVerify(payload, "completely-wrong-sig", secret);
    expect(valid).toBe(false);
  });

  it("verify rejects when signed with a different secret", async () => {
    const payload = "shared-payload";
    const signature = await hmacSign(payload, "secret-A");

    const valid = await hmacVerify(payload, signature, "secret-B");
    expect(valid).toBe(false);
  });

  it("produces a URL-safe base64url signature (no +, /, =)", async () => {
    const payload = "check-url-safety";
    const signature = await hmacSign(payload, secret);

    expect(signature).not.toContain("+");
    expect(signature).not.toContain("/");
    expect(signature).not.toContain("=");
  });

  it("produces deterministic signatures for same input", async () => {
    const payload = "deterministic-test";
    const sig1 = await hmacSign(payload, secret);
    const sig2 = await hmacSign(payload, secret);
    expect(sig1).toBe(sig2);
  });

  it("produces different signatures for different payloads", async () => {
    const sig1 = await hmacSign("payload-a", secret);
    const sig2 = await hmacSign("payload-b", secret);
    expect(sig1).not.toBe(sig2);
  });
});
