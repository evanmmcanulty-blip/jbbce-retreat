# 17 — Frontend Modernization Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Baseline web platform features in use

| Feature | Status | Notes |
|---|---|---|
| View Transitions API | ✓ Used | `document.startViewTransition` for tab nav |
| CSS `env()` safe area | ✓ Used | Notch/home indicator handling |
| `inert` attribute | Not used | Would fix ACC-02 (modal focus trap) |
| CSS container queries | Not used | Not needed at this scale |
| CSS `:has()` selector | Not used | Could simplify some conditional styling |
| `@layer` cascade layers | Not used | Not needed |
| `navigator.share()` | Not checked | Could replace copy-link patterns |

---

## Findings

### MOD-01 — Informational — CRA → Vite migration is the highest-leverage modernization
CRA is EOL. Vite provides: faster HMR, smaller dev dependency tree (no 53-CVE build chain), better tree-shaking, and a maintained ecosystem. All of the "modern web" improvements below become easier after migration because Vite's plugin ecosystem is more current.

**Timeline:** Post-trip. Estimated effort: 1-2 hours for this codebase (no custom webpack config).

### MOD-02 — Low — `inert` attribute could fix modal focus trap (ACC-02)
`inert` is Baseline Widely Available (all modern browsers since 2023). Adding `inert` to the app backdrop when a modal is open is a 2-line fix for the focus trap issue.

**Fix:** In `Modal.jsx`, apply `inert` to the main content area when modal is open:
```jsx
<div className="app-content" inert={modalOpen ? '' : undefined}>
```

### MOD-03 — Informational — React 19 not yet adopted
React 19 introduces: `use()` hook, React Compiler, `<form>` actions, `useOptimistic`. None of these are needed for the current feature set. Upgrade is post-trip, concurrent with the CRA → Vite migration.

### MOD-04 — Low — CSS custom properties are used well; consider `color-mix()` for theming
The app uses CSS variables (`--om`, `--bg`, `--muted`, etc.) correctly throughout. `color-mix()` is now Baseline and could generate tints/shades programmatically instead of hardcoding them. Low priority; the current system works.

---

## Overall

The app is using the right modern primitives for its context (View Transitions, safe area, persistent Firestore cache). The main modernization priority is CRA → Vite, post-trip.
