# 03 — Privacy & Data Protection Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

**Scope calibration:** Private app, 12 known individuals, no minors, no payments processed (Venmo/Apple Cash are external), no health data, no commercial relationship. Enterprise privacy frameworks (GDPR, CCPA, PIPEDA) do not apply — there is no business collecting data, no data subject rights workflow required. Assessment focuses on data minimization, exposure scope, and what survives the trip.

---

## What personal data is stored

| Field | Collection | Visible to | Notes |
|---|---|---|---|
| Email | `users/{uid}` (Firebase Auth + doc) | Approved users read their own doc; admins see all | Stored in both Auth and Firestore |
| Display name | `users/{uid}` | All approved users | User-set |
| Full name | `users/{uid}` | All approved users | Optional, for receipts |
| Avatar emoji | `users/{uid}` | All approved users | Non-identifying |
| Phone number | `users/{uid}` | All approved users | Stored as digits only. Used for Apple Cash link |
| Venmo handle | `users/{uid}` | All approved users | Used for payment deep link |
| Room assignment | `users/{uid}` | All approved users | |
| Arrival/departure dates | `users/{uid}` | All approved users | |
| FCM push tokens | `users/{uid}` (fcmTokens array) | Admin only (rules allow admin read of all users) | Rotated on token invalidation |
| Receipt photos | Firebase Storage | Any Firebase-authenticated user (see SEC-08) | |
| Payment amounts | `payments/{uid}` | All approved users | What each person sent / what was confirmed |
| Receipts (amounts, descriptions) | `receipts/{id}` | All approved users | |

## Findings

### PRV-01 — Low — Phone numbers and Venmo handles visible to all approved users
Both `phone` and `venmoHandle` are readable by any approved user. This is intentional (one-tap payback requires the handle/number), but users should be aware their financial contact info is shared with the group. This is adequately covered by the context (trusted group of friends), not a defect.

**Recommendation:** Add a disclosure line in the Settings → My Profile UI: "Your Venmo handle and phone are shared with the group for payments." No code required; copy change only.

### PRV-02 — Low — No data deletion path
User profiles, receipts, bulletins, and payment records persist indefinitely in Firebase after the trip ends. There is no account deletion flow, no data retention policy, and no scheduled purge.

**Recommendation:** Add an admin "Archive trip" function post-trip that exports a backup and deletes all collections. Not urgent before Jun 29 but worth doing by Aug 2026.

### PRV-03 — Informational — FCM tokens
Push tokens stored in `fcmTokens[]` on each user doc. Tokens are Firebase-generated pseudonymous identifiers. Dead tokens are cleaned up after send failures. No action required.

### PRV-04 — Informational — Firebase is the data processor
All data resides in Google Firebase (`us-central1`). Firebase's sub-processor list and DPA are available at firebase.google.com. For 12 friends using a private app, this creates no obligations.

## Out of scope
GDPR data subject rights, breach notification procedures, CCPA opt-out — all N/A for this use case.
