/**
 * Minimal client-side JWT simulator.
 *
 * This is NOT cryptographically secure — there is no real backend in this
 * experiment, so we simulate the HEADER.PAYLOAD.SIGNATURE structure from
 * the lab sheet using base64url encoding. A real system must sign tokens
 * on a trusted server. This module exists purely to demonstrate the
 * token shape, expiry handling, and decode logic described in the PDF.
 */

function base64UrlEncode(obj) {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str) {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const json = decodeURIComponent(escape(atob(b64)));
  return JSON.parse(json);
}

const HEADER = { alg: "HS256-SIM", typ: "JWT" };

/**
 * Creates a simulated JWT for a given user payload.
 * @param {object} payload - e.g. { userId, name, role }
 * @param {number} expiresInSeconds - token lifetime
 */
export function createToken(payload, expiresInSeconds = 30) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, iat: Math.floor(Date.now() / 1000), exp };
  const headerPart = base64UrlEncode(HEADER);
  const payloadPart = base64UrlEncode(fullPayload);
  // Simulated signature: not real crypto, just a deterministic fingerprint
  // so tampered tokens can be visibly detected in this demo.
  const signaturePart = base64UrlEncode({
    sig: `${headerPart}.${payloadPart}`.length * 31,
  });
  return `${headerPart}.${payloadPart}.${signaturePart}`;
}

/** Decodes a token's payload without verifying signature (client-side read). */
export function decodeToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return base64UrlDecode(parts[1]);
  } catch {
    return null;
  }
}

/** Returns true if the token is missing, malformed, or past its exp claim. */
export function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  return Date.now() / 1000 >= payload.exp;
}
