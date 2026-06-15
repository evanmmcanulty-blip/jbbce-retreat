# 15 — UX Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

**Scope:** Heuristic evaluation (Nielsen's 10 heuristics) applied to the codebase and UI model. No real-device testing performed.

---

## What's done well

- **Mobile-first layout:** `env(safe-area-inset-*)`, 16px input font size, iOS notch handling — correct.
- **Immediate feedback on actions:** Firestore `persistentLocalCache` means writes appear instant (optimistic local cache before network confirm).
- **Clear tab structure:** 6 tabs covering Today, Events, Money, House, Info, Settings — logical groupings for a trip app.
- **Avatar + emoji identity system:** Low-friction identity, no photos required. Appropriate for a small trusted group.
- **Pre-trip countdown:** `PreTripBanner` gives users something to engage with before the trip starts.

---

## Findings

### UX-01 — Medium — No empty states
When a collection is empty (no bulletins, no gear items, no groceries), the UI shows nothing — no "Add your first item" prompt, no illustration. New users don't know the feature exists or whether it failed to load.

**Fix:** Add 1-line empty states: "Nothing yet — be the first to add something." Low effort, high user clarity.

### UX-02 — Medium — Error states are minimal
Write failures surface as a native browser `alert()` (from the `unhandledrejection` handler). This is jarring and doesn't tell the user what failed or what to do next.

**Fix:** Add a small in-app toast for `FirebaseError` rather than `alert()`. The toast can auto-dismiss after 5 seconds.

### UX-03 — Low — No success feedback on writes
When a user RSVPs, adds a gear item, or posts a bulletin, the item appears instantly (via optimistic Firestore cache) but there's no micro-feedback (no brief highlight, no animation beyond the list reorder). Users may double-tap uncertain actions.

**Fix:** Add a brief CSS highlight animation (`.highlight-new` → background flash) on newly added items. Low effort.

### UX-04 — Low — "Cover someone" flow is hidden
The "cover someone" payback option in the Money tab is not discoverable — it requires knowing to tap on another user. No hint text or disclosure. Found by audit; likely fine for a group of friends who'll figure it out.

### UX-05 — Positive — Settle Up netting is visible and clear
The Settle Up view shows per-person owed amounts with clear positive/negative framing and a prominent Venmo/Apple Cash payback button. Good.

### UX-06 — Informational — Vote modal dismissal
The meal vote modal is dismissed by tapping outside it. This is a correct UX pattern but the tap target for "close" is the entire backdrop — which may conflict with accidental taps on mobile. No action needed; just documenting.

---

## Overall

The UX is clean and mobile-appropriate. The most impactful pre-trip improvements are UX-01 (empty states) and UX-02 (error states). Both are low-effort.
