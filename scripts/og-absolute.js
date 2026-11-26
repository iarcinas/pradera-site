/* Facebook, Messenger and Viber ignore a relative og:image — the share preview
   comes out as a bare link with no picture. Google's structured data and the
   canonical link want full addresses too.
   Rather than hardcode one, take whatever URL this deploy is actually served
   from. Netlify sets URL to the site's primary address, so this stays on
   *.netlify.app today and switches itself the day the custom domain becomes
   primary, with no code change.
   Locally there is no such variable, so everything is left alone. */

const fs = require("fs");
const path = require("path");

const origin = (process.env.URL || process.env.DEPLOY_PRIME_URL || "").replace(/\/+$/, "");
const file = path.join(__dirname, "..", "build", "index.html");

if (!origin) {
  console.log("og-absolute: no deploy URL in the environment — leaving social tags relative (local build).");
  process.exit(0);
}

let html = fs.readFileSync(file, "utf8");
const before = html;

html = html.replace(
  /(<meta\s+(?:property="og:image"|name="twitter:image")\s+content=")\/([^"]+)(")/g,
  `$1${origin}/$2$3`
);

// og:url tells the crawler which page the preview belongs to.
if (!/property="og:url"/.test(html)) {
  html = html.replace(
    /(<meta\s+property="og:type"[^>]*>)/,
    `$1<meta property="og:url" content="${origin}/"/>`
  );
}

/* The canonical link. Once praderaislands.com is pointed here, the old
   *.netlify.app address keeps answering, and to a search engine that is a
   second site carrying the same words — the ranking gets split between them.
   This names the one address that counts. */
if (!/rel="canonical"/.test(html)) {
  html = html.replace(
    /(<\/title>)/,
    `$1<link rel="canonical" href="${origin}/"/>`
  );
}

/* Structured data ships with root-relative URLs so the source stays readable
   and deploy previews describe themselves rather than production. Walk the
   block and prefix anything that starts with a single slash. */
html = html.replace(
  /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/,
  (_m, open, json, close) => {
    const fixed = json.replace(/"(\/[^"/][^"]*)"/g, `"${origin}$1"`).replace(/"\/"/g, `"${origin}/"`);
    return open + fixed + close;
  }
);

if (html === before) {
  console.log("og-absolute: nothing to rewrite.");
} else {
  fs.writeFileSync(file, html);
  console.log(`og-absolute: social tags, canonical and structured data now point at ${origin}`);
}

/* The opening hours Google shows.
 *
 * Staff edit the schedule in /admin/, which stores it and asks Netlify to
 * rebuild. This is the half of that promise which keeps the search result in
 * step with the page: without it, the calendar would move and Google would go
 * on telling people the old hours — and a guest reads Google before they read
 * the site.
 *
 * The schedule is read back from the live site rather than from the blob store
 * directly, because the build environment is not guaranteed to carry blob
 * credentials while the function certainly can reach them. If that read fails
 * — first ever deploy, nothing stored yet, function down — the structured data
 * committed in index.html is left exactly as it is. Stale beats invented.
 */
async function applySchedule() {
  let schedule;
  try {
    const res = await fetch(`${origin}/.netlify/functions/config`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    ({ schedule } = await res.json());
  } catch (err) {
    console.log(`og-absolute: could not read the stored schedule (${err.message}) — leaving opening hours as committed.`);
    return;
  }
  if (!schedule) {
    console.log("og-absolute: no schedule stored yet — leaving opening hours as committed.");
    return;
  }

  const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weekdayDays = [1, 2, 3, 4, 5].filter((d) => schedule.weekdays.includes(d));
  const weekendDays = [6, 0].filter((d) => schedule.weekdays.includes(d));

  const spec = (days, band) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: days.map((d) => NAMES[d]),
    opens: band.opens,
    closes: band.closes,
    ...(schedule.opensFrom ? { validFrom: schedule.opensFrom } : {}),
  });

  const opening = [];
  if (weekdayDays.length) opening.push(spec(weekdayDays, schedule.hours.weekday));
  if (weekendDays.length) opening.push(spec(weekendDays, schedule.hours.weekend));

  /* Each dated change is its own entry rather than a range: a range would also
     claim the days in between, and those are ordinary closed Mondays.
     A closure is expressed as opens and closes both at 00:00, which is how
     schema.org says "shut on this date" — without it Google keeps quoting the
     weekly hours for a day we have taken away, which is the one error that
     actually sends someone to a locked gate. */
  const special = Object.keys(schedule.overrides || {}).sort().map((date) => {
    const o = schedule.overrides[date];
    return {
      "@type": "OpeningHoursSpecification",
      opens: o.open ? schedule.hours.weekend.opens : "00:00",
      closes: o.open ? schedule.hours.weekend.closes : "00:00",
      validFrom: date,
      validThrough: date,
    };
  });

  let out = fs.readFileSync(file, "utf8");
  const before = out;
  // Replace the two arrays in place. The rest of the block — address, price
  // band, social links — is hand-maintained and must not be touched.
  out = out.replace(
    /"openingHoursSpecification":\s*\[[\s\S]*?\n(\s*)\],/,
    `"openingHoursSpecification": ${JSON.stringify(opening)},`
  );
  out = out.replace(
    /"specialOpeningHoursSpecification":\s*\[[\s\S]*?\n(\s*)\],/,
    `"specialOpeningHoursSpecification": ${JSON.stringify(special)},`
  );

  if (out === before) {
    console.log("og-absolute: opening-hours block not found — structured data left alone.");
    return;
  }
  // Fail loudly rather than ship a page whose structured data will not parse.
  const json = out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  JSON.parse(json[1]);
  fs.writeFileSync(file, out);
  console.log(
    `og-absolute: opening hours updated from the stored schedule (${opening.length} band(s), ${special.length} holiday date(s)).`
  );
}

/* The terms page is static — CRA copies it through untouched — so its own
   absolute URLs have to be filled in here too. It is the destination of the
   QR code on the gate tarpaulin, which makes its address the one thing on
   this site that must never move. */
const termsFile = path.join(__dirname, "..", "build", "terms", "index.html");
if (fs.existsSync(termsFile)) {
  let terms = fs.readFileSync(termsFile, "utf8");
  terms = terms.replace(
    /(<meta\s+property="og:image"\s+content=")\/([^"]+)(")/g,
    `$1${origin}/$2$3`
  );
  if (!/rel="canonical"/.test(terms)) {
    terms = terms.replace(/(<\/title>)/, `$1<link rel="canonical" href="${origin}/terms/"/>`);
  }
  fs.writeFileSync(termsFile, terms);
  console.log(`og-absolute: terms page pointed at ${origin}`);
}

/* Two pages now, so two entries — but Search Console asks for a
   sitemap before it will report anything useful, and both files need the
   full address, which only exists at deploy time. Generated rather than
   committed for that reason. Add a <url> block here when the rates or FAQ
   stop being sections and become their own addresses. */
const build = path.join(__dirname, "..", "build");
const today = new Date().toISOString().slice(0, 10);

fs.writeFileSync(
  path.join(build, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${origin}/terms/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
  </url>
</urlset>
`
);

const robots = path.join(build, "robots.txt");
let txt = fs.readFileSync(robots, "utf8").replace(/^Sitemap:.*$/gm, "").trimEnd();
fs.writeFileSync(robots, `${txt}\n\nSitemap: ${origin}/sitemap.xml\n`);

console.log(`og-absolute: sitemap.xml written and pointed at from robots.txt`);

/* Last, because it re-reads the file the steps above have just written.
   Its own failures are already handled inside; this catch is only for the
   unexpected, and it must not fail the deploy — a build that dies here would
   take the whole site down over a schedule refresh. */
applySchedule()
  .catch((err) => {
    console.log(`og-absolute: opening-hours refresh skipped (${err.message}).`);
  })
  .then(() => applyPriceRange())
  .catch((err) => {
    console.log(`og-absolute: price-range refresh skipped (${err.message}).`);
  });

/* The price band Google shows ("₱864–₱1,180"), from the rates staff save in
   /admin/. Same rules as the hours: read from the live site, and on any
   failure leave what is committed. Discount rows are worked out from the
   first rate the way the page does it; free rows do not count. */
async function applyPriceRange() {
  let pricing;
  try {
    const res = await fetch(`${origin}/.netlify/functions/config`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    ({ pricing } = await res.json());
  } catch (err) {
    console.log(`og-absolute: could not read the stored rates (${err.message}) — leaving the price range as committed.`);
    return;
  }
  if (!pricing || !Array.isArray(pricing.rates) || !pricing.rates.length) {
    console.log("og-absolute: no rates stored yet — leaving the price range as committed.");
    return;
  }
  const first = pricing.rates[0];
  const off = (n, pct) => Math.round((n * (100 - pct)) / 100);
  const prices = [];
  pricing.rates.forEach((r) => {
    // Both seasons: the band Google shows has to cover the dearest day too.
    if (r.kind === "price") prices.push(r.weekday, r.weekend, r.peakWeekday, r.peakWeekend);
    if (r.kind === "discount" && first.kind === "price") {
      [first.weekday, first.weekend, first.peakWeekday, first.peakWeekend]
        .filter((n) => Number.isFinite(n))
        .forEach((n) => prices.push(off(n, r.percent)));
    }
  });
  const good = prices.filter((n) => Number.isFinite(n) && n > 0);
  if (!good.length) return;
  const fmt = (n) => `₱${n.toLocaleString("en-US")}`;
  const lo = Math.min(...good);
  const hi = Math.max(...good);
  const band = lo === hi ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`;

  let out = fs.readFileSync(file, "utf8");
  const next = out.replace(/"priceRange":\s*"[^"]*"/, `"priceRange": "${band}"`);
  if (next === out) {
    console.log(`og-absolute: price range already ${band}.`);
    return;
  }
  JSON.parse(next.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  fs.writeFileSync(file, next);
  console.log(`og-absolute: price range set to ${band} from the stored rates.`);
}
