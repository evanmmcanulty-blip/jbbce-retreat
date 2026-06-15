# 24 — Workarounds & Root-Cause Gaps Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Findings

### WRK-01 — Medium — Accountant gate was a display-name substring (now fixed, but the fix is still a workaround)
The original `displayName.toLowerCase().includes('chris')` gate was a workaround for the absence of a proper role system. The fix (adding an `accountant` flag to the user doc) is the right solution — not a workaround. **No action needed; documenting the history.**

### WRK-02 — Medium — `ideas` vote null-set uses `null` instead of `deleteField()`
`EventsPage.jsx` IdeasSidebar toggles off a vote by setting `votes.uid = null`. This leaves a `null`-valued key in the map rather than removing it. The UI likely handles `null` and `'yes'` equivalently for rendering, which is why this doesn't surface as a bug — but it's a workaround (treating `null` as "absent") rather than using `deleteField()` which is the correct Firestore primitive.

**Fix:** Replace `null` in the vote toggle with `import { deleteField } from 'firebase/firestore'` and pass `deleteField()`.

**File:** `src/pages/EventsPage.jsx` — IdeasSidebar vote buttons.

### WRK-03 — Low — Weather falls back to hardcoded averages for days outside the NWS 7-day window
`useWeather.js` falls back to `WEATHER_AVG` when NWS data doesn't cover a trip day. This is intentional and documented, but it means 6 of the 13 trip days show synthetic weather until we're 7 days out. The workaround is correct for the use case (nothing better is available without a paid API); documented here so it's visible.

### WRK-04 — Low — Pre-trip content gating via `beforeTrip` boolean rather than a proper view state
`TodayPage.jsx` uses `const beforeTrip = new Date() < TRIP_DAYS[0]` and `{!beforeTrip && ...}` guards on every section. This works correctly but means the file has 8+ conditional guards rather than a clean "pre-trip view" vs "during-trip view" component split.

**Not a bug.** The right fix (when warranted) would be a `TripPhase` context that drives a proper view-model split. Post-trip refactor candidate.

### WRK-05 — Informational — `flushSync` used to sequence state update before `startViewTransition`
`App.jsx` uses `flushSync` to force a synchronous React render before `document.startViewTransition`. This is the correct pattern per React docs for View Transitions — not a workaround. Listed here because `flushSync` appears "hacky" on first read.

---

## Summary

Two items need code fixes before the next session of active development: WRK-02 (deleteField for vote toggle) and awareness of WRK-04 if EventsPage is ever split. WRK-01 is resolved. WRK-03 and WRK-05 are correct as written.
