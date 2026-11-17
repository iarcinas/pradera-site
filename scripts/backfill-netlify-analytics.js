#!/usr/bin/env node
/* One-time backfill: rescue the history Netlify Web Analytics still holds.
 *
 * Netlify keeps seven days of Web Analytics on our plan. Anything older is
 * already gone and no script can bring it back — this only saves what is
 * still in the window, which is why it is worth running sooner rather than
 * later and exactly once.
 *
 * NOT part of the build. `npm run build` must never call this: it talks to an
 * undocumented endpoint with a personal access token, and a deploy that fails
 * because an unofficial API changed its field names would take the whole site
 * down over a chart.
 *
 * ── HOW TO RUN IT ───────────────────────────────────────────────────────────
 *
 * 1. A personal access token. Netlify → avatar → User settings →
 *    Applications → Personal access tokens → New access token.
 *    It is shown ONCE and it has full access to your Netlify account, so do
 *    not paste it into chat, a commit, or a file in this repo. Delete it from
 *    Netlify when this is done — it is needed for one run.
 *
 * 2. The site ID. Netlify → the site → Site configuration → Site details →
 *    Site ID (a UUID, not the site name).
 *
 * 3. From the project folder, in PowerShell:
 *
 *      $env:NETLIFY_TOKEN  = "<paste the token>"
 *      $env:NETLIFY_SITE_ID = "<the site UUID>"
 *      node scripts/backfill-netlify-analytics.js
 *
 *    That is a DRY RUN. It fetches, checks the shape, prints a table of what
 *    it would store, and writes nothing. Read the table. If the figures look
 *    like the site's real traffic, run it again for real:
 *
 *      node scripts/backfill-netlify-analytics.js --write
 *
 *    Then clear the token from the session and delete it in Netlify:
 *
 *      Remove-Item Env:NETLIFY_TOKEN
 *
 * ── WHAT IT WILL NOT DO ─────────────────────────────────────────────────────
 *
 *  - It never overwrites a day our own counter has already written. Our count
 *    excludes bots; Netlify's does not, so ours is the better figure wherever
 *    we have it, and a backfill must not trample it.
 *  - It writes nothing at all unless every day it intends to write validated.
 *    A half-written backfill is worse than none: the gaps would look like
 *    quiet days rather than like a script that fell over.
 *  - It stores `source: "netlify"` on every day it writes, so a year from now
 *    it is still obvious which figures came from where — and why the week of
 *    the backfill reads higher than the weeks after it.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { getStore } = require("@netlify/blobs");
const { manilaParts, DATE_RE } = require("../netlify/lib/counter");

const API = "https://analytics.services.netlify.com";
const STORE = "analytics";
const DAY_MS = 86400000;

/* Netlify's retention on this plan. Asking for more is harmless — the
   endpoint simply has nothing older — and the extra day covers the case where
   the boundary falls mid-run. */
const LOOKBACK_DAYS = 8;

const WRITE = process.argv.includes("--write");
/* Where an unreadable response gets dumped for a human to read. Deliberately
   the system temp folder and not the repo: the body can carry the site's own
   traffic detail, and a file sitting in the project root is a file that ends
   up in a commit. */
const DUMP = path.join(os.tmpdir(), `netlify-analytics-raw-${Date.now()}.json`);

const die = (msg) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
};

const token = process.env.NETLIFY_TOKEN;
const siteID = process.env.NETLIFY_SITE_ID;
if (!token) die("NETLIFY_TOKEN is not set. See the instructions at the top of this file.");
if (!siteID) die("NETLIFY_SITE_ID is not set. It is the site UUID from Site configuration → Site details.");

/* ─────────────────────────────────────────────────────── the unofficial API */

/* analytics.services.netlify.com is what the Netlify dashboard itself calls.
 * It is not a documented, supported API: no version guarantee, no changelog,
 * and it can start returning a different shape without notice. Everything
 * below therefore treats the response as untrusted input and refuses to guess.
 */
async function fetchSeries(metric, resolution, fromMs, toMs) {
  const url =
    `${API}/v2/${encodeURIComponent(siteID)}/timeseries/${metric}` +
    `?from=${fromMs}&to=${toMs}&resolution=${resolution}&timezone=%2B0800`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (res.status === 401 || res.status === 403) {
    die(
      `Netlify refused the token (HTTP ${res.status}).\n` +
        `  Check NETLIFY_TOKEN is a personal access token and NETLIFY_SITE_ID is the site UUID.`
    );
  }
  if (res.status === 404) {
    die(
      `Netlify returned 404 for ${metric}/${resolution}.\n` +
        `  Either the site ID is wrong, or Web Analytics is not enabled on this site,\n` +
        `  or this undocumented endpoint has moved. Nothing was written.`
    );
  }
  if (!res.ok) {
    die(`Netlify returned HTTP ${res.status} for ${metric}/${resolution}. Nothing was written.`);
  }

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    fs.writeFileSync(DUMP, text);
    die(`${metric}/${resolution} was not JSON. The raw response is in ${DUMP}. Nothing was written.`);
  }
  return { body, text };
}

/* Pull a list of {at, count} out of whatever came back.
 *
 * It accepts the handful of shapes this endpoint has been seen to use, and
 * then checks what it extracted. What it must never do is shrug: a response it
 * cannot read with certainty means the backfill stops and dumps the body for a
 * human to look at, because the failure mode of guessing here is a chart full
 * of plausible wrong numbers that nobody ever questions. */
function readSeries(body, metric, resolution, rawText) {
  const fail = (why) => {
    fs.writeFileSync(DUMP, rawText);
    die(
      `Could not read ${metric}/${resolution}: ${why}\n` +
        `  This endpoint is undocumented and has evidently changed.\n` +
        `  The raw response is in ${DUMP} — nothing was written to the store.`
    );
  };

  const list = Array.isArray(body) ? body : Array.isArray(body && body.data) ? body.data : null;
  if (!list) fail("no array of points at the top level or under `data`.");
  if (!list.length) fail("the series is empty — Netlify has no data in this window.");

  const points = list.map((p, i) => {
    let at;
    let count;
    if (Array.isArray(p)) {
      [at, count] = p;
    } else if (p && typeof p === "object") {
      at = p.timestamp ?? p.time ?? p.t ?? p.date;
      count = p.count ?? p.value ?? p.views ?? p.visitors ?? p.v;
    } else {
      fail(`point ${i} is a ${typeof p}, not an object or a pair.`);
    }

    at = typeof at === "string" ? Date.parse(at) : Number(at);
    count = Number(count);
    if (!Number.isFinite(at)) fail(`point ${i} has no readable timestamp.`);
    if (!Number.isFinite(count) || count < 0) fail(`point ${i} has no readable count.`);
    // Seconds or milliseconds — anything below ~1973 in ms is really seconds.
    if (at < 1e11) at *= 1000;
    return { at, count: Math.round(count) };
  });

  return points;
}

/* The breakdown tables. Best-effort on purpose, and the one place this script
   is allowed to come back empty: the totals are what the chart is for, and the
   ranking endpoints are the most likely part of an unofficial API to differ.
   A warning and an empty table beats aborting a rescue of the figures. */
async function fetchRanking(kind, fromMs, toMs, labelKey) {
  const url =
    `${API}/v2/${encodeURIComponent(siteID)}/ranking/${kind}` +
    `?from=${fromMs}&to=${toMs}&limit=50&timezone=%2B0800`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const list = Array.isArray(body) ? body : Array.isArray(body && body.data) ? body.data : [];
    return list
      .map((row) => ({
        [labelKey]: String((row && (row.resource ?? row.path ?? row.value ?? row.name ?? row.label)) ?? "").slice(0, 120),
        views: Number((row && (row.count ?? row.views ?? row.value)) ?? 0) || 0,
      }))
      .filter((r) => r[labelKey] && r.views > 0)
      .slice(0, 50);
  } catch (err) {
    console.warn(`  ! ${kind} ranking unavailable (${err.message}) — that table will be empty for these days.`);
    return [];
  }
}

/* ──────────────────────────────────────────────────────────────── bucketing */

/* Bucket by OUR day boundary, not Netlify's.
 *
 * The request asks for +0800, but the grouping happens here, with the same
 * function the live counter uses. If the endpoint ever ignores the timezone
 * parameter — or interprets it differently — a backfilled Saturday would
 * otherwise be offset by hours from a counted Saturday, and the two would sit
 * side by side in one chart looking like a traffic pattern. */
function bucket(hourly) {
  const days = new Map();
  hourly.forEach(({ at, count }) => {
    const { date, hour } = manilaParts(at);
    if (!days.has(date)) days.set(date, Array.from({ length: 24 }, () => 0));
    days.get(date)[Number(hour)] += count;
  });
  return days;
}

function dayTotals(daily) {
  const out = new Map();
  daily.forEach(({ at, count }) => {
    const { date } = manilaParts(at);
    out.set(date, (out.get(date) || 0) + count);
  });
  return out;
}

/* ───────────────────────────────────────────────────────────────────── main */

(async () => {
  const now = Date.now();
  const toMs = now;
  const fromMs = now - LOOKBACK_DAYS * DAY_MS;

  console.log(`Netlify Web Analytics backfill${WRITE ? "" : "  (DRY RUN — nothing will be written)"}`);
  console.log(`Site ${siteID.slice(0, 8)}…  window ${manilaParts(fromMs).date} → ${manilaParts(toMs).date} (Asia/Manila)\n`);

  const wanted = [
    ["pageviews", "hour"],
    ["pageviews", "day"],
    ["visitors", "hour"],
    ["visitors", "day"],
  ];
  const series = {};
  for (const [metric, resolution] of wanted) {
    const { body, text } = await fetchSeries(metric, resolution, fromMs, toMs);
    series[`${metric}:${resolution}`] = readSeries(body, metric, resolution, text);
    console.log(`  fetched ${metric}/${resolution}: ${series[`${metric}:${resolution}`].length} points`);
  }

  const viewHours = bucket(series["pageviews:hour"]);
  const visitorHours = bucket(series["visitors:hour"]);
  const viewDays = dayTotals(series["pageviews:day"]);
  /* The day's unique visitors cannot be the sum of the hourly figures — one
     person browsing at 10am and 3pm is in two hours and is one visitor. It has
     to come from Netlify's own day-resolution series. */
  const visitorDays = dayTotals(series["visitors:day"]);

  const dates = [...new Set([...viewHours.keys(), ...viewDays.keys()])].filter((d) => DATE_RE.test(d)).sort();
  if (!dates.length) die("No days came back in a readable form. Nothing was written.");

  /* Build every record before writing any of them. Validation happens over
     the whole set, so one bad day stops the lot rather than leaving the store
     half-filled. */
  const records = [];
  for (const date of dates) {
    const hours = viewHours.get(date) || Array.from({ length: 24 }, () => 0);
    const vHours = visitorHours.get(date) || Array.from({ length: 24 }, () => 0);
    const hourSum = hours.reduce((t, n) => t + n, 0);
    const dayView = viewDays.has(date) ? viewDays.get(date) : hourSum;

    // Cross-check: the hourly series and the daily series are two answers to
    // the same question, and they should agree. A real disagreement means the
    // timezone handling is not what we think it is.
    if (viewDays.has(date) && Math.abs(dayView - hourSum) > Math.max(2, dayView * 0.02)) {
      die(
        `${date}: Netlify's daily pageviews (${dayView}) and the sum of its hourly ` +
          `figures (${hourSum}) disagree by more than 2%.\n` +
          `  That points at a timezone mismatch in the undocumented API, which would\n` +
          `  misdate the whole backfill. Nothing was written.`
      );
    }

    records.push({
      date,
      pageviews: dayView,
      visitors: visitorDays.has(date) ? visitorDays.get(date) : Math.max(...vHours, 0),
      hours: hours.map((pageviews, hour) => ({ hour, pageviews, visitors: vHours[hour] })),
      pages: [],
      sources: [],
      countries: [],
      notFound: [],
      fetchedAt: new Date(now).toISOString(),
      source: "netlify",
    });
  }

  // Per-day breakdowns: one request each, for the day's own window.
  for (const rec of records) {
    const dayFrom = Date.parse(`${rec.date}T00:00:00+08:00`);
    const dayTo = dayFrom + DAY_MS - 1;
    rec.pages = await fetchRanking("pages", dayFrom, dayTo, "path");
    rec.sources = await fetchRanking("sources", dayFrom, dayTo, "source");
    rec.countries = await fetchRanking("countries", dayFrom, dayTo, "country");
    rec.notFound = await fetchRanking("not_found", dayFrom, dayTo, "path");
  }

  /* The store. Reached from a laptop rather than from inside a function, so
     the site and the token have to be handed over explicitly — there is no
     deploy environment here to read them from. */
  let store;
  try {
    store = getStore({ name: STORE, siteID, token });
  } catch (err) {
    die(`Could not open the blob store: ${err.message}`);
  }

  console.log("\n  date         pageviews  visitors   action");
  console.log("  ───────────────────────────────────────────────────────────────");

  const plan = [];
  for (const rec of records) {
    let existing = null;
    try {
      existing = await store.get(rec.date, { type: "json" });
    } catch (err) {
      die(`Could not read the existing record for ${rec.date}: ${err.message}. Nothing was written.`);
    }

    let action;
    if (existing && existing.source === "counter") {
      // Our own count excludes bots; Netlify's does not. Where we have both,
      // ours is the better number and must win.
      action = "skip — our own counter already has this day";
    } else if (existing) {
      action = `replace (was ${existing.source || "unknown"})`;
      plan.push(rec);
    } else {
      action = "write";
      plan.push(rec);
    }

    console.log(
      `  ${rec.date}   ${String(rec.pageviews).padStart(8)}  ${String(rec.visitors).padStart(8)}   ${action}`
    );
  }

  if (!WRITE) {
    console.log(
      `\n  Dry run. ${plan.length} ${plan.length === 1 ? "day" : "days"} would be written.` +
        `\n  If those figures look like the real traffic, run it again with --write.\n`
    );
    return;
  }

  if (!plan.length) {
    console.log("\n  Nothing to write — every day in the window is already covered by our own counter.\n");
    return;
  }

  for (const rec of plan) {
    await store.setJSON(rec.date, rec);
    console.log(`  ✓ wrote ${rec.date}`);
  }

  console.log(
    `\n  Done. ${plan.length} ${plan.length === 1 ? "day" : "days"} backfilled and marked source: "netlify".` +
      `\n  Now delete the personal access token in Netlify — it is not needed again.\n`
  );
})().catch((err) => {
  // Anything unforeseen. Loud, with the stack, and explicit that the store was
  // not left half-written — the first question anyone will have.
  console.error(`\n✗ Backfill failed: ${err && err.message}`);
  if (err && err.stack) console.error(err.stack);
  console.error("\n  Any days listed with ✓ above were written; the rest were not.\n");
  process.exit(1);
});
