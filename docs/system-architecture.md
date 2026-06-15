# System Architecture — jbbce-retreat

Current state as of 2026-06-15 (post-feature additions: countdown, live weather NWS, gear list, Apple album + Find My links).

## What it is
Mobile-first web app coordinating a 9-person, 13-day Provincetown house trip
(Jun 29 – Jul 11, 2026): daily schedule, meal voting, events/RSVPs, house
cost-split, shared receipts with settle-up, payments ledger, bulletin board,
groceries, local tips.

## Stack
- **Frontend:** React 18.3 (Create React App / react-scripts 5), single
  `styles.css`, Georgia-serif "resort letterhead" design system. No router —
  tab state in `App.jsx`. No TypeScript, no state library, no tests.
- **Backend:** Firebase (project `provincetown-2026`, owned by the original
  author's Google account — transfer pending):
  - **Auth** — email/password; new signups gated behind admin approval.
  - **Firestore** — collections: `users`, `events`, `ideas`, `meals`,
    `receipts`, `bulletins`, `groceries`, `infoCustom`, `payments`, `gear`,
    `config/{house,cost,links}`. Per-collection rules in `firestore.rules`
    (ownership + field-scoped updates via `diff().affectedKeys()`).
    Persistent local cache enabled (offline writes queue).
  - **Storage** — receipt photos under `receipts/`, images <10 MB only.
  - **Hosting** — serves `build/` (deploy via `npm run deploy`).

## Key seams
- `src/hooks/` — `useAuth` (auth + live profile doc), `useCollection` /
  `useDoc` (live Firestore subscriptions; pass `null` path to skip).
- `src/utils/costEngine.js` — pure money math: per-night/per-room cost split
  driven by each user's room + arrival/departure dates.
- `src/constants.js` — trip dates, rooms, meal options, formatters,
  `safeUrl()` href allowlist.
- Privilege model: `admin` (Brandon, bootstrap by email), `accountant`
  (Chris, admin-toggled), `approved` (signup gate). All three are
  rules-protected fields on `users/{uid}`.
- Global failure surface: `index.js` alerts on any unhandled FirebaseError
  rejection.

## Build & verify
`CI=true npx react-scripts build` must pass; no test suite. Dev preview:
`PORT=3001 BROWSER=none npx react-scripts start` (login page only — app is
behind prod Firebase auth).

## New hooks / utilities (2026-06-15)
- `src/hooks/useWeather.js` — NWS API fetch for Provincetown forecast; 2h
  localStorage cache; falls back to WEATHER_AVG averages silently.

## Known structural debt (accepted)
- CRA is EOL-ware; fine for this trip, migrate (Vite) only if the app gets a
  second life.
- `AvatarRow.jsx` is unused.
- px-based inline type sizes (rem conversion deferred).
- `gear` collection has no Firestore rules yet — any approved user can write
  anything. Fix: add rules before deploy (see findings).
