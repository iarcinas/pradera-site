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
 * Day records come from our own snapshot job, in our own shape:
 *   { date, pageviews, visitors,
 *     pages: [{ path, views }], sources: [{ source, views }],
 *     countries: [{ country, views }], notFound: [{ path, views }],
 *     fetchedAt, source }
 * The job normalises whatever Netlify's endpoint returns into that shape, so
 * if the endpoint changes its field names, only the job changes — not this.
 * A day the job never wrote comes back as { date, missing: true }.
 */

const ENDPOINT = "/.netlify/functions/analytics";
const STORE_KEY = "pradera-analytics-session";

const el = (id) => document.getElementById(id);
const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-PH") : "—");
const iso = (d) => d.toISOString().slice(0, 10);

const state = { token: null, days: [], available: [] };

/* ---------------------------------------------------------------- transport */

async function call(payload) {
  const res = await fetch(ENDPOINT, {
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

  try {
    const { dates } = await call({ op: "days", token: state.token });
    state.available = dates;

    if (!dates.length) {
      // Honest empty state. This is what staff will see until the first
      // snapshot runs, and it should say so rather than show four zeros.
      el("dash-msg").textContent =
        "No snapshots have been saved yet. The nightly job writes one record per day; the dashboard fills in from there.";
      el("tiles").innerHTML = "";
      el("chart-wrap").innerHTML = "";
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

  document.querySelectorAll(".preset").forEach((b) => {
    const match =
      (opts.days && b.dataset.days === String(opts.days)) ||
      (opts.preset && b.dataset.preset === opts.preset);
    b.setAttribute("aria-pressed", match ? "true" : "false");
  });

  load();
}

document.querySelectorAll(".preset").forEach((b) => {
  b.addEventListener("click", () => {
    applyPreset(b.dataset.days ? { days: Number(b.dataset.days) } : { preset: b.dataset.preset });
  });
});

/* Typing a date by hand clears the preset highlight — the range is no longer
   one of the presets, and pretending otherwise misreads the chart. */
["from", "to"].forEach((id) => {
  el(id).addEventListener("change", () => {
    document.querySelectorAll(".preset").forEach((b) => b.setAttribute("aria-pressed", "false"));
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
  renderChart(days);
  renderChartTable(days);
  renderTables(present);

  const gaps = days.length - present.length;
  const fetched = present.length ? present[present.length - 1].fetchedAt : null;
  el("note").textContent = [
    `${present.length} ${present.length === 1 ? "day" : "days"} of records in this range.`,
    gaps ? `${gaps} ${gaps === 1 ? "day has" : "days have"} no record — the chart leaves those gaps open rather than joining the line across them.` : "",
    fetched ? `Last snapshot taken ${new Date(fetched).toLocaleString("en-PH")}.` : "",
    "Figures are Netlify's own server-side request counts: no cookie, no tracker, and no personal data about guests.",
  ]
    .filter(Boolean)
    .join(" ");
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
  const candidates = (mag >= 10 ? [1, 2, 2.5, 5, 10] : [1, 2, 5, 10]).map((c) => c * mag);
  const step = Math.max(1, Math.round(candidates.find((c) => c >= target) || 10 * mag));
  return step * 4;
}

function renderChart(days) {
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
            ? `<text class="axis-text" x="${x(i).toFixed(1)}" y="${h - 10}" text-anchor="middle">${d.date.slice(5)}</text>`
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
          // One direct label per series, on its last real point — enough to
          // identify the lines without a number on every point.
          for (let i = days.length - 1; i >= 0; i -= 1) {
            const d = days[i];
            if (!d.missing && typeof d[s.key] === "number") {
              const anchor = i === days.length - 1 ? "end" : "middle";
              return `<text class="axis-text" x="${x(i).toFixed(1)}" y="${(y(d[s.key]) - 9).toFixed(1)}"
                        text-anchor="${anchor}" style="font-weight:600">${fmt(d[s.key])}</text>`;
            }
          }
          return "";
        })
        .join("")}
      <g id="hover-layer"></g>
    </svg>
    <div class="tip" id="tip" hidden></div>`;

  wrap.innerHTML = svg;
  attachHover(wrap, days, x, y, series);
}

/* An SVG chart in a browser is interactive whether or not we plan for it, so
   it ships with a crosshair and a tooltip. The hit target is the whole plot
   height at that day's column, not the 9px dot. */
function attachHover(wrap, days, x, y, series) {
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
      `<b>${esc(new Date(`${day.date}T00:00:00`).toLocaleDateString("en-PH", { weekday: "short", day: "numeric", month: "short" }))}</b>` +
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

function renderChartTable(days) {
  el("chart-table").innerHTML = `
    <table>
      <caption>Daily figures</caption>
      <thead><tr><th>Date</th><th class="num">Pageviews</th><th class="num">Visitors</th></tr></thead>
      <tbody>
        ${days
          .map(
            (d) =>
              `<tr><td>${esc(d.date)}</td>` +
              (d.missing
                ? `<td class="num">—</td><td class="num">—</td>`
                : `<td class="num">${fmt(d.pageviews)}</td><td class="num">${fmt(d.visitors)}</td>`) +
              `</tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}

function renderTables(present) {
  const blocks = [
    { title: "Top pages", head: "Page", rows: mergeBreakdown(present.map((d) => d.pages), "path") },
    { title: "Sources", head: "Referrer", rows: mergeBreakdown(present.map((d) => d.sources), "source") },
    { title: "Locations", head: "Country", rows: mergeBreakdown(present.map((d) => d.countries), "country") },
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
                   .map((r) => `<tr><td>${esc(r.label)}</td><td class="num">${fmt(r.views)}</td></tr>`)
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
    if (state.days.length) renderChart(state.days);
  }, 150);
});

/* Returning to the tab inside the eight-hour window skips the form. */
const existing = loadSession();
if (existing) {
  state.token = existing;
  openDashboard();
}
