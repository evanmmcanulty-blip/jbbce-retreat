# Deploying this update (for Brandon) 🚀

Evan's update to the app you built — same app, plus: settle-up tab, password
reset, security hardening, offline support, backups, approval gate for new
signups, and a design glow-up. Everything below takes ~10 minutes.

## 1 — Deploy

Open Terminal, then:

```
cd path/to/jbbce-retreat        ← wherever you unzipped this folder
npm install
firebase login                  ← sign in with your Firebase Google account
npm run deploy
```

`npm run deploy` now ships **everything** — the app AND the updated security
rules. (Don't use `firebase deploy --only hosting` — that would skip the
security fixes.)

When it finishes you'll see your URL (https://provincetown-2026.web.app).

## 2 — In the app, right after deploy (you're the admin)

1. Sign in → ⚙️ → **Admin** tab
2. Tap **Make accountant** next to Chris — he needs it to confirm payments
3. **Approve** anyone sitting in "Waiting for approval" (new signups now
   need your OK so randos with the link can't see the door code)
4. Tap **Export backup** once — and again weekly + on the last day.
   This JSON file is the only backup of the money ledger.
5. House → House Info: replace the "set me" Wi-Fi/door-code placeholders
6. House → Cost Split: confirm the rent/cleaning/tax numbers are real

## 3 — In the Firebase console (one-time, 3 minutes)

1. **Add Evan** so he can help mid-trip: ⚙ Project Settings → Users and
   permissions → Add member → `evan.m.mcanulty@gmail.com` → role **Owner**
2. **Check the plan** (bottom-left of console): if it says **Spark**, upgrade
   to **Blaze** and set a budget alert at $10. The free tier can hard-cap
   mid-trip with 9 of us on it all day — the app would go dark until
   midnight. On Blaze this trip will realistically cost $0–2.

## 4 — Quick smoke test on your phone (2 minutes)

Sign in → RSVP to an event → vote a meal → upload a test receipt → delete it.
If all four work, we're golden. 🍹

---
Questions: text Evan. Technical detail lives in `docs/` if you're curious.

---

## Dev deploy runbook (Evan)

Always deploy rules before hosting to avoid a window where new features write to uncovered collections:

```bash
# Rules first, then everything else
firebase deploy --only firestore:rules,storage
firebase deploy --only hosting,functions
```

Or just `firebase deploy` — Firebase internally sequences rules before hosting.

**Post-deploy smoke tests:**
- Add a gear item as a non-admin (should succeed)
- Attempt to edit `config/cost` as a non-admin (should be denied with a FirebaseError)

**Rollback:** Firebase Console → Hosting → Releases → Roll back.
