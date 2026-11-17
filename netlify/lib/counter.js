/* The counting rules, kept apart from both functions that use them.
 *
 * Everything here is pure: strings in, strings out, no clock of its own, no
 * network, no store. That is the point — the beacon and the hourly job are
 * thin shells around these, so the arithmetic that decides what the dashboard
 * says can be tested without a blob store or a deploy.
 *
 * WHY WE COUNT OURSELVES
 * Netlify Web Analytics keeps seven days and costs $9/month per site to see
 * further back. This counts the same event — one page load — on our own
 * origin, keeps it as long as we like, and adds no third-party script, so the
 * CSP stays script-src 'self'. The trade is that a visitor with an ad blocker
 * or JavaScript off is not counted, where Netlify's server-side count caught
 * them. Treat the figures as the shape of the week, not an audited gate count.
 *
 * WHAT IS STORED, AND WHY IT IS NOT PERSONAL DATA
 * No cookie, no device id, no raw IP address. A visitor is a one-way hash of
 * IP + user-agent + a secret salt + THAT DAY'S DATE. The date in the hash is
 * what matters: the same person on Monday and Tuesday hashes to two unrelated
 * values, so the store cannot be used to follow anyone across days even by
 * whoever holds the salt. Under the Data Privacy Act that is the difference
 * between a statistic and a record about a person.
 *
 * WHY THE DATA LIVES IN THE KEY
 * Netlify Blobs has no atomic increment, so a read-modify-write counter loses
 * hits whenever two arrive together — and a hot Saturday is exactly when they
 * do. So each hit is its own blob, and every field we aggregate on is encoded
 * in that blob's KEY:
 *
 *   2026-11-17/14/3f9a8c1d4e7b0526/~/facebook.com/PH/mf2k1x9q
 *   └─ date ──┘ └hr┘ └── visitor ──┘ │ └─ source ─┘ └cc┘ └rand┘
 *                                    └ path, / written as ~
 *
 * list({ prefix }) returns keys without fetching any values, so a whole day
 * aggregates in one list call and ZERO reads. Putting the same fields in the
 * body instead would mean one read per pageview per run — a few thousand reads
 * an hour, for the same answer.
 *
 * The random tail is what makes two loads by the same person in the same hour
 * two pageviews rather than one overwritten blob.
 */

const crypto = require("crypto");

/* Philippine Standard Time is UTC+8 and has been since 1978 — no daylight
   saving, no scheduled change. Shifting the clock and reading the UTC fields
   is therefore exact, and it avoids depending on the ICU timezone database
   being present in the function runtime, which has bitten this kind of code
   before. If PH ever adopts DST, this is the one place to fix. */
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

function manilaParts(ms) {
  const shifted = new Date(ms + MANILA_OFFSET_MS).toISOString();
  return { date: shifted.slice(0, 10), hour: shifted.slice(11, 13) };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* Bots. Not security — a determined scraper can send any user-agent it likes
   — but the honest ones say so, and they are the bulk of the noise. Netlify's
   own analytics counts them, which is why its numbers run high; this is the
   one place we can do better than it.
   Social-media link unfurlers are in here too: a single share on Facebook
   fetches the page several times from their servers, and none of those is a
   person deciding whether to visit the park. */
const BOT_RE = new RegExp(
  [
    "bot", "crawl", "spider", "slurp", "scrape", "fetcher", "archiver",
    "facebookexternalhit", "facebookcatalog", "whatsapp", "telegram",
    "discord", "skypeuripreview", "viber", "twitterbot", "linkedinbot",
    "pinterest", "embedly", "quora link preview", "vkshare", "redditbot",
    "slackbot", "applebot", "petalbot", "bytespider", "yandex", "baidu",
    "semrush", "ahrefs", "mj12", "dotbot", "dataprovider", "serpstat",
    "curl", "wget", "python-requests", "python-urllib", "okhttp", "axios",
    "go-http-client", "java/", "libwww", "httpclient", "node-fetch",
    "headless", "phantomjs", "puppeteer", "playwright", "selenium",
    "lighthouse", "pagespeed", "gtmetrix", "pingdom", "uptime", "monitoring",
    "statuscake", "newrelic", "datadog", "censys", "zgrab", "masscan",
    "google-inspectiontool", "chrome-privacy-preserving-prefetch",
  ].join("|"),
  "i"
);

/* An empty or absurdly short user-agent is not a browser. Every real one is
   dozens of characters long; a blank one is a script that did not bother. */
function isBot(ua) {
  const s = String(ua || "");
  if (s.trim().length < 20) return true;
  return BOT_RE.test(s);
}

/* Paths become one key segment, so the slashes have to go somewhere. `~` is
   the stand-in: it appears in no path on this site, survives a blob key
   untouched, and reverses without ambiguity.
   The allow-list is the security boundary, not a tidy-up. A path arrives from
   the browser, which means it arrives from whoever is driving the browser, and
   it ends up inside a key we later parse and render. Strip it to the
   characters a real path on this site can contain and the question of what a
   hostile path could do downstream stops existing. */
function encodePath(p) {
  let s = String(p || "/").split("?")[0].split("#")[0].toLowerCase();
  s = s.replace(/[^a-z0-9/_.-]/g, "");
  s = s.replace(/\/{2,}/g, "/");
  if (!s.startsWith("/")) s = `/${s}`;
  s = s.slice(0, 60);
  return s.replace(/\//g, "~");
}

const decodePath = (enc) => String(enc || "~").replace(/~/g, "/");

/* The referrer, reduced to a bare host. Two reasons to throw the rest away:
   a full referring URL can carry someone's search terms or a session token in
   its query string, which we have no business storing; and "facebook.com" is
   the answer staff actually want, where 40 distinct Facebook URLs is noise.
   Our own host counts as direct — an internal link is not a source of
   visitors, and without this every page load after the first would be
   attributed to ourselves. */
function safeSource(referrer, selfHost) {
  if (!referrer) return "direct";
  let host;
  try {
    host = new URL(String(referrer)).hostname.toLowerCase();
  } catch {
    return "direct";
  }
  if (!host) return "direct";
  const self = String(selfHost || "").toLowerCase().replace(/^www\./, "");
  const bare = host.replace(/^www\./, "");
  if (self && bare === self) return "direct";
  const clean = bare.replace(/[^a-z0-9.-]/g, "").slice(0, 40);
  return clean || "direct";
}

/* Country code only, never city or coordinates. Country is the question
   Marketing asks — are the Balikbayan ads landing — and it is coarse enough
   that it tells nobody anything about an individual. */
function safeCountry(code) {
  const s = String(code || "").toUpperCase().replace(/[^A-Z]/g, "");
  return s.length === 2 ? s : "--";
}

/* The visitor hash.
   The date is inside the hash on purpose: it rotates the pseudonym every
   Philippine midnight, so nothing in the store can link the same person across
   two days. The cost is that a visitor who comes Saturday and Sunday counts
   twice in a weekend total, which is the right trade for a marketing chart.
   16 hex characters is 64 bits — collisions are not a practical concern at a
   few thousand hits a day, and short keys keep the list calls cheap. */
function visitorHash({ ip, ua, salt, date }) {
  return crypto
    .createHash("sha256")
    .update(`${date}|${ip || ""}|${ua || ""}|${salt}`, "utf8")
    .digest("hex")
    .slice(0, 16);
}

const VISITOR_RE = /^[0-9a-f]{16}$/;

function buildKey({ date, hour, visitor, path, source, country }) {
  const rand = `${Date.now().toString(36)}${crypto.randomBytes(4).toString("hex")}`;
  return [date, hour, visitor, path, source, country, rand].join("/");
}

/* Parse defensively. These keys are written by this same code, but a key that
   survives a format change — or a stray blob written by hand while debugging —
   must not be able to throw inside the hourly job and stop the snapshot. */
function parseKey(key) {
  const parts = String(key || "").split("/");
  if (parts.length !== 7) return null;
  const [date, hourStr, visitor, path, source, country] = parts;
  if (!DATE_RE.test(date)) return null;
  if (!/^\d{2}$/.test(hourStr)) return null;
  const hour = Number(hourStr);
  if (hour < 0 || hour > 23) return null;
  if (!VISITOR_RE.test(visitor)) return null;
  return { date, hour, visitor, path, source, country };
}

/* Keep the long tail out of the stored record. Twelve rows are shown; fifty
   leaves room to widen that without another migration, and stops a day of
   referrer spam from growing the blob without bound. */
const TOP_N = 50;

function bump(map, label) {
  map.set(label, (map.get(label) || 0) + 1);
}

function topRows(map, labelKey) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, TOP_N)
    .map(([label, views]) => ({ [labelKey]: label, views }));
}

/* Raw keys in, one record per Philippine day out, in exactly the shape the
   dashboard already reads.
 *
 * Idempotent by construction: it derives everything from the keys it is given
 * and holds no state between calls, so the hourly job can recompute today as
 * often as it likes and get the same answer. That is what makes it safe to
 * redo today and yesterday on every run — the hour either side of midnight
 * belongs to whichever run happens to see it, and recomputing both means
 * neither is ever half-counted.
 *
 * One figure needs reading carefully: the hourly visitor counts do not add up
 * to the daily one, and should not. Someone who arrives at 10am and comes back
 * at 3pm is two hours' visitor and one day's. The dashboard says so in words
 * rather than leaving staff to wonder which number is wrong.
 */
function aggregate(keys) {
  const days = new Map();

  (keys || []).forEach((key) => {
    const hit = parseKey(key);
    if (!hit) return;

    let day = days.get(hit.date);
    if (!day) {
      day = {
        date: hit.date,
        pageviews: 0,
        visitors: new Set(),
        hours: Array.from({ length: 24 }, (_, hour) => ({ hour, pageviews: 0, visitors: new Set() })),
        pages: new Map(),
        sources: new Map(),
        countries: new Map(),
      };
      days.set(hit.date, day);
    }

    day.pageviews += 1;
    day.visitors.add(hit.visitor);
    day.hours[hit.hour].pageviews += 1;
    day.hours[hit.hour].visitors.add(hit.visitor);
    bump(day.pages, decodePath(hit.path));
    bump(day.sources, hit.source);
    bump(day.countries, hit.country);
  });

  return [...days.values()]
    .map((day) => ({
      date: day.date,
      pageviews: day.pageviews,
      visitors: day.visitors.size,
      hours: day.hours.map((h) => ({ hour: h.hour, pageviews: h.pageviews, visitors: h.visitors.size })),
      pages: topRows(day.pages, "path"),
      sources: topRows(day.sources, "source"),
      countries: topRows(day.countries, "country"),
      /* Kept, always empty, deliberately. The dashboard has a 404 table from
         when these records were going to come from Netlify's endpoint. This
         counter cannot fill it: the beacon fires from the React app, and the
         app only ever loads on a path that exists. Removing the field would
         mean touching the dashboard's table list for no gain; leaving it says
         "nothing recorded", which is true. */
      notFound: [],
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

module.exports = {
  MANILA_OFFSET_MS,
  DATE_RE,
  manilaParts,
  isBot,
  encodePath,
  decodePath,
  safeSource,
  safeCountry,
  visitorHash,
  buildKey,
  parseKey,
  aggregate,
};
