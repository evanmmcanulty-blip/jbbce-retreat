# Findings Catalog — jbbce-retreat

Date: 2026-06-12 · Commit: a7dc4e1 · Partial audit (security module only).

| ID | Severity | Finding | Status |
|---|---|---|---|
| SEC-01 | Critical | Self-service admin escalation via /users write rule | Fixed in code 2026-06-12 — **rules deploy pending** |
| SEC-02 | Critical | Catch-all Firestore write rule (config, payments, votes, deletes) | Fixed in code 2026-06-12 — **rules deploy pending** |
| SEC-03 | High | Accountant gate by displayName substring | Fixed — accountant flag; **Brandon must flag Chris after deploy** |
| SEC-04 | High | Silent write failures, no offline persistence | Fixed — local cache + global rejection alert |
| SEC-05 | Medium | javascript: URL injection in user-supplied links | Fixed — safeUrl() http(s) allowlist |
| SEC-06 | Medium | Storage rules unbounded (any path/size/type) | Fixed in code — **rules deploy pending** |

## Remediation (draft only — no tickets filed; no remote/tracker on this repo)
1. Deploy rules: `firebase deploy --only firestore:rules,storage` (owner action).
2. Toggle `accountant` on for Chris in Settings → Admin (Brandon).
3. Smoke-test post-deploy: non-admin denied on config/cost edit; payment
   confirm denied for non-accountant; RSVP/vote/receipt flows still work.
