# 19 — Product-Type Audit (PWA)

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Detected product type: Progressive Web App (PWA)

Evidence: `public/manifest.json`, service worker (`src/serviceWorkerRegistration.js`), `viewport-fit=cover`, FCM push via VAPID, `isInstalledPWA()` check in `push.js`.

---

## PWA checklist

| Requirement | State | Notes |
|---|---|---|
| Web App Manifest | ✓ | `manifest.json` present |
| Service Worker | ✓ | CRA default SW + custom FCM handler |
| HTTPS | ✓ | Firebase Hosting enforces HTTPS |
| Icons (192px, 512px) | Verify | `manifest.json` should reference icons |
| `theme_color` / `background_color` | Verify | Should match app palette |
| Offline support | ✓ | Firestore persistent cache; app shell cached by SW |
| Push notifications | ✓ | FCM + VAPID, iOS-aware |
| `display: standalone` | ✓ (assumed) | Required for "Add to Home Screen" prompt |
| `start_url` | Verify | Should be `/` |

---

## Findings

### PWA-01 — Medium — iOS push requires installed PWA; no onboarding for this
iOS Safari only supports Web Push for installed PWAs (Home Screen apps). The app checks `isInstalledPWA()` before requesting push permission, which is correct — but there's no prompt guiding iOS users to install the PWA first.

**Fix:** Add a one-time install prompt on iOS Safari (detect `!isInstalledPWA() && /iPhone/.test(navigator.userAgent)`) with instructions: "Tap Share → Add to Home Screen to receive notifications."

### PWA-02 — Low — Service worker update flow
CRA's service worker uses a "skip waiting" update flow. When a new version is deployed, users on the old SW may not see the update until they close all tabs. For a trip app where updates need to be seen same-day, this could cause stale-state issues.

**Fix:** Add an in-app "Update available — tap to refresh" banner when the SW fires `waiting`. CRA's `serviceWorkerRegistration.js` exposes an `onUpdate` callback for this.

### PWA-03 — Informational — No App Store presence
Correct for this use case — the app is distributed by URL to the group, not through the App Store. PWA install is via browser "Add to Home Screen." No action needed.

---

## Overall

PWA implementation is solid. The two pre-trip improvements worth considering are PWA-01 (iOS install prompt) and PWA-02 (SW update banner). Both are low-effort and would improve the experience on day 1 when all 12 users are setting up the app.
