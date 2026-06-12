# Ship Readiness — jbbce-retreat — 2026-06-12

Mode: `/audit ship` (modules 01 architecture, 02 security cross-ref, 08
dependencies, 06 testing, 12 devops, 16 product gaps → top findings).
Trip starts 2026-06-29.

## Verdict: **SHIP-WITH-CAVEATS**

The code is ready. Shipping is blocked only by ops actions outside the repo.

## Blockers (must happen before the trip — all owner actions, not code)
1. **Firebase console access.** Project `provincetown-2026` is owned by the
   original author. Without Owner access nothing below can happen.
2. **Deploy.** `npm run deploy` (hosting) **and**
   `firebase deploy --only firestore:rules,storage`. The two Critical security
   fixes (self-admin escalation, catch-all write rule) exist only in the repo
   until this runs.
3. **Quota plan.** If the project is on Spark, 9 users × realtime listeners
   can hit the 50K reads/day cap mid-trip → app goes dark for everyone until
   midnight PT. Enable Blaze + ~$10 GCP budget alert.

## Caveats (should do; not blocking)
- **Post-deploy smoke test** on a real iPhone: sign in, RSVP, vote a meal,
  upload a receipt, log a payment, confirm as Chris. There is no test suite;
  this 5-minute pass is the regression net. (Module 06: zero automated tests —
  rules-emulator tests would be the right investment if this app outlives the
  trip; not 17 days before it.)
- **Admin setup:** Brandon confirms his account is admin, toggles
  `accountant` for Chris, approves any pending signups, replaces the
  "set me" Wi-Fi/door-code placeholders in House Info, and sets the real
  cost line items in House → Cost Split.
- **Backup habit:** Settings → Admin → Export backup, weekly + July 11.

## Watch list (post-launch)
- **Dependencies (module 08):** npm audit: 38 advisories, 0 critical; ~all in
  react-scripts' build-time chain (nth-check, postcss, serialize-javascript)
  — not shipped to browsers. firebase 10.14→12.x and react 18→19 majors
  available; **deliberately pinned** until after the trip. CRA itself is
  EOL-ware → migrate to Vite if the app gets a second season.
- **DevOps (module 12):** no CI; build verified locally per commit. Fine for
  a 2-week single-maintainer app. `node v25` works with react-scripts 5
  today; don't upgrade Node mid-trip.
- **Product gaps (module 16):** no push notifications (people must open the
  app — the badge system mitigates); photo sharing absent (group chat covers
  it); meal-vote system trusts the admin to set finals. All accepted scope.
- Console noise from signed-out listeners — fixed 2026-06-12
  (null-path skip in useCollection).

## Top cross-module findings (ranked)
1. Rules not deployed (Critical until done) — ops blocker #2.
2. Project ownership single point of failure — ops blocker #1.
3. Spark quota blackout risk — ops blocker #3.
4. Zero automated tests — accepted; manual smoke pass is the net.
5. CRA EOL + pinned majors — post-trip migration candidate.

Live-discovery health: npm registry + audit data fetched live 2026-06-12;
OWASP fetch skipped (rules/logic audit, scale-calibrated).
