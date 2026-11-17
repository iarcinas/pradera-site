/* The analytics dashboard.
 *
 * Two jobs: get a token from the function, then draw what the function sends
 * back. It holds no numbers of its own and knows no secrets — the passphrase
 * is exchanged for a short-lived token and then dropped, so what sits in this
 * tab's storage is a signed token that expires, not the passphrase itself.
 *
 * The chart is hand-drawn SVG rather than a charting library on purpose: the
 * site's CSP is script-src 'self', so a CDN script would be blocked silently.
 * Adding a library to the bundle would work, but a two-series line chart is
 * not worth 60 KB and a dependency to keep patched.
 *
 * Day records come from our own hourly job, in our own shape:
 *   { date, pageviews, visitors,
 *     hours: [{ hour, pageviews, visitors }] x24,
 *     pages: [{ path, views }], sources: [{ source, views }],
 *     countries: [{ country, views }], notFound: [{ path, views }],
 *     fetchedAt, source }
 * The counting happens in netlify/lib/counter.js; this file only draws. A day
 * the job never wrote comes back as { date, missing: true }, and a record
 * written before the hourly breakdown existed has no `hours` — both are
 * handled rather than assumed away.
 */

const ENDPOINT = "/.netlify/functions/analytics";
const CONFIG_ENDPOINT = "/.netlify/functions/config";
const STORE_KEY = "pradera-analytics-session";

const el = (id) => document.getElementById(id);
const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-PH") : "—");
const iso = (d) => d.toISOString().slice(0, 10);

const state = { token: null, days: [], available: [], chart: null };

/* ---------------------------------------------------------------- transport */

async function call(payload, endpoint = ENDPOINT) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let body = {};
  try {
    body = await res.json();
  } catch {
    /* A non-JSON answer means the function itself fell over. */
  }
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return body;
}

function saveSession(token, expiresAt) {
  state.token = token;
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify({ token, expiresAt }));
  } catch {
    /* Private window or blocked storage: the session simply lasts until
       reload instead of until the tab closes. Not worth an error. */
  }
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const { token, expiresAt } = JSON.parse(raw);
    // Check the expiry here too, so an expired token does not cost a round
    // trip before the sign-in form comes back.
    if (!token || !expiresAt || Date.now() > expiresAt) return null;
    return token;
  } catch {
    return null;
  }
}

function clearSession() {
  state.token = null;
  try {
    sessionStorage.removeItem(STORE_KEY);
  } catch {
    /* nothing to do */
  }
}

/* ------------------------------------------------------------------ sign in */

el("signin-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = el("signin-btn");
  const msg = el("signin-msg");
  const input = el("pass");
  btn.disabled = true;
  msg.textContent = "";
  try {
    const { token, expiresAt } = await call({ op: "login", passphrase: input.value });
    saveSession(token, expiresAt);
    // Clear the field rather than leave the passphrase sitting in the DOM.
    input.value = "";
    await openDashboard();
  } catch (err) {
    msg.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

el("signout").addEventListener("click", () => {
  clearSession();
  el("dash").hidden = true;
  el("signin").hidden = false;
  el("signin-msg").textContent = "";
});

/* Any call that comes back 401 means the token aged out mid-session. Drop the
   user back to the form with a reason, rather than showing a stale dashboard
   that silently stops updating. */
function handleAuthLoss() {
  clearSession();
  el("dash").hidden = true;
  el("signin").hidden = false;
  el("signin-msg").textContent = "Session expired. Please sign in again.";
}

/* ---------------------------------------------------------------- dashboard */

async function openDashboard() {
  el("signin").hidden = true;
  el("dash").hidden = false;
  el("dash-msg").textContent = "Loading…";

  /* Not awaited: the announcement and schedule editors are independent of the
     analytics store, and a day when no snapshots exist should still let staff
     publish a notice. */
  loadConfig();

  try {
    const { dates } = await call({ op: "days", token: state.token });
    state.available = dates;

    if (!dates.length) {
      // Honest empty state. This is what staff will see until the first
      // snapshot runs, and it should say so rather than show four zeros.
      el("dash-msg").textContent =
        "Nothing counted yet. Page loads are counted as they happen and rolled up every hour, so the first day appears within an hour of the first visit.";
      el("tiles").innerHTML = "";
      el("chart-wrap").innerHTML = "";
      el("chart-table").innerHTML = "";
      state.chart = null;
      el("tables").innerHTML = "";
      el("note").textContent = "";
      return;
    }

    const last = dates[dates.length - 1];
    el("from").min = dates[0];
    el("from").max = last;
    el("to").min = dates[0];
    el("to").max = last;

    // Open on the last 30 days, or on everything if there is less than that.
    applyPreset(dates.length >= 30 ? { days: 30 } : { preset: "all" });
  } catch (err) {
    if (err.status === 401) return handleAuthLoss();
    el("dash-msg").textContent = err.message;
  }
}

function applyPreset(opts) {
  const dates = state.available;
  if (!dates.length) return;
  const last = dates[dates.length - 1];
  let from;
  let to = last;

  if (opts.preset === "all") {
    from = dates[0];
  } else if (opts.preset === "month") {
    from = `${last.slice(0, 7)}-01`;
  } else {
    const d = new Date(`${last}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (opts.days - 1));
    from = iso(d);
  }
  // Never ask for days that predate the oldest record — the function would
  // read them all and find nothing.
  if (from < dates[0]) from = dates[0];

  el("from").value = from;
  el("to").value = to;

  datePresets().forEach((b) => {
    const match =
      (opts.days && b.dataset.days === String(opts.days)) ||
      (opts.preset && b.dataset.preset === opts.preset);
    b.setAttribute("aria-pressed", match ? "true" : "false");
  });

  load();
}

/* Scoped to the date filters on purpose. The tabs and the day toggles borrow
   the same .preset styling, and an unscoped selector here would reach across
   the page and clear the pressed state on both of them — the open days would
   come up empty however the schedule was stored. */
const datePresets = () => document.querySelectorAll(".filters .preset");

datePresets().forEach((b) => {
  b.addEventListener("click", () => {
    applyPreset(b.dataset.days ? { days: Number(b.dataset.days) } : { preset: b.dataset.preset });
  });
});

/* Typing a date by hand clears the preset highlight — the range is no longer
   one of the presets, and pretending otherwise misreads the chart. */
["from", "to"].forEach((id) => {
  el(id).addEventListener("change", () => {
    datePresets().forEach((b) => b.setAttribute("aria-pressed", "false"));
    load();
  });
});

async function load() {
  const from = el("from").value;
  const to = el("to").value;
  if (!from || !to) return;
  if (from > to) {
    el("dash-msg").textContent = "The From date is after the To date.";
    return;
  }

  el("dash-msg").textContent = "Loading…";
  try {
    const { days } = await call({ op: "range", token: state.token, from, to });
    state.days = days;
    el("dash-msg").textContent = "";
    render();
  } catch (err) {
    if (err.status === 401) return handleAuthLoss();
    el("dash-msg").textContent = err.message;
  }
}

/* ------------------------------------------------------------------- render */

function render() {
  const days = state.days;
  const present = days.filter((d) => !d.missing);

  renderTiles(present);

  /* One day selected draws the hours instead. A single day on the daily chart
     is one dot with nothing to compare it to; the same day by hour is the
     question Operations actually has — is anyone here before noon.
     A record saved before the hourly breakdown existed has no `hours`, so it
     falls back to the dot rather than drawing twenty-four zeroes. */
  const hourly = days.length === 1 && !days[0].missing && Array.isArray(days[0].hours);
  if (hourly) renderHourly(days[0]);
  else renderDaily(days);

  renderTables(present);

  const gaps = days.length - present.length;
  const fetched = present.length ? present[present.length - 1].fetchedAt : null;
  el("note").textContent = [
    `${present.length} ${present.length === 1 ? "day" : "days"} of records in this range.`,
    gaps ? `${gaps} ${gaps === 1 ? "day has" : "days have"} no record — the chart leaves those gaps open rather than joining the line across them.` : "",
    /* Said plainly because it looks like an error otherwise. Someone who
       arrives at 10am and comes back at 3pm is one visitor that day and a
       visitor in each of two hours, so the hourly column adds up to more than
       the daily figure. Both numbers are right. */
    hourly ? "Hourly visitor counts add up to more than the day's total: a guest who comes back later in the day is counted in each hour they appear, but once for the day." : "",
    fetched ? `Counted up to ${new Date(fetched).toLocaleString("en-PH")}.` : "",
    "Our own count, taken on this site: one tally per page load, no cookie, no third-party tracker, and nothing stored that identifies a guest. Obvious bots are left out, so these run lower than Netlify's figures — and closer to the truth.",
  ]
    .filter(Boolean)
    .join(" ");
}

/* The two views. Each sets the heading, draws the chart and fills the table
   beneath it, so the table is never describing the other chart. */
function renderDaily(days) {
  el("chart-title").textContent = "Daily traffic";
  drawChart(days);
  el("chart-table").innerHTML = chartTable("Daily figures", "Date", days, (d) => esc(d.date));
}

const HOUR_SHORT = (h) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`;
const HOUR_RANGE = (h) => {
  const name = (n) => `${n % 12 === 0 ? 12 : n % 12} ${n < 12 || n === 24 ? "AM" : "PM"}`;
  return `${name(h)} – ${name(h + 1)}`;
};

function renderHourly(day) {
  const title = new Date(`${day.date}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  el("chart-title").textContent = `By the hour — ${title}`;

  const rows = day.hours.map((h) => ({
    date: day.date,
    hour: h.hour,
    pageviews: h.pageviews || 0,
    visitors: h.visitors || 0,
  }));

  drawChart(rows, {
    xLabel: (r) => HOUR_SHORT(r.hour),
    tipTitle: (r) => HOUR_RANGE(r.hour),
    // Label the busiest hour, not the last one: at 11pm the last point is
    // almost always zero, and a "0" floating at the end of the chart is the
    // least useful number on it.
    labelPeak: true,
  });

  el("chart-table").innerHTML = chartTable("Hourly figures", "Hour", rows, (r) => esc(HOUR_RANGE(r.hour)));
}

function sumBy(rows, key) {
  return rows.reduce((t, r) => t + (Number(r[key]) || 0), 0);
}

/* Roll a per-day breakdown up across the range: the same page appears in every
   day's record, and the question staff ask is "which page over this period". */
function mergeBreakdown(rows, labelKey) {
  const totals = new Map();
  rows.forEach((day) => {
    (day || []).forEach((item) => {
      const label = item[labelKey];
      if (label == null) return;
      totals.set(label, (totals.get(label) || 0) + (Number(item.views) || 0));
    });
  });
  return [...totals.entries()]
    .map(([label, views]) => ({ label, views }))
    .sort((a, b) => b.views - a.views);
}

function renderTiles(present) {
  const views = sumBy(present, "pageviews");
  const visitors = sumBy(present, "visitors");
  const topPage = mergeBreakdown(present.map((d) => d.pages), "path")[0];
  const topSource = mergeBreakdown(present.map((d) => d.sources), "source")[0];

  const tiles = [
    { k: "Pageviews", v: fmt(views) },
    { k: "Visitors", v: fmt(visitors) },
    { k: "Top page", v: topPage ? topPage.label : "—", small: true },
    { k: "Top source", v: topSource ? topSource.label : "Direct", small: true },
  ];

  el("tiles").innerHTML = tiles
    .map(
      (t) =>
        `<div class="tile"><div class="k">${esc(t.k)}</div><div class="v${t.small ? " small" : ""}">${esc(t.v)}</div></div>`
    )
    .join("");
}

function esc(s) {
  // Page paths, referrer strings and country names all arrive from a third
  // party by way of our own store. Escape them: a referrer is an attacker's
  // free-text field, and this page runs on the same origin as the live site.
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ------------------------------------------------------------------- chart */

const CHART = { w: 900, h: 300, left: 52, right: 18, top: 18, bottom: 30 };

/* Pick a top-of-scale that divides into four readable steps. Rounding the
   maximum alone gives gridlines like 213 and 638, which a reader has to stop
   and decode; choosing the step first and multiplying up gives 250 and 750.
 *
 * The step is always a whole number. These are counts of people and requests,
 * so a gridline at 2.5 is not a quantity that exists — and worse, it would be
 * drawn at 2.5 and labelled "3". The 2.5 multiplier is therefore offered only
 * once the magnitude is large enough to keep it integral. Opening week will
 * have single-digit days; the floor of 1 is what keeps those from collapsing
 * into a ladder reading 0, 0, 1, 1, 1. */
function niceScale(v) {
  const target = Math.max(1, v) / 4;
  const mag = 10 ** Math.floor(Math.log10(target));
  /* A coarse ladder overshoots badly: with only 1, 2, 5 to choose from, a
     busiest day of 503 lands on a step of 200 and a top of 800, so the lines
     sit in the bottom half and the top half of the card is empty. That is the
     chart reading as a large white box. The finer rungs put 503 under 600. */
  const ladder = mag >= 10 ? [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10] : [1, 2, 3, 4, 5, 10];
  const step = Math.max(1, Math.round((ladder.find((c) => c * mag >= target) || 10) * mag));
  return step * 4;
}

/* One chart, two views. `rows` only has to carry pageviews, visitors and
   enough to label itself; `opts` supplies the labelling, so the daily and
   hourly views share every pixel of the drawing, the gap handling, the
   tooltip and the crosshair rather than being two charts that drift apart. */
function drawChart(days, opts = {}) {
  const xLabel = opts.xLabel || ((d) => d.date.slice(5));
  const tipTitle =
    opts.tipTitle ||
    ((d) =>
      new Date(`${d.date}T00:00:00`).toLocaleDateString("en-PH", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }));

  // Kept so a window resize can redraw the view that is actually on screen.
  state.chart = { days, opts };

  const wrap = el("chart-wrap");
  wrap.innerHTML = "";
  if (!days.length) return;

  const { w, h, left, right, top, bottom } = CHART;
  const plotW = w - left - right;
  const plotH = h - top - bottom;

  const max = niceScale(Math.max(1, ...days.map((d) => Math.max(d.pageviews || 0, d.visitors || 0))));
  // A single day cannot draw a line, so centre its point instead of dividing
  // by zero. Opening week will look exactly like this.
  const x = (i) => (days.length === 1 ? left + plotW / 2 : left + (i / (days.length - 1)) * plotW);
  const y = (v) => top + plotH - (Math.max(0, v) / max) * plotH;

  const series = [
    { key: "pageviews", label: "Pageviews", color: "var(--series-views)" },
    { key: "visitors", label: "Visitors", color: "var(--series-visitors)" },
  ];

  /* Break the path wherever a day has no record. Joining across a gap would
     draw a straight line through a night the job failed and read as real. */
  const pathFor = (key) => {
    const parts = [];
    let open = false;
    days.forEach((d, i) => {
      if (d.missing || typeof d[key] !== "number") {
        open = false;
        return;
      }
      parts.push(`${open ? "L" : "M"}${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`);
      open = true;
    });
    return parts.join(" ");
  };

  // Derived from the step, not from fractions of the maximum, so the label
  // always names the value the line is actually drawn at.
  const gridVals = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  const tickEvery = Math.max(1, Math.ceil(days.length / 6));

  const svg = `
    <svg class="chart" viewBox="0 0 ${w} ${h}" role="img"
         aria-label="Daily pageviews and visitors for the selected range. The same figures are available as a table.">
      ${gridVals
        .map(
          (v) =>
            `<line class="grid-line" x1="${left}" x2="${w - right}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>
             <text class="axis-text" x="${left - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${fmt(v)}</text>`
        )
        .join("")}
      ${days
        .map((d, i) =>
          i % tickEvery === 0 || i === days.length - 1
            ? `<text class="axis-text" x="${x(i).toFixed(1)}" y="${h - 10}" text-anchor="middle">${esc(xLabel(d, i))}</text>`
            : ""
        )
        .join("")}
      ${series
        .map((s) => {
          const dPath = pathFor(s.key);
          // One lone point renders as a dot: a path with a single M draws
          // nothing at all, which would read as "no data".
          const lone = dPath && !dPath.includes("L");
          if (lone) {
            const m = dPath.match(/M([\d.]+) ([\d.]+)/);
            return `<circle class="dot" cx="${m[1]}" cy="${m[2]}" r="4.5" fill="${s.color}"/>`;
          }
          return `<path class="series-line" d="${dPath}" stroke="${s.color}"/>`;
        })
        .join("")}
      ${series
        .map((s) => {
          // One direct label per series — enough to identify the lines without
          // a number on every point. Normally its last real value; the hourly
          // view asks for the peak instead, because its last hour is usually
          // empty and a 0 there names nothing worth knowing.
          const real = (i) => !days[i].missing && typeof days[i][s.key] === "number";
          let at = -1;
          if (opts.labelPeak) {
            days.forEach((_, i) => {
              if (real(i) && (at < 0 || days[i][s.key] > days[at][s.key])) at = i;
            });
          } else {
            for (let i = days.length - 1; i >= 0; i -= 1) {
              if (real(i)) { at = i; break; }
            }
          }
          if (at < 0) return "";
          const anchor = at === days.length - 1 ? "end" : "middle";
          return `<text class="axis-text" x="${x(at).toFixed(1)}" y="${(y(days[at][s.key]) - 9).toFixed(1)}"
                    text-anchor="${anchor}" style="font-weight:600">${fmt(days[at][s.key])}</text>`;
        })
        .join("")}
      <g id="hover-layer"></g>
    </svg>
    <div class="tip" id="tip" hidden></div>`;

  wrap.innerHTML = svg;
  attachHover(wrap, days, x, y, series, tipTitle);
}

/* An SVG chart in a browser is interactive whether or not we plan for it, so
   it ships with a crosshair and a tooltip. The hit target is the whole plot
   height at that day's column, not the 9px dot. */
function attachHover(wrap, days, x, y, series, tipTitle) {
  const svg = wrap.querySelector("svg");
  const layer = wrap.querySelector("#hover-layer");
  const tip = wrap.querySelector("#tip");
  const { w, h, left, right, top, bottom } = CHART;

  const clear = () => {
    layer.innerHTML = "";
    tip.hidden = true;
  };

  const move = (clientX) => {
    const box = svg.getBoundingClientRect();
    if (!box.width) return;
    const scale = w / box.width;
    const svgX = (clientX - box.left) * scale;

    let best = 0;
    let bestDist = Infinity;
    days.forEach((_, i) => {
      const dist = Math.abs(x(i) - svgX);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });

    const day = days[best];
    const cx = x(best);

    layer.innerHTML =
      `<line class="crosshair" x1="${cx.toFixed(1)}" x2="${cx.toFixed(1)}" y1="${top}" y2="${h - bottom}"/>` +
      series
        .map((s) =>
          day.missing || typeof day[s.key] !== "number"
            ? ""
            : `<circle class="dot" cx="${cx.toFixed(1)}" cy="${y(day[s.key]).toFixed(1)}" r="4.5" fill="${s.color}"/>`
        )
        .join("");

    tip.innerHTML =
      `<b>${esc(tipTitle(day))}</b>` +
      (day.missing
        ? `<div><em>No record for this day</em></div>`
        : series
            .map(
              (s) =>
                `<div><em><i class="swatch" style="background:${s.color}"></i>${esc(s.label)}</em><strong>${fmt(day[s.key])}</strong></div>`
            )
            .join(""));

    tip.hidden = false;
    // Place it in page pixels, flipping to the left of the crosshair when it
    // would otherwise run off the right edge.
    const px = cx / scale;
    const tw = tip.offsetWidth;
    tip.style.left = `${Math.max(0, Math.min(box.width - tw, px + 14 + tw > box.width ? px - tw - 14 : px + 14))}px`;
    tip.style.top = `${top / scale}px`;
  };

  svg.addEventListener("pointermove", (e) => move(e.clientX));
  svg.addEventListener("pointerdown", (e) => move(e.clientX));
  svg.addEventListener("pointerleave", clear);
}

/* The table view. Required, not a nicety: the orange series sits just under
   3:1 against this background for some readers, and a chart that cannot be
   read has to have somewhere to go. It is also how anyone copies figures into
   a report. */
el("toggle-table").addEventListener("click", () => {
  const box = el("chart-table");
  const btn = el("toggle-table");
  const showing = !box.hidden;
  box.hidden = showing;
  btn.setAttribute("aria-expanded", String(!showing));
  btn.textContent = showing ? "Show as table" : "Hide table";
});

/* The same table markup for either view; only the first column differs.
   `firstCell` is given already escaped by its caller, which is also where the
   heading above it is chosen — the two cannot disagree. */
function chartTable(caption, head, rows, firstCell) {
  return `
    <table>
      <caption>${esc(caption)}</caption>
      <thead><tr><th>${esc(head)}</th><th class="num">Pageviews</th><th class="num">Visitors</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (d) =>
              `<tr><td>${firstCell(d)}</td>` +
              (d.missing
                ? `<td class="num">—</td><td class="num">—</td>`
                : `<td class="num">${fmt(d.pageviews)}</td><td class="num">${fmt(d.visitors)}</td>`) +
              `</tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}

/* Our counter stores a two-letter country code — it is what the edge gives us
   and it keeps the blob key short. "PH" is not what anyone wants to read in a
   report, though, so turn it back into a name here rather than storing the
   long form a hundred thousand times.
   Intl.DisplayNames rather than a hand-written table: it covers every code
   including the ones we have never seen, and it is already in the browser.
   Anything that is not a bare code is passed through untouched, which is what
   keeps the days backfilled from Netlify — where the label is already a full
   country name — reading correctly in the same table. */
const REGION_NAMES = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();

function countryName(label) {
  if (label === "--") return "Unknown";
  if (!/^[A-Z]{2}$/.test(label)) return label;
  try {
    return (REGION_NAMES && REGION_NAMES.of(label)) || label;
  } catch {
    return label;
  }
}

function renderTables(present) {
  const blocks = [
    { title: "Top pages", head: "Page", rows: mergeBreakdown(present.map((d) => d.pages), "path") },
    { title: "Sources", head: "Referrer", rows: mergeBreakdown(present.map((d) => d.sources), "source") },
    { title: "Locations", head: "Country", rows: mergeBreakdown(present.map((d) => d.countries), "country"), label: countryName },
    { title: "Not found (404)", head: "Path", rows: mergeBreakdown(present.map((d) => d.notFound), "path") },
  ];

  el("tables").innerHTML = blocks
    .map(
      (b) => `
      <div class="card scroll">
        <table>
          <caption>${esc(b.title)}</caption>
          ${
            b.rows.length
              ? `<thead><tr><th>${esc(b.head)}</th><th class="num">Views</th></tr></thead>
                 <tbody>${b.rows
                   .slice(0, 12)
                   .map((r) => `<tr><td>${esc(b.label ? b.label(r.label) : r.label)}</td><td class="num">${fmt(r.views)}</td></tr>`)
                   .join("")}</tbody>`
              : `<tbody><tr><td class="empty">Nothing recorded for this range.</td></tr></tbody>`
          }
        </table>
      </div>`
    )
    .join("");
}

/* Redraw on resize: the SVG scales by itself, but the tooltip is positioned in
   page pixels and a stale one ends up pointing at the wrong column. */
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // Redraw whichever view is up, not always the daily one — resizing the
    // window while looking at the hours used to replace the chart underneath.
    if (state.chart && state.chart.days.length) drawChart(state.chart.days, state.chart.opts);
  }, 150);
});

/* ===================================================================== *
 *  Announcement and schedule
 *
 *  Both live in one stored document each, read and written through the
 *  config function. The public side of that function is cached at the CDN
 *  for a minute; this side is not, so what staff see here is always what is
 *  actually stored, expired or not.
 * ===================================================================== */

const cfg = (payload) => call({ ...payload, token: state.token }, CONFIG_ENDPOINT);

/* ---- tabs ---- */

document.querySelectorAll(".tab").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((other) => {
      const on = other === b;
      other.setAttribute("aria-pressed", String(on));
      el(`panel-${other.dataset.panel}`).hidden = !on;
    });
  });
});

/* ---- shared helpers ---- */

function say(id, text, ok) {
  const node = el(id);
  node.textContent = text;
  node.classList.toggle("ok", Boolean(ok));
}

/* <input type="datetime-local"> speaks local wall-clock time with no zone.
   Date.parse reads it as local, which is what staff mean, and the stored form
   is ISO so the website and the function agree on the instant. */
const localToISO = (v) => (v ? new Date(v).toISOString() : "");

/* And back again, for filling the field from a stored notice. */
function isoToLocal(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const prettyWhen = (iso) => new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });

/* ---- announcement ---- */

el("n-message").addEventListener("input", (e) => {
  el("n-count").textContent = e.target.value.length;
});

function renderCurrentNotice(notice) {
  const box = el("notice-current");
  if (!notice || !notice.message) {
    box.hidden = true;
    return;
  }
  const live = Date.parse(notice.expiresAt) > Date.now();
  box.hidden = false;
  box.className = `current${live ? " live" : ""}`;
  box.innerHTML =
    `<b>${live ? "Showing on the website now" : "Last published — already expired"}</b>` +
    `${esc(notice.message)}<br><span style="color:var(--muted)">` +
    `${live ? "Comes down" : "Came down"} ${esc(prettyWhen(notice.expiresAt))}.</span>`;
}

el("n-publish").addEventListener("click", async () => {
  const message = el("n-message").value.trim();
  const expiresAt = localToISO(el("n-expires").value);
  if (!message) return say("n-msg", "Write the message first.");
  if (!expiresAt) return say("n-msg", "Set the time it should come down.");

  say("n-msg", "Publishing…");
  try {
    const res = await cfg({
      op: "notice",
      notice: { message, level: el("n-level").value, expiresAt },
    });
    renderCurrentNotice(res.notice);
    say("n-msg", res.note || "Published.", true);
  } catch (err) {
    if (err.status === 401) return handleAuthLoss();
    say("n-msg", err.message);
  }
});

el("n-remove").addEventListener("click", async () => {
  say("n-msg", "Taking it down…");
  try {
    await cfg({ op: "notice", notice: null });
    renderCurrentNotice(null);
    el("n-message").value = "";
    el("n-count").textContent = "0";
    el("n-expires").value = "";
    say("n-msg", "Taken down. It disappears from the website within a minute.", true);
  } catch (err) {
    if (err.status === 401) return handleAuthLoss();
    say("n-msg", err.message);
  }
});

/* ---- schedule ---- */

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// Shown Monday first, the way a roster is read; the values stay JS getDay.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/* Dated changes, keyed by ISO date: { open: boolean, reason: string|null }.
   Held here while the editor is open and written whole on Save, so a misclick
   is undone by navigating away rather than by hunting for an undo. */
let overrides = {};
let picked = null;
let calCursor = new Date();

function renderDays(open) {
  el("s-days").innerHTML = DAY_ORDER.map(
    (d) =>
      `<button type="button" class="preset day" data-day="${d}" aria-pressed="${open.includes(d)}">${DAY_LABELS[d].slice(0, 3)}</button>`
  ).join("");
  el("s-days").querySelectorAll(".day").forEach((b) => {
    b.addEventListener("click", () => {
      b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
      // The calendar below colours itself from this pattern, so it has to
      // follow immediately — otherwise it shows the previous week's answer.
      renderCalendar();
      if (picked) pickDate(picked);
    });
  });
}

const selectedDays = () =>
  [...el("s-days").querySelectorAll('.day[aria-pressed="true"]')].map((b) => Number(b.dataset.day));

const isoYMD = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const todayKey = () => {
  const n = new Date();
  return isoYMD(n.getFullYear(), n.getMonth(), n.getDate());
};

/* The same decision the website makes, kept deliberately identical: an
   override wins, otherwise the weekly pattern decides. If these two ever
   disagree, staff are editing one calendar and guests are reading another. */
function isOpenOn(key, weekday) {
  const o = overrides[key];
  if (o) return o.open;
  return selectedDays().includes(weekday);
}

function renderCalendar() {
  const year = calCursor.getFullYear();
  const month = calCursor.getMonth();
  el("c-title").textContent = calCursor.toLocaleDateString("en-PH", { month: "long", year: "numeric" });

  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const today = todayKey();

  const head = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    .map((d) => `<div class="edcal-dow">${d}</div>`)
    .join("");
  const blanks = Array(first).fill('<div></div>').join("");
  const days = Array.from({ length: count }, (_, i) => {
    const d = i + 1;
    const key = isoYMD(year, month, d);
    const open = isOpenOn(key, new Date(year, month, d).getDay());
    const changed = Boolean(overrides[key]);
    const cls = [
      "edcal-day",
      open ? "open" : "",
      changed ? "changed" : "",
      key === picked ? "picked" : "",
      key < today ? "past" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return `<button type="button" class="${cls}" data-key="${key}" aria-pressed="${key === picked}">${d}</button>`;
  }).join("");

  el("c-grid").innerHTML = head + blanks + days;
  el("c-grid").querySelectorAll(".edcal-day").forEach((b) => {
    b.addEventListener("click", () => pickDate(b.dataset.key));
  });
}

/* The exact line the website will show under its calendar. Staff see it as
   they type, because whatever goes in that box is published — and an internal
   note is much easier to catch here than after it is live. */
function renderPreview() {
  const o = picked && overrides[picked];
  if (!o) return;
  const label = new Date(`${picked}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "short", day: "numeric", month: "short",
  });
  const reason = (el("c-reason").value || "").trim();
  el("c-preview").innerHTML =
    `<b>${esc(label)}</b> — ${o.open ? "open" : "closed"}` +
    (reason ? `, ${esc(reason.toLowerCase())}` : ` <span class="none">· no reason given</span>`);
}

function pickDate(key) {
  picked = key;
  const o = overrides[key];
  el("c-editor").hidden = false;
  el("c-editor-date").textContent = new Date(`${key}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  el("c-reason").value = (o && o.reason) || "";
  el("c-reason-count").textContent = el("c-reason").value.length;

  const state = !o ? "default" : o.open ? "open" : "closed";
  el("c-editor").querySelectorAll("[data-set]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.set === state));
  });

  // Nothing to explain while the date just follows the pattern.
  el("c-reason-wrap").hidden = state === "default";
  if (state !== "default") renderPreview();

  const weekday = new Date(`${key}T00:00:00`).getDay();
  const pattern = selectedDays().includes(weekday) ? "open" : "closed";
  /* No "above" or "beside": the weekly pattern sits above this on a phone and
     to the right of it on a desktop, and copy that names a direction is wrong
     in one of the two. */
  el("c-editor-hint").textContent = `Normally ${pattern}, by the weekly pattern.`;
  renderCalendar();
}

el("c-prev").addEventListener("click", () => {
  calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1);
  renderCalendar();
});
el("c-next").addEventListener("click", () => {
  calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1);
  renderCalendar();
});

el("c-editor").querySelectorAll("[data-set]").forEach((b) => {
  b.addEventListener("click", () => {
    if (!picked) return;
    if (b.dataset.set === "default") {
      delete overrides[picked];
      el("c-reason").value = "";
    } else {
      overrides[picked] = {
        open: b.dataset.set === "open",
        reason: el("c-reason").value.trim() || null,
      };
    }
    pickDate(picked);
    say("s-msg", "Changed here only — press Save schedule to publish it.", true);
  });
});

el("c-reason").addEventListener("input", () => {
  el("c-reason-count").textContent = el("c-reason").value.length;
  if (picked && overrides[picked]) {
    overrides[picked].reason = el("c-reason").value.trim() || null;
    renderPreview();
  }
});

function fillSchedule(s) {
  renderDays(s.weekdays);
  el("s-wd-open").value = s.hours.weekday.opens;
  el("s-wd-close").value = s.hours.weekday.closes;
  el("s-we-open").value = s.hours.weekend.opens;
  el("s-we-close").value = s.hours.weekend.closes;
  el("s-opens-from").value = s.opensFrom || "";
  overrides = JSON.parse(JSON.stringify(s.overrides || {}));
  savedOverrides = JSON.parse(JSON.stringify(s.overrides || {}));
  picked = null;
  el("c-editor").hidden = true;
  calCursor = new Date();
  renderCalendar();
}

/* What the schedule looked like when it was last loaded or saved. The offer
   below is judged against this, so it can ask about the closure just made
   rather than about one dealt with last week. */
let savedOverrides = {};

/* The soonest closure added in this sitting that has not already passed.
   Only closures: an opening nobody hears about costs nobody anything, and an
   announcement on the morning of an opening is too late to change a plan.
   Returns nothing when the edit added no closure, so saving a change to the
   weekly pattern — or reopening a day — asks nothing. */
function newlyClosed() {
  const today = todayKey();
  return Object.keys(overrides)
    .filter((k) => k >= today && !overrides[k].open)
    .filter((k) => !savedOverrides[k] || savedOverrides[k].open)
    .sort()[0];
}

function offerAnnouncement(key) {
  const box = el("s-followup");
  if (!key) {
    box.hidden = true;
    return;
  }
  const when = new Date(`${key}T00:00:00`);
  const isToday = key === todayKey();
  const pretty = when.toLocaleDateString("en-PH", { weekday: "long", day: "numeric", month: "long" });
  const reason = overrides[key].reason;

  box.hidden = false;
  el("s-followup-text").textContent = isToday
    ? "The park is closed today. Guests only see that if they scroll to the calendar — an announcement opens in front of them."
    : `The park is closed on ${pretty}. An announcement would tell people before they plan around it.`;

  el("s-followup-yes").onclick = () => {
    document.querySelector('.tab[data-panel="notice"]').click();
    el("n-message").value = isToday
      ? `Sarado ang park ngayong araw${reason ? ` — ${reason.toLowerCase()}` : ""}.`
      : `Sarado ang park sa ${pretty}${reason ? ` — ${reason.toLowerCase()}` : ""}.`;
    el("n-message").dispatchEvent(new Event("input"));
    el("n-level").value = "closed";
    // Run it until the end of the day being closed; past that it is history.
    const end = new Date(when.getFullYear(), when.getMonth(), when.getDate(), 23, 59);
    const pad = (n) => String(n).padStart(2, "0");
    el("n-expires").value = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T23:59`;
    say("n-msg", "Drafted from the calendar — check the wording, then Publish.", true);
    box.hidden = true;
  };
  el("s-followup-no").onclick = () => {
    box.hidden = true;
  };
}

el("s-save").addEventListener("click", async () => {
  const days = selectedDays();
  if (!days.length) {
    return say("s-msg", "Pick at least one open day. A park open on no days is almost certainly a mistake.");
  }
  say("s-msg", "Saving…");
  el("s-followup").hidden = true;
  try {
    const res = await cfg({
      op: "schedule",
      schedule: {
        weekdays: days,
        overrides,
        hours: {
          weekday: { opens: el("s-wd-open").value, closes: el("s-wd-close").value },
          weekend: { opens: el("s-we-open").value, closes: el("s-we-close").value },
        },
        opensFrom: el("s-opens-from").value || null,
      },
    });
    // Worked out before fillSchedule, which resets the baseline it compares to.
    const justClosed = newlyClosed();
    fillSchedule(res.schedule);
    say("s-msg", res.note || "Saved. The website updates within a minute; Google follows after the rebuild.", true);
    offerAnnouncement(justClosed);
  } catch (err) {
    if (err.status === 401) return handleAuthLoss();
    say("s-msg", err.message);
  }
});

/* What the site ships with, so the editors open on the real schedule rather
   than on empty fields the first time, before anything has been stored. */
const FALLBACK_SCHEDULE = {
  weekdays: [0, 4, 5, 6],
  overrides: {
    "2026-11-16": { open: true, reason: "Holiday" },
    "2026-11-17": { open: true, reason: "Holiday" },
    "2026-11-18": { open: true, reason: "Holiday" },
    "2026-11-30": { open: true, reason: "Holiday" },
  },
  hours: { weekday: { opens: "10:00", closes: "17:00" }, weekend: { opens: "09:00", closes: "17:00" } },
  opensFrom: "2026-11-15",
};

async function loadConfig() {
  try {
    const { notice, schedule } = await cfg({ op: "read" });
    renderCurrentNotice(notice);
    if (notice) {
      el("n-message").value = notice.message;
      el("n-count").textContent = notice.message.length;
      el("n-level").value = notice.level;
      el("n-expires").value = isoToLocal(notice.expiresAt);
    }
    fillSchedule(schedule || FALLBACK_SCHEDULE);
  } catch (err) {
    if (err.status === 401) return handleAuthLoss();
    say("n-msg", err.message);
    say("s-msg", err.message);
    fillSchedule(FALLBACK_SCHEDULE);
  }
}

/* Returning to the tab inside the eight-hour window skips the form. */
const existing = loadSession();
if (existing) {
  state.token = existing;
  openDashboard();
}
