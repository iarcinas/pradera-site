/* The staff gate, shared by every function that needs it.
 *
 * It lives outside netlify/functions on purpose: anything inside that folder
 * is published as its own endpoint, and this is a library, not a door.
 *
 * One secret, ADMIN_PASSPHRASE. The token-signing key is derived from it, so
 * changing the passphrase invalidates every outstanding token at once and
 * there is only one thing to rotate.
 */

const crypto = require("crypto");

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

const sha256 = (s) => crypto.createHash("sha256").update(String(s), "utf8").digest();

/* Compare digests, never the strings. Digests are always 32 bytes, so the
   comparison cannot throw on a length mismatch and its duration stops
   carrying a hint about how long the real passphrase is. */
function sameSecret(a, b) {
  return crypto.timingSafeEqual(sha256(a), sha256(b));
}

const tokenKey = (secret) => sha256(secret);

function signToken(secret, expiresAt) {
  const sig = crypto.createHmac("sha256", tokenKey(secret)).update(String(expiresAt)).digest("hex");
  return `${expiresAt}.${sig}`;
}

function verifyToken(token, secret) {
  if (typeof token !== "string") return false;
  const [expPart, sig] = token.split(".");
  const expiresAt = Number(expPart);
  if (!Number.isFinite(expiresAt) || !sig) return false;
  if (Date.now() > expiresAt) return false;
  // Re-sign the claimed expiry. Someone who edits the expiry to next year
  // cannot produce the signature that belongs with it.
  return sameSecret(sig, crypto.createHmac("sha256", tokenKey(secret)).update(expPart).digest("hex"));
}

/* `cache` is seconds for the CDN to hold the answer. Anything carrying staff
   data passes nothing and gets no-store; only the public read uses it. */
const json = (statusCode, body, cache) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": cache ? `public, max-age=${cache}, s-maxage=${cache}` : "no-store",
  },
  body: JSON.stringify(body),
});

/* Netlify hands the body back base64-encoded in some runtimes. Decoding
   unconditionally would corrupt a plain body, so follow the flag. */
function parseBody(event) {
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : event.body || "";
  return JSON.parse(raw || "{}");
}

module.exports = { TOKEN_TTL_MS, sameSecret, signToken, verifyToken, json, parseBody };
