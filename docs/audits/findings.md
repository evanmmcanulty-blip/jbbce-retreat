# 00.2 — Findings Catalog

**Updated:** 2026-06-15 · Full audit suite complete · **Commit:** c7a6024

---

## Prior findings (2026-06-12 security module)

| ID | Severity | Finding | Status |
|---|---|---|---|
| SEC-01 | Critical | Self-service admin escalation via /users write rule | Fixed in code — **rules deploy pending** |
| SEC-02 | Critical | Catch-all Firestore write rule | Fixed in code — **rules deploy pending** |
| SEC-03 | High | Accountant gate by displayName substring | Fixed — accountant flag; **Brandon must flag Chris after deploy** |
| SEC-04 | High | Silent write failures, no offline persistence | Fixed — local cache + global rejection alert |
| SEC-05 | Medium | javascript: URL injection in user-supplied links | Fixed — `safeUrl()` http(s) allowlist |
| SEC-06 | Medium | Storage rules unbounded (any path/size/type) | Fixed in code — **rules deploy pending** |

---

## Full-suite findings (2026-06-15)

### High

| ID | Finding | Module |
|---|---|---|
| SEC-07 | `gear` collection has no Firestore rules — silently fails all writes in production | Security |
| TST-01 | `costEngine.js` has no tests — money math has no regression guard | Testing |
| OPS-01 | Firestore rules from 2026-06-15 session not yet deployed | DevOps |
| DEP-03 | `react-scripts` is EOL — no upstream security patches | Dependencies |

### Medium

| ID | Finding | Module |
|---|---|---|
| DEP-02 | Firebase SDK two major versions behind (10.14.1 → 12.x) | Dependencies |
| TST-02 | No Firestore rules emulator tests | Testing |
| WRK-02 | Vote toggle sets `null` instead of `deleteField()` | Workarounds |
| SEC-08 | Storage read gated on auth, not approval | Security |
| ACC-01 | `window.confirm()` delete dialogs inaccessible | Accessibility |
| ACC-02 | Modal focus trap missing in `Modal.jsx` | Accessibility |
| ARC-01 | `EventsPage.jsx` is a 530-line 9-component monolith | Architecture |
| UX-01 | No empty states in list views | UX |
| UX-02 | Error states use browser `alert()` | UX |
| GAP-02 | No offline indicator when writes are queuing | Product Gaps |
| GAP-03 | No push notification opt-in guidance for iOS users | Product Gaps |
| DOC-01 | No deploy runbook | Documentation |
| PWA-01 | No iOS PWA install prompt before push opt-in | PWA |
| ENG-01 | No pre-deploy checklist (rules deploy order) | Engineering |
| GAP-05 | Shared album URL has no icloud.com domain validation | Product Gaps |

### Low

| ID | Finding | Module |
|---|---|---|
| ACC-03 | Avatar tooltips not screen-reader accessible | Accessibility |
| ACC-04 | Icon-only nav button missing `aria-label` | Accessibility |
| ACC-05 | Day chip / meal card / weather day missing accessible roles | Accessibility |
| ACC-06 | `--muted` contrast ~3.5:1, below 4.5:1 AA | Accessibility |
| ARC-02 | `users` collection has 6 independent `onSnapshot` listeners | Architecture |
| ARC-03 | `constants.js` mixes 4 concern categories | Architecture |
| RCN-03 | `AvatarRow.jsx` is dead code — safe to delete | Reuse |
| RCN-04 | `window.confirm` delete pattern repeated 6+ times | Reuse |
| TST-04 | No TypeScript / type safety | Testing |
| DOC-02 | No project-level `CLAUDE.md` | Documentation |
| ENG-02 | `.firebase/` cache committed to git | Engineering |
| ENG-03 | `firebase.json` modified but not committed | Engineering |
| ENG-04 | `src/App.jsx` modified but not committed | Engineering |
| UX-03 | No success micro-feedback on writes | UX |
| PRV-01 | Phone/Venmo visible to all users — no disclosure copy | Privacy |
| PRV-02 | No data deletion path post-trip | Privacy |
| MOD-02 | `inert` attribute would fix modal focus trap (2-line fix) | Modernization |
| PWA-02 | No SW update notification banner | PWA |
| SPD-03 | No loading skeleton for initial auth check | Speed |
