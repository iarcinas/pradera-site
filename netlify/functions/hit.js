/* The beacon. One page load in, one tiny blob out.
 *
 * Called by src/App.js once per mount via navigator.sendBeacon. Public by
 * necessity — it has to answer an unauthenticated browser — so it is written
 * on the assumption that anything reaching it may be hostile:
 *
 *   - It returns 204 and an empty body no matter what happens, including when
 *     it decides not to count. A caller learns nothing about why, which means
 *     nobody can use it to probe whether the salt is set or what the bot rules
 *     are. It is also the only sensible answer to sendBeacon, which discards
 *     the response.
 *   - Every field that reaches the store is either computed here from request
 *     headers or run through the allow-lists in ../lib/counter.
 *   - It never reads the store, so there is nothing here to read out.
 *
 * It accepts two values from the page — the path and the referrer — because
 * only the browser knows them. Both are strictly narrowed before use.
 *
 * Environment:
 *   HIT_SALT   secret, any long random string. Rotating it makes every
 *              existing visitor hash unlinkable to any new one, which is the
 *              point of having it separate from the passphrase.
 *              If unset, SITE_ID is used — Netlify sets it on every deploy,
 *              it is not public, and it keeps the counter working from the
 *              first deploy instead of silently dropping a week of data
 *              waiting for someone to set a variable. Set HIT_SALT anyway:
 *              SITE_ID cannot be rotated.
 */

const { getStore, connectLambda } = require("@netlify/blobs");
const {
  manilaParts,
  isBot,
  encodePath,
  safeSource,
  safeCountry,
  visitorHash,
  buildKey,
} = require("../lib/counter");

const STORE = "hits";

/* 204, always, whatever we decided. */
const done = () => ({
  statusCode: 204,
  headers: { "Cache-Control": "no-store" },
  body: "",
});

const lower = (headers) => {
  const out = {};
  Object.keys(headers || {}).forEach((k) => {
    out[k.toLowerCase()] = headers[k];
  });
  return out;
};

/* Netlify's own header first: it is set by the edge and cannot be spoofed by
   the client. x-forwarded-for can be, and its first entry is whatever the
   caller put there — fine as a last resort for a hash input, since a forged
   value only ever splits one visitor into two, but never worth preferring. */
function clientIp(h) {
  if (h["x-nf-client-connection-ip"]) return h["x-nf-client-connection-ip"];
  if (h["client-ip"]) return h["client-ip"];
  return String(h["x-forwarded-for"] || "").split(",")[0].trim();
}

/* x-nf-geo is base64 JSON from the edge. Country only — see safeCountry. */
function country(h) {
  try {
    const geo = JSON.parse(Buffer.from(h["x-nf-geo"], "base64").toString("utf8"));
    return safeCountry(geo && geo.country && geo.country.code);
  } catch {
    return "--";
  }
}

/* Is this request coming from a page on this site?
 *
 * The host is whichever name the request arrived on, so this holds for
 * praderaislands.com and for the *.netlify.app address without naming either
 * — and keeps holding the day the primary domain changes. A browser sends
 * Origin on every POST and, under our strict-origin-when-cross-origin policy,
 * sends Referer on a same-origin one too. A request with neither is not a
 * page; it is a script talking to the endpoint directly. */
function fromOurPage(h) {
  const self = String(h.host || "").toLowerCase();
  if (!self) return false;
  const matches = (value) => {
    if (!value) return false;
    try {
      return new URL(value).host.toLowerCase() === self;
    } catch {
      return false;
    }
  };
  return matches(h.origin) || matches(h.referer);
}

exports.handler = async (event) => {
  // v1 handler: the blobs credentials ride in on the event and have to be
  // handed over before the first getStore call. The guard is for the tests,
  // which call this with a plain event carrying no blobs context.
  if (event.blobs) connectLambda(event);

  if (event.httpMethod !== "POST") return done();

  const h = lower(event.headers);
  if (!fromOurPage(h)) return done();

  const ua = h["user-agent"] || "";
  if (isBot(ua)) return done();

  const salt = process.env.HIT_SALT || process.env.SITE_ID;
  if (!salt) {
    // Counting without a salt would mean storing a plain hash of an IP and a
    // user-agent, which for a known IP range is reversible by anyone who gets
    // the store. Better to count nothing.
    console.warn("hit: neither HIT_SALT nor SITE_ID is set — not counting.");
    return done();
  }

  let body = {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || "";
    body = JSON.parse(raw || "{}");
  } catch {
    /* A page load with an unreadable body is still a page load. Count it at
       the root rather than throw the visit away. */
  }

  // The dashboard is staff looking at their own numbers, not traffic.
  const path = encodePath(body.p);
  if (path.startsWith("~admin")) return done();

  const now = Date.now();
  const { date, hour } = manilaParts(now);

  const key = buildKey({
    date,
    hour,
    visitor: visitorHash({ ip: clientIp(h), ua, salt, date }),
    path,
    source: safeSource(body.r, h.host),
    country: country(h),
  });

  try {
    /* The value is a single byte. Everything the hourly job needs is in the
       key, and list() returns keys without reading values — so the body is
       there only because a blob must have one. */
    await getStore(STORE).set(key, "1");
  } catch (err) {
    // A visit we failed to record is worth a log line and nothing more. The
    // guest is mid-page-load; they must never see this, and a 500 here would
    // show up in the console of a real browser on the live site.
    console.error(`hit: could not write ${key}: ${err.message}`);
  }

  return done();
};
