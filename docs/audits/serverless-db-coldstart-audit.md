# 11 — Serverless DB & Cold-Start Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Applicability

This module applies: the app uses Firebase Cloud Functions (Node.js, us-central1) for FCM push notifications.

---

## Findings

### SVC-01 — Positive — `maxInstances: 5` cold-start budget is appropriate
The FCM Cloud Function uses `maxInstances: 5`. At 12 users sending push notifications, peak load is trivially 1 concurrent invocation. Cold starts will occur when the function hasn't been called in ~10 minutes. Since push notifications are triggered by write events (not user-facing requests), a 1–2 second cold start delay on push delivery is invisible to users.

### SVC-02 — Positive — No connection-pool cold-start problem
This app has no serverless-to-database connection problem because Firestore is accessed via the Firebase Admin SDK in Functions, which uses a persistent gRPC connection that tolerates cold starts gracefully. The classic "too many connections" problem (PostgreSQL + serverless) does not apply here.

### SVC-03 — Low — No retry on FCM send failure
If a Cloud Functions invocation fails (network timeout, Firebase outage), the push notification is silently dropped. There's no retry queue.

**Fix:** Cloud Functions v2 supports `retry: true` on the trigger config. Adding `retry: true` to the Firestore trigger would re-attempt failed invocations. Acceptable as-is for best-effort push notifications.

### SVC-04 — Informational — Node 20 is current LTS
Firebase Functions Node 20 is the current LTS runtime (as of 2026-06-15). No action needed.

---

## Overall

The serverless layer is minimal and correct. No critical cold-start issues.
