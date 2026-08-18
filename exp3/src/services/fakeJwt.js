// Simulated JWT utilities for the experiment.
// NOTE: this is NOT cryptographically signed — it exists to demonstrate the
// HEADER.PAYLOAD.SIGNATURE structure and the auth flow client-side, per the
// experiment brief ("Simulate/generate JWT token"). A real system signs the
// token on a trusted server with a secret/private key.

function base64urlEncode(obj) {
  const json = JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return JSON.parse(decodeURIComponent(escape(atob(s))));
}

export function generateToken(payload, expiresInSeconds = 30) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const headerEncoded = base64urlEncode(header);
  const payloadEncoded = base64urlEncode(fullPayload);
  // Simulated signature — a real server computes HMACSHA256(header.payload, secret)
  const signature = base64urlEncode({ len: `${headerEncoded}.${payloadEncoded}`.length, salt: Math.random().toString(36).slice(2) });
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

export function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return base64urlDecode(parts[1]);
  } catch {
    return null;
  }
}

export function decodeHeader(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return base64urlDecode(parts[0]);
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  return Date.now() / 1000 > payload.exp;
}

export function secondsUntilExpiry(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return 0;
  return Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
}
