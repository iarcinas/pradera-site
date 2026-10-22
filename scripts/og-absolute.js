/* Facebook, Messenger and Viber ignore a relative og:image — the share preview
   comes out as a bare link with no picture. They need a full address.
   Rather than hardcode one, take whatever URL this deploy is actually served
   from. Netlify sets URL to the site's primary address, so this stays on
   *.netlify.app today and switches itself the day the custom domain becomes
   primary, with no code change.
   Locally there is no such variable, so the tags are left alone. */

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

if (html === before) {
  console.log("og-absolute: nothing to rewrite.");
} else {
  fs.writeFileSync(file, html);
  console.log(`og-absolute: social tags now point at ${origin}`);
}
