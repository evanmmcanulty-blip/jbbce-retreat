# 06 — Testing & Quality Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Current state

**Test count:** 0. There are no test files in the project. CRA installs `@testing-library/react` and `@testing-library/jest-dom` as devDependencies, but no tests have been written.

**Type safety:** None. Plain JavaScript throughout. No JSDoc type annotations beyond a few inline comments.

**Linting:** No ESLint config file. CRA ships a default ESLint config (extends `react-app`), which runs during `npm start` and `npm run build`. No custom rules.

---

## Findings

### TST-01 — High (for the money math) — `costEngine.js` has no tests
`costEngine.js` contains the only business logic with real financial consequences: per-night room allocation, empty-room absorption, and settle-up netting. A wrong output here means someone pays the wrong amount. It has been manually reviewed and found correct, but there's nothing preventing a future regression.

**Fix:** Write 3–5 unit tests for `calcOwed` covering: (1) even split, (2) manual split, (3) empty room absorbed, (4) partial-night arrival/departure. This is 30 minutes of work and would be the highest-value test in the codebase.

### TST-02 — Medium — No Firestore rules tests
`firestore.rules` contains the security model for the entire app. There are no emulator-based tests. A rules change that accidentally opens a collection to all users would be undetected until someone tries it.

**Fix:** Add a `rules.test.js` using the Firebase Emulator Suite (`@firebase/rules-unit-testing`). Cover the most critical invariants: (a) non-admin cannot write `admin: true` to their own doc, (b) unapproved user cannot read trip data, (c) non-accountant cannot write `confirmed` to `payments/{uid}`. Estimated effort: 2 hours.

### TST-03 — Low — No integration or E2E tests
Expected for a solo-built private trip app. Not a defect at this scale.

### TST-04 — Low — No type safety
The codebase is plain JS. Type errors (passing the wrong shape to `calcOwed`, referencing a non-existent field) are silent until runtime. For a 12-user app this is a reasonable tradeoff. Migrating to TypeScript would be a post-trip project.

---

## Overall

The complete absence of tests is appropriate for a solo private app of this scope — writing tests that take longer than the app lifetime is waste. The one exception is `costEngine.js` (TST-01), where a 30-minute test investment protects against the only class of bug with real-world financial impact.
