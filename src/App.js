import { useState, useEffect, useRef } from "react";

const COLORS = {
  orange: "#FF8E00",
  dagat: "#0021E8",
  hiraya: "#00237B",
  lakandanum: "#0EB0C0",
  azure: "#3AE1B4",
  janjan: "#0AD2F0",
  sunset: "#DC22AE",
  takipsilim: "#8A00B6",
  kawayan: "#433012",
};

const GRADIENTS = {
  main: `linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.janjan} 55%, ${COLORS.dagat} 100%)`,
  hero: `linear-gradient(180deg, ${COLORS.janjan} 0%, ${COLORS.lakandanum} 25%, ${COLORS.dagat} 65%, ${COLORS.hiraya} 100%)`,
  azure: `linear-gradient(135deg, ${COLORS.azure} 0%, ${COLORS.lakandanum} 100%)`,
  sunset: `linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.sunset} 100%)`,
  twilight: `linear-gradient(135deg, ${COLORS.sunset} 0%, ${COLORS.takipsilim} 100%)`,
  deep: `linear-gradient(160deg, ${COLORS.dagat} 0%, ${COLORS.hiraya} 100%)`,
};

/* A little Christmas, and only at Christmas.
 *
 * The season switches itself on and off against Philippine dates, so nobody
 * has to remember to take the snow down in January — the one maintenance job
 * a seasonal decoration reliably fails at. `?xmas=1` forces it on and
 * `?xmas=0` forces it off, which is how staff and anyone reviewing a change
 * can see it in June.
 */
const HOLIDAY_FROM = "11-23";
const HOLIDAY_TO = "01-06";
function isHolidaySeason(now = new Date()) {
  if (typeof window !== "undefined") {
    const forced = new URLSearchParams(window.location.search).get("xmas");
    if (forced === "1") return true;
    if (forced === "0") return false;
  }
  /* Manila time: the park's own calendar, not the visitor's. Shifting the
     clock and reading UTC fields avoids depending on a timezone database. */
  const manila = new Date(now.getTime() + 8 * 3600000).toISOString();
  const md = manila.slice(5, 10);
  return md >= HOLIDAY_FROM || md <= HOLIDAY_TO;
}

/* Fixed rather than random, so every visitor gets the same quiet snowfall and
   a re-render never reshuffles it mid-fall. Drift is how far a flake slides
   sideways on the way down; without it they fall like rain. `y` is used
   only when motion is turned off, to scatter the stilled flakes. */
const SNOWFLAKES = [
  { left: "3%",  size: 14, dur: 17, delay: 0.0,  drift: 34,  fade: 0.60, y: "12%" },
  { left: "7%",  size: 26, dur: 22, delay: 6.5,  drift: -20, fade: 0.80, y: "58%" },
  { left: "11%", size: 18, dur: 13, delay: 4.2,  drift: -28, fade: 0.75, y: "34%" },
  { left: "16%", size: 11, dur: 21, delay: 1.6,  drift: 44,  fade: 0.50, y: "81%" },
  { left: "21%", size: 30, dur: 25, delay: 9.0,  drift: 30,  fade: 0.85, y: "22%" },
  { left: "26%", size: 15, dur: 15, delay: 7.8,  drift: -18, fade: 0.68, y: "70%" },
  { left: "31%", size: 12, dur: 19, delay: 2.9,  drift: 26,  fade: 0.52, y: "8%" },
  { left: "36%", size: 22, dur: 18, delay: 12.4, drift: -34, fade: 0.78, y: "47%" },
  { left: "41%", size: 16, dur: 12, delay: 9.4,  drift: -38, fade: 0.72, y: "90%" },
  { left: "46%", size: 11, dur: 20, delay: 5.1,  drift: 30,  fade: 0.50, y: "16%" },
  { left: "51%", size: 20, dur: 16, delay: 0.8,  drift: 18,  fade: 0.74, y: "76%" },
  { left: "56%", size: 12, dur: 22, delay: 11.3, drift: -22, fade: 0.48, y: "38%" },
  { left: "61%", size: 28, dur: 24, delay: 3.4,  drift: 40,  fade: 0.82, y: "6%" },
  { left: "66%", size: 14, dur: 14, delay: 8.0,  drift: -26, fade: 0.66, y: "62%" },
  { left: "71%", size: 11, dur: 20, delay: 8.6,  drift: -32, fade: 0.50, y: "28%" },
  { left: "76%", size: 19, dur: 13, delay: 6.0,  drift: 20,  fade: 0.74, y: "84%" },
  { left: "81%", size: 24, dur: 23, delay: 13.1, drift: -30, fade: 0.80, y: "44%" },
  { left: "86%", size: 12, dur: 18, delay: 1.1,  drift: -42, fade: 0.52, y: "14%" },
  { left: "91%", size: 17, dur: 16, delay: 10.2, drift: 24,  fade: 0.70, y: "68%" },
  { left: "95%", size: 27, dur: 21, delay: 4.7,  drift: -26, fade: 0.82, y: "32%" },
  { left: "98%", size: 11, dur: 19, delay: 7.2,  drift: -16, fade: 0.48, y: "88%" },
];

/* Gold sparkles that hold still and twinkle, as on the holiday artwork. */
const SPARKLES = [
  { left: "9%",  top: "24%", size: 18, delay: 0.0 },
  { left: "19%", top: "62%", size: 12, delay: 1.4 },
  { left: "29%", top: "17%", size: 14, delay: 2.6 },
  { left: "71%", top: "20%", size: 20, delay: 0.7 },
  { left: "83%", top: "55%", size: 13, delay: 2.0 },
  { left: "92%", top: "27%", size: 16, delay: 3.1 },
  { left: "77%", top: "80%", size: 11, delay: 1.0 },
  { left: "13%", top: "83%", size: 15, delay: 2.3 },
];

/* The string of lights: one sagging wire per 200 units, three bulbs on each. */
const LIGHT_COLORS = ["#FF8E00", "#FFD23F", "#0AD2F0", "#3AE1B4", "#FFFFFF"];
const LIGHT_SPANS = Array.from({ length: 10 }, (_, i) => i * 200);
const GOLD = "#FFD23F";

/* Marker positions as % of the cropped park map (park-map.jpg, 1560x832).
   Derived from the badge centres on the source primer page. */
const mapPins = [
  { name: "Danaw Dapu", x: 41.7, y: 6.4 },
  { name: "Dapu's Cove", x: 50.8, y: 7.8 },
  { name: "Jan-Jan's Cove", x: 26.9, y: 18.0 },
  { name: "Ulan Towers", x: 52.4, y: 45.1 },
  { name: "Rio de Pradera", x: 66.5, y: 46.9 },
  { name: "Drizzle District", x: 44.2, y: 57.2 },
  { name: "Lake Liway", x: 93.8, y: 53.2 },
  { name: "Amihan Spinner", x: 88.2, y: 67.2 },
  { name: "Danum 360", x: 12.1, y: 62.5 },
  { name: "Waves of Laut", x: 25.3, y: 82.9 },
  { name: "Lunar Speedway", x: 48.7, y: 84.9 },
  { name: "Habagat Rush", x: 84.9, y: 90.1 },
  // Venues — resolved from the dining & retail list rather than the ride list.
  { name: "Sinag", x: 75.6, y: 28.2, venue: true },
  { name: "Pradera Treasures", x: 69.3, y: 9.6, venue: true },
];

const attractions = [
  { name: "Amihan Spinner", desc: "Feel the winds of the Northeast Monsoon in this spinning vortex slide — fast, furious, and unstoppable.", theme: "Wind & Storm", color: COLORS.dagat, logo: "/attractions/amihan-spinner.webp" },
  { name: "Habagat Rush", desc: "Ride the Southwest Monsoon's force down a high-speed plunge slide that leaves you breathless.", theme: "Thrill Slide", color: COLORS.orange, logo: "/attractions/habagat-rush.webp" },
  { name: "Danum 360", desc: "A triple-twisting serpentine slide inspired by the bakunawa — spiral through water in pure flow.", theme: "Twister", color: COLORS.azure, logo: "/attractions/danum-360.webp" },
  { name: "Lunar Speedway", desc: "Six lanes racing side by side under the lunar cycle — moon-inspired, tidal speed.", theme: "Race Slides", color: COLORS.lakandanum, logo: "/attractions/lunar-speedway.webp" },
  { name: "Ulan Towers", desc: "A multi-level rain-zone ride house where every turn pours with tropical abundance.", theme: "Family Rides", color: COLORS.janjan, logo: "/attractions/ulan-towers.webp" },
  { name: "Waves of Laut", desc: "Laut's domain — a massive adult wave pool with rolling swells and sun-soaked shores.", theme: "Wave Pool", color: COLORS.dagat, logo: "/attractions/waves-of-laut.webp" },
  { name: "Rio de Pradera", desc: "Drift along the Pampanga-inspired lazy river — the flowing heart of Pradera Islands.", theme: "Lazy River", color: COLORS.azure, logo: "/attractions/rio-de-pradera.webp" },
  { name: "Dapu's Cove", desc: "A sheltered splash lagoon with a gentle waterfall — Dapu's own hideaway for the littlest swimmers.", theme: "Kids Lagoon", color: COLORS.azure, logo: "/attractions/dapus-cove.webp" },
  { name: "Danaw Dapu", desc: "Dapu's playful cove — a gentle kiddie zone full of turtle slides and little splashes.", theme: "Kids Zone", color: COLORS.orange, logo: "/attractions/danaw-dapu.webp" },
  { name: "Drizzle District", desc: "A sun-drenched spray park where rain meets sunshine — perfect for little ones.", theme: "Spray Park", color: COLORS.sunset, logo: "/attractions/drizzle-district.webp" },
  { name: "Jan-Jan's Cove", desc: "Jan-Jan's pond-themed water dock — glide and splash in the most playful corner of the park.", theme: "Kids Slides", color: COLORS.janjan, logo: "/attractions/janjans-cove.webp" },
  { name: "Lake Liway", desc: "The chill tambayan zone — teen activity pool beside the restaurant and pool bar.", theme: "Teen Pool", color: COLORS.lakandanum, logo: "/attractions/lake-liway.webp" },
  /* Name confirmed by Marketing 4 Nov 2026. Still unbuilt, so the card keeps
     the Coming Soon mark and has no logo or map pin yet. */
  { name: "Danum Flow", desc: "A FlowRider-style surf simulator is on its way — stand-up and bodyboard surfing on an endless wave.", theme: "Surf Simulator", color: COLORS.hiraya, comingSoon: true, tempMark: "DF" },
];

/* Dining & retail lineup agreed 5 Oct 2026: Sinag, three food kiosks, one retail kiosk.
   Kiosk names and logos delivered 25 Oct 2026. Pepito's copy is drawn from the
   Kiosk 1 menu board; the other two still describe only what their name says,
   pending their menus. No prices on the page — the boards are the source. */
const fnb = [
  { name: "Sinag", desc: "Our main restaurant. Sun-drenched, sunrise-warm interiors with flavors as vibrant as first light.", type: "Main Restaurant", color: COLORS.orange, logo: "/brand/venues/sinag.webp" },
  { name: "Pepito's Rice House", desc: "Filipino rice plates — sisig, kaldereta, adobo, barbecue — plus fried chicken by the bucket when the whole group is hungry.", type: "Food Kiosk", color: COLORS.azure, logo: "/brand/venues/pepitos-rice-house.webp" },
  { name: "Dapu's Pizza Pit", desc: "Hot pizza by the slice, straight from Dapu's own oven.", type: "Food Kiosk", color: COLORS.orange, logo: "/brand/venues/dapus-pizza-pit.webp" },
  { name: "Jan-Jan's Snack Shack", desc: "Quick bites and ice-cold drinks for the stretch between rides.", type: "Food Kiosk", color: COLORS.janjan, logo: "/brand/venues/jan-jans-snack-shack.webp" },
  { name: "Pradera Treasures", desc: "Take the islands home. Mascot plush, swimwear, towels, and Pradera merchandise by the park exit.", type: "Retail", color: COLORS.azure, logo: "/brand/venues/pradera-treasures.webp" },
];


const characters = [
  { name: "Lakandanum", role: "Spirit of the Waters", desc: "Laidback, cool, intuitive. The calm presence of Hiraya Lake — guiding rivers and currents with quiet control.", color: COLORS.lakandanum, image: "/brand/characters/lakandanum.webp" },
  { name: "Jan-Jan", role: "Park Technician", desc: "Caring, reliable, and always ready to save the day. The behind-the-scenes magic that keeps Pradera running.", color: COLORS.takipsilim, image: "/brand/characters/janjan.webp" },
  { name: "Laut", role: "Guardian of the Waters", desc: "Fast, fearless, and always in motion. She charges waves, drives energy, and turns every splash into adventure.", color: COLORS.dagat, image: "/brand/characters/laut.webp" },
  { name: "Dapu", role: "Children's Guide", desc: "Cheerful, gentle, and always alert. Pradera's friendly turtle guide who keeps every young adventurer safe.", color: COLORS.orange, image: "/brand/characters/dapu.webp" },
];

/* Social channels — shared by Find Us and the footer. */
const SOCIALS = [
{ name: "Facebook", url: "https://www.facebook.com/people/Pradera-Islands-Waterpark/61576524087915/", accent: "#1877F2", path: <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" /> },
{ name: "Instagram", url: "https://www.instagram.com/praderaislandswaterpark/", accent: "#E1306C", path: (<><path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.72 3.72 0 01-.9 1.38c-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63A5.92 5.92 0 002 2.01 5.92 5.92 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91a5.92 5.92 0 001.38 2.14 5.92 5.92 0 002.14 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a6.17 6.17 0 003.52-3.52c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.92 5.92 0 00-1.38-2.14A5.92 5.92 0 0019.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0z" /><path d="M12 5.84A6.16 6.16 0 1018.16 12 6.17 6.17 0 0012 5.84zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4z" /><circle cx="18.41" cy="5.59" r="1.44" /></>) },
{ name: "TikTok", url: "https://www.tiktok.com/@praderawaterpark_", accent: "#25F4EE", path: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.58 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.62-.1z" /> },
];

/* Online ticket sales run through Klook for now. */
const TICKETS_URL = "https://www.klook.com/en-US/activity/226976-pradera-islands-theme-park/";

const COOKIE_CONSENT_ENABLED = false;

/* Admission rates from the Sales / Revenue information request form (Sept 2026).
   Flip RATES_PUBLISHED to true once Sales marks them Final. */
const RATES_PUBLISHED = true;
/* Sections that are still empty shells stay hidden until their department delivers. */
const FAQ_PUBLISHED = false;    // Marketing + Customer Service
const LEGAL_PUBLISHED = false;  // Legal: Privacy Policy and Terms of Service
const CS_EMAIL = null;          // Legal/Admin: customer service address, e.g. "info@praderaislands.com"
/* Guest line, staffed during park hours only. Written the way guests dial it;
   the tel: link is derived. null hides every place the number appears. */
const CONTACT_PHONE = "0977 810 0808";
const telHref = (n) => `tel:+63${n.replace(/\D/g, "").replace(/^0/, "")}`;

/* Not allowed inside the park — from Operations' Prohibited Items poster
   (20 Nov 2026). Labels are the poster's own words; keep them that way, the
   same list is printed at the gate. */
/* Icons are drawn here rather than taken from emoji: a jar or a ring buoy is
   a recent emoji, and on an older phone it renders as an empty box. */
const PROHIBITED_ITEMS = [
  { label: "Outside food and drinks", icon: <><path d="M4 11a8 5 0 0 1 16 0z" /><path d="M3 14h18" /><path d="M4 17h16v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /></> },
  { label: "Glass containers", icon: <><path d="M8 3h8v3H8z" /><path d="M7 6h10a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1z" /><path d="M9.5 10v6" /></> },
  { label: "Smoking and vaping", icon: <><path d="M2 14h15v4H2z" /><path d="M13 14v4" /><path d="M20 14v4" /><path d="M18 11c0-2 2-2 2-4s-2-2-2-4" /></> },
  { label: "Illegal substances", icon: <g transform="rotate(-45 12 12)"><rect x="3" y="8.5" width="18" height="7" rx="3.5" /><path d="M12 8.5v7" /></g> },
  { label: "Alcohol", icon: <><path d="M7 3h10l-1 6a4 4 0 0 1-8 0z" /><path d="M12 13v7" /><path d="M8 20h8" /></> },
  { label: "Coolers", icon: <><path d="M3 9h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M3 9l1-3h16l1 3" /><path d="M9 6V4h6v2" /><path d="M3 13h18" /></> },
  { label: "Pets", icon: <><ellipse cx="12" cy="16" rx="4" ry="3.5" /><circle cx="5.5" cy="10.5" r="1.8" /><circle cx="9.5" cy="6.5" r="1.8" /><circle cx="14.5" cy="6.5" r="1.8" /><circle cx="18.5" cy="10.5" r="1.8" /></> },
  { label: "Weapons and dangerous objects", icon: <><path d="M20 3L9 14l2 2c5-3 9-8 9-13z" /><path d="M9 14l-5 5a1.4 1.4 0 0 0 2 2l5-5" /></> },
  { label: "Wheeled equipment and drones", icon: <><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 18H15l3.5-13" /><path d="M16 5h5" /></> },
  { label: "Improper swimwear and swimwear with metal hardware", icon: <><path d="M5 3l1 6a3 3 0 0 0 6 0 3 3 0 0 0 6 0l1-6" /><path d="M5 14h14l-4.5 6h-5z" /></> },
  { label: "Unapproved floatation devices", icon: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><path d="M6 6l3.2 3.2M18 6l-3.2 3.2M6 18l3.2-3.2M18 18l-3.2-3.2" /></> },
  { label: "Action cameras and extension poles", icon: <><rect x="4" y="7" width="16" height="11" rx="2" /><circle cx="12" cy="12.5" r="3" /><path d="M8 7l1.5-2.5h5L16 7" /><path d="M12 18v4" /></> },
];

/* Rates and promos. Staff edit these in /admin/ (Rates & promos); the page
   reads them from the config function on load. What is written here is what
   the page shows until that answers, or if it never does — so keep it equal
   to what is stored, the same way DEFAULT_SCHEDULE is kept.

   Two seasons, from Sales' Retail Admission Rate Schedule: Peak runs
   peakFrom to peakTo (MM-DD, inclusive) and everything else is Off-Peak.
   weekday/weekend are the Off-Peak prices; peakWeekday/peakWeekend the Peak.

   A "discount" row is a percentage off the first row, worked out here rather
   than typed, so PWD & Senior follows the Adult pass whenever it changes. A
   promo "deal" is worked out the same way, from the first row's weekday rate
   in the season on screen.
   In a promo's text, [words in brackets] become the "get in touch" link. */
const DEFAULT_PRICING = {
  season: { peakFrom: "04-01", peakTo: "08-15" },
  rates: [
    { name: "Adult Day Pass", note: "4 ft / 48\" and beyond, regardless of age", kind: "price", weekday: 1080, weekend: 1180, peakWeekday: 1280, peakWeekend: 1380 },
    { name: "Junior Day Pass", note: "Above 3 ft / 36\" and below 4 ft / 48\"", kind: "price", weekday: 880, weekend: 980, peakWeekday: 1080, peakWeekend: 1180 },
    { name: "Infant", note: "3 ft / 36\" and below", kind: "free" },
    { name: "PWD & Senior Citizen", note: "Valid OSCA / PWD ID; includes the 20% discount by law", kind: "discount", percent: 20 },
  ],
  promos: [
    {
      enabled: true,
      title: "10 for 10 — ten tickets, ten percent off",
      text: "Planning a corporate outing, school field trip, or tour group? [Get in touch] with your date and group size and we will send a quote.",
      badge: "10%",
      badgeSub: "off",
      startsOn: null,
      endsOn: null,
      deal: { qty: 10, percent: 10 },
    },
  ],
};

const pctOff = (amount, percent) => Math.round((amount * (100 - percent)) / 100);
const peso = (n) => `₱${n.toLocaleString("en-PH")}`;

/* A row's two prices for one season. A row stored before seasons existed
   has no peak prices; it shows its one price in both rather than nothing. */
const seasonPrices = (r, which) =>
  which === "peak"
    ? { weekday: r.peakWeekday ?? r.weekday, weekend: r.peakWeekend ?? r.weekend }
    : { weekday: r.weekday, weekend: r.weekend };

/* Every row as the page shows it for one season: a discount row gets real
   prices, and a row that cannot be priced (no base, bad numbers) is dropped
   rather than shown as "₱NaN". */
function resolveRates(rates, which) {
  const base = rates[0] && rates[0].kind === "price" ? seasonPrices(rates[0], which) : null;
  return rates
    .map((r) => {
      if (r.kind === "free") return { ...r, free: true };
      if (r.kind === "discount") {
        if (!base) return null;
        return { ...r, weekday: pctOff(base.weekday, r.percent), weekend: pctOff(base.weekend, r.percent) };
      }
      const p = seasonPrices(r, which);
      return Number.isFinite(p.weekday) && Number.isFinite(p.weekend) ? { ...r, ...p } : null;
    })
    .filter(Boolean);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const mdLabel = (md) => `${MONTHS[Number(md.slice(0, 2)) - 1]} ${Number(md.slice(3))}`;
/* The day before / after an MM-DD, in a non-leap year — the season edges are
   calendar dates, and Feb 29 is never one of them. */
const mdShift = (md, by) => {
  const d = new Date(Date.UTC(2025, Number(md.slice(0, 2)) - 1, Number(md.slice(3)) + by));
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

/* Which season a YYYY-MM-DD falls in. Peak may wrap the new year. */
function seasonOn(date, season) {
  if (!season) return "offpeak";
  const md = date.slice(5);
  const { peakFrom, peakTo } = season;
  const inPeak = peakFrom <= peakTo ? md >= peakFrom && md <= peakTo : md >= peakFrom || md <= peakTo;
  return inPeak ? "peak" : "offpeak";
}

const seasonRanges = (season) => ({
  peak: `${mdLabel(season.peakFrom)} – ${mdLabel(season.peakTo)}`,
  offpeak: `${mdLabel(mdShift(season.peakTo, 1))} – ${mdLabel(mdShift(season.peakFrom, -1))}`,
});

/* Today in Manila, as YYYY-MM-DD. A promo's dates are the park's dates, not
   the dates of wherever the guest's phone thinks it is. */
const manilaToday = (now = new Date()) => new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10);

const promoIsLive = (x, today) =>
  x.enabled !== false && (!x.startsOn || x.startsOn <= today) && (!x.endsOn || x.endsOn >= today);

const COUNT_WORDS = { 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve" };

/* The worked-out sentence for a group deal, from the base weekday rate of
   the season on screen. */
function dealLine(deal, rates, which) {
  const base = rates[0];
  if (!deal || !base || base.kind !== "price") return null;
  const was = seasonPrices(base, which).weekday;
  const each = pctOff(was, deal.percent);
  return { qty: deal.qty, total: each * deal.qty, each, was };
}


/* Rest state for the social icons: a quiet tint of the brand colour; solid on hover. */
const socialIconBg = (name, accent) => `${accent}26`;


export default function PraderaIslands() {
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [attractionIndex, setAttractionIndex] = useState(0);
  const goAttraction = (dir) => {
    setAttractionIndex((i) => (i + dir + attractions.length) % attractions.length);
  };
  const [navOpen, setNavOpen] = useState(false);

  const [isNarrow, setIsNarrow] = useState(false);
  // The page runs past 20,000px. Past the first screen, offer a way back up.
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      setShowTop(window.scrollY > window.innerHeight);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const apply = (e) => setIsNarrow(e.matches);
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Reveal elements as they enter the viewport, with a stagger per group.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const delay = Number(entry.target.dataset.revealDelay || 0);
          setTimeout(() => entry.target.classList.add("is-in"), delay);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -70px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Hero parallax — the photo drifts slower than the page.
  const [heroShift, setHeroShift] = useState(0);
  const [bandShift, setBandShift] = useState(0);
  const [activePin, setActivePin] = useState(null);
  const [hoverPin, setHoverPin] = useState(null);
  const [form, setForm] = useState({ name: "", contact: "", email: "", visitDate: "", message: "" });
  const [formState, setFormState] = useState("idle"); // idle | sending | sent | error
  // Honeypot. Hidden from people, irresistible to scrapers. Kept out of `form`
  // so it can never reach a real field, and posted under its own name so
  // Netlify's own filter sees it too.
  const [botField, setBotField] = useState("");
  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  /* The schedule and the announcement, both edited from /admin/ and read back
     from one cached endpoint. Until that answers — or if it never does — the
     page runs on DEFAULT_SCHEDULE and shows no announcement. A park whose
     calendar goes blank because a function had a bad minute would be a worse
     failure than a stale one. */
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  /* Read once. The season cannot turn over while someone is looking at the
     page, and re-reading it on every render would restart the snowfall. */
  const [holiday] = useState(isHolidaySeason);
  const [notice, setNotice] = useState(null);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  /* The season the rate cards show. Starts on today's (Manila) and can be
     switched by the guest to plan a visit in the other one. null = today's. */
  const [seasonPick, setSeasonPick] = useState(null);

  useEffect(() => {
    let live = true;
    fetch("/.netlify/functions/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!live || !data) return;
        if (data.schedule) setSchedule({ ...DEFAULT_SCHEDULE, ...data.schedule });
        if (data.notice) setNotice(data.notice);
        if (data.pricing && Array.isArray(data.pricing.rates) && data.pricing.rates.length) {
          setPricing({ season: data.pricing.season || DEFAULT_PRICING.season, rates: data.pricing.rates, promos: data.pricing.promos || [] });
        }
      })
      .catch(() => {
        /* Offline, blocked, or the function is down. The page is already
           showing a schedule; leave it alone and say nothing. */
      });
    return () => {
      live = false;
    };
  }, []);

  /* Count this page load.
   *
   * Our own counter, on our own origin — no Google Analytics, no third-party
   * script, so the CSP stays script-src 'self' and there is no cookie banner
   * to show. The function behind it stores a path, a daily-rotating hash and
   * an hour; see netlify/lib/counter.js for why that is a statistic and not a
   * record about anyone.
   *
   * sendBeacon rather than fetch: it hands the request to the browser to send
   * on its own time, so it cannot hold up the page and still goes out if the
   * visitor closes the tab in the same second. Older Safari lacks it, hence
   * the keepalive fetch behind it — same reason: the request has to survive
   * the page going away.
   *
   * Every failure path here is silent and empty. A counter that logs to the
   * console of a real guest's browser, or that can throw during render, has
   * cost more than it measures. */
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;
    const url = "/.netlify/functions/hit";
    const body = JSON.stringify({
      p: window.location.pathname,
      r: document.referrer || "",
    });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: "application/json" }))) {
        return;
      }
    } catch {
      /* Blocked by an extension, or the queue is full. Fall through. */
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, []);

  // Planned visit date: optional, today or later, and only on days the park is open.
  const todayISO = new Date().toLocaleDateString("en-CA");
  const [visitDateWarn, setVisitDateWarn] = useState("");
  const handleVisitDate = (e) => {
    const v = e.target.value;
    if (!v) { setVisitDateWarn(""); setForm({ ...form, visitDate: "" }); return; }
    const day = new Date(v + "T00:00:00").getDay();
    if (schedule.opensFrom && v < schedule.opensFrom) {
      const opening = new Date(`${schedule.opensFrom}T00:00:00`).toLocaleDateString("en-PH", { day: "numeric", month: "long", year: "numeric" });
      setVisitDateWarn(`The park opens on ${opening}. Please pick a date from then on.`);
      setForm({ ...form, visitDate: "" });
      return;
    }
    /* One function decides this for the calendar and for the form, so the two
       can never disagree — and a dated opening beats the weekly pattern, since
       turning away a guest who picked a day we are open is the worst kind of
       wrong. Where a reason was given, say it: "closed" invites an argument,
       "closed, scheduled maintenance" does not. */
    const { open, override } = dayStatus(v, day, schedule);
    if (!open) {
      const openDays = [...WEEKDAY_BAND, ...WEEKEND_BAND].filter((d) => schedule.weekdays.includes(d)).map((d) => DAY_NAMES[d]);
      setVisitDateWarn(
        override && override.reason
          ? `The park is closed that day — ${override.reason}. Please pick another date.`
          : `The park is closed on that day. Please pick a ${openDays.join(", ")}, or a date marked open on the calendar.`
      );
      setForm({ ...form, visitDate: "" });
      return;
    }
    setVisitDateWarn("");
    setForm({ ...form, visitDate: v });
  };
  const handleFormSubmit = (e) => {
    e.preventDefault();
    // A filled honeypot means a bot. Show the same thank-you it expects and
    // send nothing — the free Forms tier allows 100 submissions a month, and
    // a real customer's inquiry should not be the one that gets turned away.
    if (botField) { setFormState("sent"); return; }
    setFormState("sending");
    const body = new URLSearchParams({ "form-name": "inquiry", "bot-field": botField, ...form }).toString();
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body })
      .then((r) => { if (!r.ok) throw new Error(r.status); setFormState("sent"); setForm({ name: "", contact: "", email: "", visitDate: "", message: "" }); })
      .catch(() => setFormState("error"));
  };

  // A link tapped inside the open sheet parks its target id here. The sheet
  // has the body pinned, so the page cannot be scrolled until the lock comes
  // off — the close handler below does both in one move.
  const pendingScroll = useRef(null);

  // Lock the page behind the mobile menu so scrolling the sheet can't
  // chain into the page. Pins body position and restores the exact
  // scroll offset on close — iOS Safari loses it with overflow:hidden alone.
  useEffect(() => {
    if (!navOpen) return;
    const y = window.scrollY;
    const { position, top, width, overflowY } = document.body.style;
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.width = "100%";
    document.body.style.overflowY = "scroll";
    return () => {
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      document.body.style.overflowY = overflowY;

      // Exactly one scroll on the way out. Restoring the old offset and then
      // scrolling to the target are two animations racing each other, and the
      // restore wins — which is why tapping a menu item appeared to do nothing.
      const target = pendingScroll.current && document.getElementById(pendingScroll.current);
      pendingScroll.current = null;
      if (target) {
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
      } else {
        window.scrollTo(0, y);
      }
    };
  }, [navOpen]);

  // Intro curtain — unmounts once its animation has finished.
  // ?intro=off skips it; ?intro=hold keeps it on screen for review.
  const introMode = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("intro") : null;
  const [splashDone, setSplashDone] = useState(introMode === "off");
  useEffect(() => {
    if (introMode === "hold" || introMode === "off") return;
    const t = setTimeout(() => setSplashDone(true), 5000);
    return () => clearTimeout(t);
  }, [introMode]);

  // Carousel drifts on its own so the section is alive before anyone touches it;
  // pauses while the pointer is over it.
  const [carouselHover, setCarouselHover] = useState(false);
  useEffect(() => {
    if (carouselHover) return;
    const t = setInterval(
      () => setAttractionIndex((i) => (i + 1) % attractions.length),
      4600
    );
    return () => clearInterval(t);
  }, [carouselHover]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setHeroShift(Math.min(y, window.innerHeight) * 0.28);
        const band = document.getElementById("stat-band");
        if (band) {
          const r = band.getBoundingClientRect();
          setBandShift(Math.max(-60, Math.min(60, (window.innerHeight / 2 - (r.top + r.height / 2)) * 0.09)));
        }
        raf = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const scrollTo = (id) => {
    setActiveSection(id);
    if (navOpen) {
      // Hand the target to the lock cleanup; it scrolls once it has unpinned.
      pendingScroll.current = id;
      setNavOpen(false);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };



  const navItems = [
    // Order agreed at the 5 Oct 2026 website review; Promos live inside Rates.
    { id: "attractions", label: "attractions" },
    { id: "rates", label: "Rates", soon: !RATES_PUBLISHED },
    { id: "characters", label: "characters" },
    { id: "dining", label: "dining" },
    { id: "map", label: "map" },
    { id: "gallery", label: "gallery" },
    { id: "guide", label: "Guide" },
    { id: "visit", label: "Contact Us" },
  ];

  return (
    <div style={{ fontFamily: "'Montserrat', 'Proxima Nova', system-ui, sans-serif", background: "#fff", color: "#111", overflowX: "hidden" }}>
      {/* Only rendered when staff have published something that has not yet
          expired. No announcement means nothing here at all — no empty bar,
          no placeholder. */}
      {notice && <NoticeDialog notice={notice} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@500;600;700;800;900&family=Montserrat:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${COLORS.hiraya}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.orange}; border-radius: 4px; }

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes drift { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-8px,-10px)} }
        @keyframes wave { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes wp-flow { 0% { transform: translateX(0); } 100% { transform: translateX(-600px); } }
        @keyframes wp-flow-rev { 0% { transform: translateX(-600px); } 100% { transform: translateX(0); } }
        @keyframes wp-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .wp-wave-1 { animation: wp-flow 9s linear infinite; }
        .wp-wave-2 { animation: wp-flow-rev 7s linear infinite; }
        .wp-wave-3 { animation: wp-flow 5s linear infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%,100%{opacity:0.35} 50%{opacity:0.9} }

        h1, h2, h3, h4, .display { font-family: 'Bricolage Grotesque', 'Kanit', sans-serif; font-weight: 700; letter-spacing: -0.02em; }
        .eyebrow { font-family: 'Kanit', sans-serif; font-weight: 600; font-size: 12px; letter-spacing: 4px; text-transform: uppercase; }
        .body { font-family: 'Montserrat', sans-serif; font-weight: 400; line-height: 1.75; }

        .nav-link { transition: color 0.2s; cursor: pointer; font-family: 'Kanit', sans-serif; font-weight: 600; font-size: 12px; letter-spacing: 1.2px; text-transform: uppercase; white-space: nowrap; }
        .nav-link:hover { color: ${COLORS.orange}; }
        .card { transition: transform 0.35s cubic-bezier(.2,.8,.2,1), box-shadow 0.35s; cursor: pointer; }
        .card:hover { transform: translateY(-10px); box-shadow: 0 30px 80px rgba(0,35,123,0.18); }
        .btn-primary { background: ${COLORS.orange}; color: #fff; border: none; padding: 16px 40px; font-family: 'Kanit', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 1.2px; text-transform: uppercase; border-radius: 6px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(0,35,123,0.16); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(255,142,0,0.45); }
        .btn-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,0.55); color: #fff; padding: 14px 36px; font-family: 'Kanit', sans-serif; font-weight: 600; font-size: 14px; letter-spacing: 1.2px; text-transform: uppercase; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { background: #fff; color: ${COLORS.hiraya}; }

        .section-fade { animation: fadeUp 0.8s ease forwards; }
        .wave-anim { animation: wave 14s linear infinite; }
        .float-anim { animation: float 5s ease-in-out infinite; }
        .drift-anim { animation: drift 7s ease-in-out infinite; }
        .gallery-tile img { transition: transform 0.6s ease; }
        .gallery-tile:hover img { transform: scale(1.08); }

        /* ---- Meet the Crew cards ---- */
        .crew-watermark { position: absolute; right: -8%; bottom: -10%; width: 62%; opacity: 0.10; pointer-events: none;
          filter: grayscale(1) brightness(3); transform: rotate(-8deg); }
        .crew-ground { position: absolute; left: 50%; bottom: 22px; width: 58%; height: 22px; transform: translateX(-50%);
          border-radius: 50%; background: radial-gradient(ellipse, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.12) 55%, transparent 75%);
          transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.5s; }
        .crew-img { position: relative; z-index: 1; transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);
          filter: drop-shadow(0 18px 26px rgba(0,0,0,0.30)); }
        .tilt-scene:hover .crew-img { transform: translateY(-12px) scale(1.05); }
        .tilt-scene:hover .crew-ground { transform: translateX(-50%) scale(0.82); opacity: 0.6; }
        .crew-role-pill { position: absolute; top: 16px; left: 16px; z-index: 2; padding: 6px 11px; border-radius: 4px;
          background: rgba(255,255,255,0.16); backdrop-filter: blur(6px); color: #fff; font-family: 'Kanit', sans-serif;
          font-size: 10px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; }


        /* ---- Interactive park map ---- */
        .map-frame { position: relative; border-radius: 12px; overflow: hidden; line-height: 0;
          box-shadow: 0 40px 90px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.09); }
        .map-frame img { transition: transform 0.6s cubic-bezier(0.22,1,0.36,1); }
        .map-pin { position: absolute; width: 7.2%; aspect-ratio: 1; transform: translate(-50%,-50%);
          border-radius: 50%; border: 2.5px solid transparent; background: transparent; padding: 0;
          cursor: pointer; transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, box-shadow 0.3s; }
        .map-pin::after { content: ""; position: absolute; inset: -6px; border-radius: 50%;
          border: 2px solid ${COLORS.orange}; opacity: 0; transform: scale(0.75); transition: opacity 0.35s, transform 0.35s; }
        .map-pin:hover, .map-pin.on, .map-pin:focus-visible {
          transform: translate(-50%,-50%) scale(1.22); border-color: ${COLORS.orange};
          box-shadow: 0 0 0 5px rgba(255,142,0,0.22), 0 14px 30px rgba(0,0,0,0.4); outline: none; }
        .map-pin:hover::after, .map-pin.on::after { opacity: 1; transform: scale(1); }
        .map-readout { display: flex; align-items: center; gap: 18px; min-height: 92px; margin-top: 28px;
          padding: 20px 24px; border-radius: 10px; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09); font-size: 15px; line-height: 1.5; }
        .map-readout-logo { width: 58px; height: 58px; flex: 0 0 58px; }
        .map-hint { color: rgba(255,255,255,0.45); }
        @media (max-width: 700px) {
          .map-readout { flex-direction: column; text-align: center; gap: 12px; }
          .map-pin { width: 9%; }
        }

        /* ---- Intro splash: a body of water that drains downward ---- */
        .splash { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(180deg, ${COLORS.dagat} 0%, ${COLORS.hiraya} 55%, #00143f 100%);
          animation: splashDrain 1.6s cubic-bezier(0.76,0,0.24,1) 3.2s forwards; will-change: transform; }
        .splash-surface { position: absolute; left: 0; right: 0; top: -1px; height: 120px; transform: translateY(-100%);
          overflow: hidden; pointer-events: none; }
        .splash-surface svg { position: absolute; bottom: 0; left: 0; width: 200%; height: 100%; }
        .splash-surface .w1 { animation: splashWave 5s linear infinite; }
        .splash-surface .w2 { animation: splashWave 3.4s linear infinite reverse; opacity: 0.55; }
        .splash-mark { position: relative; display: flex; flex-direction: column; align-items: center; gap: 18px;
          animation: splashMark 1.5s cubic-bezier(0.22,1,0.36,1) both; }
        .splash-mark img { width: clamp(170px, 26vw, 300px); filter: drop-shadow(0 20px 40px rgba(0,0,0,0.45));
          animation: splashBob 2.6s ease-in-out 0.4s infinite; }
        .ripple { position: absolute; top: 50%; left: 50%; width: 320px; height: 320px; margin: -160px 0 0 -160px;
          border-radius: 50%; border: 2px solid rgba(120,240,255,0.7); box-shadow: 0 0 18px rgba(120,240,255,0.25); transform: scale(0.3); opacity: 0;
          animation: rippleOut 2.2s ease-out infinite; pointer-events: none; }
        .ripple.r2 { animation-delay: 0.7s; }
        .ripple.r3 { animation-delay: 1.4s; }
        @keyframes splashMark { from { opacity: 0; transform: scale(0.82) translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes splashBob { 0%, 100% { transform: translateY(0) rotate(-1.5deg); } 50% { transform: translateY(-9px) rotate(1.5deg); } }
        @keyframes rippleOut { from { transform: scale(0.3); opacity: 0.9; } to { transform: scale(2.6); opacity: 0; } }
        @keyframes splashWave { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes splashDrain { to { transform: translateY(112%); } }

        /* Underwater atmosphere: sunlight through the surface and drifting caustics */
        .splash-light { position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 55% 45% at 50% -8%, rgba(150,235,255,0.42) 0%, rgba(90,200,255,0.14) 40%, transparent 70%),
            linear-gradient(180deg, transparent 55%, rgba(0,8,30,0.55) 100%); }
        .splash-caustics { position: absolute; inset: -20%; pointer-events: none; opacity: 0.55; mix-blend-mode: screen;
          background-image:
            radial-gradient(ellipse 18% 9% at 30% 25%, rgba(170,240,255,0.55), transparent 70%),
            radial-gradient(ellipse 14% 7% at 70% 18%, rgba(170,240,255,0.45), transparent 70%),
            radial-gradient(ellipse 22% 10% at 55% 40%, rgba(120,220,255,0.35), transparent 70%),
            radial-gradient(ellipse 16% 8% at 15% 50%, rgba(170,240,255,0.40), transparent 70%),
            radial-gradient(ellipse 20% 9% at 85% 55%, rgba(120,220,255,0.35), transparent 70%);
          animation: causticDrift 7s ease-in-out infinite alternate; }
        .splash-caustics.c2 { opacity: 0.35; animation-duration: 9.5s; animation-direction: alternate-reverse;
          background-position: 40% 60%; }
        @keyframes causticDrift { from { transform: translate(-3%, -2%) scale(1); } to { transform: translate(3%, 3%) scale(1.06); } }

        /* Bubbles: real spheres with a highlight, rising in wobbling columns */
        .bubble { position: absolute; bottom: -30px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle at 32% 30%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 22%, rgba(180,235,255,0.10) 60%, rgba(255,255,255,0.0) 100%);
          box-shadow: inset 0 0 6px rgba(255,255,255,0.45), 0 0 10px rgba(140,225,255,0.25);
          border: 1px solid rgba(220,250,255,0.55);
          animation: bubbleUp var(--dur, 4s) ease-in var(--delay, 0s) infinite; }
        .b1  { left: 12%; width: 16px; height: 16px; --dur: 4.2s; --delay: 0.1s; }
        .b2  { left: 17%; width: 9px;  height: 9px;  --dur: 3.4s; --delay: 1.1s; }
        .b3  { left: 22%; width: 22px; height: 22px; --dur: 5.0s; --delay: 0.5s; }
        .b4  { left: 33%; width: 11px; height: 11px; --dur: 3.8s; --delay: 1.8s; }
        .b5  { left: 46%; width: 7px;  height: 7px;  --dur: 3.1s; --delay: 0.8s; }
        .b6  { left: 58%; width: 13px; height: 13px; --dur: 4.4s; --delay: 2.1s; }
        .b7  { left: 69%; width: 18px; height: 18px; --dur: 4.9s; --delay: 0.3s; }
        .b8  { left: 77%; width: 8px;  height: 8px;  --dur: 3.3s; --delay: 1.5s; }
        .b9  { left: 84%; width: 24px; height: 24px; --dur: 5.4s; --delay: 0.9s; }
        .b10 { left: 91%; width: 12px; height: 12px; --dur: 3.9s; --delay: 2.4s; }
        @keyframes bubbleUp {
          0%   { transform: translate3d(0, 0, 0) scale(0.6); opacity: 0; }
          12%  { opacity: 0.95; }
          50%  { transform: translate3d(14px, -52vh, 0) scale(1); }
          100% { transform: translate3d(-10px, -108vh, 0) scale(1.15); opacity: 0; }
        }
        @media (max-width: 640px) { .b2, .b4, .b6, .b8, .b10 { display: none; } }

        /* ---- Cinematic hero: photo settles from a slow push-in once the water clears ---- */
        .hero-photo { animation: heroSettle 3.2s cubic-bezier(0.22,1,0.36,1) 3.1s both; }
        @keyframes heroSettle { from { scale: 1.34; } to { scale: 1; } }
        .hero-copy { animation: fadeUp 1.2s cubic-bezier(0.22,1,0.36,1) 4.0s both; }

        /* ---- Water-cut section edges ---- */
        .wave-edge { display: block; width: 100%; height: clamp(38px, 6vw, 84px); line-height: 0; }
        .wave-edge svg { width: 100%; height: 100%; display: block; }

        /* Reduced motion: only the large hero push-in is suppressed. */
        @media (prefers-reduced-motion: reduce) { .hero-photo { animation: none; } }

        .stat-row { display: grid; grid-template-columns: repeat(4, auto); gap: 64px; justify-content: start; }
        @media (max-width: 860px) { .stat-row { grid-template-columns: repeat(2, 1fr); gap: 36px 28px; } }

        /* ---- Motion system: scroll reveal, 3D tilt, depth ---- */
        .reveal { opacity: 0; transform: translateY(34px) scale(0.985); }
        .reveal.is-in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: no-preference) {
          .reveal { transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1); will-change: opacity, transform; }
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal { transform: none; transition: opacity 0.6s ease; }
        }

        .tilt-scene { perspective: 1100px; }
        .tilt { transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease; transform-style: preserve-3d; will-change: transform; }
        .tilt-scene:hover .tilt { transition-duration: 0.12s; }

        .lift { transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.45s ease; }
        .lift:hover { transform: translateY(-10px); box-shadow: 0 26px 54px rgba(0,35,123,0.22); }

        .gallery-tile { transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease; }
        .gallery-tile:hover { transform: translateY(-8px) scale(1.015); box-shadow: 0 28px 56px rgba(0,0,0,0.42); z-index: 3; }
        .cta-mascot { transition: opacity 0.3s; }
        @media (max-width: 1000px) {
          .cta-mascot:nth-of-type(2), .cta-mascot:nth-of-type(3) { display: none; }
          .cta-mascot { opacity: 0.5 !important; height: clamp(100px, 20vw, 150px) !important; }
        }
        @media (max-width: 640px) {
          .cta-mascot { display: none; }
        }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        /* For short lists: collapse empty tracks, cap card width, centre the row */
        .grid-cards--center { grid-template-columns: repeat(auto-fit, minmax(280px, 360px)); justify-content: center; }

        /* ---- Rates: ticket cards ---- */
        .avp-band { background: #050d1f; line-height: 0; }
        .avp-frame { position: relative; margin: 0 auto; overflow: hidden; background: #050d1f; }
        .avp-landscape .avp-frame { width: 100%; aspect-ratio: 16 / 9; max-height: 92vh; }
        /* Upright: the whole 9:16 frame on a phone; on an upright tablet, as
           tall as the screen allows and centred. */
        .avp-portrait .avp-frame { width: min(100%, calc(100svh * 9 / 16)); aspect-ratio: 9 / 16; }
        .avp-video { width: 100%; height: 100%; object-fit: cover; display: block; }
        /* Bottom-left: the bottom-right corner belongs to the back-to-top button. */
        .avp-toggle { position: absolute; left: 16px; bottom: 16px; width: 42px; height: 42px; border-radius: 50%; border: 0; cursor: pointer;
          display: flex; align-items: center; justify-content: center; color: #fff; background: rgba(5,13,31,0.55);
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); box-shadow: 0 0 0 1px rgba(255,255,255,0.25); transition: background .2s; }
        .avp-toggle:hover { background: rgba(5,13,31,0.8); }
        .avp-toggle:focus-visible { outline: 2px solid ${COLORS.orange}; outline-offset: 3px; }
        .ticket-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .season-switch { display: flex; justify-content: center; gap: 0; width: max-content; max-width: 100%; margin: -16px auto 26px;
          padding: 5px; border-radius: 999px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); }
        .season-switch button { display: flex; flex-direction: column; align-items: center; gap: 1px; min-width: 168px; padding: 9px 22px 10px;
          border: 0; border-radius: 999px; background: transparent; color: rgba(255,255,255,0.62); cursor: pointer; font: inherit; transition: background .2s, color .2s; }
        .season-switch button:hover { color: #fff; }
        .season-switch button[aria-pressed="true"] { background: ${COLORS.orange}; color: #fff; }
        .season-name { display: inline-flex; align-items: center; gap: 7px; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 16px; }
        .season-now { font-family: 'Kanit', sans-serif; font-size: 9.5px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase;
          padding: 2px 7px; border-radius: 999px; background: rgba(255,255,255,0.16); }
        .season-dates { font-family: 'Kanit', sans-serif; font-size: 11px; letter-spacing: 0.6px; opacity: 0.85; }
        .ticket { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px 24px 22px;
          display: flex; flex-direction: column; gap: 20px; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, background 0.3s; }
        .ticket:hover { transform: translateY(-6px); border-color: ${COLORS.orange}88; background: rgba(255,255,255,0.08); }
        .ticket-name { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 22px; color: #fff; letter-spacing: -0.3px; }
        .ticket-note { font-size: 12.5px; color: rgba(255,255,255,0.5); margin-top: 4px; line-height: 1.4; }
        .ticket-prices { display: grid; gap: 12px; margin-top: auto; }
        .ticket-prices > div, .ticket-free { display: flex; flex-direction: column; gap: 2px; }
        .ticket-free { margin-top: auto; }
        .ticket-when { font-family: 'Kanit', sans-serif; font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase; color: rgba(255,255,255,0.45); }
        .ticket-price { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 30px; color: #fff; line-height: 1; font-variant-numeric: tabular-nums; }
        .ticket-prices > div:first-child .ticket-price { color: ${COLORS.orange}; }
        .ticket-free .ticket-price { color: ${COLORS.azure}; }
        .promo-callout { display: flex; align-items: center; gap: 24px; margin-top: 20px; padding: 24px 28px; border-radius: 12px;
          background: linear-gradient(135deg, rgba(255,142,0,0.18) 0%, rgba(255,142,0,0.06) 100%); border: 1px solid rgba(255,142,0,0.4); }
        .promo-badge-sub { display: block; font-family: 'Kanit', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
        .promo-badge { flex: 0 0 auto; text-align: center; line-height: 0.95; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 900; font-size: 34px; color: ${COLORS.orange}; letter-spacing: -1px;
          padding: 12px 20px; border-radius: 10px; background: rgba(255,142,0,0.14); white-space: nowrap; }
        .promo-title { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 19px; color: #fff; margin-bottom: 6px; }
        .promo-text { margin: 0; font-size: 14px; color: rgba(255,255,255,0.68); line-height: 1.65; }
        .promo-link { background: none; border: 0; padding: 0; font: inherit; color: ${COLORS.orange}; font-weight: 700; cursor: pointer; text-decoration: underline; margin: 0 4px; }
        @media (max-width: 960px) { .ticket-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px) { .season-switch { width: 100%; } .season-switch button { flex: 1 1 0; min-width: 0; padding: 9px 8px 10px; }
          .ticket-grid { grid-template-columns: 1fr; } .promo-callout { flex-direction: column; align-items: flex-start; } }

        /* ---- Find Us: address card, hours, contact ---- */
        .findus-map { display: flex; align-items: center; gap: 16px; padding: 18px 20px; border-radius: 12px; text-decoration: none;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, background 0.3s; }
        .findus-map:hover { transform: translateY(-3px); border-color: ${COLORS.orange}88; background: rgba(255,255,255,0.08); }
        .findus-pin { width: 44px; height: 44px; border-radius: 10px; background: ${COLORS.orange}; color: #fff; display: flex; align-items: center; justify-content: center; flex: 0 0 44px; }
        .findus-cta { font-family: 'Kanit', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 1.2px; text-transform: uppercase; color: ${COLORS.orange}; white-space: nowrap; }
        .findus-hours { margin-top: 16px; padding: 18px 20px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .hours-row { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.07); font-size: 14.5px; color: rgba(255,255,255,0.75); }
        .hours-row b { color: #fff; font-weight: 600; font-variant-numeric: tabular-nums; }
        .hours-row.muted, .hours-row.muted b { color: rgba(255,255,255,0.4); }
        .hours-row:last-of-type { border-bottom: 0; }
        .findus-foot { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-top: 22px; flex-wrap: wrap; }
        .findus-email { color: #fff; font-weight: 600; font-size: 15px; text-decoration: none; }
        .findus-email:hover { color: ${COLORS.azure}; }
        .social-dot { width: 42px; height: 42px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; border: 1px solid;
          box-shadow: 0 6px 14px rgba(0,0,0,0.25); transition: transform 0.25s cubic-bezier(.2,.8,.2,1), background 0.25s, box-shadow 0.25s; }
        .social-dot:hover { transform: translateY(-4px) scale(1.08); background: var(--accent) !important; box-shadow: 0 12px 26px rgba(0,0,0,0.35); }
        @media (max-width: 520px) { .findus-cta { display: none; } }

        /* ---- Dining & retail logo slot ---- */
        .venue-logo-slot { height: 72px; display: flex; align-items: center; margin-bottom: 20px; }
        .venue-logo-placeholder { height: 72px; width: 72px; border-radius: 12px; border: 1.5px dashed; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-family: 'Kanit', sans-serif; font-size: 9px; letter-spacing: 1.2px; text-transform: uppercase; background: rgba(255,255,255,0.04); }

        /* ---- Inquiry form ---- */
        .inq-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 15px 18px; color: #fff; font-size: 15px; font-family: 'Montserrat', sans-serif; outline: none; transition: border-color 0.2s, background 0.2s; }
        .inq-input:focus { border-color: ${COLORS.orange}; background: rgba(255,255,255,0.08); }
        .inq-input::placeholder { color: rgba(255,255,255,0.4); }
        .inq-input[type="date"] { color-scheme: dark; }
        .inq-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .inq-label { display: grid; gap: 6px; font-family: 'Kanit', sans-serif; font-size: 11px; letter-spacing: 1.6px; text-transform: uppercase; color: rgba(255,255,255,0.5); }
        .inq-label em { font-style: normal; text-transform: none; letter-spacing: 0; font-family: 'Montserrat', sans-serif; color: rgba(255,255,255,0.4); }
        .inq-warn { font-family: 'Montserrat', sans-serif; text-transform: none; letter-spacing: 0; font-size: 12px; color: ${COLORS.orange}; }
        @media (max-width: 600px) { .inq-row { grid-template-columns: 1fr; } }

        /* ---- Coming Soon mark on the surf-ride card ---- */
        .coming-soon-mark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 2; }
        .coming-soon-ring { position: absolute; width: 150px; height: 150px; border-radius: 50%; border: 2px dashed rgba(255,255,255,0.55); animation: spin-slow 24s linear infinite; }
        .coming-soon-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 7px; }
        /* Stand-in monogram until the real ride logo is delivered. Drop the
           mark from the data and this collapses back to the plain ring. */
        .coming-soon-mono { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 900; font-size: 56px; line-height: 0.9; color: #fff; letter-spacing: 1px; text-shadow: 0 6px 20px rgba(0,0,0,0.45); }
        .coming-soon-text { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 12px; line-height: 1; text-align: center; color: #fff; text-transform: uppercase; letter-spacing: 2.4px; text-shadow: 0 4px 16px rgba(0,0,0,0.4); }

        /* ---- Guide + open-days calendar ---- */
        .guide-grid { display: grid; grid-template-columns: minmax(300px, 420px) 1fr; gap: 24px; align-items: start; }
        .guide-card { background: #f4f7ff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 28px; }
        .rules-card { margin-top: 24px; }
        .rules-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .rule { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; }
        /* A red "no" ring over the icon, drawn in CSS so the twelve icons stay
           plain emoji and need no image files. */
        .rule-icon { position: relative; flex: 0 0 46px; width: 46px; height: 46px; border-radius: 50%; border: 3px solid #d62828;
          display: flex; align-items: center; justify-content: center; background: #fff5f5; color: ${COLORS.hiraya}; }
        .rule-icon::after { content: ""; position: absolute; left: 50%; top: 50%; width: 3px; height: 100%; background: #d62828;
          border-radius: 2px; transform: translate(-50%, -50%) rotate(-45deg); }
        .rule-label { font-family: 'Montserrat', sans-serif; font-size: 13.5px; font-weight: 600; color: ${COLORS.hiraya}; line-height: 1.35; }
        .rules-bring { display: flex; align-items: center; gap: 12px; margin: 20px 0 0; padding: 14px 18px; border-radius: 10px;
          background: ${COLORS.orange}14; border: 1px solid ${COLORS.orange}40; font-family: 'Montserrat', sans-serif;
          font-size: 14px; font-weight: 600; font-style: italic; color: #7a3d00; line-height: 1.5; }
        .rules-bring > svg { flex: 0 0 22px; color: ${COLORS.orange}; }
        .route-list { display: grid; gap: 18px; }
        .route { display: grid; grid-template-columns: 40px 1fr; gap: 14px; align-items: start; }
        .route-icon { width: 40px; height: 40px; border-radius: 10px; background: #fff; border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .route strong { display: block; color: ${COLORS.hiraya}; font-size: 15px; margin-bottom: 6px; }
        .route-time { font-family: 'Kanit', sans-serif; font-weight: 600; font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: ${COLORS.orange}; margin-left: 8px; }
        .route ol { margin: 0; padding-left: 18px; color: #55566a; font-size: 14px; line-height: 1.65; }
        .route ol li + li { margin-top: 4px; }
        .route p { margin: 0; color: #55566a; font-size: 14px; line-height: 1.65; }
        .route b { color: ${COLORS.hiraya}; font-weight: 600; }
        .route-note { font-size: 12px !important; color: #9a5300 !important; margin-top: 8px !important; }
        .cal { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
        .cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .cal-title { font-family: 'Kanit', sans-serif; font-weight: 600; font-size: 14px; color: ${COLORS.hiraya}; letter-spacing: 0.5px; }
        .cal-nav { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e5e7eb; background: #fff; color: ${COLORS.hiraya}; font-size: 20px; line-height: 1; cursor: pointer; }
        .cal-nav:hover { background: #f4f7ff; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .cal-dow { text-align: center; font-family: 'Kanit', sans-serif; font-size: 10px; letter-spacing: 1px; color: #7a819a; padding: 4px 0 6px; }
        .cal-day { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 13px; font-weight: 600; color: #b4bacb; background: #f4f6fb; font-variant-numeric: tabular-nums; }
        .cal-day.open { background: ${COLORS.orange}; color: #fff; }
        .cal-day.past { opacity: 0.38; }
        .cal-day.today { box-shadow: inset 0 0 0 2px ${COLORS.hiraya}; }
        /* A day shut against the weekly pattern. Hatched rather than simply
           grey, so it reads as "something changed here" at a glance and is
           still distinguishable in print or for a colourblind reader, who
           would otherwise see two identical grey squares. */
        .cal-day.shut {
          background: repeating-linear-gradient(135deg, #f4f6fb, #f4f6fb 3px, #e0e4ef 3px, #e0e4ef 6px);
          color: #8d93a6;
          box-shadow: inset 0 0 0 1px #d4d9e6;
        }
        .cal-changes { list-style: none; margin: 12px 0 0; padding: 0; font-size: 12.5px; color: #55566a; line-height: 1.7; }
        .cal-changes li { padding-left: 14px; position: relative; }
        .cal-changes li::before { content: "·"; position: absolute; left: 4px; }
        .cal-changes b { color: #1b2340; }
        .cal-legend { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 12px; color: #55566a; flex-wrap: wrap; }
        .cal-legend .cal-swatch.shut {
          background: repeating-linear-gradient(135deg, #f4f6fb, #f4f6fb 3px, #e0e4ef 3px, #e0e4ef 6px);
          box-shadow: inset 0 0 0 1px #d4d9e6;
        }
        .cal-swatch { display: inline-block; width: 14px; height: 14px; border-radius: 4px; background: #f4f6fb; border: 1px solid #e5e7eb; }
        .cal-swatch.open { background: ${COLORS.orange}; border-color: ${COLORS.orange}; }
        .cal-legend .cal-swatch:not(:first-child) { margin-left: 10px; }
        @media (max-width: 820px) { .guide-grid { grid-template-columns: 1fr; } }
        @media (max-width: 1000px) { .rules-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 720px) { .rules-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 420px) { .rules-grid { gap: 8px; } .rule { flex-direction: column; text-align: center; gap: 10px; padding: 14px 10px; } .rule-label { font-size: 12.5px; } }

        .carousel-3d-wrap { position: relative; perspective: 1600px; padding: 0; }
        .carousel-3d-stage { position: relative; height: clamp(380px, 44vw, 500px); transform-style: preserve-3d; display: flex; align-items: center; justify-content: center; }
        .carousel-3d-card { position: absolute; top: 50%; left: 50%; width: clamp(300px, 38vw, 460px); height: auto; transform-style: preserve-3d; transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease, box-shadow 0.6s ease; box-shadow: 0 30px 60px rgba(0,35,123,0.18); will-change: transform, opacity; }
        .carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%); z-index: 20; width: 52px; height: 52px; border-radius: 999px; border: none; background: #fff; color: ${COLORS.hiraya}; font-size: 30px; font-weight: 700; line-height: 1; cursor: pointer; box-shadow: 0 10px 28px rgba(0,35,123,0.22); display: flex; align-items: center; justify-content: center; transition: transform 0.2s, background 0.2s, color 0.2s; }
        .carousel-arrow:hover { background: ${COLORS.orange}; color: #fff; transform: translateY(-50%) scale(1.1); }
        .carousel-dots { display: flex; justify-content: center; gap: 10px; margin-top: 24px; }
        .carousel-dot { width: 10px; height: 10px; border-radius: 999px; border: none; background: rgba(0,35,123,0.2); cursor: pointer; padding: 0; transition: background 0.3s, transform 0.3s, width 0.3s; }
        .carousel-dot.active { background: ${COLORS.orange}; width: 28px; }
        .nav-desktop { display: flex; gap: 26px; align-items: center; margin-left: 48px; }
        .nav-sheet-foot { display: none; }
        .nav-mobile-toggle { display: none; }
        .section-pad { padding: 120px 6%; }

        @media (max-width: 1120px) {
          .grid-2 { grid-template-columns: 1fr; gap: 48px; }
          /* Full-bleed sheet: fixed to the viewport so the nav's 6% padding
             can't inset it, and tall enough to read as a real menu. */
          .nav-desktop {
            display: ${navOpen ? "flex" : "none"};
            position: fixed; top: 70px; left: 0; right: 0; bottom: 0;
            flex-direction: column; align-items: stretch;
            margin-left: 0; gap: 0; padding: 6px 0 40px;
            background-image:
              linear-gradient(180deg, rgba(0,22,66,0.90) 0%, rgba(0,14,42,0.96) 55%, rgba(0,10,32,0.99) 100%),
              url('/photos/hero-aerial.webp');
            background-size: cover;
            background-position: center;
            border-top: 1px solid rgba(255,255,255,0.12);
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            animation: sheetIn 0.26s cubic-bezier(0.22,1,0.36,1);
          }
          @keyframes sheetIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
          .nav-desktop .nav-link {
            display: flex; align-items: center; justify-content: space-between;
            min-height: 58px; padding: 0 7%;
            font-size: 15px; letter-spacing: 1.6px;
            border-bottom: 1px solid rgba(255,255,255,0.07);
          }
          .nav-desktop .nav-link:active { background: rgba(255,255,255,0.07); }
          .nav-sheet-foot { display: block; margin-top: auto; padding: 30px 7% 8px; }
          .nav-sheet-meta { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 26px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,0.1); }
          .nav-desktop .nav-link sup {
            font-size: 9px !important; letter-spacing: 1px; margin-left: 0 !important;
            background: rgba(255,142,0,0.16); color: ${COLORS.orange};
            padding: 4px 9px; border-radius: 3px; vertical-align: middle;
          }
          .nav-mobile-toggle { display: block; background: transparent; border: none; color: #fff; font-size: 22px; cursor: pointer; }
          .section-pad { padding: 80px 6%; }
          #gallery .section-pad { padding: 80px 6%; }
          [id="gallery"] > div > div:last-child { grid-template-columns: 1fr 1fr !important; grid-auto-rows: 150px !important; }
          [id="gallery"] > div > div:last-child > div { grid-column: span 1 !important; grid-row: span 1 !important; }
        }

        /* Phones: the carousel card is taller than it is wide, so it needs real room
           and the arrows have to move out from under the text. */
        @media (max-width: 760px) {
          .carousel-3d-stage { height: auto; min-height: 640px; padding: 16px 0 84px; }
          .carousel-3d-card { width: 78vw; }
          .carousel-3d-card .card-body { padding: 24px; }
          .carousel-arrow { width: 46px; height: 46px; font-size: 26px; top: auto; bottom: 6px; transform: none; }
          .carousel-arrow:hover { transform: scale(1.08); }
          .carousel-dots { margin-top: 8px; }
        }

        /* The slides sit on the right of the band photo. A narrow screen crops
           the centre, which is just walkway — shift the crop so they stay in frame. */
        @media (max-width: 860px) { .band-photo { object-position: 76% center; } }

        .to-top {
          position: fixed; right: 22px; bottom: 22px; z-index: 90;
          width: 46px; height: 46px; border-radius: 999px; border: none;
          display: flex; align-items: center; justify-content: center;
          background: ${COLORS.orange}; color: #fff; cursor: pointer;
          box-shadow: 0 6px 20px rgba(0,0,0,0.22);
          opacity: 0; visibility: hidden; transform: translateY(8px);
          transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s;
        }
        .to-top.is-on { opacity: 1; visibility: visible; transform: none; }
        .to-top:hover { background: ${COLORS.sunset}; }
        .to-top:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
        @media (max-width: 760px) { .to-top { right: 16px; bottom: 16px; width: 44px; height: 44px; } }
        @media (prefers-reduced-motion: reduce) { .to-top { transition: opacity 0.15s ease, visibility 0.15s; transform: none; } }

        /* ---- Stat figures, each one a jump to the section it counts ---- */
        /* Must stay after .reveal: the button reset would otherwise undo it. */
        .stat-link { display: block; text-align: left; background: none; border: none;
          padding: 0; margin: 0; font: inherit; color: inherit; cursor: pointer;
          -webkit-tap-highlight-color: transparent; }
        .stat-num { display: block; font-size: clamp(44px, 6vw, 76px); font-weight: 900;
          color: #fff; line-height: 0.9; letter-spacing: -2px;
          transition: color 0.22s ease; }
        .stat-label { display: block; margin-top: 10px; font-size: 10px;
          color: rgba(255,255,255,0.7); transition: color 0.22s ease; }
        .stat-link:hover .stat-num { color: ${COLORS.orange}; }
        .stat-link:hover .stat-label { color: #fff; }
        /* The underline only appears on hover, so the figures still read as a
           row of statistics rather than a row of links. */
        .stat-link:hover .stat-label { text-decoration: underline; text-underline-offset: 4px; }
        .stat-link:focus-visible { outline: 3px solid ${COLORS.orange}; outline-offset: 6px; border-radius: 4px; }

        /* ---- The seasonal layer ---- */
        /* Decoration only, and it says so: the snow is aria-hidden and sits
           behind the hero copy, where it can never swallow a tap meant for
           the buttons. */
        .snow { position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; }
        .flake { position: absolute; top: -40px; display: block; color: #fff;
          animation: snowfall var(--dur) linear var(--delay) infinite;
          will-change: transform, opacity; }
        .flake:nth-child(3n) { color: ${COLORS.janjan}; }
        .flake:nth-child(5n) { color: ${COLORS.azure}; }
        /* The hero is 100vh but never shorter than 640px, so the fall has to
           clear whichever of the two is taller or flakes pile up mid-screen. */
        @keyframes snowfall {
          0%   { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
          8%   { opacity: var(--fade); }
          88%  { opacity: var(--fade); }
          100% { transform: translate3d(var(--drift), max(112vh, 760px), 0) rotate(300deg); opacity: 0; }
        }
        .sparkle { position: absolute; color: ${GOLD}; animation: twinkle 3.2s ease-in-out infinite; }
        @keyframes twinkle { 0%, 100% { opacity: 0.25; transform: scale(0.7) rotate(0deg); } 50% { opacity: 1; transform: scale(1.15) rotate(18deg); } }
        .garland { position: absolute; top: 62px; left: 0; width: 100%; height: 64px; z-index: 1; pointer-events: none; }
        .bulb { animation: bulb-glow 2.4s ease-in-out infinite; }
        .bulb:nth-of-type(2n) { animation-delay: 0.8s; }
        .bulb:nth-of-type(3n) { animation-delay: 1.6s; }
        @keyframes bulb-glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        .xmas-script { font-family: 'Kaushan Script', 'Brush Script MT', cursive; font-weight: 400; line-height: 1; }
        .xmas-hello { display: inline-flex; align-items: center; gap: 14px; margin: 0 auto 6px;
          font-size: clamp(30px, 3.9vw, 56px); color: ${GOLD}; transform: rotate(-3deg);
          text-shadow: 0 4px 0 rgba(0,16,50,0.35), 0 10px 30px rgba(0,10,40,0.6); }
        .xmas-hello svg { color: ${COLORS.janjan}; flex: 0 0 auto; filter: drop-shadow(0 2px 6px rgba(0,10,40,0.5)); }

        /* ---- The holiday band: the season's artwork, rebuilt for a screen ---- */
        .xmas-band { position: relative; overflow: hidden; background: #0B1A6E; color: #fff;
          padding: clamp(56px, 7vw, 96px) 6% clamp(130px, 15vw, 190px); }
        .xmas-band::before { content: ""; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(255,255,255,0.14) 2px, transparent 3px), radial-gradient(rgba(255,255,255,0.08) 4px, transparent 5px);
          background-size: 170px 190px, 310px 270px; background-position: 30px 40px, 120px 150px; }
        .xmas-band-inner { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto;
          display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); gap: 40px; align-items: center; }
        .xmas-happy { display: block; font-family: Georgia, 'Times New Roman', serif; font-weight: 400; font-size: clamp(20px, 2.6vw, 38px);
          letter-spacing: 3px; color: ${COLORS.orange}; text-align: right; margin: 0 8% -0.35em 0; }
        .xmas-title { margin: 0 0 26px; transform: rotate(-4deg); transform-origin: left center; display: inline-block; }
        .xmas-title .xmas-script { display: block; font-size: clamp(76px, 11.5vw, 176px); color: ${COLORS.orange};
          letter-spacing: 0; text-shadow: 0 6px 0 rgba(0,0,0,0.12); padding-right: 0.12em; }
        .xmas-band h3 { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; text-transform: uppercase;
          font-size: clamp(20px, 2.3vw, 30px); letter-spacing: 0; margin: 0; }
        .xmas-band h3 { white-space: nowrap; font-size: clamp(17px, calc(2.2vw - 1px), 29px); }
        .xmas-rule { width: 150px; height: 2px; background: ${COLORS.orange}; margin: 16px 0 18px; border: 0; }
        .xmas-band p { font-family: 'Montserrat', sans-serif; font-style: italic; font-weight: 600;
          font-size: clamp(15px, 1.35vw, 18px); line-height: 1.65; margin: 0 0 22px; max-width: 520px; color: rgba(255,255,255,0.92); }
        .xmas-band p { margin-bottom: 14px; }
        .xmas-band p.xmas-lead { font-style: normal; font-weight: 800; font-size: clamp(17px, 1.6vw, 22px); color: #fff; margin-bottom: 8px; }
        .xmas-band p:last-of-type { margin-bottom: 24px; }
        .xmas-days { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 28px; padding: 0; max-width: 560px; }
        .xmas-days li { font-family: 'Kanit', sans-serif; font-weight: 600; font-size: 12.5px; letter-spacing: 0.4px;
          padding: 7px 13px; border-radius: 999px; background: rgba(255,255,255,0.09); border: 1px solid rgba(255,255,255,0.2); }
        .xmas-days b { color: ${GOLD}; font-weight: 700; margin-right: 6px; }
        .xmas-art { position: relative; justify-self: center; width: min(100%, 440px); aspect-ratio: 44 / 52; }
        .xmas-tree { position: absolute; right: 0; top: 0; width: 72%; height: auto; }
        .xmas-mascot { position: absolute; left: -8%; bottom: -2%; width: 76%; height: auto;
          filter: drop-shadow(0 14px 22px rgba(0,0,40,0.45)); animation: float 5s ease-in-out infinite; }
        .xmas-flake-deco { position: absolute; color: ${COLORS.lakandanum}; z-index: 1; }
        .xmas-waves { position: absolute; left: 0; right: 0; bottom: -2px; width: 100%; height: clamp(120px, 15vw, 210px); z-index: 1; display: block; }
        @media (prefers-reduced-motion: reduce) { .stat-num, .stat-label { transition: none; } }
        /* Falling snow is exactly the kind of drifting motion that makes some
           people ill. Asked for stillness, we keep the flakes and drop the
           fall: the hero still reads as Christmas, nothing moves. */
        @media (prefers-reduced-motion: reduce) {
          .flake { animation: none; top: var(--y); opacity: var(--fade);
            transform: none; }
          .sparkle, .bulb, .xmas-mascot { animation: none; }
        }
        @media (max-width: 860px) {
          .xmas-band-inner { grid-template-columns: 1fr; gap: 12px; }
          .xmas-art { width: min(78%, 320px); order: -1; }
          .xmas-flake-deco.wide-only { display: none; }
          .xmas-band h3 { font-size: min(22px, 3.9vw); }
          .garland { top: 58px; height: 48px; }
        }
      `}</style>

      {/* INTRO SPLASH — a pool of water that drains to reveal the park */}
      {!splashDone && (
        <div className="splash" aria-hidden="true">
          {/* Wave crest riding the top edge of the water */}
          <div className="splash-surface">
            <svg className="w1" viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path d="M0,70 C120,30 240,110 360,70 C480,30 600,110 720,70 C840,30 960,110 1080,70 C1200,30 1320,110 1440,70 L1440,120 L0,120 Z" fill={COLORS.dagat} />
            </svg>
            <svg className="w2" viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path d="M0,85 C160,50 260,115 420,80 C580,45 700,115 860,82 C1020,50 1160,115 1300,80 C1380,62 1420,75 1440,80 L1440,120 L0,120 Z" fill="#3AE1B4" />
            </svg>
          </div>
          <span className="ripple r1" /><span className="ripple r2" /><span className="ripple r3" />

          {/* Underwater light and drifting caustics */}
          <div className="splash-light" />
          <div className="splash-caustics" />
          <div className="splash-caustics c2" />

          {/* Bubbles rising through the pool */}
          {["b1","b2","b3","b4","b5","b6","b7","b8","b9","b10"].map((b) => <span key={b} className={`bubble ${b}`} />)}

          <div className="splash-mark">
            <img src="/brand/emblem-full.webp" alt="" />
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(0,35,123,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(18px)" : "none",
        transition: "all 0.4s",
        padding: "0 6%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 70,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", zIndex: 2 }} onClick={() => scrollTo("home")}>
          <img src="/brand/emblem-full.webp" alt="Pradera Islands" style={{ height: 46, width: "auto", display: "block" }} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ color: "#fff", fontFamily: "'Kanit', sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: 1.5 }}>PRADERA ISLANDS</span>
            <span style={{ color: COLORS.azure, fontFamily: "'Kanit', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: 4, marginTop: 2 }}>WATERPARK</span>
          </div>
        </div>

        <div className="nav-desktop">
          {navItems.map(({ id, label, soon }) => (
            <span key={id} className="nav-link"
              onClick={() => { if (soon) { alert(`${label} — coming soon!`); setNavOpen(false); } else { scrollTo(id); } }}
              title={soon ? "Coming soon" : ""}
              style={{ color: activeSection === id ? COLORS.orange : "#fff", opacity: soon ? 0.75 : 1 }}>
              {label}{soon && <sup style={{ fontSize: 7, marginLeft: 3, color: COLORS.orange, opacity: 0.9, letterSpacing: 0.5 }}>SOON</sup>}
            </span>
          ))}

          {/* Mobile sheet footer — gives the menu a purpose instead of dead space */}
          <div className="nav-sheet-foot">
            <a
              className="btn-primary"
              href={TICKETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: COLORS.orange, width: "100%", padding: "17px 24px", textDecoration: "none", display: "block", textAlign: "center", boxSizing: "border-box" }}
              onClick={() => setNavOpen(false)}
            >
              Buy Tickets
            </a>
            <div className="nav-sheet-meta">
              <div>
                <span className="eyebrow" style={{ color: "rgba(255,255,255,0.45)", fontSize: 9 }}>Location</span>
                <p style={{ color: "#fff", fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>
                  Prado Siongco, Lubao<br />Pampanga
                </p>
                {CONTACT_PHONE && (
                  <a href={telHref(CONTACT_PHONE)} style={{ display: "inline-block", color: "#fff", fontSize: 13, fontWeight: 600, margin: "10px 0 0", textDecoration: "none" }}>
                    {CONTACT_PHONE}
                    <span style={{ display: "block", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 400 }}>During park hours</span>
                  </a>
                )}
              </div>
              <img src="/brand/emblem-full.webp" alt="" style={{ width: 46, height: 46, opacity: 0.85 }} />
            </div>
          </div>
        </div>

        <button className="nav-mobile-toggle" onClick={() => setNavOpen(!navOpen)} aria-label="Toggle menu">
          {navOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* HERO */}
      <section id="home" style={{
        height: "100vh",
        minHeight: 640,
        background: GRADIENTS.hero,
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {/* Real park photo backdrop */}
        <img
          className="hero-photo"
          src="/photos/hero-aerial.webp"
          alt="Aerial view of Pradera Islands Waterpark at golden hour"
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            width: "100%", height: "128%", objectFit: "cover", zIndex: 0,
            transform: `translate3d(0, ${heroShift}px, 0)`,
            willChange: "transform",
          }}
        />
        {/* Brand gradient wash over the photo for text legibility */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: `linear-gradient(180deg, rgba(0,20,60,0.58) 0%, rgba(0,30,95,0.30) 38%, rgba(0,35,123,0.55) 72%, rgba(0,35,123,0.88) 100%)`,
        }} />
        {/* Centre vignette so the lockup reads against a busy photo */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "radial-gradient(ellipse 60% 55% at 50% 46%, rgba(0,16,50,0.52) 0%, rgba(0,16,50,0.22) 55%, transparent 78%)",
        }} />

        {/* A quiet snowfall over the photo, December to Twelfth Night. */}
        {holiday && (
          <div className="snow" aria-hidden="true">
            <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
              <defs>
                {/* One spoke, drawn three times at sixty degrees. */}
                <g id="xmas-flake" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  {[0, 60, 120].map((deg) => (
                    <g key={deg} transform={`rotate(${deg} 12 12)`}>
                      <path d="M12 2.5V21.5" />
                      <path d="M9.6 3.8 12 6.2 14.4 3.8" />
                      <path d="M9.6 20.2 12 17.8 14.4 20.2" />
                    </g>
                  ))}
                </g>
              </defs>
            </svg>
            {SPARKLES.map((k) => (
              <svg key={k.left} className="sparkle" viewBox="0 0 24 24" width={k.size} height={k.size}
                style={{ left: k.left, top: k.top, animationDelay: `${k.delay}s` }}>
                <path fill="currentColor" d="M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z" />
              </svg>
            ))}
            {SNOWFLAKES.map((f) => (
              <span key={f.left} className="flake" style={{
                left: f.left,
                "--dur": `${f.dur}s`,
                "--delay": `${f.delay}s`,
                "--drift": `${f.drift}px`,
                "--fade": f.fade,
                "--y": f.y,
              }}>
                <svg viewBox="0 0 24 24" width={f.size} height={f.size} aria-hidden="true" focusable="false">
                  <use href="#xmas-flake" />
                </svg>
              </span>
            ))}
          </div>
        )}

        {/* A string of lights under the navigation. Sliced, not stretched, so
            the bulbs stay round at every width. */}
        {holiday && (
          <svg className="garland" viewBox="0 0 2000 64" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
            <path d={`M0 8 ${LIGHT_SPANS.map((x) => `Q${x + 100} 46 ${x + 200} 8`).join(" ")}`} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" />
            {LIGHT_SPANS.flatMap((x, i) => [[40, 20.2], [100, 27], [160, 20.2]].map(([dx, y], j) => {
              const c = LIGHT_COLORS[(i * 3 + j) % LIGHT_COLORS.length];
              return (
                <g key={`${x}-${dx}`} className="bulb">
                  <rect x={x + dx - 2.5} y={y} width="5" height="5" rx="1" fill="#0B1A4A" />
                  <ellipse cx={x + dx} cy={y + 12} rx="5.5" ry="8" fill={c} style={{ filter: `drop-shadow(0 0 7px ${c})` }} />
                </g>
              );
            }))}
          </svg>
        )}

        {/* Hero content */}
        <div className="hero-copy" style={{ textAlign: "center", position: "relative", zIndex: 2, padding: "72px 6% 48px", maxWidth: 1100 }}>

          {holiday && (
            <div className="xmas-hello xmas-script">
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><use href="#xmas-flake" /></svg>
              Happy Holidays!
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><use href="#xmas-flake" /></svg>
            </div>
          )}

          <h1 style={{ margin: "0 auto 10px", lineHeight: 0 }}>
            <img
              src="/brand/pradera-islands-wordmark.webp"
              /* The h1 is this image, so its alt text is the strongest heading
                 on the page — for search engines and for anyone listening to
                 it read aloud. Worth the full name and the place. */
              alt="Pradera Islands Waterpark — Lubao, Pampanga"
              style={{
                width: "clamp(265px, 50vw, 560px)",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
          </h1>
          <svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid meet" style={{ width: "clamp(292px, 57vw, 632px)", height: "auto", display: "block", margin: "0 auto 30px" }} aria-label="Waterpark">
            <defs>
              <mask id="wp-mask" maskUnits="userSpaceOnUse" x="-24" y="-24" width="948" height="188">
                <rect x="-24" y="-24" width="948" height="188" fill="black" />
                <text x="450" y="108" textAnchor="middle" fontSize="122" fontWeight="900" fontFamily="Kanit, sans-serif" letterSpacing="6" fill="white" style={{ textTransform: "uppercase" }}>WATERPARK</text>
              </mask>
              <linearGradient id="wp-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0AD2F0" />
                <stop offset="60%" stopColor="#0EB0C0" />
                <stop offset="100%" stopColor="#0021E8" />
              </linearGradient>
            </defs>
            <g mask="url(#wp-mask)">
              <rect width="900" height="140" fill="url(#wp-grad)" />
              <g className="wp-wave-1">
                <path d="M-300,50 C0,10 200,90 500,50 C800,10 1000,90 1300,50 L1300,160 L-300,160 Z" fill="rgba(255,255,255,0.35)" />
              </g>
              <g className="wp-wave-2">
                <path d="M-300,80 C100,40 300,110 600,75 C900,45 1100,110 1300,80 L1300,160 L-300,160 Z" fill="rgba(255,255,255,0.5)" />
              </g>
              <g className="wp-wave-3">
                <path d="M-300,110 C150,85 350,125 650,100 C950,80 1100,120 1300,105 L1300,160 L-300,160 Z" fill="rgba(255,255,255,0.65)" />
              </g>
            </g>
          </svg>

          <p className="body" style={{
            fontSize: "clamp(14px, 1.6vw, 17px)", lineHeight: 1.6, color: "rgba(255,255,255,0.88)", maxWidth: 580, margin: "0 auto 26px",
          }}>
            Create unforgettable memories<br />and enjoy a refreshing waterpark adventure.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a className="btn-primary" href={TICKETS_URL} target="_blank" rel="noopener noreferrer" style={{ background: COLORS.orange, boxShadow: "0 12px 32px rgba(255,142,0,0.45)", textDecoration: "none", display: "inline-block" }}>Buy Tickets</a>
            <button className="btn-ghost" onClick={() => scrollTo("visit")}>Park Hours</button>
          </div>
        </div>

      </section>

      {/* The AVP sits directly under the hero: the first scroll shows the park
          moving, and on a phone it is one screen down rather than five. */}
      <AvpBand />

      {holiday && <HolidayBand schedule={schedule} onSeeDays={() => scrollTo("guide")} />}

      {/* BRAND STORY */}
      <section className="section-pad" style={{ background: "#fff", position: "relative", overflow: "hidden" }}>

        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
          <div className="grid-2">
            <div>
              <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 16 }}>Our Story</div>
              <h2 className="display" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, lineHeight: 0.95, textTransform: "uppercase", marginBottom: 28, color: COLORS.hiraya }}>
                Where Fun
                <span style={{ color: COLORS.dagat, display: "block" }}>Flows</span>
              </h2>
              <p className="body" style={{ fontSize: 17, color: "#3a3a4a", marginBottom: 20 }}>
                At Pradera Islands Waterpark, <strong style={{ color: COLORS.hiraya }}>the rush of being together becomes something we can jump into</strong>.
              </p>
              <p className="body" style={{ fontSize: 17, color: "#3a3a4a", marginBottom: 20 }}>
                Built on the <strong style={{ color: COLORS.hiraya }}>Kapampangan tradition of Báyung Danum</strong>, Pradera Islands Waterpark celebrates <strong style={{ color: COLORS.hiraya }}>a more heartfelt meaning of abundance</strong> — the extraordinary rush of joy that comes from being together with the people who matter most.
              </p>
              <p className="body" style={{ fontSize: 17, color: "#3a3a4a", marginBottom: 20 }}>
                Here, water sets that excitement in motion. Every splash, wave, and slide pulls you and your loved ones from one thrill to the next, creating an experience that's impossible not to get swept up in.
              </p>
              <p className="body" style={{ fontSize: 17, color: "#3a3a4a", marginBottom: 40 }}>
                When the thrill of the water collides with the joy of being with your favorite people, there's only one thing left to do: <strong style={{ color: COLORS.orange }}>Ride the Rush.</strong>
              </p>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{
                background: GRADIENTS.deep,
                borderRadius: 10,
                padding: 48,
                color: "#fff",
                position: "relative",
                overflow: "hidden",
                boxShadow: `0 30px 80px ${COLORS.dagat}30`,
              }}>
                <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, background: "rgba(255,255,255,0.06)", borderRadius: "50%" }} />
                <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, background: `${COLORS.azure}25`, borderRadius: "50%" }} />
                <img src="/brand/logo-main.webp" alt="Pradera Islands Waterpark" style={{ width: 150, height: "auto", marginBottom: 22, filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.3))" }} />
                <h3 className="display" style={{ fontSize: 30, fontWeight: 800, marginBottom: 14, textTransform: "uppercase", letterSpacing: -0.5 }}>Bayúng Danum</h3>
                <p className="body" style={{ fontSize: 15, opacity: 0.88, marginBottom: 16 }}>
                  "New Water" in Kapampangan — a traditional celebration marking the arrival of new waters, symbolizing renewal, purification, and the coming of abundance and prosperity.
                </p>
                <p className="body" style={{ fontSize: 15, opacity: 0.88, marginBottom: 24 }}>
                  Rooted in Pampanga's river culture and shared water traditions, Bayúng Danum reflects a time of collective celebration, movement, and communal joy.
                </p>
              </div>

              <div style={{
                position: "absolute", bottom: -28, left: -28,
                background: COLORS.orange,
                borderRadius: 10, padding: "20px 24px", color: "#fff",
                boxShadow: "0 6px 20px rgba(0,35,123,0.18)",
                
              }}>
                <div className="eyebrow" style={{ color: "rgba(255,255,255,0.8)", fontSize: 9 }}>Located In</div>
                <div className="display" style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: 0.8, marginTop: 4, lineHeight: 1.35 }}>PRADERA ISLANDS · PRADO SIONGCO · LUBAO, PAMPANGA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FULL-BLEED STAT BAND — breaks the white rhythm and puts the park on screen */}
      <section id="stat-band" style={{
        position: "relative",
        minHeight: 420,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        borderTop: `4px solid ${COLORS.orange}`,
      }}>
        <img
          className="band-photo"
          src="/photos/lunar-speedway.webp"
          alt="Lunar Speedway and the park beyond it at Pradera Islands"
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "118%", objectFit: "cover", zIndex: 0,
            transform: `translate3d(0, ${bandShift}px, 0)`,
            willChange: "transform",
          }}
        />
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(90deg, rgba(0,15,45,0.90) 0%, rgba(0,20,60,0.72) 45%, rgba(0,25,75,0.35) 100%)",
        }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1240, margin: "0 auto", padding: "72px 6%", width: "100%" }}>
          <div className="reveal" style={{ maxWidth: 620, marginBottom: 44 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 16, letterSpacing: 4 }}>Lubao, Pampanga</div>
            <h2 className="display" style={{
              fontSize: "clamp(30px, 4.4vw, 52px)", fontWeight: 900, color: "#fff",
              lineHeight: 1.08, letterSpacing: -0.5, margin: 0,
            }}>
              Twelve attractions, one <span style={{ color: COLORS.orange }}>island of water</span>.
            </h2>
            <p className="body" style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", margin: "16px 0 0", lineHeight: 1.6 }}>
              A combination of slides, pools and rain parks — plus one more on the way.
            </p>
          </div>
          {/* Each figure is a way into the section it counts. Buttons rather
              than links: these move the page, they do not open an address. */}
          <div className="stat-row">
            {[
              { n: "12", l: "Attractions", to: "attractions", say: "Attractions" },
              // The one still to come is the last card in the carousel, so
              // send the carousel there too — landing on Amihan Spinner when
              // you asked about what is coming would be its own small lie.
              { n: "1", l: "Coming Soon", to: "attractions", say: "Attractions", card: attractions.length - 1 },
              { n: "5", l: "Dining & Retail", to: "dining", say: "Dining and Retail" },
              { n: "4", l: "Characters", to: "characters", say: "Waterpark Characters" },
            ].map(({ n, l, to, say, card }, si) => (
              <button
                type="button"
                key={l}
                className="reveal stat-link"
                data-reveal-delay={si * 110}
                aria-label={`${n} ${l}. Go to ${say}.`}
                onClick={() => {
                  if (card !== undefined) setAttractionIndex(card);
                  scrollTo(to);
                }}
              >
                <span className="display stat-num"><CountUp value={n} /></span>
                <span className="eyebrow stat-label">{l}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ATTRACTIONS */}
      <section id="attractions" style={{
        background: `linear-gradient(180deg, #f4f7ff 0%, #fff 100%)`,
        position: "relative",
        overflow: "hidden",
        padding: "72px 6%",
      }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 40 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>The Rides</div>
            <h2 className="display" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, textTransform: "uppercase", color: COLORS.hiraya, lineHeight: 1 }}>
              Our <span style={{ color: COLORS.dagat }}>Attractions</span>
            </h2>
            <p className="body" style={{ fontSize: 17, color: "#55566a", maxWidth: 560, margin: "20px auto 0" }}>
              From high-speed plunges to lazy drifts — every ride tells the story of water, wind, and celebration.
            </p>
          </div>

          <div className="carousel-3d-wrap">
            <button type="button" aria-label="Previous" onClick={() => goAttraction(-1)} className="carousel-arrow" style={{ left: 8 }}>‹</button>
            <button type="button" aria-label="Next" onClick={() => goAttraction(1)} className="carousel-arrow" style={{ right: 8 }}>›</button>
            <div className="carousel-3d-stage" onMouseEnter={() => setCarouselHover(true)} onMouseLeave={() => setCarouselHover(false)}>
            {attractions.map((a, i) => {
              const n = attractions.length;
              let offset = i - attractionIndex;
              if (offset > n / 2) offset -= n;
              if (offset < -n / 2) offset += n;
              const abs = Math.abs(offset);
              const visible = abs <= (isNarrow ? 1 : 2);
              const sign = Math.sign(offset);
              const scale = abs === 0 ? 1.15 : 1 - abs * 0.12;
              const transform = `translate(-50%, -50%) translateX(${offset * (isNarrow ? 104 : 58)}%) translateZ(${-abs * 220}px) rotateY(${-sign * Math.min(abs, 2) * 28}deg) scale(${scale})`;
              return (
              <div key={a.name} className="card carousel-3d-card" style={{
                background: "#fff",
                borderRadius: 10,
                padding: 0,
                overflow: "hidden",
                border: "1px solid #eaecf4",
                transform,
                opacity: visible ? (abs === 0 ? 1 : abs === 1 ? (isNarrow ? 0.32 : 0.75) : 0.35) : 0,
                pointerEvents: abs === 0 ? "auto" : "none",
                zIndex: 10 - abs,
                cursor: abs === 0 ? "default" : "pointer",
              }}
              onClick={() => abs !== 0 && setAttractionIndex(i)}
              >
                <div style={{
                  height: 200,
                  background: `linear-gradient(135deg, ${a.color} 0%, ${a.color}cc 100%)`,
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {a.image && (
                    <>
                      <img src={a.image} alt={a.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      {/* The logo lands mid-frame, where a bright sky or pale
                          concrete would swallow it. A band of shade across the
                          middle keeps it readable on any photo. */}
                      <span aria-hidden="true" style={{
                        position: "absolute", inset: 0, zIndex: 1,
                        background: "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.10) 100%)",
                      }} />
                    </>
                  )}
                  {!a.image && (
                    <svg viewBox="0 0 400 140" style={{ position: "absolute", bottom: 0, width: "100%", height: "60%" }} preserveAspectRatio="none">
                      <path d="M0,80 C80,40 160,110 240,70 C320,30 360,90 400,70 L400,140 L0,140 Z" fill="rgba(255,255,255,0.18)" />
                      <path d="M0,100 C100,70 180,130 280,95 C360,70 380,110 400,100 L400,140 L0,140 Z" fill="rgba(255,255,255,0.14)" />
                    </svg>
                  )}
                  {a.logo && (
                    <img
                      src={a.logo}
                      alt={`${a.name} logo`}
                      style={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 170, height: 170, objectFit: "contain",
                        filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.35))",
                        zIndex: 2,
                      }}
                    />
                  )}
                  {a.comingSoon && (
                    <div className="coming-soon-mark" aria-hidden="true">
                      <span className="coming-soon-ring" />
                      <span className="coming-soon-inner">
                        {a.tempMark && <span className="coming-soon-mono">{a.tempMark}</span>}
                        <span className="coming-soon-text">Coming Soon</span>
                      </span>
                    </div>
                  )}
                  <span className="eyebrow" style={{
                    position: "absolute", top: 18, left: 20,
                    background: "rgba(255,255,255,0.22)", color: "#fff",
                    padding: "6px 12px", borderRadius: 999, fontSize: 10,
                    backdropFilter: "blur(8px)",
                    zIndex: 3,
                  }}>{a.theme}</span>
                </div>
                <div className="card-body" style={{ padding: 34 }}>
                  <h3 className="display" style={{ fontSize: 28, fontWeight: 800, textTransform: "uppercase", color: COLORS.hiraya, marginBottom: 14, lineHeight: 1.1, letterSpacing: -0.3 }}>
                    {a.name}
                  </h3>
                  <p className="body" style={{ fontSize: 16, color: "#55566a", lineHeight: 1.55 }}>{a.desc}</p>
                </div>
              </div>
              );
            })}
            </div>
            <div className="carousel-dots">
              {attractions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to attraction ${i + 1}`}
                  onClick={() => setAttractionIndex(i)}
                  className={"carousel-dot" + (i === attractionIndex ? " active" : "")}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* RATES — ticket cards on the dark ground, placed right after Attractions per the nav order */}
      <section id="rates" style={{ background: "#071228", padding: "clamp(72px,8vw,110px) 6%", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 44 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Waterpark Rates</div>
            <h2 className="display" style={{ fontSize: "clamp(38px, 6vw, 68px)", fontWeight: 900, lineHeight: 0.95, textTransform: "uppercase", color: "#fff", margin: 0 }}>
              Admission <span style={{ color: COLORS.orange }}>Rates</span>
            </h2>
            <p className="body" style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", maxWidth: 680, margin: "18px auto 0" }}>
              Full-day access to every attraction. Rates are per guest in Philippine pesos.
            </p>
          </div>

          {RATES_PUBLISHED ? (() => {
            const season = pricing.season || DEFAULT_PRICING.season;
            const nowSeason = seasonOn(manilaToday(), season);
            const shown = seasonPick || nowSeason;
            const ranges = seasonRanges(season);
            return (
            <>
              {/* Two seasons, one set of cards. The switch opens on today's
                  season, so the first prices a guest sees are the ones they
                  would pay this week. */}
              <div className="season-switch reveal" role="group" aria-label="Season">
                {[["offpeak", "Off-Peak"], ["peak", "Peak"]].map(([key, label]) => (
                  <button key={key} type="button" aria-pressed={shown === key} onClick={() => setSeasonPick(key)}>
                    <span className="season-name">{label}{key === nowSeason && <span className="season-now">Now</span>}</span>
                    <span className="season-dates">{ranges[key]}</span>
                  </button>
                ))}
              </div>
              <div className="ticket-grid">
                {resolveRates(pricing.rates, shown).map((r, i) => (
                  <div key={r.name} className="ticket reveal" data-reveal-delay={i * 90}>
                    <div className="ticket-top">
                      <div className="ticket-name">{r.name}</div>
                      {r.note && <div className="ticket-note">{r.note}</div>}
                    </div>
                    {r.free ? (
                      <div className="ticket-free">
                        <span className="ticket-price">Free</span>
                        <span className="ticket-when">All days</span>
                      </div>
                    ) : (
                      <div className="ticket-prices">
                        <div>
                          <span className="ticket-when">Weekday</span>
                          <span className="ticket-price">{peso(r.weekday)}</span>
                        </div>
                        <div>
                          <span className="ticket-when">Weekend / Holiday</span>
                          <span className="ticket-price">{peso(r.weekend)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {(pricing.promos || []).filter((x) => promoIsLive(x, manilaToday())).map((x, i) => {
                const deal = dealLine(x.deal, pricing.rates, shown);
                return (
                  <div key={`${x.title}-${i}`} className="promo-callout reveal">
                    <div className="promo-badge">{x.badge}{x.badgeSub && <span className="promo-badge-sub">{x.badgeSub}</span>}</div>
                    <div>
                      <div className="promo-title">{x.title}</div>
                      <p className="promo-text">
                        {deal && (
                          <>
                            Book {COUNT_WORDS[deal.qty] || deal.qty} admissions together for <strong style={{ color: "#fff" }}>{peso(deal.total)}</strong> — that's {peso(deal.each)} each instead of {peso(deal.was)}.{" "}
                          </>
                        )}
                        {/* [words] become the link to the enquiry form. Split
                            on the brackets so the text stays plain text — no
                            HTML from the store ever reaches the page. */}
                        {(x.text || "").split(/(\[[^\]]{1,40}\])/).map((part, j) =>
                          /^\[[^\]]+\]$/.test(part) ? (
                            <button key={j} type="button" onClick={() => scrollTo("visit")} className="promo-link">{part.slice(1, -1)}</button>
                          ) : (
                            part
                          )
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Section 2 of the Terms promises they are reachable "before
                  purchase", so a footer link alone would only half-keep that
                  promise — it waits to be looked for. This sits in the path of
                  someone about to buy. Klook carries most sales, so the same
                  link belongs on that listing too; that one is Marketing's. */}
              <p className="body" style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", marginTop: 22, textAlign: "center", lineHeight: 1.6 }}>
                Regular and special non-working holidays follow the weekend / holiday rate. Senior citizen and PWD rates require a valid OSCA or PWD ID at the gate.
                Rates may change without prior notice.<br />
                By buying a ticket you agree to the <a href="/terms/" style={{ color: "rgba(255,255,255,0.72)", textDecoration: "underline", textUnderlineOffset: 3 }}>Guest Terms &amp; Waiver</a>.
              </p>
            </>
            );
          })() : (
            <div className="reveal" style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 36, border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
              <p className="body" style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", margin: 0 }}>
                Admission, cabana and group rates will be published here once finalized by the Sales team.
              </p>
            </div>
          )}
        </div>
      </section>


      {/* CHARACTERS */}
      <section id="characters" className="section-pad" style={{
        background: "#fff",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 72 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Meet the Crew</div>
            <h2 className="display" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, textTransform: "uppercase", color: COLORS.hiraya, lineHeight: 1 }}>
              Waterpark <span style={{ color: COLORS.dagat }}>Characters</span>
            </h2>
            <p className="body" style={{ fontSize: 17, color: "#55566a", maxWidth: 560, margin: "20px auto 0" }}>
              Guardians of the waters, spirits of the river — meet the vibrant characters of Pradera Islands.
            </p>
          </div>

          <div className="grid-cards">
            {characters.map((c, ci) => (
              <Tilt key={c.name} className="reveal" data-reveal-delay={ci * 90} max={8}>
              <div className="card" style={{
                borderRadius: 10,
                overflow: "hidden",
                border: `1px solid ${c.color}30`,
                background: "#fff",
                height: "100%",
              }}>
                <div style={{
                  background: `linear-gradient(160deg, ${c.color} 0%, ${c.color}88 100%)`,
                  padding: c.image ? "28px 20px 20px" : "56px 24px 44px",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                  minHeight: c.image ? 350 : 200,
                }}>
                  {/* Brand watermark and a ground shadow so the character stands on something */}
                  <img src="/brand/emblem-full.webp" alt="" aria-hidden="true" className="crew-watermark" />
                  <div className="crew-ground" />
                  <span className="crew-role-pill">{c.role}</span>
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="crew-img" style={{ width: "auto", maxWidth: "100%", height: 300, objectFit: "contain", display: "block", margin: "0 auto", position: "relative", zIndex: 1, filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.25))" }} />
                  ) : (
                    <svg viewBox="0 0 80 80" width="80" height="80" style={{ margin: "0 auto", position: "relative", zIndex: 1, filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.2))" }}>
                      <circle cx="40" cy="40" r="32" fill="rgba(255,255,255,0.2)" />
                      <circle cx="40" cy="40" r="20" fill="#fff" opacity="0.9" />
                      <text x="40" y="52" textAnchor="middle" fontSize="28" fontWeight="900" fill={c.color} fontFamily="Kanit, sans-serif">{c.name[0]}</text>
                    </svg>
                  )}
                  
                </div>
                <div style={{ padding: "26px 28px 30px" }}>
                  <div style={{ width: 44, height: 4, borderRadius: 2, background: c.color, marginBottom: 16 }} />
                  <h3 className="display" style={{ fontSize: 24, fontWeight: 900, textTransform: "uppercase", color: COLORS.hiraya, marginBottom: 12, letterSpacing: -0.3 }}>{c.name}</h3>
                  <p className="body" style={{ fontSize: 14, color: "#55566a" }}>{c.desc}</p>
                </div>
              </div>
              </Tilt>
            ))}
          </div>
        </div>
      </section>

      <WaveEdge from="#fff" to={COLORS.dagat} />

      {/* DINING */}
      <section id="dining" className="section-pad" style={{
        background: GRADIENTS.deep,
        position: "relative",
        overflow: "hidden",
        color: "#fff",
      }}>

        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 72 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Food, Drinks & Retail</div>
            <h2 className="display" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, textTransform: "uppercase", color: "#fff", lineHeight: 1 }}>
              Dining & Retail at <span style={{ color: COLORS.orange }}>Pradera Islands</span>
            </h2>
            <p className="body" style={{ fontSize: 17, color: "rgba(255,255,255,0.72)", maxWidth: 560, margin: "20px auto 0" }}>
              Sun-themed, sunrise-warm. From full meals to quick bites and ice-cold drinks — we have you covered.
            </p>
          </div>

          <div className="grid-cards grid-cards--center">
            {fnb.map((f, fi) => (
              <div key={f.name} className="card lift reveal" data-reveal-delay={fi * 90} style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: 32,
                position: "relative",
                overflow: "hidden",
              }}>
                {f.image && (
                  <div style={{ margin: "-32px -32px 24px", height: 180, overflow: "hidden" }}>
                    <img src={f.image} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                {/* Every card gets the same 72px logo slot so the row lines up */}
                <div className="venue-logo-slot">
                  {f.logo ? (
                    <img src={f.logo} alt="" aria-hidden="true" style={{ height: 72, width: "auto", display: "block", filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.3))" }} />
                  ) : (
                    <div className="venue-logo-placeholder" style={{ borderColor: `${f.color}66`, color: f.color }} aria-hidden="true">
                      <img src="/brand/emblem-full.webp" alt="" style={{ width: 34, height: 34, opacity: 0.85 }} />
                      <span>Logo soon</span>
                    </div>
                  )}
                </div>
                <div className="eyebrow" style={{ color: f.color, marginBottom: 10, fontSize: 10 }}>
                  {f.type}{f.pending && <span style={{ marginLeft: 8, color: "rgba(255,255,255,0.45)" }}>· Name to be announced</span>}
                </div>
                <h3 className="display" style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", color: "#fff", marginBottom: 14, letterSpacing: -0.5 }}>{f.name}</h3>
                <p className="body" style={{ fontSize: 14, color: "rgba(255,255,255,0.72)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveEdge from={COLORS.dagat} to="#071228" />

      {/* INTERACTIVE PARK MAP */}
      <section id="map" style={{ background: "#071228", padding: "clamp(72px,8vw,110px) 6%", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Find Your Way</div>
            <h2 className="display" style={{ fontSize: "clamp(38px, 6vw, 68px)", fontWeight: 900, lineHeight: 0.95, textTransform: "uppercase", color: "#fff", margin: 0 }}>
              The Waterpark <span style={{ color: COLORS.orange }}>Map</span>
            </h2>
            <p className="body" style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginTop: 18 }}>
              Tap a marker to see the attraction or venue.
            </p>
          </div>

          <div className="reveal map-frame">
            <img src="/photos/park-map.webp" alt="Pradera Islands Waterpark map" style={{ width: "100%", display: "block" }} />
            {mapPins.map((p) => {
              const ride = (p.venue ? fnb : attractions).find((a) => a.name === p.name);
              const on = (hoverPin || activePin) === p.name;
              return (
                <button
                  key={p.name}
                  type="button"
                  className={`map-pin${on ? " on" : ""}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  onMouseEnter={() => setHoverPin(p.name)}
                  onFocus={() => setHoverPin(p.name)}
                  onMouseLeave={() => setHoverPin(null)}
                  onBlur={() => setHoverPin(null)}
                  onClick={() => setActivePin(activePin === p.name ? null : p.name)}
                  aria-label={ride ? `${p.name} — ${ride.theme || ride.type}` : p.name}
                />
              );
            })}
          </div>

          {/* Info panel — reads out whichever pin is active */}
          <div className="map-readout" aria-live="polite">
            {(() => {
              const sel = (hoverPin || activePin);
              const ride = attractions.find((a) => a.name === sel) || fnb.find((v) => v.name === sel);
              if (!ride) {
                return <span className="map-hint">Tap any marker to see the attraction or venue.</span>;
              }
              return (
                <>
                  {ride.logo && <img src={ride.logo} alt="" className="map-readout-logo" />}
                  <span>
                    <strong style={{ color: "#fff" }}>{ride.name}</strong>
                    <em style={{ color: COLORS.orange, fontStyle: "normal" }}> · {ride.theme || ride.type}</em>
                    <span style={{ display: "block", color: "rgba(255,255,255,0.62)", marginTop: 4 }}>{ride.desc}</span>
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="section-pad" style={{ background: "#0a1730", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>The Park in Real Life</div>
            <h2 className="display" style={{ fontSize: "clamp(38px, 6vw, 68px)", fontWeight: 900, lineHeight: 0.95, textTransform: "uppercase", color: "#fff", margin: 0 }}>
              A Splash of <span style={{ color: COLORS.orange }}>Paradise</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: 200, gap: 16 }}>
            {[
              { src: "/photos/park-day.webp", alt: "Aerial view of Pradera Islands Waterpark", span: "span 2", row: "span 2" },
              { src: "/photos/aqua-play.webp", alt: "The kids aqua play zone", span: "span 2", row: "span 1" },
              /* Same shot as the stat band above — Marketing's pick, 4 Nov 2026. */
              { src: "/photos/lunar-speedway.webp", alt: "Lunar Speedway racer slides", span: "span 1", row: "span 1" },
              /* Marketing dropped the flat-sky racer and bowl shots, 6 Nov 2026. */
              { src: "/photos/pools-and-slides.webp", alt: "Pools and slides across Pradera Islands", span: "span 1", row: "span 1" },
              { src: "/photos/family-slides.webp", alt: "Family slides", span: "span 2", row: "span 1" },
              { src: "/photos/slides-tower.webp", alt: "Slide tower and wave pool", span: "span 2", row: "span 1" },
            ].map((g, i) => (
              <div key={i} className="gallery-tile reveal" data-reveal-delay={i * 90} style={{ gridColumn: g.span, gridRow: g.row, overflow: "hidden", borderRadius: 10, position: "relative" }}>
                <img src={g.src} alt={g.alt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPEN DAYS CALENDAR + TRAVEL GUIDE — agreed 5 Oct 2026 */}
      <section id="guide" style={{ background: "#fff", padding: "clamp(72px,8vw,110px) 6%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: 36 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Plan Your Visit</div>
            <h2 className="display" style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, color: COLORS.hiraya, margin: 0, lineHeight: 1.05, textTransform: "uppercase" }}>
              Travel <span style={{ color: COLORS.dagat }}>Guide</span>
            </h2>
          </div>

          <div className="guide-grid">
            {/* Open-days calendar — separate from the park-hours block in Contact */}
            <div className="reveal guide-card">
              <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Open Days</div>
              <OpenDaysCalendar schedule={schedule} />
              <p className="body" style={{ fontSize: 13, color: "#7a819a", margin: "16px 0 0", lineHeight: 1.6 }}>
                Open {dayListLabel(schedule.weekdays, [...WEEKDAY_BAND, ...WEEKEND_BAND])}, plus the holidays and extra dates shown above.
                {dayListLabel(schedule.weekdays, WEEKDAY_BAND) ? ` ${dayListLabel(schedule.weekdays, WEEKDAY_BAND)} ${fmtBand(schedule.hours.weekday)}.` : ""}
                {dayListLabel(schedule.weekdays, WEEKEND_BAND) ? ` ${dayListLabel(schedule.weekdays, WEEKEND_BAND)} and holidays ${fmtBand(schedule.hours.weekend)}.` : ""}
              </p>
            </div>

            {/* How to get here — car route is from the park's location; the bus line
                reuses the "How to get to Pradera" content sheet once Marketing sends it. */}
            <div className="reveal guide-card">
              <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>How to Get to Pradera Islands</div>
              <h3 className="display" style={{ fontSize: 22, fontWeight: 800, color: COLORS.hiraya, margin: "0 0 6px" }}>Prado Siongco, Lubao, Pampanga</h3>
              <p className="body" style={{ fontSize: 14, color: "#55566a", margin: "0 0 20px", lineHeight: 1.6 }}>
                About 90 km north-west of Metro Manila. Set your navigation to <strong>Pradera Islands Waterpark</strong> or <strong>Pradera Verde, Lubao</strong>.
              </p>

              <div className="route-list">
                <div className="route">
                  <div className="route-icon" aria-hidden="true">🚗</div>
                  <div>
                    <strong>By private car <span className="route-time">1.5 – 2 hrs from Manila</span></strong>
                    <ol>
                      <li>Take <b>NLEX</b> northbound to the <b>SCTEX</b> link at Mabalacat.</li>
                      <li>On SCTEX, exit at <b>Floridablanca</b>.</li>
                      <li>Follow the Floridablanca–Lubao road toward the town proper, then continue to <b>Prado Siongco</b>. Watch for the Pradera Verde signs.</li>
                    </ol>
                  </div>
                </div>

                <div className="route">
                  <div className="route-icon" aria-hidden="true">🚌</div>
                  <div>
                    <strong>By bus <span className="route-time">2.5 – 3 hrs</span></strong>
                    <ol>
                      <li>From Cubao or Pasay, board any bus bound for <b>Olongapo</b> or <b>Bataan</b> via SCTEX, or a Pampanga bus to <b>Lubao</b>.</li>
                      <li>Alight at <b>Lubao</b> (ask for Prado Siongco or Pradera Verde).</li>
                      <li>Take a tricycle or jeepney to the park gate.</li>
                    </ol>
                    <p className="route-note">Bus routes and fares to be confirmed by Marketing.</p>
                  </div>
                </div>

                <div className="route">
                  <div className="route-icon" aria-hidden="true">🅿️</div>
                  <div>
                    <strong>Parking</strong>
                    <p>On-site parking is available at a flat rate of ₱50 per vehicle.</p>
                  </div>
                </div>
              </div>

              <a href="https://www.google.com/maps/search/?api=1&query=Pradera+Islands+Waterpark+Prado+Siongco+Lubao+Pampanga" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "inline-block", marginTop: 22, background: COLORS.orange, textDecoration: "none", padding: "13px 26px", fontSize: 13 }}>
                Open in Google Maps
              </a>
            </div>
          </div>

          {/* Before you go — the gate's prohibited-items list. Text, not the
              poster image: the poster's lettering is unreadable at phone width,
              and a picture of a list cannot be searched or read aloud. */}
          <div className="reveal guide-card rules-card" id="not-allowed">
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Before You Go</div>
            <h3 className="display" style={{ fontSize: "clamp(20px, 2.4vw, 26px)", fontWeight: 800, color: COLORS.hiraya, margin: "0 0 22px", lineHeight: 1.25 }}>
              The following items are <span style={{ color: "#d62828" }}>not allowed</span> inside Pradera Islands Waterpark:
            </h3>
            <ul className="rules-grid">
              {PROHIBITED_ITEMS.map((item) => (
                <li key={item.label} className="rule">
                  <span className="rule-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                  </span>
                  <span className="rule-label">{item.label}</span>
                </li>
              ))}
            </ul>
            <p className="rules-bring">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9.5" /><path d="M12 7.5v5.5" /><path d="M12 16.5h.01" /></svg>
              Don't forget to bring your swimwear, towel, sunscreen, and a change of clothes for a fun day at the park!
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "clamp(80px, 10vw, 130px) 6% clamp(90px, 11vw, 150px)",
        background: `linear-gradient(160deg, ${COLORS.dagat} 0%, ${COLORS.hiraya} 55%, #001542 100%)`,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* The crew, framing the message */}
        {[
          { src: "/brand/characters/lakandanum.webp", left: "1%", bottom: 0, height: "clamp(150px, 18vw, 260px)", delay: 0 },
          { src: "/brand/characters/janjan.webp",     left: "15%", bottom: 14, height: "clamp(110px, 12vw, 175px)", delay: 1.2 },
          { src: "/brand/characters/laut.webp",       right: "15%", bottom: 0, height: "clamp(135px, 16vw, 235px)", delay: 0.6 },
          { src: "/brand/characters/dapu.webp",       right: "1%", bottom: 28, height: "clamp(120px, 13vw, 195px)", delay: 1.8 },
        ].map((ch, i) => (
          <img key={i} className="cta-mascot" src={ch.src} alt="" aria-hidden="true" style={{
            position: "absolute",
            bottom: ch.bottom, left: ch.left, right: ch.right,
            height: ch.height, width: "auto", objectFit: "contain",
            opacity: 0.96,
            filter: "drop-shadow(0 18px 34px rgba(0,0,0,0.45))",
            
            pointerEvents: "none",
            zIndex: 1,
          }} />
        ))}

        <div style={{ position: "relative", zIndex: 2, maxWidth: 720, margin: "0 auto" }}>
          <div className="eyebrow" style={{ color: COLORS.azure, marginBottom: 18, letterSpacing: 4 }}>Plan Your Visit</div>
          <h2 className="display" style={{ fontSize: "clamp(34px, 5.6vw, 62px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", marginBottom: 20, letterSpacing: -1, lineHeight: 1 }}>
            The New Waters <span style={{ color: COLORS.orange }}>Await</span>
          </h2>
          <p className="body" style={{ fontSize: 18, color: "rgba(255,255,255,0.88)", maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.6 }}>
            Splash, flow, and celebrate at Pradera Islands Waterpark — Lubao, Pampanga's new home for water, fun, and family.
          </p>
          <button className="btn-primary" style={{ background: COLORS.orange, boxShadow: "0 14px 34px rgba(255,142,0,0.45)" }} onClick={() => scrollTo("visit")}>Get in Touch</button>
        </div>
      </section>

      {/* VISIT / CONTACT */}
      <section id="visit" className="section-pad" style={{
        background: "#05050f",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="grid-2">
            <div>
              <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 16 }}>Find Us</div>
              <h2 className="display" style={{ fontSize: "clamp(34px, 4.5vw, 54px)", fontWeight: 900, textTransform: "uppercase", marginBottom: 20, lineHeight: 0.95, color: "#fff" }}>
                Visit<br /><span style={{ color: COLORS.azure }}>Pradera Islands</span><br />Waterpark
              </h2>
              <p className="body" style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", marginBottom: 28, maxWidth: 480 }}>
                Prado Siongco, Lubao, Pampanga — an easy drive from Metro Manila via NLEX and SCTEX.
              </p>

              {/* Address card with a real map button */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Pradera Islands Waterpark, Prado Siongco, Lubao, Pampanga")}`}
                target="_blank" rel="noopener noreferrer" className="findus-map"
              >
                <div className="findus-pin" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="eyebrow" style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginBottom: 4 }}>Location</div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 16, lineHeight: 1.3 }}>Prado Siongco, Lubao, Pampanga</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>Parking on site · ₱50 flat rate</div>
                </div>
                <span className="findus-cta">Open in Maps ↗</span>
              </a>

              {/* Hours */}
              <div className="findus-hours">
                <div className="eyebrow" style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginBottom: 12 }}>Park Hours</div>
                {/* Rows are built from the schedule rather than written out,
                    so changing the open days in /admin/ cannot leave this
                    block quietly contradicting the calendar below it. */}
                {dayListLabel(schedule.weekdays, WEEKDAY_BAND) && (
                  <div className="hours-row"><span>{dayListLabel(schedule.weekdays, WEEKDAY_BAND)}</span><b>{fmtBand(schedule.hours.weekday)}</b></div>
                )}
                {dayListLabel(schedule.weekdays, WEEKEND_BAND) && (
                  <div className="hours-row"><span>{dayListLabel(schedule.weekdays, WEEKEND_BAND)} &amp; Holidays</span><b>{fmtBand(schedule.hours.weekend)}</b></div>
                )}
                {dayListLabel([0, 1, 2, 3, 4, 5, 6].filter((d) => !schedule.weekdays.includes(d)), [...WEEKDAY_BAND, ...WEEKEND_BAND]) && (
                  <div className="hours-row muted"><span>{dayListLabel([0, 1, 2, 3, 4, 5, 6].filter((d) => !schedule.weekdays.includes(d)), [...WEEKDAY_BAND, ...WEEKEND_BAND])}</span><b>Closed, except holidays &amp; select dates</b></div>
                )}
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12.5, margin: "12px 0 0", lineHeight: 1.55 }}>
                  Last entry one hour before closing. Holiday hours may differ — see the <button type="button" onClick={() => scrollTo("guide")} className="promo-link" style={{ color: COLORS.azure }}>open-days calendar</button>.
                </p>
              </div>

              {/* Contact + social */}
              <div className="findus-foot">
                <a href={`mailto:${CS_EMAIL || "sales@praderaislands.com"}`} className="findus-email">
                  <span className="eyebrow" style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, display: "block", marginBottom: 4 }}>Email</span>
                  {CS_EMAIL || "sales@praderaislands.com"}
                </a>
                {CONTACT_PHONE && (
                  <a href={telHref(CONTACT_PHONE)} className="findus-email">
                    <span className="eyebrow" style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, display: "block", marginBottom: 4 }}>Call or Text</span>
                    {CONTACT_PHONE}
                    <span style={{ display: "block", color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 400, marginTop: 4 }}>Available during park hours</span>
                  </a>
                )}
                <div>
                  <span className="eyebrow" style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, display: "block", marginBottom: 8 }}>Follow Us</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    {SOCIALS.map(({ name, url, accent, path }) => (
                      <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name} className="social-dot" style={{ "--accent": accent, background: `${accent}26`, borderColor: `${accent}8c` }}>
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">{path}</svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Inquiry form — agreed 5 Oct 2026. Submissions land in Netlify Forms and are
                forwarded to the sales@ Google Workspace group (set the notification in the
                Netlify dashboard under Forms → Notifications). */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: 44,
            }}>
              <h3 className="display" style={{ fontSize: 24, fontWeight: 800, textTransform: "uppercase", marginBottom: 10, letterSpacing: -0.3, color: "#fff" }}>
                Get in Touch
              </h3>
              <p className="body" style={{ fontSize: 15, color: "rgba(255,255,255,0.62)", marginBottom: 26, lineHeight: 1.6 }}>
                Tell us about your visit, group, or event and our team will get back to you.
              </p>

              {formState === "sent" ? (
                <div style={{ padding: "32px 24px", textAlign: "center", background: `${COLORS.azure}18`, border: `1px solid ${COLORS.azure}55`, borderRadius: 10 }}>
                  <div className="display" style={{ fontSize: 20, fontWeight: 800, color: COLORS.azure, marginBottom: 8 }}>Message sent</div>
                  <p className="body" style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0 }}>Thank you — our team will be in touch soon.</p>
                  <button className="btn-ghost" style={{ marginTop: 20, padding: "10px 24px", fontSize: 12 }} onClick={() => setFormState("idle")}>Send another</button>
                </div>
              ) : (
                <form name="inquiry" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleFormSubmit} style={{ display: "grid", gap: 12 }}>
                  <input type="hidden" name="form-name" value="inquiry" />
                  <p hidden><label>Don't fill this out: <input name="bot-field" tabIndex={-1} autoComplete="off" value={botField} onChange={(e) => setBotField(e.target.value)} /></label></p>
                  <input name="name" type="text" placeholder="Full name" required autoComplete="name" value={form.name} onChange={handleFormChange} className="inq-input" />
                  <div className="inq-row">
                    <input name="contact" type="tel" placeholder="Contact number" required autoComplete="tel" value={form.contact} onChange={handleFormChange} className="inq-input" />
                    <input name="email" type="email" placeholder="Email address" required autoComplete="email" value={form.email} onChange={handleFormChange} className="inq-input" />
                  </div>
                  <label className="inq-label">
                    <span>Planned visit date <em>(optional — park is open Thursday to Sunday, on holidays and on select dates)</em></span>
                    <input name="visitDate" type="date" min={todayISO} value={form.visitDate} onChange={handleVisitDate} className="inq-input" />
                    {visitDateWarn && <span className="inq-warn">{visitDateWarn}</span>}
                  </label>
                  <textarea name="message" placeholder="Your message" rows={4} required value={form.message} onChange={handleFormChange} className="inq-input" style={{ resize: "vertical" }} />
                  <button type="submit" className="btn-primary" disabled={formState === "sending"} style={{ marginTop: 6, background: COLORS.orange, opacity: formState === "sending" ? 0.7 : 1 }}>
                    {formState === "sending" ? "Sending…" : "Get in Touch"}
                  </button>
                  {formState === "error" && (
                    <div className="body" style={{ fontSize: 13, color: COLORS.sunset }}>Something went wrong. Please try again, or message us on Facebook.</div>
                  )}
                  <p className="body" style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", margin: "4px 0 0", lineHeight: 1.6 }}>
                    By sending this form you agree that Pradera Islands Waterpark may contact you about your inquiry and keep your details to follow up.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RATES — scaffold; populate when Sales delivers pricing */}

      {/* FAQ — scaffold */}
      {FAQ_PUBLISHED && (
      <section id="faq" style={{ background: "#fff", padding: "96px 6%" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>FAQs</div>
          <h2 className="display" style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, color: COLORS.hiraya, marginBottom: 28, lineHeight: 1.05 }}>
            Frequently Asked <span style={{ color: COLORS.dagat }}>Questions</span>
          </h2>
          <div style={{ display: "grid", gap: 14 }}>
            {[1,2,3,4,5,6,7,8,9,10].map((i) => (
              <details key={i} style={{ background: "#f4f7ff", borderRadius: 8, padding: "18px 22px", border: "1px solid #e5e7eb" }}>
                <summary style={{ cursor: "pointer", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, color: COLORS.hiraya, fontSize: 16 }}>Question {i} — to be filled in</summary>
                <p className="body" style={{ marginTop: 12, color: "#55566a", fontSize: 14 }}>Answer placeholder. Marketing + Customer Service to provide actual Q&A content.</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* PRIVACY POLICY — scaffold */}
      {LEGAL_PUBLISHED && (<>
      <section id="privacy" style={{ background: "#f9fafb", padding: "96px 6%" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Legal</div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, color: COLORS.hiraya, marginBottom: 24, lineHeight: 1.05 }}>
            Privacy Policy
          </h2>
          <div style={{ color: "#55566a", fontSize: 15, lineHeight: 1.75 }}>
            <p style={{ marginBottom: 16 }}>This Privacy Policy describes how Pradera Islands Waterpark collects, uses, and protects information provided through this website and on park premises.</p>
            <h3 style={{ color: COLORS.hiraya, marginTop: 28, marginBottom: 10, fontSize: 18 }}>1. Information We Collect</h3>
            <p style={{ marginBottom: 16 }}>[To be provided by Legal]</p>
            <h3 style={{ color: COLORS.hiraya, marginTop: 28, marginBottom: 10, fontSize: 18 }}>2. How We Use Your Information</h3>
            <p style={{ marginBottom: 16 }}>[To be provided by Legal]</p>
            <h3 style={{ color: COLORS.hiraya, marginTop: 28, marginBottom: 10, fontSize: 18 }}>3. Data Sharing & Third Parties</h3>
            <p style={{ marginBottom: 16 }}>[To be provided by Legal]</p>
            <h3 style={{ color: COLORS.hiraya, marginTop: 28, marginBottom: 10, fontSize: 18 }}>4. Cookies & Analytics</h3>
            <p style={{ marginBottom: 16 }}>[To be provided by Legal]</p>
            <h3 style={{ color: COLORS.hiraya, marginTop: 28, marginBottom: 10, fontSize: 18 }}>5. Your Rights</h3>
            <p style={{ marginBottom: 16 }}>[To be provided by Legal]</p>
            <h3 style={{ color: COLORS.hiraya, marginTop: 28, marginBottom: 10, fontSize: 18 }}>6. Contact</h3>
            <p>[To be provided by Legal]</p>
          </div>
        </div>
      </section>

      {/* TERMS OF SERVICE — scaffold */}
      <section id="terms" style={{ background: "#fff", padding: "96px 6%" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Legal</div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, color: COLORS.hiraya, marginBottom: 24, lineHeight: 1.05 }}>
            Terms of Service
          </h2>
          <div style={{ color: "#55566a", fontSize: 15, lineHeight: 1.75 }}>
            <p style={{ marginBottom: 16 }}>By accessing this website or visiting Pradera Islands Waterpark, you agree to the following terms.</p>
            <h3 style={{ color: COLORS.hiraya, marginTop: 28, marginBottom: 10, fontSize: 18 }}>1. Use of the Website</h3>
            <p style={{ marginBottom: 16 }}>[To be provided by Legal]</p>
            <h3 style={{ color: COLORS.hiraya, marginTop: 28, marginBottom: 10, fontSize: 18 }}>2. Ticket Purchase & Admission</h3>
            <p style={{ marginBottom: 16 }}>[To be provided by Legal]</p>
            <h3 style={{ color: COLORS.hiraya, marginTop: 28, marginBottom: 10, fontSize: 18 }}>3. Park Rules & Safety</h3>
            <p style={{ marginBottom: 16 }}>[To be provided by Legal + Operations]</p>
            <h3 style={{ color: COLORS.hiraya, marginTop: 28, marginBottom: 10, fontSize: 18 }}>4. Refunds & Cancellations</h3>
            <p style={{ marginBottom: 16 }}>[To be provided by Legal + Sales]</p>
            <h3 style={{ color: COLORS.hiraya, marginTop: 28, marginBottom: 10, fontSize: 18 }}>5. Liability</h3>
            <p style={{ marginBottom: 16 }}>[To be provided by Legal]</p>
            <h3 style={{ color: COLORS.hiraya, marginTop: 28, marginBottom: 10, fontSize: 18 }}>6. Governing Law</h3>
            <p>[To be provided by Legal]</p>
          </div>
        </div>
      </section>
      </>)}

      {/* FOOTER */}
      <footer style={{
        background: "#030310",
        padding: "48px 6%",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/brand/emblem-full.webp" alt="Pradera Islands" style={{ height: 40, width: "auto" }} />
          <div style={{ lineHeight: 1.2 }}>
            <div className="display" style={{ color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: 1.5 }}>PRADERA ISLANDS</div>
            <div className="eyebrow" style={{ color: COLORS.azure, fontSize: 9, marginTop: 2 }}>Waterpark</div>
          </div>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Pradera Islands Waterpark, Prado Siongco, Lubao, Pampanga")}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "rgba(255,255,255,0.7)" }}
          title="View on Google Maps"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="body" style={{ fontSize: 13 }}>Prado Siongco, Lubao, Pampanga</span>
        </a>
        <div className="body" style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          © 2026 Pradera Islands Waterpark. All rights reserved.
          {/* A real address, not a scroll — the gate tarpaulin's QR points at
              the same page, so it has to exist as its own URL. */}
          <span style={{ margin: "0 8px" }}>·</span>
          <a href="/terms/" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.22)" }}>Guest Terms &amp; Waiver</a>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {SOCIALS.map(({ name, url, accent, path }) => {
            const iconStyle = {
              width: 46, height: 46, borderRadius: "50%",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: socialIconBg(name, accent),
              boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
              border: `1px solid ${accent}8c`,
              color: url ? "#fff" : "rgba(255,255,255,0.3)",
              textDecoration: "none",
              cursor: url ? "pointer" : "not-allowed",
              transition: "transform 0.25s cubic-bezier(.2,.8,.2,1), background 0.25s, border-color 0.25s, box-shadow 0.25s",
              backdropFilter: "blur(6px)",
            };
            const svg = (
              <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">{path}</svg>
            );
            return url ? (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name}
                style={iconStyle}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px) scale(1.08)";
                  e.currentTarget.style.background = accent;
                  e.currentTarget.style.borderColor = accent;
                  e.currentTarget.style.boxShadow = `0 12px 28px ${accent}55`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.background = socialIconBg(name, accent);
                  e.currentTarget.style.borderColor = `${accent}8c`;
                  e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.25)";
                }}>
                {svg}
              </a>
            ) : (
              <span key={name} title={`${name} — coming soon`} aria-label={`${name} coming soon`} style={iconStyle}>
                {svg}
              </span>
            );
          })}
        </div>
      </footer>

      {COOKIE_CONSENT_ENABLED && <CookieBanner />}

      {/* Back to top. Tapping the logo already does this, but nothing says so,
          and the page is long enough that guessing is a poor fallback. */}
      <button
        type="button"
        className={`to-top${showTop ? " is-on" : ""}`}
        onClick={() => scrollTo("home")}
        aria-label="Back to top"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M12 19V5M12 5l-7 7M12 5l7 7" fill="none" stroke="currentColor"
                strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

/* The operating schedule.
 *
 * Staff edit this from /admin/, which stores it and triggers a rebuild. What
 * follows is the copy the site ships with: it is what the page shows before
 * the stored answer arrives, and what it keeps showing if that answer never
 * comes. Holding a real schedule here rather than an empty one means a failed
 * request degrades to yesterday's truth instead of to a blank calendar.
 *
 * `weekdays` are JS getDay numbers — 0 is Sunday. Holidays are full ISO dates
 * so next year's calendar cannot inherit this year's by accident. `opensFrom`
 * closes every date before the park's first operating day whatever the weekday
 * says; it can be cleared once opening week is well behind us.
 *
 * Google does not read this. The opening hours in search and on Maps come from
 * the structured data in index.html, which scripts/og-absolute.js refreshes
 * from the stored schedule at build time. That is why saving a schedule asks
 * for a rebuild: otherwise the page says one thing and the search result
 * another, which is how a guest ends up at a closed gate.
 */
const DEFAULT_SCHEDULE = {
  weekdays: [0, 4, 5, 6], // Thu, Fri, Sat, Sun
  /* Single dates that depart from the weekly pattern, in either direction.
     `open: true` opens a day the pattern would close — a holiday. `open: false`
     closes one it would open — weather, maintenance, a private booking. The
     reason is shown to guests: a calendar that says a Saturday is shut without
     saying why reads like a mistake, and a guest who thinks it is a mistake
     drives out anyway. */
  overrides: {
    "2026-11-16": { open: true, reason: "Holiday" },
    "2026-11-17": { open: true, reason: "Holiday" },
    "2026-11-18": { open: true, reason: "Holiday" },
    "2026-11-30": { open: true, reason: "Bonifacio Day" },
    /* December, per the operating-days calendar Management approved for the
       month (revised 25 Nov 2026). The Thursday-to-Sunday pattern holds; the
       holidays are named, because "are you open on Christmas?" is the
       question the whole month is asked. Wed Dec 23 is the one extra open
       weekday and carries no reason, so it shows as an ordinary open day
       instead of joining the holiday list under the grid. */
    "2026-12-08": { open: true, reason: "Feast of the Immaculate Conception" },
    "2026-12-11": { open: true, reason: "Pampanga Day" },
    "2026-12-23": { open: true },
    "2026-12-24": { open: true, reason: "Christmas Eve" },
    "2026-12-25": { open: true, reason: "Christmas Day" },
    "2026-12-30": { open: true, reason: "Rizal Day" },
    "2026-12-31": { open: true, reason: "New Year's Eve" },
    "2027-01-01": { open: true, reason: "New Year's Day" },
  },
  hours: {
    weekday: { opens: "10:00", closes: "17:00" },
    weekend: { opens: "09:00", closes: "17:00" },
  },
  opensFrom: "2026-11-15",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_BAND = [1, 2, 3, 4, 5];
const WEEKEND_BAND = [6, 0];

/* "09:00" becomes "9:00 AM". The stored form is 24-hour because that is what
   the structured data needs; this is only ever for reading. */
const fmtTime = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};
const fmtBand = (band) => `${fmtTime(band.opens)} – ${fmtTime(band.closes)}`;

/* Name a set of days the way a person would: a run becomes "Thursday – Sunday",
   anything else is listed. `order` decides what counts as consecutive, so the
   weekend reads Saturday to Sunday rather than wrapping through the week. */
function dayListLabel(days, order) {
  const sel = order.filter((d) => days.includes(d));
  if (!sel.length) return null;
  if (sel.length === 1) return DAY_NAMES[sel[0]];
  const positions = sel.map((d) => order.indexOf(d));
  const consecutive = positions.every((p, i) => i === 0 || p === positions[i - 1] + 1);
  return consecutive
    ? `${DAY_NAMES[sel[0]]} – ${DAY_NAMES[sel[sel.length - 1]]}`
    : sel.map((d) => DAY_NAMES[d]).join(", ");
}

const isoDate = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/* The announcement.
 *
 * It opens by itself when the page loads, because the thing it exists to say
 * — the park is shut today, the pools are down — is the one thing a guest
 * must not have to go looking for.
 *
 * Closing it does not throw it away. A slim bar stays behind, and the bar
 * reopens it. Someone who dismisses a notice on reflex and then wonders what
 * it said has somewhere to go; without that, the information is simply gone
 * for the rest of their visit.
 *
 * A dismissal is remembered against the notice's own timestamp, so the dialog
 * does not reopen on every page they visit — but the moment staff publish
 * something new, the timestamp changes and it opens again. That is deliberate:
 * a new announcement is new, whatever the visitor did with the last one.
 */
const NOTICE_SEEN_KEY = "pradera-notice-seen";

const NOTICE_TONE = {
  closed: { bg: "#B3261E", chip: "Park closed" },
  warning: { bg: "#B55F00", chip: "Please note" },
  info: { bg: COLORS.hiraya, chip: "Announcement" },
};

function NoticeDialog({ notice }) {
  const tone = NOTICE_TONE[notice.level] || NOTICE_TONE.info;
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    // Storage can be blocked or throw outright in a private window. A notice
    // that cannot be remembered should still be shown.
    let seen = null;
    try {
      seen = localStorage.getItem(NOTICE_SEEN_KEY);
    } catch {
      seen = null;
    }
    setOpen(seen !== notice.updatedAt);
  }, [notice.updatedAt]);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(NOTICE_SEEN_KEY, notice.updatedAt);
    } catch {
      /* Nothing to do; it will simply open again next visit. */
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    // Put the keyboard where the dialog is, or a keyboard user is left
    // tabbing through a page they cannot see past.
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {open && (
        <div
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) dismiss();
          }}
          style={{
            position: "fixed", inset: 0, zIndex: 3000,
            background: "rgba(10,16,40,0.62)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-title"
            style={{
              background: "#fff", borderRadius: 18, maxWidth: 440, width: "100%",
              overflow: "hidden", boxShadow: "0 24px 70px rgba(10,16,40,0.35)",
            }}
          >
            <div style={{ background: tone.bg, padding: "16px 22px" }}>
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>
                {tone.chip}
              </div>
              <h2 id="notice-title" style={{ margin: "6px 0 0", color: "#fff", fontSize: 19, fontWeight: 800, lineHeight: 1.25 }}>
                Pradera Islands Waterpark
              </h2>
            </div>
            <div style={{ padding: "20px 22px 22px" }}>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65, color: "#1b2340", whiteSpace: "pre-wrap" }}>
                {notice.message}
              </p>
              <button
                type="button"
                ref={closeRef}
                onClick={dismiss}
                style={{
                  marginTop: 20, width: "100%", padding: "12px", borderRadius: 10,
                  border: "none", cursor: "pointer", background: COLORS.hiraya,
                  color: "#fff", fontWeight: 700, fontSize: 14.5, letterSpacing: 0.4,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stays after the dialog is closed, and opens it again. */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 2900,
            border: "none", cursor: "pointer", background: tone.bg, color: "#fff",
            padding: "10px 16px", fontSize: 13.5, fontWeight: 600,
            textAlign: "center", lineHeight: 1.4,
          }}
        >
          {tone.chip} — tap to read
        </button>
      )}
    </>
  );
}

/* The holiday band. The season's poster, rebuilt for a screen: the same navy,
   the same orange script, the tree, the snow and the waves — but the copy is
   live, so the dates it promises are read from the schedule and can never
   drift from the calendar further down the page. */
/* The park AVP, in its own band under the hero.
 *
 * Two cuts of the same 30-second edit: landscape for wide screens, portrait
 * for a phone held upright. The choice follows the screen's shape, not the
 * device, so a phone turned sideways gets the landscape cut and a tablet held
 * upright gets the portrait one. The cuts are frame-for-frame the same edit,
 * so on a turn the new one picks up at the same second.
 *
 * Bandwidth is the cost here, so nothing loads until the band is within a
 * screen of view, each guest downloads only the one cut their screen needs,
 * and Data Saver gets the still frame alone. Guests who ask for reduced motion
 * get the still frame and a play button rather than autoplay.
 *
 * The video carries its own words and logo, which is why nothing is laid
 * over it. */
const AVP = {
  landscape: { src: "/video/avp-landscape.mp4", poster: "/video/avp-landscape-poster.webp" },
  portrait: { src: "/video/avp-portrait.mp4", poster: "/video/avp-portrait-poster.webp" },
};

function AvpBand() {
  const ref = useRef(null);
  const videoRef = useRef(null);
  const resumeAt = useRef(0);
  const [cut, setCut] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape"
  );
  const [near, setNear] = useState(false);
  const [playing, setPlaying] = useState(false);
  const saveData = typeof navigator !== "undefined" && navigator.connection && navigator.connection.saveData;
  const [calm] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [userWants, setUserWants] = useState(null); // null = follow autoplay rules; true/false = the guest pressed the button

  // Follow the screen's shape. Remember where the old cut was, so the new one
  // carries on from the same moment.
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const onChange = () => {
      if (videoRef.current) resumeAt.current = videoRef.current.currentTime || 0;
      setCut(mq.matches ? "portrait" : "landscape");
    };
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange));
  }, []);

  const visible = useRef(false);
  const wantPlay = useRef(false);

  /* Play or pause to match where things stand. Called after every render and
     on every visibility change, rather than trusting one observer's first
     report: that report can arrive mid-scroll, say "not in view", and never
     be corrected if the next threshold crossing came before it was wired. */
  const sync = () => {
    const v = videoRef.current;
    if (!v) return;
    if (visible.current && wantPlay.current && v.getAttribute("src")) {
      if (!v.paused) return;
      v.play().catch(() => setPlaying(false));
    } else if (!v.paused) {
      v.pause();
    }
  };

  // Two watchers on the band: one a screen ahead, to start the download in
  // time; one on the band itself, to play only while it can be seen.
  useEffect(() => {
    if (!ref.current || !("IntersectionObserver" in window)) {
      visible.current = true;
      setNear(true);
      return undefined;
    }
    const ahead = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setNear(true)),
      { rootMargin: "100% 0px" }
    );
    const inView = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        visible.current = e.intersectionRatio >= 0.25;
        sync();
      }),
      { threshold: [0, 0.25, 0.5, 1] }
    );
    ahead.observe(ref.current);
    inView.observe(ref.current);
    return () => {
      ahead.disconnect();
      inView.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // React sets `muted` as a property only, and browsers decide whether a
  // video may autoplay by the attribute; without it, play() is refused and the
  // band sits on its still frame. Set both on every new element.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
  }, [cut]);

  // Out of view, paused, so a phone is not decoding video nobody can see.
  wantPlay.current = userWants !== null ? userWants : !calm && !saveData;
  useEffect(sync); // eslint-disable-line react-hooks/exhaustive-deps

  const load = near && !(saveData && userWants === null);
  const { src, poster } = AVP[cut];

  return (
    <section id="avp" ref={ref} className={`avp-band avp-${cut}`} aria-label="Pradera Islands Waterpark video">
      <div className="avp-frame">
        <video
          key={cut}
          ref={videoRef}
          className="avp-video"
          src={load ? src : undefined}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          onLoadedMetadata={(e) => {
            if (resumeAt.current) e.currentTarget.currentTime = resumeAt.current;
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        <button
          type="button"
          className="avp-toggle"
          aria-label={playing ? "Pause video" : "Play video"}
          onClick={() => {
            const v = videoRef.current;
            if (playing) {
              setUserWants(false);
              if (v) v.pause();
            } else {
              // A press is a press: play even if the band is only partly in
              // view. The src may only now be set; the render that follows
              // attaches it and the effect after it plays.
              setUserWants(true);
              setNear(true);
              visible.current = true;
            }
          }}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>
          )}
        </button>
      </div>
    </section>
  );
}

function HolidayBand({ schedule, onSeeDays }) {
  const now = new Date();
  const todayKey = isoDate(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Object.keys(schedule.overrides || {})
    .filter((key) => key >= todayKey && schedule.overrides[key].open && schedule.overrides[key].reason
      && (key.slice(5, 7) === "12" || key.slice(5) <= HOLIDAY_TO))
    .sort()
    .slice(0, 8)
    .map((key) => ({
      key,
      reason: schedule.overrides[key].reason,
      label: new Date(`${key}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
    }));
  const flake = (size, style, extra = "") => (
    <svg className={`xmas-flake-deco${extra}`} viewBox="0 0 24 24" width={size} height={size} style={style} aria-hidden="true" focusable="false">
      <use href="#xmas-flake" />
    </svg>
  );
  return (
    <section className="xmas-band" aria-label="Happy Holidays from Pradera Islands">
      {/* The script face is only fetched while the season is on. */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap');`}</style>
      {flake(44, { left: "4%", top: "9%" })}
      {flake(26, { left: "31%", top: "6%" })}
      {flake(34, { left: "52%", top: "16%" })}
      {flake(22, { left: "47%", top: "58%" }, " wide-only")}
      {flake(38, { right: "3%", top: "8%" })}
      {flake(24, { left: "2%", top: "70%" }, " wide-only")}

      <div className="xmas-band-inner">
        <div>
          <h2 className="xmas-title">
            <span className="xmas-happy">HAPPY</span>
            <span className="xmas-script">Holidays!</span>
          </h2>
          <h3>Your holiday escape starts here.</h3>
          <hr className="xmas-rule" />
          <p className="xmas-lead">Make this season one to remember.</p>
          <p>
            Gather the whole family for waves of fun, thrilling slides, and
            unforgettable moments together.
          </p>
          <p>
            We’re open throughout Christmas and New Year, ready to make your
            holiday celebrations extra special.
          </p>
          {days.length > 0 && (
            <ul className="xmas-days" aria-label="Holiday dates the park is open">
              {days.map((d) => <li key={d.key}><b>{d.label}</b>{d.reason}</li>)}
            </ul>
          )}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <a className="btn-primary" href={TICKETS_URL} target="_blank" rel="noopener noreferrer" style={{ background: COLORS.orange, textDecoration: "none", display: "inline-block" }}>Buy Tickets</a>
            <button className="btn-ghost" onClick={onSeeDays}>See open days</button>
          </div>
        </div>

        <div className="xmas-art" aria-hidden="true">
          <svg className="xmas-tree" viewBox="0 0 300 440">
            <polygon points="150,46 286,440 14,440" fill="#2F8F83" />
            <polygon points="150,46 286,440 150,440" fill="#267A73" />
            {/* strings of pearls */}
            {[150, 205, 262, 322, 384].map((y) => {
              const half = ((y - 46) / 394) * 136 - 6;
              return (
                <path key={y} d={`M${150 - half} ${y} Q150 ${y + 36} ${150 + half} ${y}`}
                  fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeDasharray="0.1 17" opacity="0.9" />
              );
            })}
            {[[118, 150, 15, "#FF8E00"], [196, 132, 13, "#FFD23F"], [92, 262, 16, "#FFD23F"], [214, 250, 15, "#FF8E00"], [150, 330, 17, "#FF8E00"], [70, 376, 14, "#FF8E00"], [236, 372, 15, "#FFD23F"]].map(([x, y, r, c]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={c} />
            ))}
            {/* the star, tilted the way a hand-placed one always is */}
            <g transform="translate(150 40) rotate(-14)">
              <polygon points="0,-40 11,-13 40,-12 17,6 25,34 0,18 -25,34 -17,6 -40,-12 -11,-13" fill="#F6B25A" />
              <polygon points="0,-40 11,-13 40,-12 17,6 25,34 0,18" fill="#F0703C" />
            </g>
          </svg>
          <img className="xmas-mascot" src="/brand/characters/janjan.webp" alt="" loading="lazy" />
        </div>
      </div>

      {/* Brushed waves with gold flecks, closing the band into the page. */}
      <svg className="xmas-waves" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 96 C160 30 300 150 470 92 C640 34 760 150 940 96 C1110 44 1260 140 1440 82 L1440 200 L0 200Z" fill="#0021E8" />
        <path d="M0 96 C160 30 300 150 470 92 C640 34 760 150 940 96 C1110 44 1260 140 1440 82" fill="none" stroke="#5FA8FF" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
        <path d="M0 132 C200 80 330 180 540 128 C740 78 900 178 1100 130 C1240 96 1350 150 1440 124 L1440 200 L0 200Z" fill="#2A63F5" />
        <path d="M0 132 C200 80 330 180 540 128 C740 78 900 178 1100 130 C1240 96 1350 150 1440 124" fill="none" stroke="#9CCBFF" strokeWidth="4" strokeLinecap="round" opacity="0.75" />
        <path d="M0 168 C220 128 400 196 640 160 C860 128 1040 196 1240 162 C1330 148 1400 166 1440 158 L1440 200 L0 200Z" fill="#fff" />
        {[[120, 70], [380, 118], [610, 62], [830, 128], [1010, 72], [1290, 104], [1400, 60], [250, 150]].map(([x, y], i) => (
          <path key={x} transform={`translate(${x} ${y}) scale(${i % 2 ? 0.55 : 0.8})`} fill="#FFD23F"
            d="M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z" />
        ))}
      </svg>
    </section>
  );
}

/* Month calendar that marks which days the park is open. Shows the current
   month and lets guests step forward. Days before today are dimmed. */
/* Is the park open on this date, and why is that not the usual answer?
   One place decides it, so the calendar, the sentence beneath it and the
   enquiry form can never disagree about a Saturday. */
function dayStatus(key, weekday, schedule) {
  if (schedule.opensFrom && key < schedule.opensFrom) {
    return { open: false, override: null };
  }
  const override = (schedule.overrides || {})[key];
  if (override) return { open: override.open, override };
  return { open: schedule.weekdays.includes(weekday), override: null };
}

function OpenDaysCalendar({ schedule = DEFAULT_SCHEDULE }) {
  const openHours = fmtBand(schedule.hours.weekend);
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const label = cursor.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
  const isPast = (d) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  /* The dated changes that fall in the month on screen, listed under the grid.
     Past dates are dropped — a guest planning a visit does not need to be told
     we were shut last Tuesday, and the list stays short enough to read. */
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const todayKey = isoDate(today.getFullYear(), today.getMonth(), today.getDate());
  const changes = Object.keys(schedule.overrides || {})
    .filter((key) => key.startsWith(monthPrefix) && key >= todayKey
      && (!schedule.overrides[key].open || schedule.overrides[key].reason))
    .sort()
    .map((key) => ({
      key,
      open: schedule.overrides[key].open,
      reason: schedule.overrides[key].reason,
      label: new Date(`${key}T00:00:00`).toLocaleDateString("en-PH", { weekday: "short", day: "numeric", month: "short" }),
    }));
  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" className="cal-nav" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous month">‹</button>
        <div className="cal-title">{label}</div>
        <button type="button" className="cal-nav" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next month">›</button>
      </div>
      <div className="cal-grid" role="grid" aria-label={`Open days, ${label}`}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const key = isoDate(year, month, d);
          const { open, override } = dayStatus(key, new Date(year, month, d).getDay(), schedule);
          /* A day shut when the week says it should be open gets its own mark.
             Left looking like an ordinary closed Monday, it reads as a mistake,
             and a guest who thinks the site is wrong sets out anyway. */
          const shut = Boolean(override) && !override.open;
          const reason = override && override.reason;
          return (
            <div key={d} className={`cal-day${open ? " open" : ""}${shut ? " shut" : ""}${isPast(d) ? " past" : ""}${isToday(d) ? " today" : ""}`}
              title={reason || (open ? `Open, ${openHours}` : undefined)}
              aria-label={`${d} ${label}, ${open ? "open" : "closed"}${reason ? `, ${reason}` : ""}`}>
              {d}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span className="cal-swatch open" /> Open <span className="cal-swatch" /> Closed
        {changes.length > 0 && <><span className="cal-swatch shut" /> Changed</>}
      </div>

      {/* Spelled out, not left to a tooltip. Half the guests are on a phone,
          where there is no hover at all, and the reason is the part that stops
          someone setting out on a day we are shut. */}
      {changes.length > 0 && (
        <ul className="cal-changes">
          {changes.map((c) => (
            <li key={c.key}>
              <b>{c.label}</b> — {c.open ? "open" : "closed"}
              {c.reason ? `, ${c.reason}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* Counts a stat up from zero the first time it scrolls into view.
   Keeps any suffix ("11+") and passes non-numeric values ("∞") through. */
function CountUp({ value, duration = 1400 }) {
  const match = String(value).match(/^(\d+)(.*)$/);
  const target = match ? Number(match[1]) : null;
  const suffix = match ? match[2] : "";
  const [shown, setShown] = useState(target === null ? value : 0);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (target === null || !ref) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(ref);
    return () => io.disconnect();
  }, [ref, target, duration]);

  return <span ref={setRef}>{shown}{suffix}</span>;
}

/* Water-cut divider between two sections. `from` is the section above,
   `to` the one below, so the wave reads as water spilling downward. */
function WaveEdge({ from, to }) {
  return (
    <div className="wave-edge" style={{ background: to }} aria-hidden="true">
      <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
        <path d="M0,0 L1440,0 L1440,38 C1180,92 980,10 720,44 C460,78 260,4 0,52 Z" fill={from} />
      </svg>
    </div>
  );
}

/* Cursor-tracked 3D tilt. Stays inert on touch devices. */
function Tilt({ children, max = 9, className = "", style, ...rest }) {
  const [transform, setTransform] = useState("");

  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTransform(
      `rotateY(${(px * max * 2).toFixed(2)}deg) rotateX(${(-py * max * 2).toFixed(2)}deg) translateZ(18px)`
    );
  };

  return (
    <div className={`tilt-scene ${className}`} style={style} {...rest}>
      <div
        className="tilt"
        style={{ transform, height: "100%" }}
        onMouseMove={handleMove}
        onMouseLeave={() => setTransform("")}
      >
        {children}
      </div>
    </div>
  );
}

function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("pradera_cookie_consent")) {
      setVisible(true);
    }
  }, []);
  const accept = () => {
    localStorage.setItem("pradera_cookie_consent", "accepted");
    setVisible(false);
  };
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", bottom: 16, left: 16, right: 16, maxWidth: 720, margin: "0 auto",
      background: "#fff", borderRadius: 8, padding: "16px 20px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.18)", border: "1px solid #e5e7eb",
      display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", zIndex: 9999,
      fontFamily: "'Kanit', sans-serif",
    }}>
      <div style={{ flex: "1 1 280px", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
        We use cookies to improve your experience and analyze site traffic. See our <a href="#privacy" style={{ color: COLORS.dagat, textDecoration: "underline" }}>Privacy Policy</a> for details.
      </div>
      <button onClick={accept} style={{
        background: COLORS.orange, color: "#fff", border: "none",
        padding: "10px 22px", borderRadius: 999, fontWeight: 700,
        fontSize: 12, letterSpacing: 1, cursor: "pointer",
        textTransform: "uppercase",
      }}>Accept</button>
    </div>
  );
}
