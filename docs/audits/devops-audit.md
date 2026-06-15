# 12 — DevOps / Deployment Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Current deploy process

1. `npm run build` (local)
2. `firebase deploy` (local — deploys hosting + functions + rules)
3. Commit to `main` (no branch protection, direct push)

No CI/CD pipeline. Solo dev workflow. This is explicitly the right choice for a private trip app — a CI pipeline would add overhead with no benefit.

---

## Findings

### OPS-01 — High — Firestore rules not yet deployed post-June-15 changes
The `firestore.rules` changes from this session (adding `gear` collection rules, noted in SEC-07) have **not been deployed**. The app will silently fail all gear list writes until they are.

**Fix:** `firebase deploy --only firestore:rules,storage` from an authenticated machine before next use.

### OPS-02 — Medium — No explicit deploy order documented
Rules should be deployed before hosting to avoid a window where new features write to collections not yet covered by updated rules. This order is not documented anywhere.

**Fix:** Add `DEPLOY.md` (see DOC-01 in documentation audit).

### OPS-03 — Low — No rollback procedure documented
If a bad deploy goes to production, the recovery path (Firebase Hosting's "rollback to previous release" in the console, or re-running `firebase deploy` from the last good commit) is not written down.

**Fix:** Add a one-liner to `DEPLOY.md`: "To rollback: Firebase Console → Hosting → Releases → Roll back."

### OPS-04 — Informational — No CI/CD (intentional)
For this use case, no CI/CD is the right call. Noted as intentional. If the app is used for a future trip, a simple GitHub Actions workflow (`npm run build && firebase deploy`) would be worth adding.

### OPS-05 — Positive — Firebase Hosting release history
Firebase Hosting retains 25 previous releases automatically. Rollback is a console click. This is the effective "CD" safety net for this project.

---

## Observability

- No error monitoring (Sentry, Datadog, etc.)
- `unhandledrejection` handler logs to console and shows an in-app alert for FirebaseError — minimal but correct for a private app
- Firebase Console provides Firestore usage metrics, Auth user list, and Functions logs

**OPS-06 — Low — No structured logging in Cloud Functions**
`console.log` is used in `functions/index.js`. Firebase Cloud Logging captures these, but without structured fields (severity, traceId) they're hard to query.

**Fix:** Use `logger.log()` from `firebase-functions/logger` which emits JSON-structured logs. Low priority.

---

## Overall

The devops posture is appropriate for a solo private app. The only pre-trip action item is OPS-01 (deploy the rules fix before the trip starts).
