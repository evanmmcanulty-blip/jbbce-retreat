# 16 — Product Gap Analysis

**Date:** 2026-06-15 · **Commit:** c7a6024

**Scope:** Production-readiness gaps and missing features relative to the app's stated purpose (coordinating a 13-day Provincetown group trip for ~12 people, active Jun 29 – Jul 11 2026).

---

## Features recently shipped (audit baseline)

- Pre-trip countdown + crew grid (PreTripBanner)
- Live NWS weather for trip days
- Gear list (House tab)
- Shared Apple Album link + Find My link (Info tab)
- One-tap Venmo/Apple Cash payback
- Meal votes + admin clear-vote
- Push notifications (FCM)

---

## Gaps

### GAP-01 — High — `gear` Firestore rules not deployed
The gear list feature is fully built but silently broken in production because the `gear` collection has no Firestore security rules. See SEC-07 for details and the exact rules block.

**Status:** Must fix before trip.

### GAP-02 — Medium — No offline indicator
When the user is offline, writes queue silently (Firebase offline persistence). There's no UI indicator that the app is operating in offline mode. Users may assume their writes failed.

**Fix:** Listen to `onSnapshot`'s metadata `hasPendingWrites` or the Firebase connection state and show a small "Offline — changes will sync" banner.

### GAP-03 — Medium — No push notification opt-in prompt
Push notifications require user action to enable, but there's no in-app prompt guiding users through the iOS PWA push flow (Install PWA → Settings → Allow Notifications). First-time users likely never get push.

**Fix:** Add a one-time prompt in Settings explaining the steps. Or add a banner on the Today page: "Enable notifications to stay updated."

### GAP-04 — Low — Arrival/departure dates not surfaced on Today page
Users' travel dates are stored in their profile, but the Today page doesn't show who's arriving or leaving today. This was partially handled in previous versions.

**Status:** Arrivals/departures section exists in TodayPage but verify it renders correctly after the `beforeTrip` gating changes.

### GAP-05 — Low — Shared Apple Album URL is admin-only editable but has no validation
The album URL is stored as a freetext string. There's no validation that it's an `icloud.com` URL. A typo produces a broken link with no error.

**Fix:** Add `safeUrl()` validation + a domain check for `icloud.com` before saving.

### GAP-06 — Informational — Weather strip shows all 13 days including post-NWS-window days
Days outside the NWS 7-day window show `WEATHER_AVG` without visual distinction from live data. The live badge (`weatherLive`) applies to the weather card but not the day strip.

**Fix:** Add a visual indicator (e.g., `~` prefix on avg temperatures) to distinguish forecast vs historical-average days in the strip. Very low priority.

---

## Not gaps (intentional scope decisions)

- No in-app chat: the group uses iMessage; duplicating that is waste.
- No map integration: Google Maps Places API is commented out by choice; text addresses are sufficient.
- No calendar export (ICS): nice-to-have but adds complexity without clear need.
- No native iOS app: PWA is the right call for a temporary trip app.
