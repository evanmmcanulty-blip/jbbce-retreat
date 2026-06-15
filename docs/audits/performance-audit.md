# 09 — Performance & Scalability Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

**Scale context:** 12 users max, ~13 days of active use. Scalability findings are calibrated accordingly — Firestore quotas that would matter at 10k users are irrelevant here.

---

## Firestore query patterns

All Firestore reads are `onSnapshot` listeners on full collections (no `where` clauses, no pagination). This is correct and efficient for:
- `users` — 12 docs, ~1 KB each
- `events` — ~50 docs max
- `receipts` — ~100 docs max
- `gear`, `groceries`, `bulletins` — small collections

No compound queries, no cross-collection joins. `firestore.indexes.json` is empty (correct — no custom indexes needed).

### PERF-01 — Informational — Full-collection reads are fine at this scale
At 12 users and a few hundred documents total, full-collection `onSnapshot` reads are optimal — a `where` clause would add latency without reducing data transferred. No action needed.

---

## Offline / cache behavior

`persistentLocalCache` is configured. On LTE with spotty connectivity (beach house), the app renders from local cache instantly and syncs in the background. This is the right architecture for the use case.

---

## Bundle size

CRA produces a single-chunk bundle. With React 18, Firebase modular SDK (tree-shaken), and lucide-react, the gzipped bundle is estimated at 200–350 KB. No code splitting is configured.

### PERF-02 — Low — No code splitting
All 6 page components load on app boot. For a 6-page app on modern devices with Firebase Hosting CDN, this adds ~0ms perceived latency (the bundle is small enough that splitting would cost more in HTTP round-trips than it saves). No action needed for this use case.

---

## Real-time listeners

6 simultaneous `onSnapshot` listeners for `users` (see ARC-02 in architecture audit). At Firebase's free tier (1 concurrent connection = 1 persistent WebSocket), all 6 listeners share one WebSocket multiplexed connection. No scaling concern.

---

## Overall

Performance is appropriate for a 12-user private app. No action items before the trip.
