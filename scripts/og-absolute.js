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
