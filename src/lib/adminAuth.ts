/**
 * Minimal single-password admin auth.
 *
 * - ADMIN_PASSWORD (env) is the only credential.
 * - On login we set an HttpOnly cookie: "<expiryMs>.<hmac>" signed with a key
 *   derived from ADMIN_PASSWORD (+ optional ADMIN_SESSION_SECRET), so no extra
 *   secret is strictly required.
 * - Uses Web Crypto only, so verification also runs in edge middleware.
 */

export const ADMIN_COOKIE = "pkdm_admin";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

const enc = new TextEncoder();

function secretMaterial(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  const extra = process.env.ADMIN_SESSION_SECRET ?? "";
  return `pkdm-admin-v1:${pw}:${extra}`;
}

async function hmacKey(): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(secretMaterial()));
  return crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + SESSION_TTL_MS;
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(String(exp)));
  return `${exp}.${toHex(sig)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  if (!token) return false;
  const [expStr, sigHex] = token.split(".");
  const exp = Number(expStr);
  if (!expStr || !sigHex || !Number.isFinite(exp) || exp < Date.now()) return false;
  try {
    const key = await hmacKey();
    const sig = Uint8Array.from(
      sigHex.match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? []
    );
    return await crypto.subtle.verify("HMAC", key, sig, enc.encode(expStr));
  } catch {
    return false;
  }
}

/** Constant-time-ish password comparison via HMAC digests. */
export async function checkPassword(candidate: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !candidate) return false;
  const key = await hmacKey();
  const a = toHex(await crypto.subtle.sign("HMAC", key, enc.encode(candidate)));
  const b = toHex(await crypto.subtle.sign("HMAC", key, enc.encode(expected)));
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
