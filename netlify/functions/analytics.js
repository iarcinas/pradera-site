/* The only door into the analytics dashboard.
 *
 * Netlify's own password protection and the Basic-Auth `_headers` trick are
 * both Pro-plan features, and this site is on Personal — so the gate is here,
 * in a function, rather than in front of the page. That turns out to be the
 * sounder arrangement anyway: /admin/ is a static shell holding no numbers at
 * all, so an unauthenticated visitor who finds the address gets an empty form.
 * The data never leaves this file without a valid token. Hiding the URL is not
 * the protection and was never meant to be.
 *
 * No Google, no OAuth, no third party: a passphrase in an environment variable
 * and an HMAC token derived from it. That also keeps the site's CSP tight —
 * a Google sign-in button would need googleapis.com in script-src.
 *
 * Environment:
 *   ADMIN_PASSPHRASE  the shared staff passphrase. Make it long (20+ chars).
 *                     A serverless function has nowhere reliable to keep a
 *                     failed-attempt counter, so there is no rate limiting;
 *                     length is what makes guessing hopeless instead.
 *
 * One shared passphrase is a deliberate trade, not an oversight: it means we
 * cannot tell who looked, and a departure means changing it for everyone.
 * Per-person accounts need a user store and a reset flow — a real project, not
 * an afternoon. Revisit when more than a handful of people need access.
 */

const { getStore } = require("@netlify/blobs");
const { TOKEN_TTL_MS, sameSecret, signToken, verifyToken, json, parseBody } = require("../lib/auth");

const STORE = "analytics";

/* A ceiling on one request. Each day is its own blob, so a two-year range
   would be 700 reads in one invocation — slow, and billed as compute. When the
   history gets long enough for that to bite, the answer is a monthly rollup
   blob written by the snapshot job, not a bigger ceiling here. */
const MAX_DAYS = 185;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* Read several days at once without opening 185 sockets in the same breath. */
async function readDays(store, dates) {
  const out = [];
  for (let i = 0; i < dates.length; i += 20) {
    const chunk = dates.slice(i, i + 20);
    // A day that was never written comes back as null, and that is a gap: a
    // night the job did not run, or a date before the park opened. A thrown
    // error is a different thing entirely and is allowed to travel — dressing
    // a failed read up as "no data" would put a hole in the chart that looks
    // like history instead of like a fault.
    const got = await Promise.all(chunk.map((d) => store.get(d, { type: "json" })));
    got.forEach((rec, n) => {
      out.push(rec || { date: chunk[n], missing: true });
    });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Use POST." });
  }

  const secret = process.env.ADMIN_PASSPHRASE;
  if (!secret) {
    // Say this plainly. A dashboard that answers "wrong passphrase" when the
    // real problem is an unset variable costs an hour of looking in the wrong
    // place, and nothing here is secret enough to be worth that.
    return json(500, { error: "ADMIN_PASSPHRASE is not set on this deploy." });
  }

  let body;
  try {
    body = parseBody(event);
  } catch {
    return json(400, { error: "Body must be JSON." });
  }

  if (body.op === "login") {
    if (typeof body.passphrase !== "string" || !body.passphrase) {
      return json(400, { error: "Passphrase missing." });
    }
    if (!sameSecret(body.passphrase, secret)) {
      return json(401, { error: "That passphrase is not right." });
    }
    const expiresAt = Date.now() + TOKEN_TTL_MS;
    return json(200, { token: signToken(secret, expiresAt), expiresAt });
  }

  // Everything past this point needs a token.
  if (!verifyToken(body.token, secret)) {
    return json(401, { error: "Session expired. Please sign in again." });
  }

  /* Opened per branch, after the request has been checked. A malformed range
     should come back as "those dates are wrong", not as a storage error. */
  const openStore = () => {
    try {
      return getStore(STORE);
    } catch (err) {
      return { error: `Blob store unavailable: ${err.message}` };
    }
  };

  if (body.op === "days") {
    // Which dates exist at all. The dashboard asks this first so its date
    // pickers can be bounded by reality instead of by the calendar.
    //
    // Before the snapshot job has ever run there is no store to list. That is
    // the ordinary state on the day this ships, not a failure, so it answers
    // with an empty list and lets the dashboard say so in words.
    const store = openStore();
    if (store.error) return json(500, { error: store.error });

    let blobs = [];
    try {
      ({ blobs } = await store.list());
    } catch {
      blobs = [];
    }
    const dates = blobs.map((b) => b.key).filter((k) => DATE_RE.test(k)).sort();
    return json(200, { dates });
  }

  if (body.op === "range") {
    const { from, to } = body;
    if (!DATE_RE.test(from || "") || !DATE_RE.test(to || "")) {
      return json(400, { error: "from and to must be YYYY-MM-DD." });
    }
    if (from > to) {
      return json(400, { error: "from is after to." });
    }

    const dates = [];
    // Step in UTC so the loop cannot lose or repeat a day across a DST
    // boundary. The dates themselves are Philippine calendar days, decided by
    // the snapshot job; this is only arithmetic over their labels.
    for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86400000) {
      dates.push(new Date(t).toISOString().slice(0, 10));
      if (dates.length > MAX_DAYS) {
        return json(400, { error: `That range is longer than ${MAX_DAYS} days. Please narrow it.` });
      }
    }

    const store = openStore();
    if (store.error) return json(500, { error: store.error });

    return json(200, { days: await readDays(store, dates) });
  }

  return json(400, { error: "Unknown op." });
};
