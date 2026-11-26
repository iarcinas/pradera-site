/* What the park is telling the public today: the notice banner, the
 * operating schedule, and the admission rates and promos.
 *
 * Two doors in one file, because they act on the same stored documents:
 *
 *   GET   open to anyone. It is what the website itself reads on every visit,
 *         so it is held at the CDN for a minute. One invocation a minute, not
 *         one per guest — on a busy Saturday that is the difference between a
 *         rounding error and a bill.
 *
 *   POST  staff only, same passphrase as the dashboard. No caching.
 *
 * An expired notice is dropped on the way out rather than on the way in, so a
 * stale "closed today" cannot survive in the store and reappear. A notice with
 * no expiry is refused outright: a banner nobody remembers to take down is
 * worse than no banner, and "Closed today" still showing on Thursday is the
 * exact way this feature embarrasses a park.
 *
 * Saving the schedule also pokes the build, if NETLIFY_BUILD_HOOK is set.
 * That is what keeps Google in step: the page reads this function live, but
 * the opening hours Google shows are baked into the HTML at build time. The
 * page would otherwise say one thing and the search result another.
 */

const { getStore, connectLambda } = require("@netlify/blobs");
const { sameSecret, verifyToken, json, parseBody } = require("../lib/auth");

const STORE = "site-config";
const PUBLIC_CACHE_SECONDS = 60;

const LEVELS = new Set(["info", "warning", "closed"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/* A banner nobody can read in a glance is not a banner. */
const MAX_MESSAGE = 280;

/* Far enough ahead for "closed for the rest of the week", short enough that a
   typo in the year cannot pin a notice to the site until 2030. */
const MAX_NOTICE_DAYS = 60;

const openStore = () => {
  try {
    return getStore(STORE);
  } catch (err) {
    return { error: `Store unavailable: ${err.message}` };
  }
};

const readDoc = async (store, key) => {
  try {
    return await store.get(key, { type: "json" });
  } catch {
    // A read that fails is not a reason to take the website down. The page
    // falls back to what it was built with.
    return null;
  }
};

/* Schedules stored before dated overrides existed carry a `holidays` list,
   which could only open a day and carried no reason. Convert on the way out so
   that everything downstream — the website, the admin, the build step — deals
   with one shape only. The stored document is left as it is; it gets rewritten
   in the new shape the first time staff save. */
function normaliseSchedule(s) {
  if (!s) return null;
  if (s.overrides) return s;
  const overrides = {};
  (s.holidays || []).forEach((date) => {
    overrides[date] = { open: true, reason: "Holiday" };
  });
  const { holidays, ...rest } = s;
  return { ...rest, overrides };
}

/* Drop a notice whose time has passed. This runs on read, so even a notice
   that was never cleared by hand simply stops being served. */
const liveNotice = (notice) => {
  if (!notice || !notice.message || !notice.expiresAt) return null;
  return Date.parse(notice.expiresAt) > Date.now() ? notice : null;
};

function validateNotice(n) {
  if (n === null) return null; // an explicit "take it down"
  if (typeof n !== "object") return "Notice must be an object or null.";
  if (typeof n.message !== "string" || !n.message.trim()) return "The notice needs a message.";
  if (n.message.length > MAX_MESSAGE) return `Keep the message under ${MAX_MESSAGE} characters.`;
  if (!LEVELS.has(n.level)) return "Level must be info, warning or closed.";
  const expires = Date.parse(n.expiresAt);
  if (!Number.isFinite(expires)) return "The notice needs a valid end time.";
  if (expires <= Date.now()) return "That end time has already passed.";
  if (expires > Date.now() + MAX_NOTICE_DAYS * 86400000) {
    return `An announcement cannot run longer than ${MAX_NOTICE_DAYS} days.`;
  }
  return null;
}

/* A reason shows as a line under the guest calendar, so it has to fit on one. */
const MAX_REASON = 90;
const MAX_OVERRIDES = 150;

/* Single dates that depart from the weekly pattern, each way:
     { "2026-11-21": { open: false, reason: "Masamang panahon" },
       "2026-11-30": { open: true,  reason: "Holiday" } }
   This replaces the old `holidays` list, which could only ever open a day and
   could not say why. Schedules stored in the old shape are converted on read
   rather than migrated in place — see normaliseSchedule. */
function validateOverrides(o) {
  if (o === undefined) return null;
  if (typeof o !== "object" || o === null || Array.isArray(o)) {
    return "overrides must be an object keyed by date.";
  }
  const keys = Object.keys(o);
  if (keys.length > MAX_OVERRIDES) return `That is more than ${MAX_OVERRIDES} dated changes.`;
  for (const date of keys) {
    if (!DATE_RE.test(date)) return `"${date}" is not a YYYY-MM-DD date.`;
    const v = o[date];
    if (typeof v !== "object" || v === null) return `The entry for ${date} is malformed.`;
    if (typeof v.open !== "boolean") return `The entry for ${date} must say open true or false.`;
    if (v.reason !== undefined && v.reason !== null) {
      if (typeof v.reason !== "string") return `The reason for ${date} must be text.`;
      if (v.reason.length > MAX_REASON) return `Keep the reason for ${date} under ${MAX_REASON} characters.`;
    }
  }
  return null;
}

function validateSchedule(s) {
  if (typeof s !== "object" || s === null) return "Schedule must be an object.";
  if (!Array.isArray(s.weekdays) || s.weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
    return "weekdays must be a list of day numbers from 0 to 6.";
  }
  const badOverrides = validateOverrides(s.overrides);
  if (badOverrides) return badOverrides;
  for (const band of ["weekday", "weekend"]) {
    const h = s.hours && s.hours[band];
    if (!h || !TIME_RE.test(h.opens || "") || !TIME_RE.test(h.closes || "")) {
      return `${band} hours must be 24-hour times like 09:00.`;
    }
    if (h.opens >= h.closes) return `${band} hours close before they open.`;
  }
  if (s.opensFrom && !DATE_RE.test(s.opensFrom)) return "opensFrom must be YYYY-MM-DD.";
  return null;
}

/* ---- rates and promos ----
 *
 * One document, "pricing":
 *   { season: { peakFrom, peakTo },     // MM-DD, inclusive; the rest is Off-Peak
 *     rates:  [{ name, note, kind: "price"|"free"|"discount",
 *                weekday, weekend,          // kind "price": Off-Peak, whole pesos
 *                peakWeekday, peakWeekend,  // kind "price": Peak
 *                percent }],                // kind "discount": % off the first row
 *     promos: [{ enabled, title, text, badge, badgeSub,
 *                startsOn, endsOn,      // YYYY-MM-DD, either may be empty
 *                deal: { qty, percent } | null }] }
 *
 * A discount row is stored as a percentage, not as two more prices, so that
 * Senior/PWD can never drift away from Regular when Regular changes. The same
 * goes for a deal: the website works out "P9,720 for ten" from the Regular
 * weekday rate, so nobody has to redo the arithmetic and get it wrong.
 * The first row is that base, so it has to be an ordinary priced row.
 */
const MAX_RATES = 8;
const MAX_PROMOS = 4;
const MAX_PESOS = 100000;
const KINDS = new Set(["price", "free", "discount"]);

const isText = (v, max, required) =>
  v === undefined || v === null
    ? !required
    : typeof v === "string" && v.length <= max && (!required || v.trim().length > 0);
const isWhole = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const MD_RE = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const DAYS_IN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const isMonthDay = (v) => typeof v === "string" && MD_RE.test(v) && Number(v.slice(3)) <= DAYS_IN[Number(v.slice(0, 2)) - 1];
const PRICE_FIELDS = [["weekday", "Off-Peak weekday"], ["weekend", "Off-Peak weekend"], ["peakWeekday", "Peak weekday"], ["peakWeekend", "Peak weekend"]];

function validatePricing(p) {
  if (typeof p !== "object" || p === null) return "Pricing must be an object.";
  if (!p.season || !isMonthDay(p.season.peakFrom) || !isMonthDay(p.season.peakTo)) {
    return "The Peak season needs a real start and end date.";
  }
  if (p.season.peakFrom === p.season.peakTo) return "The Peak season has to be longer than one day.";
  if (!Array.isArray(p.rates) || !p.rates.length) return "Add at least one rate.";
  if (p.rates.length > MAX_RATES) return `Keep it to ${MAX_RATES} rates or fewer.`;
  for (const [i, r] of p.rates.entries()) {
    if (typeof r !== "object" || r === null) return `Rate ${i + 1} is malformed.`;
    if (!isText(r.name, 40, true)) return `Rate ${i + 1} needs a name (up to 40 characters).`;
    const label = r.name.trim();
    if (!isText(r.note, 80, false)) return `Keep the note for ${label} under 80 characters.`;
    if (!KINDS.has(r.kind)) return `${label}: pick priced, free or discount.`;
    if (i === 0 && r.kind !== "price") {
      return `${label} is the base the discounts and promos are worked out from, so it needs its own prices.`;
    }
    if (r.kind === "price") {
      for (const [f, what] of PRICE_FIELDS) {
        if (!isWhole(r[f], 1, MAX_PESOS)) return `${label}: the ${what} price must be whole pesos from 1 to ${MAX_PESOS}.`;
      }
    }
    if (r.kind === "discount" && !isWhole(r.percent, 1, 90)) return `${label}: the discount must be 1 to 90 percent.`;
  }
  const names = p.rates.map((r) => r.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) return "Two rates have the same name.";

  if (!Array.isArray(p.promos)) return "promos must be a list.";
  if (p.promos.length > MAX_PROMOS) return `Keep it to ${MAX_PROMOS} promos or fewer.`;
  for (const [i, x] of p.promos.entries()) {
    if (typeof x !== "object" || x === null) return `Promo ${i + 1} is malformed.`;
    if (!isText(x.title, 80, true)) return `Promo ${i + 1} needs a title (up to 80 characters).`;
    const label = x.title.trim();
    if (typeof x.enabled !== "boolean") return `${label}: say whether it is on or off.`;
    if (!isText(x.text, 400, false)) return `Keep the text of ${label} under 400 characters.`;
    if (!isText(x.badge, 8, true)) return `${label} needs a badge, up to 8 characters, like 10%.`;
    if (!isText(x.badgeSub, 12, false)) return `Keep the small badge line of ${label} under 12 characters.`;
    for (const k of ["startsOn", "endsOn"]) {
      if (x[k] && !DATE_RE.test(x[k])) return `${label}: dates must be YYYY-MM-DD.`;
    }
    if (x.startsOn && x.endsOn && x.endsOn < x.startsOn) return `${label} ends before it starts.`;
    if (x.deal !== null && x.deal !== undefined) {
      if (typeof x.deal !== "object") return `${label}: the deal is malformed.`;
      if (!isWhole(x.deal.qty, 2, 100)) return `${label}: the group size must be 2 to 100 tickets.`;
      if (!isWhole(x.deal.percent, 1, 90)) return `${label}: the deal discount must be 1 to 90 percent.`;
    }
  }
  return null;
}

/* Rebuilt field by field, like the schedule, so nothing unexpected is stored. */
function cleanPricing(p) {
  const t = (v) => (typeof v === "string" ? v.trim() : "") || null;
  return {
    season: { peakFrom: p.season.peakFrom, peakTo: p.season.peakTo },
    rates: p.rates.map((r) => ({
      name: r.name.trim(),
      note: t(r.note),
      kind: r.kind,
      ...(r.kind === "price"
        ? { weekday: r.weekday, weekend: r.weekend, peakWeekday: r.peakWeekday, peakWeekend: r.peakWeekend }
        : {}),
      ...(r.kind === "discount" ? { percent: r.percent } : {}),
    })),
    promos: p.promos.map((x) => ({
      enabled: x.enabled,
      title: x.title.trim(),
      text: t(x.text),
      badge: x.badge.trim(),
      badgeSub: t(x.badgeSub),
      startsOn: x.startsOn || null,
      endsOn: x.endsOn || null,
      deal: x.deal ? { qty: x.deal.qty, percent: x.deal.percent } : null,
    })),
    updatedAt: new Date().toISOString(),
  };
}

/* Guests never see a promo that has been switched off. Dates are left for the
   page to judge, in Manila time: this answer is cached, and a promo that ends
   tonight should not linger into tomorrow on the cache's account. */
const publicPricing = (p) => (p ? { ...p, promos: (p.promos || []).filter((x) => x.enabled) } : null);

/* Ask Netlify to rebuild. Best effort: a schedule that saved but did not
   trigger a build is still saved, and the caller is told plainly rather than
   being shown a failure for work that succeeded. */
async function triggerBuild() {
  const hook = process.env.NETLIFY_BUILD_HOOK;
  if (!hook) return "No build hook is set, so the hours Google shows will update on the next deploy.";
  try {
    const res = await fetch(hook, { method: "POST" });
    return res.ok ? null : `The site saved, but the rebuild did not start (${res.status}).`;
  } catch (err) {
    return `The site saved, but the rebuild did not start (${err.message}).`;
  }
}

exports.handler = async (event) => {
  /* This is a v1 (Lambda-compatible) handler, and in that shape the blobs
     client does not find its credentials by itself — they arrive on the event
     and have to be handed over before the first getStore call. Without this,
     every read and write fails with "the environment has not been configured",
     which reads like a misconfigured site rather than a missing line.
     The guard is for the tests, which call the handler with a plain event
     that carries no blobs context. */
  if (event.blobs) connectLambda(event);

  const store = openStore();

  if (event.httpMethod === "GET") {
    if (store.error) {
      // Answer with nothing rather than an error. The website treats an empty
      // answer as "carry on with what you were built with", which is right.
      return json(200, { notice: null, schedule: null, pricing: null }, PUBLIC_CACHE_SECONDS);
    }
    const [notice, schedule, pricing] = await Promise.all([
      readDoc(store, "notice"),
      readDoc(store, "schedule"),
      readDoc(store, "pricing"),
    ]);
    return json(
      200,
      { notice: liveNotice(notice), schedule: normaliseSchedule(schedule), pricing: publicPricing(pricing) },
      PUBLIC_CACHE_SECONDS
    );
  }

  if (event.httpMethod !== "POST") return json(405, { error: "Use GET or POST." });

  const secret = process.env.ADMIN_PASSPHRASE;
  if (!secret) return json(500, { error: "ADMIN_PASSPHRASE is not set on this deploy." });

  let body;
  try {
    body = parseBody(event);
  } catch {
    return json(400, { error: "Body must be JSON." });
  }

  if (!verifyToken(body.token, secret)) {
    return json(401, { error: "Session expired. Please sign in again." });
  }
  if (store.error) return json(500, { error: store.error });

  // Staff reading their own settings: unlike the public GET, this hands back
  // an expired notice too, so the editor can show what was last published
  // instead of an empty box that looks like nothing was ever set.
  if (body.op === "read") {
    const [notice, schedule, pricing] = await Promise.all([
      readDoc(store, "notice"),
      readDoc(store, "schedule"),
      readDoc(store, "pricing"),
    ]);
    return json(200, { notice: notice || null, schedule: normaliseSchedule(schedule), pricing: pricing || null });
  }

  if (body.op === "notice") {
    const bad = validateNotice(body.notice);
    if (bad) return json(400, { error: bad });

    if (body.notice === null) {
      await store.delete("notice");
      return json(200, { notice: null, saved: true });
    }
    const notice = {
      message: body.notice.message.trim(),
      level: body.notice.level,
      expiresAt: new Date(Date.parse(body.notice.expiresAt)).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await store.setJSON("notice", notice);
    // The CDN holds the public answer for a minute, so say so rather than let
    // staff think the banner failed when it is merely a few seconds behind.
    return json(200, { notice, saved: true, note: "The banner appears within a minute." });
  }

  if (body.op === "schedule") {
    const bad = validateSchedule(body.schedule);
    if (bad) return json(400, { error: bad });

    // Rebuilt rather than spread, so a stray field cannot ride in and sit in
    // the store forever pretending to mean something.
    const overrides = {};
    Object.keys(body.schedule.overrides || {})
      .sort()
      .forEach((date) => {
        const v = body.schedule.overrides[date];
        overrides[date] = {
          open: v.open,
          reason: (v.reason || "").trim() || null,
        };
      });

    const schedule = {
      weekdays: [...new Set(body.schedule.weekdays)].sort(),
      overrides,
      hours: {
        weekday: { opens: body.schedule.hours.weekday.opens, closes: body.schedule.hours.weekday.closes },
        weekend: { opens: body.schedule.hours.weekend.opens, closes: body.schedule.hours.weekend.closes },
      },
      opensFrom: body.schedule.opensFrom || null,
      updatedAt: new Date().toISOString(),
    };
    await store.setJSON("schedule", schedule);
    return json(200, { schedule, saved: true, note: await triggerBuild() });
  }

  if (body.op === "pricing") {
    const bad = validatePricing(body.pricing);
    if (bad) return json(400, { error: bad });
    const pricing = cleanPricing(body.pricing);
    await store.setJSON("pricing", pricing);
    // The rebuild carries the new price band into what Google shows.
    return json(200, { pricing, saved: true, note: await triggerBuild() });
  }

  return json(400, { error: "Unknown op." });
};

// Exported for the tests; the handler above is what Netlify runs.
module.exports.validateNotice = validateNotice;
module.exports.validateSchedule = validateSchedule;
module.exports.liveNotice = liveNotice;
module.exports.validatePricing = validatePricing;
module.exports.cleanPricing = cleanPricing;
module.exports.publicPricing = publicPricing;
