# 04 — Accessibility Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

**Live Discovery:** WCAG 2.2 is the current W3C Recommendation (https://www.w3.org/TR/WCAG22/, October 2023). WCAG 2.1 AA remains the legal baseline in most jurisdictions. This audit checks against WCAG 2.1 AA and notes WCAG 2.2 additions where relevant.

**Scope calibration:** Private app for 12 friends. No ADA/AODA legal exposure. Audit documents the state for good-faith reference; severity is calibrated accordingly (no Critical findings for this use case).

---

## What's done well

- **Focus visibility:** `:focus-visible` ring defined in CSS (`2px solid var(--om)`, 2px offset). Keyboard navigation works without exposing rings to mouse users. ✓
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` properly suppresses all animations (View Transitions, meal flash, day chip glow, loader, confetti). ✓
- **Input font size:** All `input`, `textarea`, `select` elements are `font-size: 16px` — prevents iOS Safari auto-zoom on focus. ✓
- **Viewport safe area:** `viewport-fit=cover` + `env(safe-area-inset-top)` in header CSS — correct iOS notch handling. ✓
- **Language:** `<html lang="en">` declared in `public/index.html`. ✓
- **Semantic buttons:** Interactive elements use `<button>` throughout (not `<div onClick>`). ✓
- **Color:** Design uses color + text/icon together for status (RSVP states use color AND text labels). ✓

---

## Findings

### ACC-01 — Medium — `window.confirm()` delete dialogs are inaccessible on some assistive tech
All destructive actions (delete event, delete receipt, etc.) use `window.confirm()`. Native browser dialogs have inconsistent AT (assistive technology) behavior on mobile and are non-customizable for screen reader UX.
**Fix:** Replace with a small in-page confirmation pattern (e.g., a "Are you sure?" row that appears inline). For this 12-user app this is aesthetic; mark deferred.

### ACC-02 — Medium — Modal focus trap missing
`Modal.jsx` does not trap focus inside the modal. When a modal is open, keyboard Tab cycles through the entire page behind it.
**File:** `src/components/Modal.jsx`
**Fix:** Add a focus trap (`inert` attribute on the background, or a manual Tab intercept). The `inert` attribute is now Baseline Widely Available and is the cleanest solution.

### ACC-03 — Low — Avatar emoji tooltips not screen-reader accessible
`Avatar.jsx` shows a tooltip on hover (`avatar-tooltip` CSS class) with the user's name. The tooltip is CSS-only (`:hover → opacity: 1`) with no ARIA relationship to the avatar element.
**Fix:** Add `aria-label={user.displayName}` to the avatar element. Tooltip can remain as visual enhancement.

### ACC-04 — Low — Icon-only nav buttons have no accessible label
`SlidersIcon` button in the header (`App.jsx:106`) has `title="Me"` but no `aria-label`. `title` is not reliably surfaced by all screen readers.
**Fix:** Add `aria-label="Settings"` to the icon button.

### ACC-05 — Low — Day chip, meal card, and weather day missing accessible labels
`.day-chip`, `.meal-card`, and `.weather-day` elements are `<div onClick>` patterns with visible text content but no role or aria attributes. Screen readers won't announce them as interactive.
**File:** `TodayPage.jsx`, `EventsPage.jsx`
**Fix:** Wrap in `<button>` or add `role="button" tabIndex={0}` + keyboard event handlers. Low priority for a mobile-primary app where keyboard navigation isn't the expected mode.

### ACC-06 — Low — Color contrast: muted text
`--muted: #7a6a56` on `#f5f0e8` background. Contrast ratio: approximately 3.5:1. WCAG 2.1 AA requires 4.5:1 for normal text, 3:1 for large text (≥18pt or ≥14pt bold). Most muted text in the app is 11-12px — below large-text threshold.
**Fix:** Darken `--muted` to approximately `#695a46` to reach 4.5:1. Visual impact is minimal.

## WCAG 2.2 additions (informational)
- **2.4.11 Focus Appearance (AA):** The `:focus-visible` ring (`2px solid var(--om)`) meets the minimum area requirement. ✓
- **2.5.8 Target Size Minimum (AA):** Most tap targets are ≥24×24 CSS px. `.btn-mini` padding results in targets around 30px tall — borderline. Acceptable.

## Out of scope
Screen reader testing on real devices (VoiceOver / TalkBack) was not performed. The findings above are code-observable; actual AT experience may differ.
