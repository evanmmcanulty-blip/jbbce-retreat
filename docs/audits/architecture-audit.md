# 05 — Architecture Integrity Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Component map

| File | LOC (est.) | Components defined | Concern |
|---|---|---|---|
| `EventsPage.jsx` | ~530 | `EventsPage`, `EventList`, `EventListItem`, `EditEventForm`, `AddEventForm`, `IdeasSidebar`, `IdeasTab`, `IdeaEditForm`, `MealsTab` | Fat module — 9 components in one file |
| `TodayPage.jsx` | ~340 | `TodayPage`, `PreTripBanner` | Manageable |
| `ReceiptsPage.jsx` | ~350 | `ReceiptsPage`, `SettleUp`, `ReceiptList`, `PayModal` (est.) | Similar to EventsPage |
| `InfoPage.jsx` | ~350 | `InfoPage`, `BulletinBoard`, `GroceryList`, `LinksTab` | OK |
| `HousePage.jsx` | ~160 | `HousePage`, `HouseInfo`, `GearList` | OK |
| `SettingsPage.jsx` | ~200 | `SettingsPage`, `MyProfile`, `TravelTab`, `AdminTab` | OK |

---

## Findings

### ARC-01 — Medium — EventsPage is a 530-line monolith with 9 components
`EventsPage.jsx` defines the calendar tab, meals grid, ideas board, idea editing, event editing, and idea promotion — all in one file with 9 components. Changes to any one of these require reading the entire file. This is not a performance problem (CRA treeshakes nothing at this granularity) but it is a maintenance problem.

**Recommendation:** Split into `EventsCalendar.jsx`, `MealsTab.jsx`, `IdeasTab.jsx` when the app gets a second season. Pre-trip: leave as is. Not worth the refactor risk 14 days out.

### ARC-02 — Low — `users` collection fetched independently in multiple pages
`TodayPage`, `EventsPage`, `HousePage`, `ReceiptsPage`, `SettingsPage`, and `App.jsx` all call `useCollection('users')`. Each `useCollection` call creates its own `onSnapshot` listener. Firebase's local cache means all reads after the first are served from memory, not the network — so there's no billing or latency concern. But there are ~6 simultaneous Firestore listeners for the same path.

**Recommendation:** Lift `users` into a context (e.g., `UsersContext`) and provide it from `App.jsx` alongside `AuthProvider`. Reduces listener count and simplifies future user-list logic. Post-trip improvement.

### ARC-03 — Low — `constants.js` mixes four categories of concerns
`constants.js` contains: trip config (`TRIP_START`, `TRIP_DAYS`, `ROOMS`, `TOTAL_NIGHTS`), UI option data (`MEAL_OPTIONS`, `PTOWN_RESTAURANTS`, `TRAVEL_MODES_ARR/DEP`), formatting utilities (`fmt12`, `fmtFull`, `fmtDOW`, `fmtMon`, `dayKey`, `isoDate`, `isNightEvent`, `safeUrl`, `money`), style config (`COLORS`), and UX copy (`WEATHER_AVG`). This makes grepping for the "trip config" vs "UI data" concerns confused.

**Recommendation:** Not urgent. If the app lives past the trip, split into `tripConfig.js`, `uiData.js`, and `formatters.js`. Low priority — the file is short enough that it works fine as-is.

### ARC-04 — Informational — No client-side routing
Tab state is managed in a single `useState` in `App.jsx`. This is intentional and the right call for a 6-tab single-page app with no deep links beyond the `?n=<tab>` push-notification shortcut. No finding.

### ARC-05 — Informational — `AvatarRow.jsx` is unused
`src/components/AvatarRow.jsx` is imported nowhere. Safe to delete. Mentioned in the 2026-06-12 architecture note; still present.

## Overall assessment
The architecture is appropriate for a solo-maintained, trip-scoped app. The main structural concern is `EventsPage.jsx`'s size, which is a maintenance liability but not a correctness problem. No coupling violations, no circular dependencies, data layer is clean.
