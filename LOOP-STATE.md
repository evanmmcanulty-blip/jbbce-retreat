# /loop state — accretive → empathize → audit → iceberg → delight

Project: ~/Code/jbbce-retreat (React+Firebase Provincetown retreat app, handed off via zip).
Goal: repeat the 5-skill cycle until no meaningful additions remain. Implement findings, commit each one.
Build check: `CI=true npx react-scripts build` (must pass before commit). App is behind prod Firebase auth — don't sign in; compile + code-read is the verification.

## Cycle 1
- [x] /accretive — DONE. Implemented Lens A: Settle Up card on ReceiptsPage (commit ce7058d).
  - Queued from accretive, NOT yet built:
    - Lens B (design treatment): time-of-day Provincetown sky gradient on Today hero (do during /delight)
    - Lens C (UX micro): receipt "Who was there?" pre-selects people present per arrival/departure dates (do during /empathize)
- [ ] /empathize — NEXT. Walk the app as: a guest mid-trip on iPhone, the admin (Brandon), the accountant (Chris), a late-arriving guest. Implement top frictions (include queued Lens C).
- [ ] /audit — codebase-audit skill; known candidates: firestore.rules catch-all allows any signed-in user to write anything incl. config/cost + payments (privilege gap); window.prompt/alert flows; admin assigned by hardcoded email in client; no error handling on Firestore writes; XSS-safe (React) but check links/urls.
- [ ] /iceberg — unknown-unknowns for "13 guys live on this app for 2 weeks": Firebase free-tier quotas, storage costs of receipt photos, lost-password mid-trip, multi-device, offline at the beach, June 29 timezone edges.
- [ ] /delight — include accretive Lens B sky treatment + micro-joy (paid-up celebration, day-strip today pulse, etc).

## Cycle 2+
Re-run lenses on the evolved app; stop when a full cycle yields no meaningful additions. Then end loop (no ScheduleWakeup) and summarize.
