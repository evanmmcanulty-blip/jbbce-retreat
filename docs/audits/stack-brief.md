# 01.5 — Stack-Specific Brief

**Date:** 2026-06-15 · **Commit:** c7a6024

Compiled at audit-time. Consumed by downstream modules (02 Security, 11 Serverless, 12 DevOps, 13 Cost).

---

## Firebase (Web SDK 10.14.1 / Admin SDK 12.6.x)

### Firestore security rules
- `me()` helper calls `get()` on every rules evaluation — a conditional read that counts toward Firestore read quota. At 12 users with light traffic this is negligible. At scale, replace with custom claims.
- `diff().affectedKeys().hasOnly([...])` is the correct field-scope guard pattern. Used correctly in this codebase.
- Rules version is `rules_version = '2'` — the only supported version as of 2026.
- `isSignedIn()` alone is NOT sufficient for approved-only data; the codebase correctly uses `isApproved()` for all trip data.

### Firestore offline cache
- `persistentLocalCache` + `persistentMultipleTabManager` is configured — writes queue when offline and sync on reconnect. Correct for a beach trip with spotty LTE.
- Known gotcha: offline writes silently queue then fail at sync time if rules deny them. The global `unhandledrejection` handler in `index.js` surfaces these.

### Firebase Auth (email/password)
- No social login, no magic links. Fine for a trusted-invite group.
- `approved` field is the app-level gate, enforced in rules. Firebase Auth itself has no knowledge of approval state.

### Firebase Storage
- Rules restrict uploads to `receipts/` path, images only, ≤10 MB. Correct.
- **Gap:** read is gated on `request.auth != null` (any authenticated Firebase user), not `isApproved()`. Any Firebase user who knows the bucket name can read receipt photos.

### Firebase Functions v2
- Node 20, `us-central1`, `maxInstances: 5`.
- `sendEachForMulticast` replaces deprecated `sendMulticast` — correct for SDK 12.x.
- Dead-token cleanup runs inline after each send — correct pattern.
- No retry configuration — FCM failures (network timeouts) are not retried. Acceptable for best-effort notifications.

### Firebase Hosting
- Cache headers configured correctly: `no-cache` for HTML, `max-age=31536000, immutable` for hashed assets.
- SPA rewrite `**` → `/index.html` — correct.

### Firebase FCM / Web Push
- VAPID key is the public Web Push application server key — safe in client code. Sending uses server-side VAPID via Admin SDK (private key in Firebase Functions environment).
- `isSupported()` check before `getMessaging()` — correct pattern for cross-browser compat.
- iOS requires installed PWA for push — correctly gated in `push.js` with `isInstalledPWA()` check.

---

## React / CRA

- CRA (`react-scripts` 5.0.1) is effectively EOL. The upstream `create-react-app` org is archived. Security advisories in build-time dependencies (nth-check, postcss, serialize-javascript) will not be patched upstream. **Migration target: Vite.** Post-trip.
- React 18.3.1 with `flushSync` for View Transitions — correct usage pattern.
- `document.startViewTransition` is used with a `.catch(() => {})` on `.finished` — correct; aborted transitions reject the promise by design.

---

## NWS Weather API (api.weather.gov)

- Free US government API, no key required.
- Two-step: `points/{lat},{lon}` → forecast URL → daily periods.
- Known reliability: occasional 500s and slow responses during weather events. The `useWeather.js` hook catches all errors and falls back to `WEATHER_AVG` — correct.
- User-Agent header sent (required by NWS fair-use policy).
- Cache: localStorage, 2-hour TTL. Falls back silently.
- 7-day forecast window: only covers ~7 of the 13 trip days until we're close. Days beyond the window fall back to `WEATHER_AVG` — expected and handled.

---

## Google Maps Places API

- Currently commented out in `public/index.html`. `PlaceInput.jsx` degrades to a plain text input.
- If enabled: restrict API key to `https://provincetown-2026.web.app/*` (documented in SETUP.md). The key would be visible in client HTML — acceptable only when domain-restricted.
- Enabling it requires uncommenting the `<script>` tag and providing a real key. No code changes needed.
