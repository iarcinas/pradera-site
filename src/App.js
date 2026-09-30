import { useState, useEffect } from "react";

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
];

const attractions = [
  { name: "Amihan Spinner", desc: "Feel the winds of the Northeast Monsoon in this spinning vortex slide — fast, furious, and unstoppable.", theme: "Wind & Storm", color: COLORS.dagat, logo: "/attractions/amihan-spinner.png" },
  { name: "Habagat Rush", desc: "Ride the Southwest Monsoon's force down a high-speed plunge slide that leaves you breathless.", theme: "Thrill Slide", color: COLORS.orange, logo: "/attractions/habagat-rush.png" },
  { name: "Danum 360", desc: "A triple-twisting serpentine slide inspired by the bakunawa — spiral through water in pure flow.", theme: "Twister", color: COLORS.azure, logo: "/attractions/danum-360.png" },
  { name: "Lunar Speedway", desc: "Six lanes racing side by side under the lunar cycle — moon-inspired, tidal speed.", theme: "Race Slides", color: COLORS.lakandanum, logo: "/attractions/lunar-speedway.png" },
  { name: "Ulan Towers", desc: "A multi-level rain-zone ride house where every turn pours with tropical abundance.", theme: "Family Rides", color: COLORS.janjan, logo: "/attractions/ulan-towers.png" },
  { name: "Waves of Laut", desc: "Laut's domain — a massive adult wave pool with rolling swells and sun-soaked shores.", theme: "Wave Pool", color: COLORS.dagat, logo: "/attractions/waves-of-laut.png" },
  { name: "Rio de Pradera", desc: "Drift along the Pampanga-inspired lazy river — the flowing heart of Pradera Islands.", theme: "Lazy River", color: COLORS.azure, logo: "/attractions/rio-de-pradera.png" },
  { name: "Dapu's Cove", desc: "A sheltered splash lagoon with a gentle waterfall — Dapu's own hideaway for the littlest swimmers.", theme: "Kids Lagoon", color: COLORS.azure, logo: "/attractions/dapus-cove.png" },
  { name: "Danaw Dapu", desc: "Dapu's playful cove — a gentle kiddie zone full of turtle slides and little splashes.", theme: "Kids Zone", color: COLORS.orange, logo: "/attractions/danaw-dapu.png" },
  { name: "Drizzle District", desc: "A sun-drenched spray park where rain meets sunshine — perfect for little ones.", theme: "Spray Park", color: COLORS.sunset, logo: "/attractions/drizzle-district.png" },
  { name: "Jan-Jan's Cove", desc: "Jan-Jan's pond-themed water dock — glide and splash in the most playful corner of the park.", theme: "Kids Slides", color: COLORS.janjan, logo: "/attractions/janjans-cove.png" },
  { name: "Lake Liway", desc: "The chill tambayan zone — teen activity pool beside the restaurant and pool bar.", theme: "Teen Pool", color: COLORS.lakandanum, logo: "/attractions/lake-liway.png" },
];

const fnb = [
  { name: "Sinag", desc: "Our main restaurant. Sun-drenched, sunrise-warm interiors with flavors as vibrant as first light.", type: "Main Restaurant", color: COLORS.orange },
  { name: "Sinag Pool Bar", desc: "Cold drinks, warm vibes. An extension of Sinag right by the water — sun-themed and breezy.", type: "Pool Bar", color: COLORS.sunset },
  { name: "Souvenir Shop", desc: "Take the islands home. Mascot plush, swimwear, towels, and Pradera merchandise by the park exit.", type: "Retail", color: COLORS.azure },
];

/* Direct-message channels shown in the Contact section. Instagram and TikTok
   stay null (rendered as "Coming soon") until Marketing supplies the handles —
   set url to https://ig.me/m/<handle> and https://www.tiktok.com/@<handle>. */
const MESSAGE_CHANNELS = [
  { name: "Messenger", label: "Message us on Facebook", url: "https://m.me/61576524087915", accent: "#1877F2",
    path: <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 16.99 22 12z" /> },
  { name: "Instagram", label: "Message us on Instagram", url: "https://ig.me/m/praderaislandswaterpark", accent: "#E1306C",
    path: <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" /> },
  { name: "TikTok", label: "Message us on TikTok", url: "https://www.tiktok.com/@praderaislandswaterpark", accent: "#25F4EE",
    path: <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /> },
];

const characters = [
  { name: "Lakandanum", role: "Spirit of the Waters", desc: "Laidback, cool, intuitive. The calm presence of Hiraya Lake — guiding rivers and currents with quiet control.", color: COLORS.lakandanum, image: "/brand/characters/lakandanum.png" },
  { name: "Jan-Jan", role: "Park Technician", desc: "Caring, reliable, and always ready to save the day. The behind-the-scenes magic that keeps Pradera running.", color: COLORS.takipsilim, image: "/brand/characters/janjan.png" },
  { name: "Laut", role: "Guardian of the Waters", desc: "Fast, fearless, and always in motion. She charges waves, drives energy, and turns every splash into adventure.", color: COLORS.dagat, image: "/brand/characters/laut.png" },
  { name: "Dapu", role: "Children's Guide", desc: "Cheerful, gentle, and always alert. Pradera's friendly turtle guide who keeps every young adventurer safe.", color: COLORS.orange, image: "/brand/characters/dapu.png" },
];

const COOKIE_CONSENT_ENABLED = false;

/* Admission rates from the Sales / Revenue information request form (Sept 2026).
   Flip RATES_PUBLISHED to true once Sales marks them Final. */
const RATES_PUBLISHED = true;
/* Sections that are still empty shells stay hidden until their department delivers. */
const FAQ_PUBLISHED = false;    // Marketing + Customer Service
const LEGAL_PUBLISHED = false;  // Legal: Privacy Policy and Terms of Service
const CS_EMAIL = null;          // Legal/Admin: customer service address, e.g. "info@praderaislands.com"

const TICKET_RATES = [
  { name: "Regular",        weekday: 1080, weekend: 1180, peakWeekday: 1280, peakWeekend: 1380 },
  { name: "Junior",         note: "Ages 4 to 11", weekday: 880, weekend: 980, peakWeekday: 1080, peakWeekend: 1180 },
  { name: "Senior / PWD",   note: "20% off Regular with valid ID", weekday: 864, weekend: 944, peakWeekday: 1024, peakWeekend: 1104 },
  { name: "Infant",         note: "Under 3 years old", free: true },
];

const GROUP_RATE = { weekday: 9720, weekend: 10620, peakWeekday: 11520, peakWeekend: 12420 };

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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
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
      window.scrollTo(0, y);
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
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
    setNavOpen(false);
  };



  const navItems = [
    { id: "attractions", label: "attractions" },
    { id: "dining", label: "dining" },
    { id: "characters", label: "characters" },
    { id: "map", label: "map" },
    { id: "gallery", label: "gallery" },
    { id: "rates", label: "Rates", soon: !RATES_PUBLISHED },
    { id: "promos", label: "Promos", soon: true },
    { id: "guide", label: "Guide", soon: true },
    { id: "visit", label: "Contact Us" },
  ];

  return (
    <div style={{ fontFamily: "'Montserrat', 'Proxima Nova', system-ui, sans-serif", background: "#fff", color: "#111", overflowX: "hidden" }}>
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
        .msg-row:hover { transform: translateX(4px); border-color: rgba(255,255,255,0.28) !important; background: rgba(255,255,255,0.09) !important; }

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
        .splash-line { width: 0; height: 2px; background: ${COLORS.orange}; animation: splashLine 1.2s ease 0.6s forwards; }
        .ripple { position: absolute; top: 50%; left: 50%; width: 320px; height: 320px; margin: -160px 0 0 -160px;
          border-radius: 50%; border: 2px solid rgba(120,240,255,0.7); box-shadow: 0 0 18px rgba(120,240,255,0.25); transform: scale(0.3); opacity: 0;
          animation: rippleOut 2.2s ease-out infinite; pointer-events: none; }
        .ripple.r2 { animation-delay: 0.7s; }
        .ripple.r3 { animation-delay: 1.4s; }
        @keyframes splashMark { from { opacity: 0; transform: scale(0.82) translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes splashLine { to { width: 220px; } }
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

        /* ---- Rates table ---- */
        .rates-wrap { overflow-x: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; }
        .rates-table { width: 100%; border-collapse: collapse; min-width: 640px; font-variant-numeric: tabular-nums; }
        .rates-table th { font-family: 'Kanit', sans-serif; font-weight: 600; font-size: 11px; letter-spacing: 1.8px; text-transform: uppercase; color: #7a819a; text-align: left; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; background: #fafbff; }
        .rates-table td { padding: 18px 20px; border-bottom: 1px solid #eef0f6; font-size: 17px; font-weight: 600; color: ${COLORS.hiraya}; }
        .rates-table tr:last-child td { border-bottom: 0; }
        .rates-table td:first-child { font-size: 15px; }
        .rates-table .peak { color: #9a5300; background: #fff8ee; }
        .rates-table th.peak { color: #9a5300; }
        .rates-note { display: block; font-size: 12px; font-weight: 500; color: #7a819a; margin-top: 3px; }
        .rates-free { color: ${COLORS.lakandanum}; font-family: 'Kanit', sans-serif; letter-spacing: 1.5px; text-transform: uppercase; font-size: 14px; }
        .rates-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
        .rates-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 26px 28px; }
        .rates-card--soon { background: #f8f9fd; border-style: dashed; }
        @media (max-width: 720px) {
          .rates-cards { grid-template-columns: 1fr; }
          /* Phones: each ticket becomes a stacked card instead of a sideways-scrolling table */
          .rates-table { min-width: 0; }
          .rates-table thead { display: none; }
          .rates-table, .rates-table tbody, .rates-table tr, .rates-table td { display: block; }
          .rates-table tr { padding: 16px 18px 12px; border-bottom: 1px solid #eef0f6; }
          .rates-table tr:last-child { border-bottom: 0; }
          .rates-table td { padding: 7px 0; border: 0; display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 16px; }
          .rates-table td:first-child { display: block; padding: 0 0 10px; font-size: 17px; border-bottom: 1px dashed #e5e7eb; margin-bottom: 4px; }
          .rates-table td[data-label]::before { content: attr(data-label); font-family: 'Kanit', sans-serif; font-weight: 600; font-size: 11px; letter-spacing: 1.6px; text-transform: uppercase; color: #7a819a; }
          .rates-table td.peak { background: transparent; }
          .rates-table td.peak::before { color: #9a5300; }
          .rates-table td.rates-free { justify-content: space-between; }
        }
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
              url('/photos/park-golden.jpg');
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
            <img src="/brand/emblem-full.png" alt="" />
            <div className="splash-line" />
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
          <img src="/brand/emblem-full.png" alt="Pradera Islands" style={{ height: 46, width: "auto", display: "block" }} />
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
            <button
              className="btn-primary"
              style={{ background: COLORS.orange, width: "100%", padding: "17px 24px" }}
              onClick={() => { setNavOpen(false); alert("Buy Tickets — coming soon!"); }}
            >
              Buy Tickets
            </button>
            <div className="nav-sheet-meta">
              <div>
                <span className="eyebrow" style={{ color: "rgba(255,255,255,0.45)", fontSize: 9 }}>Location</span>
                <p style={{ color: "#fff", fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>
                  Prado Siongco, Lubao<br />Pampanga
                </p>
              </div>
              <img src="/brand/emblem-full.png" alt="" style={{ width: 46, height: 46, opacity: 0.85 }} />
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
          src="/photos/hero-aerial.jpg"
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

        {/* Hero content */}
        <div className="hero-copy" style={{ textAlign: "center", position: "relative", zIndex: 2, padding: "72px 6% 48px", maxWidth: 1100 }}>
          <div className="eyebrow" style={{ color: "rgba(255,255,255,0.92)", marginBottom: 26, letterSpacing: 4 }}>
            Bayúng Danum — The New Waters
          </div>

          <h1 style={{ margin: "0 auto 10px", lineHeight: 0 }}>
            <img
              src="/brand/pradera-islands-wordmark.png"
              alt="Pradera Islands"
              style={{
                width: "clamp(210px, 40vw, 440px)",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
          </h1>
          <svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid meet" style={{ width: "clamp(230px, 46vw, 500px)", height: "auto", display: "block", margin: "0 auto 30px" }} aria-label="Waterpark">
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
            <button className="btn-primary" style={{ background: COLORS.orange, boxShadow: "0 12px 32px rgba(255,142,0,0.45)" }} onClick={() => alert("Buy Tickets — coming soon!")}>Buy Tickets</button>
            <button className="btn-ghost" onClick={() => scrollTo("visit")}>Park Hours</button>
          </div>
        </div>

      </section>

      {/* BRAND STORY */}
      <section className="section-pad" style={{ background: "#fff", position: "relative", overflow: "hidden" }}>

        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
          <div className="grid-2">
            <div>
              <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 16 }}>Our Story</div>
              <h2 className="display" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, lineHeight: 0.95, textTransform: "uppercase", marginBottom: 28, color: COLORS.hiraya }}>
                The New
                <span style={{ color: COLORS.dagat, display: "block" }}>Waters</span>
              </h2>
              <p className="body" style={{ fontSize: 17, color: "#3a3a4a", marginBottom: 20 }}>
                Pradera Islands celebrates <strong style={{ color: COLORS.hiraya }}>renewal, abundance, purity, and prosperity</strong> through waves, color, sound, and shared play — rooted in the rich water traditions of Pampanga's river culture.
              </p>
              <p className="body" style={{ fontSize: 17, color: "#3a3a4a", marginBottom: 20 }}>
                It is a vibrant playground of movement and community, where everyone is invited to splash, flow, and celebrate together.
              </p>
              <p className="body" style={{ fontSize: 17, color: "#3a3a4a", marginBottom: 40 }}>
                Rooted in Pampanga's river culture and shared water traditions, <strong style={{ color: COLORS.hiraya }}>Bayúng Danum</strong> reflects a time of collective celebration, movement, and communal joy.
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
                <img src="/brand/emblem-full.png" alt="" style={{ width: 88, height: 88, marginBottom: 20, filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.3))" }} />
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
                <div className="display" style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1, marginTop: 4 }}>PRADO SIONGCO · LUBAO, PAMPANGA</div>
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
          src="/photos/wave-pool.jpg"
          alt="The wave pool at Pradera Islands"
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
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 16, letterSpacing: 4 }}>Central Luzon</div>
            <h2 className="display" style={{
              fontSize: "clamp(30px, 4.4vw, 52px)", fontWeight: 900, color: "#fff",
              lineHeight: 1.08, letterSpacing: -0.5, margin: 0,
            }}>
              Eleven attractions, one <span style={{ color: COLORS.orange }}>island of water</span>.
            </h2>
          </div>
          <div className="stat-row">
            {[["11+", "Attractions"], ["3", "Dining & Retail"], ["7", "Hectares"], ["∞", "Memories"]].map(([n, l], si) => (
              <div key={l} className="reveal" data-reveal-delay={si * 110}>
                <div className="display" style={{
                  fontSize: "clamp(44px, 6vw, 76px)", fontWeight: 900, color: "#fff",
                  lineHeight: 0.9, letterSpacing: -2,
                }}><CountUp value={n} /></div>
                <div className="eyebrow" style={{ color: "rgba(255,255,255,0.7)", marginTop: 10, fontSize: 10 }}>{l}</div>
              </div>
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
                    <img src={a.image} alt={a.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
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
                        width: 132, height: 132,
                        filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.28))",
                        zIndex: 2,
                      }}
                    />
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

      <WaveEdge from="#f4f7ff" to={COLORS.dagat} />

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
              Dining & Retail at <span style={{ color: COLORS.orange }}>Pradera</span>
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
                <div style={{
                  width: 56, height: 4,
                  background: f.color,
                  borderRadius: 2,
                  marginBottom: 24,
                }} />
                <div className="eyebrow" style={{ color: f.color, marginBottom: 10, fontSize: 10 }}>{f.type}</div>
                <h3 className="display" style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", color: "#fff", marginBottom: 14, letterSpacing: -0.5 }}>{f.name}</h3>
                <p className="body" style={{ fontSize: 14, color: "rgba(255,255,255,0.72)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
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
              Park <span style={{ color: COLORS.dagat }}>Characters</span>
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
                  <img src="/brand/emblem-full.png" alt="" aria-hidden="true" className="crew-watermark" />
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

      <WaveEdge from="#fff" to="#071228" />

      {/* INTERACTIVE PARK MAP */}
      <section id="map" style={{ background: "#071228", padding: "clamp(72px,8vw,110px) 6%", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Find Your Way</div>
            <h2 className="display" style={{ fontSize: "clamp(38px, 6vw, 68px)", fontWeight: 900, lineHeight: 0.95, textTransform: "uppercase", color: "#fff", margin: 0 }}>
              The Park <span style={{ color: COLORS.orange }}>Map</span>
            </h2>
            <p className="body" style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginTop: 18 }}>
              Tap a marker to see the ride.
            </p>
          </div>

          <div className="reveal map-frame">
            <img src="/photos/park-map.jpg" alt="Pradera Islands Waterpark map" style={{ width: "100%", display: "block" }} />
            {mapPins.map((p) => {
              const ride = attractions.find((a) => a.name === p.name);
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
                  aria-label={ride ? `${p.name} — ${ride.theme}` : p.name}
                />
              );
            })}
          </div>

          {/* Info panel — reads out whichever pin is active */}
          <div className="map-readout" aria-live="polite">
            {(() => {
              const ride = attractions.find((a) => a.name === (hoverPin || activePin));
              if (!ride) {
                return <span className="map-hint">Tap any marker to see the ride.</span>;
              }
              return (
                <>
                  <img src={ride.logo} alt="" className="map-readout-logo" />
                  <span>
                    <strong style={{ color: "#fff" }}>{ride.name}</strong>
                    <em style={{ color: COLORS.orange, fontStyle: "normal" }}> · {ride.theme}</em>
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
              { src: "/photos/park-day.jpg", alt: "Aerial view of Pradera Islands Waterpark", span: "span 2", row: "span 2" },
              { src: "/photos/wave-pool.jpg", alt: "The wave pool", span: "span 2", row: "span 1" },
              { src: "/photos/racer-slides.jpg", alt: "Racer slides", span: "span 1", row: "span 1" },
              { src: "/photos/bowl-slides.jpg", alt: "Tornado bowl slides", span: "span 1", row: "span 1" },
              { src: "/photos/family-slides.jpg", alt: "Family slides", span: "span 2", row: "span 1" },
              { src: "/photos/slides-tower.jpg", alt: "Slide tower and wave pool", span: "span 2", row: "span 1" },
            ].map((g, i) => (
              <div key={i} className="gallery-tile reveal" data-reveal-delay={i * 90} style={{ gridColumn: g.span, gridRow: g.row, overflow: "hidden", borderRadius: 10, position: "relative" }}>
                <img src={g.src} alt={g.alt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ))}
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
          { src: "/brand/characters/lakandanum.png", left: "1%", bottom: 0, height: "clamp(150px, 18vw, 260px)", delay: 0 },
          { src: "/brand/characters/janjan.png",     left: "15%", bottom: 14, height: "clamp(110px, 12vw, 175px)", delay: 1.2 },
          { src: "/brand/characters/laut.png",       right: "15%", bottom: 0, height: "clamp(135px, 16vw, 235px)", delay: 0.6 },
          { src: "/brand/characters/dapu.png",       right: "1%", bottom: 28, height: "clamp(120px, 13vw, 195px)", delay: 1.8 },
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
            Splash, flow, and celebrate at Pradera Islands Waterpark — Central Luzon's most vibrant water destination.
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
              <h2 className="display" style={{ fontSize: "clamp(34px, 4.5vw, 54px)", fontWeight: 900, textTransform: "uppercase", marginBottom: 28, lineHeight: 0.95, color: "#fff" }}>
                Visit<br /><span style={{ color: COLORS.azure }}>Pradera Islands</span><br />Waterpark
              </h2>
              <p className="body" style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", marginBottom: 36 }}>
                Located in the vibrant heartland of Pampanga, Central Luzon — Pradera Islands Waterpark is the new premier destination for water, fun, and community celebration.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Location", val: "Prado Siongco, Lubao, Pampanga", c: COLORS.orange, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Pradera Islands Waterpark, Prado Siongco, Lubao, Pampanga")}` },
                  { label: "Park Hours", val: (
                      <span style={{ display: "block", lineHeight: 1.55 }}>
                        Thursday 10:00 AM – 4:00 PM<br />
                        Friday to Sunday 10:00 AM – 5:00 PM<br />
                        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>Last entry one hour before closing · Closed Monday to Wednesday · Holiday hours may differ</span>
                      </span>
                    ), c: COLORS.sunset, href: null },
                  ...(CS_EMAIL ? [{ label: "Email", val: CS_EMAIL, c: COLORS.azure, href: `mailto:${CS_EMAIL}` }] : []),
                  { label: "Parking", val: "₱50 flat rate", c: COLORS.janjan, href: null },
                ].map(({ label, val, c, href }) => {
                  const rowStyle = { display: "flex", alignItems: "center", gap: 18, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", textDecoration: "none", cursor: href ? "pointer" : "default", transition: "background 0.2s" };
                  const body = (
                    <>
                      <div style={{ width: 6, minHeight: 40, alignSelf: "stretch", background: c, borderRadius: 3, flexShrink: 0 }} />
                      <div>
                        <div className="eyebrow" style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>{label}</div>
                        <div className="body" style={{ fontSize: 15, color: "#fff", fontWeight: 500, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 8 }}>
                          {val}
                          {href && <span style={{ color: c, fontSize: 13, fontFamily: "'Kanit', sans-serif", fontWeight: 700, letterSpacing: 1 }}>{href.startsWith("mailto:") ? "EMAIL ↗" : "VIEW MAP ↗"}</span>}
                        </div>
                      </div>
                    </>
                  );
                  return href
                    ? <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={rowStyle}>{body}</a>
                    : <div key={label} style={rowStyle}>{body}</div>;
                })}

                <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 0" }}>
                  <div style={{ width: 6, height: 40, background: COLORS.sunset, borderRadius: 3, flexShrink: 0 }} />
                  <div>
                    <div className="eyebrow" style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 8 }}>Follow Us</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {[
                        { name: "Facebook", url: "https://www.facebook.com/people/Pradera-Islands-Waterpark/61576524087915/", accent: "#1877F2", path: <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" /> },
                        { name: "Instagram", url: "https://www.instagram.com/praderaislandswaterpark/", accent: "#E1306C", path: (<><path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.72 3.72 0 01-.9 1.38c-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63A5.92 5.92 0 002 2.01 5.92 5.92 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91a5.92 5.92 0 001.38 2.14 5.92 5.92 0 002.14 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a6.17 6.17 0 003.52-3.52c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.92 5.92 0 00-1.38-2.14A5.92 5.92 0 0019.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0z" /><path d="M12 5.84A6.16 6.16 0 1018.16 12 6.17 6.17 0 0012 5.84zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4z" /><circle cx="18.41" cy="5.59" r="1.44" /></>) },
                        { name: "TikTok", url: "https://www.tiktok.com/@praderaislandswaterpark", accent: "#25F4EE", path: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.58 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.62-.1z" /> },
                      ].map(({ name, url, accent, path }) => {
                        const iconStyle = {
                          width: 42, height: 42, borderRadius: "50%",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          background: socialIconBg(name, accent), border: `1px solid ${accent}8c`, boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
                          color: url ? "#fff" : "rgba(255,255,255,0.3)",
                          textDecoration: "none", cursor: url ? "pointer" : "not-allowed",
                          transition: "transform 0.25s cubic-bezier(.2,.8,.2,1), background 0.25s, border-color 0.25s, box-shadow 0.25s",
                        };
                        const svg = <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">{path}</svg>;
                        return url ? (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name} style={iconStyle}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) scale(1.08)"; e.currentTarget.style.background = accent; e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 12px 26px ${accent}66`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.background = socialIconBg(name, accent); e.currentTarget.style.borderColor = `${accent}8c`; e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.25)"; }}>
                            {svg}
                          </a>
                        ) : (
                          <span key={name} title={`${name} — coming soon`} aria-label={`${name} coming soon`} style={iconStyle}>{svg}</span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message us on social — replaces the contact form */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: 44,
            }}>
              <h3 className="display" style={{ fontSize: 24, fontWeight: 800, textTransform: "uppercase", marginBottom: 10, letterSpacing: -0.3, color: "#fff" }}>
                Message Us
              </h3>
              <p className="body" style={{ fontSize: 15, color: "rgba(255,255,255,0.62)", marginBottom: 28, lineHeight: 1.6 }}>
                Fastest way to reach the team — send us a message on the platform you already use.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                {MESSAGE_CHANNELS.map(({ name, label, url, accent, path }) => {
                  const live = Boolean(url);
                  const inner = (
                    <>
                      <span style={{
                        width: 44, height: 44, borderRadius: 10, flex: "0 0 44px",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        background: live ? accent : "rgba(255,255,255,0.08)", color: live ? "#fff" : "rgba(255,255,255,0.35)",
                      }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">{path}</svg>
                      </span>
                      <span style={{ flex: 1, textAlign: "left" }}>
                        <span style={{ display: "block", fontFamily: "'Kanit', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 0.4, color: live ? "#fff" : "rgba(255,255,255,0.45)" }}>{label}</span>
                        <span style={{ display: "block", fontSize: 12, color: live ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)", marginTop: 2 }}>
                          {live ? `Opens ${name}` : "Coming soon"}
                        </span>
                      </span>
                      <span aria-hidden="true" style={{ color: live ? accent : "rgba(255,255,255,0.25)", fontSize: 20, lineHeight: 1 }}>›</span>
                    </>
                  );
                  const rowStyle = {
                    display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderRadius: 10,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    textDecoration: "none", cursor: live ? "pointer" : "not-allowed",
                    transition: "transform 0.25s cubic-bezier(.2,.8,.2,1), border-color 0.25s, background 0.25s",
                  };
                  return live ? (
                    <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="msg-row" style={rowStyle}>{inner}</a>
                  ) : (
                    <div key={name} className="msg-row" style={rowStyle} title="Handle to be provided by Marketing">{inner}</div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RATES — scaffold; populate when Sales delivers pricing */}
      <section id="rates" style={{ background: "#f4f7ff", padding: "96px 6%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: 28 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Park Rates</div>
            <h2 className="display" style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, color: COLORS.hiraya, margin: 0, lineHeight: 1.05, textTransform: "uppercase" }}>
              Admission <span style={{ color: COLORS.dagat }}>Rates</span>
            </h2>
            <p className="body" style={{ fontSize: 16, color: "#55566a", maxWidth: 620, margin: "16px 0 0" }}>
              Full-day admission to every attraction. Rates are per guest in Philippine pesos.
            </p>
          </div>

          {RATES_PUBLISHED ? (
            <>
              <div className="rates-wrap reveal">
                <table className="rates-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Weekday</th>
                      <th>Weekend</th>
                      <th className="peak">Peak weekday</th>
                      <th className="peak">Peak weekend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TICKET_RATES.map((r) => (
                      <tr key={r.name}>
                        <td>
                          <strong>{r.name}</strong>
                          {r.note && <span className="rates-note">{r.note}</span>}
                        </td>
                        {r.free ? (
                          <td colSpan={4} className="rates-free" data-label="All days">Free</td>
                        ) : (
                          <>
                            <td data-label="Weekday">₱{r.weekday.toLocaleString()}</td>
                            <td data-label="Weekend">₱{r.weekend.toLocaleString()}</td>
                            <td className="peak" data-label="Peak weekday">₱{r.peakWeekday.toLocaleString()}</td>
                            <td className="peak" data-label="Peak weekend">₱{r.peakWeekend.toLocaleString()}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rates-cards reveal">
                <div className="rates-card">
                  <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 10 }}>Group Rate</div>
                  <div className="display" style={{ fontSize: 30, fontWeight: 900, color: COLORS.hiraya, lineHeight: 1 }}>
                    ₱{GROUP_RATE.weekday.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600, color: "#55566a" }}>weekday</span>
                  </div>
                  <div className="body" style={{ fontSize: 14, color: "#55566a", marginTop: 8, lineHeight: 1.7 }}>
                    ₱{GROUP_RATE.weekend.toLocaleString()} weekend<br />
                    Peak season ₱{GROUP_RATE.peakWeekday.toLocaleString()} weekday · ₱{GROUP_RATE.peakWeekend.toLocaleString()} weekend
                  </div>
                  <p className="body" style={{ fontSize: 13, color: "#7a819a", marginTop: 12, marginBottom: 0 }}>
                    Message us to arrange a group visit.
                  </p>
                </div>
                <div className="rates-card rates-card--soon">
                  <div className="eyebrow" style={{ color: "#7a819a", marginBottom: 10 }}>Cabanas & Promos</div>
                  <p className="body" style={{ fontSize: 15, color: "#55566a", margin: 0, lineHeight: 1.6 }}>
                    Cabana rates, school and corporate packages, and opening promos will be posted here soon.
                  </p>
                </div>
              </div>

              <p className="body" style={{ fontSize: 13, color: "#7a819a", marginTop: 20, lineHeight: 1.6 }}>
                Senior citizen and PWD rates require a valid ID at the gate. Peak season covers holidays and declared peak dates. Rates may change without prior notice.
              </p>
            </>
          ) : (
            <div className="reveal" style={{ background: "#fff", borderRadius: 10, padding: 36, border: "1px solid #e5e7eb" }}>
              <p className="body" style={{ fontSize: 15, color: "#55566a", margin: 0 }}>
                Admission, cabana and group rates will be published here once finalized by the Sales team.
              </p>
            </div>
          )}
        </div>
      </section>

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
          <img src="/brand/emblem-full.png" alt="Pradera Islands" style={{ height: 40, width: "auto" }} />
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
        <div className="body" style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>© 2026 Pradera Islands Waterpark. All rights reserved.</div>
        <div style={{ display: "flex", gap: 14 }}>
          {[
            {
              name: "Facebook",
              url: "https://www.facebook.com/people/Pradera-Islands-Waterpark/61576524087915/",
              accent: "#1877F2",
              path: <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />,
            },
            {
              name: "Instagram",
              url: "https://www.instagram.com/praderaislandswaterpark/",
              accent: "#E1306C",
              path: (
                <>
                  <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.72 3.72 0 01-.9 1.38c-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63A5.92 5.92 0 002 2.01 5.92 5.92 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91a5.92 5.92 0 001.38 2.14 5.92 5.92 0 002.14 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a6.17 6.17 0 003.52-3.52c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.92 5.92 0 00-1.38-2.14A5.92 5.92 0 0019.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0z" />
                  <path d="M12 5.84A6.16 6.16 0 1018.16 12 6.17 6.17 0 0012 5.84zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4z" />
                  <circle cx="18.41" cy="5.59" r="1.44" />
                </>
              ),
            },
            {
              name: "TikTok",
              url: "https://www.tiktok.com/@praderaislandswaterpark",
              accent: "#25F4EE",
              path: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.58 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.62-.1z" />,
            },
          ].map(({ name, url, accent, path }) => {
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
