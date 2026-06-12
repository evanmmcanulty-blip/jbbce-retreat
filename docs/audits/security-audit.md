# Security Audit — jbbce-retreat

Date: 2026-06-12 · Commit: a7dc4e1 · Scope: partial (module 02), per request —
Firestore/storage rules, auth/admin gating, silent write failures, money-math
correctness. Enterprise compliance modules intentionally skipped (9-user
private app). Live Discovery (OWASP fetch) skipped — findings below are
rules/logic defects observable directly in the code, not framework-currency
items.

## Findings

### SEC-01 — Critical — Self-service privilege escalation
`firestore.rules` `/users/{uid}` allowed `write: if request.auth.uid == uid`
with no field guard. Any guest could set `admin: true` (or `accountant: true`)
on their own doc from the browser console and gain full admin powers.
**Fix:** privilege fields (`admin`, `accountant`) only changeable by an
existing admin; signup may set `admin: true` only when the auth token email is
the designated admin's.

### SEC-02 — Critical — Catch-all write rule
`match /{collection}/{doc} { allow write: if isSignedIn(); }` let any guest:
edit `config/cost` (changes everyone's owed rent), write `confirmed` on their
own `payments/{uid}` doc (the accountant's job), overwrite other users' meal
votes / RSVPs, and delete any event, receipt, or bulletin. The UI implies
ownership rules the database never enforced.
**Fix:** per-collection rules mirroring the UI's ownership model (see
firestore.rules). Collaborative surfaces (ideas editing, grocery claiming,
bulletin got-it) intentionally stay open to all signed-in users — that's a
feature, now explicit instead of accidental.

### SEC-03 — High — Accountant gate by display-name substring
`HousePage.jsx:15` — `displayName.toLowerCase().includes('chris')` grants
payment-confirm powers. Display names are self-editable: anyone can become
"chris", and Chris loses access if he goes by anything else.
**Fix:** explicit `accountant` flag on the user doc, toggled by admin in
Settings → Admin, enforced both in UI and rules. **Migration step: Brandon
must toggle "accountant" on for Chris after deploy.**

### SEC-04 — High — Silent write failures
No `updateDoc`/`addDoc` call in the app handles rejection; Firestore offline
persistence was not enabled. On flaky LTE, or any rules denial, an RSVP /
vote / payment log fails silently.
**Fix:** (a) persistent local cache (`persistentLocalCache`) so offline writes
queue and sync; (b) global `unhandledrejection` listener that alerts on
FirebaseError so denials are never silent.

### SEC-05 — Medium — javascript: URL injection
`ev.url`, `idea.url`, and custom info links render user input directly into
`href`. A `javascript:` URL executes on click. Low realistic risk among 9
friends; trivial to close.
**Fix:** `safeUrl()` helper — only `http(s)://` URLs render as links.

### SEC-06 — Medium — Storage rules unbounded
Any authed user could write any path, any size, any content type.
**Fix:** writes restricted to `receipts/`, images only, under 10 MB.

### Money-math review — no defects found
`costEngine.calcOwed` (per-night, per-room, absorption of empty rooms),
even/manual receipt splits, Settle Up netting, and Payments balances are
internally consistent. Empty-room absorption is intentional and documented in
the UI. Default `baseRent: 12000` placeholder renders real-looking numbers
before `config/cost` is set — acceptable; admin-editable, flagged in UI copy.

### Not findings
Firebase web config/API key in the bundle is public by design (security is the
rules, which is why SEC-01/02 mattered). React escapes rendered text (no XSS
beyond SEC-05).

## Deploy note
Rules changes require `firebase deploy --only firestore:rules,storage` from an
authenticated machine — **not yet deployed; manual step.**

## Out of scope / inconclusive
No test infrastructure exists; rules-emulator tests would be the right guard
but are heavier than this project warrants right now. Re-test manually after
deploy: a non-admin attempting to edit config/cost should be denied.
