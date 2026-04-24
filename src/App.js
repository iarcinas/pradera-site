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

const attractions = [
  { name: "Amihan Spinner", desc: "Feel the winds of the Northeast Monsoon in this spinning vortex slide — fast, furious, and unstoppable.", theme: "Wind & Storm", color: COLORS.dagat },
  { name: "Habagat Rush", desc: "Ride the Southwest Monsoon's force down a high-speed plunge slide that leaves you breathless.", theme: "Thrill Slide", color: COLORS.orange },
  { name: "Danum 360", desc: "A triple-twisting serpentine slide inspired by the bakunawa — spiral through water in pure flow.", theme: "Twister", color: COLORS.azure },
  { name: "Lunar Speedway", desc: "Six lanes racing side by side under the lunar cycle — moon-inspired, tidal speed.", theme: "Race Slides", color: COLORS.lakandanum },
  { name: "Ulan Towers", desc: "A multi-level rain-zone ride house where every turn pours with tropical abundance.", theme: "Family Rides", color: COLORS.janjan },
  { name: "Waves of Laut", desc: "Laut's domain — a massive adult wave pool with rolling swells and sun-soaked shores.", theme: "Wave Pool", color: COLORS.dagat },
  { name: "Rio de Pradera", desc: "Drift along the Pampanga-inspired lazy river — the flowing heart of Pradera Islands.", theme: "Lazy River", color: COLORS.azure },
  { name: "Danaw Dapu", desc: "Dapu's playful cove — a gentle kiddie zone full of turtle slides and little splashes.", theme: "Kids Zone", color: COLORS.orange },
  { name: "Drizzle District", desc: "A sun-drenched spray park where rain meets sunshine — perfect for little ones.", theme: "Spray Park", color: COLORS.sunset },
  { name: "Jan-Jan's Cove", desc: "Jan-Jan's pond-themed water dock — glide and splash in the most playful corner of the park.", theme: "Kids Slides", color: COLORS.janjan },
  { name: "Lake Liway", desc: "The chill tambayan zone — teen activity pool beside the restaurant and pool bar.", theme: "Teen Pool", color: COLORS.lakandanum },
];

const fnb = [
  { name: "Sinag", desc: "Our main restaurant. Sun-drenched, sunrise-warm interiors with flavors as vibrant as first light.", type: "Main Restaurant", color: COLORS.orange },
  { name: "Sinag Pool Bar", desc: "Cold drinks, warm vibes. An extension of Sinag right by the water — sun-themed and breezy.", type: "Pool Bar", color: COLORS.sunset },
  { name: "Dapu's Kitchen", desc: "Quick bites and casual favorites stationed throughout the park — always close, always satisfying.", type: "Kiosk", color: COLORS.azure },
  { name: "Chibog Street", desc: "A street-urban food truck zone packed with local flavors and festival energy.", type: "Food Trucks", color: COLORS.janjan },
];

const characters = [
  { name: "Lakandanum", role: "Spirit of the Waters", desc: "Laidback, cool, intuitive. The calm presence of Hiraya Lake — guiding rivers and currents with quiet control.", color: COLORS.lakandanum, image: "/brand/characters/lakandanum.png" },
  { name: "Jan-Jan", role: "Park Technician", desc: "Caring, reliable, and always ready to save the day. The behind-the-scenes magic that keeps Pradera running.", color: COLORS.janjan, image: "/brand/characters/janjan.png" },
  { name: "Laut", role: "Guardian of the Waters", desc: "Fast, fearless, and always in motion. She charges waves, drives energy, and turns every splash into adventure.", color: COLORS.dagat, image: null },
  { name: "Dapu", role: "Children's Guide", desc: "Cheerful, gentle, and always alert. Pradera's friendly turtle guide who keeps every young adventurer safe.", color: COLORS.orange, image: null },
];

const encodeForm = (data) =>
  Object.keys(data)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
    .join("&");

export default function PraderaIslands() {
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [formState, setFormState] = useState("idle"); // idle | sending | sent | error

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
    setNavOpen(false);
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormState("sending");
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeForm({ "form-name": "contact", ...form }),
    })
      .then(() => {
        setFormState("sent");
        setForm({ name: "", email: "", message: "" });
      })
      .catch(() => setFormState("error"));
  };

  const navItems = [
    { id: "attractions", label: "attractions" },
    { id: "dining", label: "dining" },
    { id: "characters", label: "characters" },
    { id: "visit", label: "Contact Us" },
  ];

  return (
    <div style={{ fontFamily: "'Montserrat', 'Proxima Nova', system-ui, sans-serif", background: "#fff", color: "#111", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@500;600;700;800;900&family=Montserrat:wght@400;500;600;700&display=swap');
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

        h1, h2, h3, h4, .display { font-family: 'Kanit', sans-serif; font-weight: 700; letter-spacing: -0.01em; }
        .eyebrow { font-family: 'Kanit', sans-serif; font-weight: 600; font-size: 12px; letter-spacing: 4px; text-transform: uppercase; }
        .body { font-family: 'Montserrat', sans-serif; font-weight: 400; line-height: 1.75; }

        .nav-link { transition: color 0.2s; cursor: pointer; font-family: 'Kanit', sans-serif; font-weight: 600; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; }
        .nav-link:hover { color: ${COLORS.orange}; }
        .card { transition: transform 0.35s cubic-bezier(.2,.8,.2,1), box-shadow 0.35s; cursor: pointer; }
        .card:hover { transform: translateY(-10px); box-shadow: 0 30px 80px rgba(0,35,123,0.18); }
        .btn-primary { background: ${GRADIENTS.main}; color: #fff; border: none; padding: 16px 40px; font-family: 'Kanit', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; border-radius: 999px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 10px 30px rgba(255,142,0,0.35); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(255,142,0,0.45); }
        .btn-ghost { background: transparent; border: 2px solid rgba(255,255,255,0.8); color: #fff; padding: 14px 36px; font-family: 'Kanit', sans-serif; font-weight: 600; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; border-radius: 999px; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { background: #fff; color: ${COLORS.hiraya}; }

        .section-fade { animation: fadeUp 0.8s ease forwards; }
        .wave-anim { animation: wave 14s linear infinite; }
        .float-anim { animation: float 5s ease-in-out infinite; }
        .drift-anim { animation: drift 7s ease-in-out infinite; }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        .nav-desktop { display: flex; gap: 36px; }
        .nav-mobile-toggle { display: none; }
        .section-pad { padding: 120px 6%; }

        @media (max-width: 820px) {
          .grid-2 { grid-template-columns: 1fr; gap: 48px; }
          .nav-desktop { display: ${navOpen ? "flex" : "none"}; position: absolute; top: 70px; left: 0; right: 0; flex-direction: column; background: ${COLORS.hiraya}; padding: 24px 6%; gap: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
          .nav-mobile-toggle { display: block; background: transparent; border: none; color: #fff; font-size: 22px; cursor: pointer; }
          .section-pad { padding: 80px 6%; }
        }
      `}</style>

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
          {navItems.map(({ id, label }) => (
            <span key={id} className="nav-link" onClick={() => scrollTo(id)} style={{ color: activeSection === id ? COLORS.orange : "#fff" }}>{label}</span>
          ))}
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
        {/* Decorative orbs */}
        {[
          { size: 420, x: "-10%", y: "-15%", color: COLORS.sunset, opacity: 0.22, delay: 0 },
          { size: 320, x: "75%", y: "5%", color: COLORS.orange, opacity: 0.28, delay: 2 },
          { size: 260, x: "5%", y: "65%", color: COLORS.azure, opacity: 0.18, delay: 1 },
          { size: 200, x: "80%", y: "60%", color: COLORS.janjan, opacity: 0.2, delay: 3 },
        ].map((o, i) => (
          <div key={i} style={{
            position: "absolute",
            width: o.size, height: o.size,
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
            opacity: o.opacity,
            left: o.x, top: o.y,
            filter: "blur(40px)",
            animation: `drift ${8 + i}s ease-in-out infinite`,
            animationDelay: `${o.delay}s`,
          }} />
        ))}

        {/* Animated waves */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55vh", overflow: "hidden", pointerEvents: "none" }}>
          <div className="wave-anim" style={{ display: "flex", width: "200%", height: "100%" }}>
            {[0, 1].map(i => (
              <svg key={i} viewBox="0 0 720 400" style={{ width: "50%", height: "100%" }} preserveAspectRatio="none">
                <path d="M0,120 C120,60 240,180 360,120 C480,60 600,180 720,120 L720,400 L0,400 Z" fill="rgba(255,255,255,0.06)" />
                <path d="M0,180 C140,120 260,220 400,170 C540,120 640,210 720,180 L720,400 L0,400 Z" fill="rgba(255,255,255,0.08)" />
                <path d="M0,260 C160,200 280,300 420,240 C560,190 640,280 720,260 L720,400 L0,400 Z" fill="rgba(255,255,255,0.1)" />
              </svg>
            ))}
          </div>
        </div>

        {/* Hero content */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 2, padding: "84px 6% 56px", maxWidth: 1100, animation: "fadeUp 1s ease" }}>
          <img src="/brand/emblem-full.png" alt="" style={{ width: 96, height: 96, margin: "0 auto 14px", filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.25))" }} className="float-anim" />

          <div className="eyebrow" style={{ color: "rgba(255,255,255,0.85)", marginBottom: 14 }}>
            ✦ Bayúng Danum ✦ The New Waters
          </div>

          <h1 className="display" style={{
            fontSize: "clamp(44px, 9vw, 104px)",
            fontWeight: 900,
            lineHeight: 0.9,
            color: "#fff",
            textTransform: "uppercase",
            letterSpacing: -2,
            textShadow: "0 8px 50px rgba(0,0,0,0.25)",
            marginBottom: 10,
          }}>
            <span style={{ color: COLORS.orange, display: "block" }}>Pradera</span>
            <span style={{ color: COLORS.orange }}>Islands</span>
          </h1>
          <svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid meet" style={{ width: "clamp(280px, 68vw, 760px)", height: "auto", display: "block", margin: "0 auto 20px" }} aria-label="Waterpark">
            <defs>
              <mask id="wp-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="900" height="140">
                <rect width="900" height="140" fill="black" />
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
            Inspired by <strong style={{ color: COLORS.orange, fontWeight: 600 }}>Bayúng Danum</strong> — the arrival of new waters. A vibrant playground of movement, community, and shared joy in the heart of Pampanga.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-ghost" onClick={() => scrollTo("attractions")}>Explore Attractions</button>
            <button className="btn-ghost" onClick={() => scrollTo("visit")}>Plan Your Visit</button>
          </div>
        </div>

      </section>

      {/* BRAND STORY */}
      <section className="section-pad" style={{ background: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, right: -120, width: 520, height: 520, background: `radial-gradient(circle, ${COLORS.orange}15 0%, transparent 70%)`, borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, background: `radial-gradient(circle, ${COLORS.azure}18 0%, transparent 70%)`, borderRadius: "50%" }} />

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
              <p className="body" style={{ fontSize: 17, color: "#3a3a4a", marginBottom: 40 }}>
                It is a vibrant playground of movement and community, where everyone is invited to splash, flow, and celebrate together.
              </p>
              <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
                {[["11+", "Attractions"], ["4", "Dining Spots"], ["∞", "Memories"]].map(([n, l]) => (
                  <div key={l}>
                    <div className="display" style={{ fontSize: 44, fontWeight: 900, color: COLORS.orange, lineHeight: 1 }}>{n}</div>
                    <div className="eyebrow" style={{ color: "#888", marginTop: 6 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{
                background: GRADIENTS.deep,
                borderRadius: 28,
                padding: 48,
                color: "#fff",
                position: "relative",
                overflow: "hidden",
                boxShadow: `0 30px 80px ${COLORS.dagat}30`,
              }}>
                <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, background: "rgba(255,255,255,0.06)", borderRadius: "50%" }} />
                <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, background: `${COLORS.azure}25`, borderRadius: "50%" }} />
                <img src="/brand/emblem-full.png" alt="" style={{ width: 88, height: 88, marginBottom: 20, filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.3))" }} className="float-anim" />
                <h3 className="display" style={{ fontSize: 30, fontWeight: 800, marginBottom: 14, textTransform: "uppercase", letterSpacing: -0.5 }}>Bayúng Danum</h3>
                <p className="body" style={{ fontSize: 15, opacity: 0.88, marginBottom: 24 }}>
                  "New Water" in Kapampangan — a traditional celebration marking the arrival of new waters, symbolizing renewal, purification, and the coming of abundance and prosperity.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Renewal", "Flow", "Community", "Celebration", "Dawn"].map(tag => (
                    <span key={tag} className="eyebrow" style={{ background: "rgba(255,255,255,0.12)", padding: "6px 14px", borderRadius: 999, fontSize: 10, color: "#fff" }}>{tag}</span>
                  ))}
                </div>
              </div>

              <div style={{
                position: "absolute", bottom: -28, left: -28,
                background: GRADIENTS.sunset,
                borderRadius: 20, padding: "20px 24px", color: "#fff",
                boxShadow: `0 14px 40px ${COLORS.orange}55`,
                animation: "float 5s ease-in-out infinite",
              }}>
                <div className="eyebrow" style={{ color: "rgba(255,255,255,0.8)", fontSize: 9 }}>Located In</div>
                <div className="display" style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1, marginTop: 4 }}>PAMPANGA · CENTRAL LUZON</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ATTRACTIONS */}
      <section id="attractions" className="section-pad" style={{
        background: `linear-gradient(180deg, #f4f7ff 0%, #fff 100%)`,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>The Rides</div>
            <h2 className="display" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, textTransform: "uppercase", color: COLORS.hiraya, lineHeight: 1 }}>
              Our <span style={{ color: COLORS.dagat }}>Attractions</span>
            </h2>
            <p className="body" style={{ fontSize: 17, color: "#55566a", maxWidth: 560, margin: "20px auto 0" }}>
              From high-speed plunges to lazy drifts — every ride tells the story of water, wind, and celebration.
            </p>
          </div>

          <div className="grid-cards">
            {attractions.map((a) => (
              <div key={a.name} className="card" style={{
                background: "#fff",
                borderRadius: 24,
                padding: 0,
                overflow: "hidden",
                border: "1px solid #eaecf4",
              }}>
                <div style={{
                  height: 140,
                  background: `linear-gradient(135deg, ${a.color} 0%, ${a.color}cc 100%)`,
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <svg viewBox="0 0 400 140" style={{ position: "absolute", bottom: 0, width: "100%", height: "60%" }} preserveAspectRatio="none">
                    <path d="M0,80 C80,40 160,110 240,70 C320,30 360,90 400,70 L400,140 L0,140 Z" fill="rgba(255,255,255,0.18)" />
                    <path d="M0,100 C100,70 180,130 280,95 C360,70 380,110 400,100 L400,140 L0,140 Z" fill="rgba(255,255,255,0.14)" />
                  </svg>
                  <span className="eyebrow" style={{
                    position: "absolute", top: 18, left: 20,
                    background: "rgba(255,255,255,0.22)", color: "#fff",
                    padding: "6px 12px", borderRadius: 999, fontSize: 10,
                    backdropFilter: "blur(8px)",
                  }}>{a.theme}</span>
                </div>
                <div style={{ padding: 26 }}>
                  <h3 className="display" style={{ fontSize: 22, fontWeight: 800, textTransform: "uppercase", color: COLORS.hiraya, marginBottom: 10, lineHeight: 1.1, letterSpacing: -0.3 }}>
                    {a.name}
                  </h3>
                  <p className="body" style={{ fontSize: 14, color: "#55566a" }}>{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DINING */}
      <section id="dining" className="section-pad" style={{
        background: GRADIENTS.deep,
        position: "relative",
        overflow: "hidden",
        color: "#fff",
      }}>
        <div style={{ position: "absolute", top: -120, left: -120, width: 480, height: 480, background: `radial-gradient(circle, ${COLORS.orange}25 0%, transparent 70%)`, borderRadius: "50%", filter: "blur(20px)" }} />
        <div style={{ position: "absolute", bottom: -120, right: -120, width: 560, height: 560, background: `radial-gradient(circle, ${COLORS.azure}18 0%, transparent 70%)`, borderRadius: "50%", filter: "blur(20px)" }} />

        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Food & Drinks</div>
            <h2 className="display" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, textTransform: "uppercase", color: "#fff", lineHeight: 1 }}>
              Dining at <span style={{ color: COLORS.orange }}>Pradera</span>
            </h2>
            <p className="body" style={{ fontSize: 17, color: "rgba(255,255,255,0.72)", maxWidth: 560, margin: "20px auto 0" }}>
              Sun-themed, sunrise-warm. From full meals to quick bites and ice-cold drinks — we have you covered.
            </p>
          </div>

          <div className="grid-cards">
            {fnb.map((f) => (
              <div key={f.name} className="card" style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 24,
                padding: 32,
                position: "relative",
                overflow: "hidden",
              }}>
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
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 14 }}>Meet the Crew</div>
            <h2 className="display" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, textTransform: "uppercase", color: COLORS.hiraya, lineHeight: 1 }}>
              Park <span style={{ color: COLORS.dagat }}>Characters</span>
            </h2>
            <p className="body" style={{ fontSize: 17, color: "#55566a", maxWidth: 560, margin: "20px auto 0" }}>
              Guardians of the waters, spirits of the river — meet the vibrant characters of Pradera Islands.
            </p>
          </div>

          <div className="grid-cards">
            {characters.map((c) => (
              <div key={c.name} className="card" style={{
                borderRadius: 28,
                overflow: "hidden",
                border: `1px solid ${c.color}30`,
                background: "#fff",
              }}>
                <div style={{
                  background: `linear-gradient(160deg, ${c.color} 0%, ${c.color}88 100%)`,
                  padding: c.image ? "28px 20px 20px" : "56px 24px 44px",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                  minHeight: c.image ? 280 : 200,
                }}>
                  <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, background: "rgba(255,255,255,0.12)", borderRadius: "50%" }} />
                  <div style={{ position: "absolute", bottom: -40, left: -40, width: 120, height: 120, background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
                  {c.image ? (
                    <img src={c.image} alt={c.name} style={{ width: "100%", maxWidth: 220, height: "auto", display: "block", margin: "0 auto", position: "relative", zIndex: 1, filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.25))" }} className="float-anim" />
                  ) : (
                    <svg viewBox="0 0 80 80" width="80" height="80" style={{ margin: "0 auto", position: "relative", zIndex: 1, filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.2))" }} className="float-anim">
                      <circle cx="40" cy="40" r="32" fill="rgba(255,255,255,0.2)" />
                      <circle cx="40" cy="40" r="20" fill="#fff" opacity="0.9" />
                      <text x="40" y="52" textAnchor="middle" fontSize="28" fontWeight="900" fill={c.color} fontFamily="Kanit, sans-serif">{c.name[0]}</text>
                    </svg>
                  )}
                  <div className="eyebrow" style={{ color: "rgba(255,255,255,0.85)", marginTop: 16, fontSize: 10, position: "relative", zIndex: 1 }}>{c.role}</div>
                </div>
                <div style={{ padding: 28 }}>
                  <h3 className="display" style={{ fontSize: 24, fontWeight: 900, textTransform: "uppercase", color: COLORS.hiraya, marginBottom: 12, letterSpacing: -0.3 }}>{c.name}</h3>
                  <p className="body" style={{ fontSize: 14, color: "#55566a" }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "100px 6%",
        background: GRADIENTS.main,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)" }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 800, margin: "0 auto" }}>
          <img src="/brand/emblem-full.png" alt="" style={{ width: 80, height: 80, margin: "0 auto 24px", filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.25))" }} className="float-anim" />
          <h2 className="display" style={{ fontSize: "clamp(34px, 6vw, 64px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", marginBottom: 18, letterSpacing: -1, lineHeight: 1 }}>
            The New Waters Await
          </h2>
          <p className="body" style={{ fontSize: 18, color: "rgba(255,255,255,0.9)", marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" }}>
            Splash, flow, and celebrate at Pradera Islands Waterpark — Central Luzon's most vibrant water destination.
          </p>
          <button className="btn-ghost" onClick={() => scrollTo("visit")}>Get in Touch</button>
        </div>
      </section>

      {/* VISIT / CONTACT */}
      <section id="visit" className="section-pad" style={{
        background: "#05050f",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.sunset}, ${COLORS.janjan}, ${COLORS.azure}, ${COLORS.dagat})` }} />
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="grid-2">
            <div>
              <div className="eyebrow" style={{ color: COLORS.orange, marginBottom: 16 }}>Find Us</div>
              <h2 className="display" style={{ fontSize: "clamp(40px, 5vw, 60px)", fontWeight: 900, textTransform: "uppercase", marginBottom: 28, lineHeight: 0.95, color: "#fff" }}>
                Visit<br /><span style={{ color: COLORS.azure }}>Pradera</span>
              </h2>
              <p className="body" style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", marginBottom: 36 }}>
                Located in the vibrant heartland of Pampanga, Central Luzon — Pradera Islands Waterpark is the new premier destination for water, fun, and community celebration.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Location", val: "Pradera Verde, Lubao, Pampanga", c: COLORS.orange, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Pradera Water Park, VGF4+X6V, Pradera Verde, Lubao, Pampanga")}` },
                  { label: "Email", val: "hello@praderaislands.com", c: COLORS.azure, href: null },
                  { label: "Website", val: "praderaislands.com", c: COLORS.janjan, href: null },
                ].map(({ label, val, c, href }) => {
                  const rowStyle = { display: "flex", alignItems: "center", gap: 18, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", textDecoration: "none", cursor: href ? "pointer" : "default", transition: "background 0.2s" };
                  const body = (
                    <>
                      <div style={{ width: 6, height: 40, background: c, borderRadius: 3, flexShrink: 0 }} />
                      <div>
                        <div className="eyebrow" style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>{label}</div>
                        <div className="body" style={{ fontSize: 15, color: "#fff", fontWeight: 500, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 8 }}>
                          {val}
                          {href && <span style={{ color: c, fontSize: 13, fontFamily: "'Kanit', sans-serif", fontWeight: 700, letterSpacing: 1 }}>VIEW MAP ↗</span>}
                        </div>
                      </div>
                    </>
                  );
                  return href
                    ? <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={rowStyle}>{body}</a>
                    : <div key={label} style={rowStyle}>{body}</div>;
                })}
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 28, padding: 44,
            }}>
              <h3 className="display" style={{ fontSize: 24, fontWeight: 800, textTransform: "uppercase", marginBottom: 28, letterSpacing: -0.3 }}>Send a Message</h3>
              {formState === "sent" ? (
                <div style={{ padding: "32px 24px", textAlign: "center", background: `${COLORS.azure}18`, border: `1px solid ${COLORS.azure}40`, borderRadius: 14 }}>
                  <div className="display" style={{ fontSize: 20, fontWeight: 800, color: COLORS.azure, marginBottom: 8 }}>Message sent!</div>
                  <p className="body" style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Thank you — we'll get back to you soon.</p>
                  <button className="btn-ghost" style={{ marginTop: 20, padding: "10px 24px", fontSize: 12 }} onClick={() => setFormState("idle")}>Send another</button>
                </div>
              ) : (
                <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <input type="hidden" name="form-name" value="contact" />
                  <p hidden><label>Don't fill this out: <input name="bot-field" onChange={() => {}} /></label></p>
                  {[
                    { name: "name", placeholder: "Your Name", type: "text" },
                    { name: "email", placeholder: "Email Address", type: "email" },
                    { name: "message", placeholder: "Message", type: "textarea" },
                  ].map((f) => {
                    const inputStyle = {
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 14,
                      padding: "16px 20px",
                      color: "#fff",
                      fontSize: 15,
                      fontFamily: "'Montserrat', sans-serif",
                      outline: "none",
                      transition: "border-color 0.2s",
                      width: "100%",
                    };
                    return f.type === "textarea" ? (
                      <textarea key={f.name} name={f.name} placeholder={f.placeholder} rows={4} required value={form[f.name]} onChange={handleFormChange} style={{ ...inputStyle, resize: "none" }} />
                    ) : (
                      <input key={f.name} name={f.name} type={f.type} placeholder={f.placeholder} required value={form[f.name]} onChange={handleFormChange} style={inputStyle} />
                    );
                  })}
                  <button type="submit" className="btn-primary" disabled={formState === "sending"} style={{ marginTop: 8, opacity: formState === "sending" ? 0.6 : 1, cursor: formState === "sending" ? "wait" : "pointer" }}>
                    {formState === "sending" ? "Sending…" : "Send Message"}
                  </button>
                  {formState === "error" && <div className="body" style={{ fontSize: 13, color: COLORS.sunset, marginTop: 4 }}>Something went wrong. Please try again or email us directly.</div>}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

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
              url: null,
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
              url: null,
              accent: "#25F4EE",
              path: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.58 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.62-.1z" />,
            },
          ].map(({ name, url, accent, path }) => {
            const iconStyle = {
              width: 44, height: 44, borderRadius: "50%",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: url ? "#fff" : "rgba(255,255,255,0.3)",
              textDecoration: "none",
              cursor: url ? "pointer" : "not-allowed",
              transition: "transform 0.25s cubic-bezier(.2,.8,.2,1), background 0.25s, border-color 0.25s, box-shadow 0.25s",
              backdropFilter: "blur(6px)",
            };
            const svg = (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">{path}</svg>
            );
            return url ? (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name}
                style={iconStyle}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-3px) scale(1.08)";
                  e.currentTarget.style.background = accent;
                  e.currentTarget.style.borderColor = accent;
                  e.currentTarget.style.boxShadow = `0 12px 28px ${accent}55`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.boxShadow = "none";
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
    </div>
  );
}
