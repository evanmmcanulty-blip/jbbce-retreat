# 23 — Reuse & Consolidation Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Findings

### RCN-01 — Low — `useCollection` and `useDoc` are solid; no duplication
The two Firestore hooks (`useCollection`, `useDoc`) are used correctly across all pages. No page re-implements snapshot listening logic inline. The pattern is clean.

### RCN-02 — Low — Avatar rendering has two slightly different callsites
`Avatar.jsx` is used in multiple places, but some callsites pass a `size` prop and others use default sizing. This is correct hook usage, not duplication. No finding.

### RCN-03 — Informational — `AvatarRow.jsx` is dead code
`src/components/AvatarRow.jsx` is exported but imported nowhere in the codebase. Safe to delete.

**Action:** `git rm src/components/AvatarRow.jsx`

### RCN-04 — Low — Delete confirmation pattern is repeated 6+ times
The pattern `if (!window.confirm('Are you sure?')) return;` appears in `EventsPage`, `ReceiptsPage`, `HousePage`, `InfoPage`, `SettingsPage`. Each is a 1-line guard — not enough duplication to warrant abstraction, but worth knowing when ACC-01 (replace `window.confirm`) is addressed: fix all of them at once.

### RCN-05 — Low — `money()` formatter is used in 4 pages but lives in `constants.js`
This is correct (shared formatter, single source). No duplication. Listed for completeness.

---

## Overall

The codebase shows good reuse discipline for its size. The hook layer (`useCollection`, `useDoc`) is the primary consolidation mechanism and it's working well. The one concrete action item is deleting `AvatarRow.jsx`.
