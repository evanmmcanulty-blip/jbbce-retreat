# 00.3 — Remediation Plan

**Date:** 2026-06-15 · **Commit:** c7a6024

Sequenced by: must-do-before-trip → nice-to-have-before-trip → post-trip.

No issue tracker is configured (solo dev, private repo). Items are tracked here and in `findings.md`.

---

## P0 — Must fix before Jun 29 (trip start)

### P0-A — Deploy Firestore rules (blocks gear list)
**Fixes:** SEC-01, SEC-02, SEC-03, SEC-06, SEC-07, OPS-01

The gear collection rules added 2026-06-15 (and all prior rules fixes from 2026-06-12) have not been deployed to production.

**Steps:**
1. `firebase deploy --only firestore:rules,storage`
2. Brandon: toggle `accountant` on for Chris in Settings → Admin tab
3. Smoke test: add a gear item (should succeed), verify a non-admin can't edit `config/cost`

**Owner:** Evan (deploy) + Brandon (accountant toggle)

---

### P0-B — Commit pending changes
**Fixes:** ENG-03, ENG-04

`firebase.json` and `src/App.jsx` are modified but not committed. The new features (weather, countdown, gear list, album/findmy links) are in these files.

**Steps:**
1. Review `git diff` for anything unintended
2. `git add firebase.json src/App.jsx` (and any other modified src files)
3. `git commit -m "feat: weather, countdown, gear list, album+findmy links"`

---

### P0-C — Fix `.gitignore` for `.firebase/` cache
**Fixes:** ENG-02

**Steps:**
1. Add `.firebase/` to `.gitignore`
2. `git rm --cached .firebase/hosting.YnVpbGQ.cache`

---

## P1 — Nice to have before trip (low-effort)

### P1-A — Fix vote toggle to use `deleteField()`
**Fixes:** WRK-02

**File:** `src/pages/EventsPage.jsx` — IdeasSidebar vote buttons

Replace `null` in the merge update with `deleteField()`:
```js
import { deleteField } from 'firebase/firestore';
// ...
{ [`votes.${profile.uid}`]: mv === 'yes' ? deleteField() : 'yes' }
```
Same for the "No" branch. 5-minute fix.

---

### P1-B — Delete dead code `AvatarRow.jsx`
**Fixes:** RCN-03

`git rm src/components/AvatarRow.jsx`

---

### P1-C — Add `aria-label` to settings nav button
**Fixes:** ACC-04

1-line change in `App.jsx`: add `aria-label="Settings"` to the icon button.

---

### P1-D — Add `aria-label` to Avatar component
**Fixes:** ACC-03

In `Avatar.jsx`: add `aria-label={user.displayName}` to the outer element.

---

### P1-E — Add domain validation for shared album URL
**Fixes:** GAP-05

In `InfoPage.jsx` `saveAlbum()`: wrap with `safeUrl()` and add an `icloud.com` check before calling `setDoc`.

---

### P1-F — Write `DEPLOY.md`
**Fixes:** DOC-01, ENG-01, OPS-02, OPS-03

5–10 lines covering: deploy order (rules first), rollback path (Firebase Console → Releases), accountant migration note.

---

## P2 — Post-trip improvements

| Item | Finding | Effort |
|---|---|---|
| Migrate CRA → Vite | DEP-03, MOD-01 | 1-2 hours |
| Upgrade Firebase SDK 10 → 12 | DEP-02 | 2-4 hours (read migration guide) |
| Add `costEngine.js` unit tests | TST-01 | 30 minutes |
| Add Firestore rules emulator tests | TST-02 | 2 hours |
| Lift `users` into a context provider | ARC-02 | 1 hour |
| Replace `window.confirm` with inline confirm | ACC-01, RCN-04 | 1 hour |
| Add modal focus trap (`inert` attr) | ACC-02, MOD-02 | 15 minutes |
| Add SW update banner | PWA-02 | 1 hour |
| Add iOS PWA install prompt | PWA-01, GAP-03 | 30 minutes |
| Add empty states to list views | UX-01 | 30 minutes |
| Replace `alert()` with toast for errors | UX-02 | 1 hour |
| Add offline indicator banner | GAP-02 | 30 minutes |
| Add admin "Archive trip" data deletion | PRV-02 | 2 hours |
| Create project-level `CLAUDE.md` | DOC-02 | 15 minutes |
| Switch Cloud Functions to structured logging | OPS-06 | 15 minutes |
| Darken `--muted` color for contrast | ACC-06 | 5 minutes |
| Split `EventsPage.jsx` into sub-modules | ARC-01 | 2-3 hours |
| Upgrade React 18 → 19 | MOD-03 | 2-4 hours |
