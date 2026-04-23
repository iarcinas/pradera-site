# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Create React App project (react-scripts 5.0.1, React 19).

- `npm start` — dev server at http://localhost:3000
- `npm run build` — production build to `build/`
- `npm test` — Jest in watch mode (via react-scripts)
- `npm test -- --watchAll=false` — single non-watch run (useful for one-shot checks)
- `npm test -- src/App.test.js` — run a single test file
- `npm test -- -t "renders learn react link"` — run tests matching a name

No separate lint command; ESLint runs as part of `react-scripts start`/`build` using the `react-app` + `react-app/jest` config in `package.json`.

## Architecture

This is a **single-page marketing site** for Pradera Islands Waterpark (Pampanga, Philippines). The entire UI lives in one file — `src/App.js` — as a single default-exported component (`PraderaIslands`). Understanding that one file ≈ understanding the site.

### Content is inline, not data-driven
Section content is declared as top-of-file constants in `src/App.js`:
- `COLORS` — the brand palette (orange / yellow / azure / lakandanum / daluyong / deep / sunset). Refer to these by name when adding sections; don't hardcode hex values.
- `attractions` — rides/slides (11 entries). Each has `{ name, desc, icon, theme, color }`.
- `fnb` — food & beverage outlets.
- `characters` — park mascots (Lakandanum, Jan-Jan, Laut, Dapu).

To add a ride or F&B item, extend the relevant array — the section below auto-renders it.

### Styling approach
- **All styles are inline `style={{...}}`** on JSX elements. There is no CSS module, Tailwind, or styled-components layer.
- The one exception is a single `<style>{`...`}</style>` block inside the component that defines `@import` for the Kanit Google Font, keyframes (`float`, `wave`, `ripple`, `fadeUp`, `shimmer`, `spin-slow`), and a handful of utility classes (`.nav-link`, `.card-hover`, `.btn-primary`, `.btn-outline`, `.wave-anim`, `.float-anim`). Reuse those classes instead of redefining the same animations inline.
- `App.css` and `index.css` exist from the CRA template but the site does not meaningfully rely on them.
- Responsive sizing uses `clamp(...)` in inline styles rather than media queries.

### Section structure
The page is one long vertical scroll with `id`-anchored sections: `home` (hero), intro/brand story, `attractions`, `dining`, `characters`, CTA banner, `contact`, footer. Navigation uses `scrollIntoView({ behavior: "smooth" })` via the local `scrollTo(id)` helper; the nav bar swaps to an opaque backdrop once `window.scrollY > 60` (tracked by `scrolled` state).

### Brand / domain context
The project theme is **Bayúng Danum** ("new water" in Kapampangan) — copy and naming lean Filipino/Kapampangan (Amihan, Habagat, Danum, Bakunawa, Lakandanum, etc.). Keep that voice when editing copy. Brand reference material (concept primer PDF, typography sample, logo guidelines) lives in `Resources/` — these are artifacts, not code, and aren't imported by the app.

### Test state
`src/App.test.js` is the unmodified CRA stub that asserts a "learn react" link exists. The real `App.js` does not render that text, so this test will fail if run. Replace or delete it when adding real tests rather than treating a failure as a regression.
