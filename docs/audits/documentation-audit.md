# 07 — Documentation & Onboarding Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Existing documentation

| File | Purpose | State |
|---|---|---|
| `docs/system-architecture.md` | Current-state architecture snapshot | Good; updated 2026-06-15 |
| `SETUP.md` | Local dev setup steps | Present; includes Firebase project setup, Places API key note |
| `docs/audits/` | This audit suite | Being created |

---

## Findings

### DOC-01 — Medium — No runbook for deploy
There is no document describing how to deploy the app. The deploy command (`firebase deploy`) is simple, but the order of operations matters: Firestore rules before app code (to avoid a window where new features write to uncovered collections). This is in solo-dev heads-only memory today.

**Fix:** Add a `DEPLOY.md` (5–10 lines): firebase login check, `npm run build`, `firebase deploy --only firestore:rules,storage`, then `firebase deploy --only hosting`. Include the migration step note (accountant flag for Chris).

### DOC-02 — Low — No CLAUDE.md (project-level)
There is no `CLAUDE.md` in the repo root. Project-level context for AI-assisted development (stack decisions, patterns to follow, things to avoid) must be rediscovered each session.

**Fix:** Create `CLAUDE.md` capturing: stack (React 18 / CRA / Firebase 10), key patterns (`useCollection`, `useDoc`, `safeUrl`), known debt (`gear` needs rules, `AvatarRow.jsx` is dead, firebase upgrade pending), and the pre-trip window constraint (no risky refactors before Jun 29).

### DOC-03 — Low — No ADR (Architecture Decision Records)
No ADRs exist for decisions like: CRA over Vite (historical), email/password over social login, no client-side routing, Firebase over Supabase. These decisions are reasonable but their rationale isn't recorded.

**Fix:** Not urgent. If the app gets a second season, ADRs would help a future maintainer understand why things are the way they are. Out of scope pre-trip.

---

## Overall

Documentation is lean but functional for a solo project. The highest-value addition before the trip is DOC-01 (deploy runbook) to ensure the critical `firestore:rules` fix gets deployed correctly before Jun 29.
