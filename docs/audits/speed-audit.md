# 10 — Speed (Perceived Performance) Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Core Web Vitals targets (2026)

| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP | ≤2.5s | 2.5–4.0s | >4s |
| INP | ≤200ms | 200–500ms | >500ms |
| CLS | ≤0.1 | 0.1–0.25 | >0.25 |

*INP replaced FID as a Core Web Vital in March 2024.*

---

## Findings

### SPD-01 — Positive — Firebase Hosting CDN + immutable asset caching
`firebase.json` correctly sets `max-age=31536000, immutable` for hashed static assets and `no-cache` for `index.html`. This means returning users get instant cache hits on JS/CSS bundles. No action needed.

### SPD-02 — Positive — Firestore persistent local cache = instant re-renders
On revisit, Firestore serves from the IndexedDB cache before the network responds. The app appears interactive immediately. This is the main reason perceived performance is good on beach LTE. No action needed.

### SPD-03 — Low — No loading skeleton for initial auth check
On first load, `App.jsx` shows a plain loading indicator while Firebase Auth resolves (`loading` state). The loader was improved (branded boot loader per commit `3bc1ba8`), but there's no skeleton for the tab content that appears after auth. On a cold 4G connection this could produce a 1–2 second blank-screen gap.

**Fix:** Add a minimal skeleton (grey pulse bars) beneath the loader for the first paint. Low priority — most users install the PWA and subsequent loads are near-instant.

### SPD-04 — Positive — View Transitions API for tab navigation
Tab switches use `document.startViewTransition` with a `flushSync` + React state update — correct pattern that gives native-app-feel transitions without layout thrash. Good.

### SPD-05 — Informational — NWS weather adds 2 network round-trips on first load
`useWeather` fires 2 sequential fetches (points → forecast URL → periods) in the background. These don't block render. The 2-hour localStorage cache means subsequent loads skip both fetches entirely. No user-visible impact.

---

## Overall

Perceived performance is good for this app's context. Firebase Hosting CDN, persistent Firestore cache, and View Transitions are all working correctly. No pre-trip action items.
