# Audit Index — jbbce-retreat

**Full audit run:** 2026-06-15 · **Commit:** c7a6024

---

## Synthesis (start here)

| File | Purpose |
|---|---|
| [findings.md](findings.md) | All findings, severity-sorted, de-duplicated |
| [remediation-plan.md](remediation-plan.md) | Sequenced action items: P0 (pre-trip), P1, P2 (post-trip) |

---

## Foundation

| File | Module |
|---|---|
| [../system-architecture.md](../system-architecture.md) | 01 — Current-state architecture |
| [stack-brief.md](stack-brief.md) | 01.5 — Firebase / React / NWS / CRA gotchas |

---

## Security & Compliance

| File | Module |
|---|---|
| [security-audit.md](security-audit.md) | 02 — Firestore rules, auth, XSS, storage |
| [privacy-audit.md](privacy-audit.md) | 03 — Personal data inventory, exposure scope |
| [accessibility-audit.md](accessibility-audit.md) | 04 — WCAG 2.1/2.2 AA findings |

*Module 22 (Sector Compliance) skipped — not HIPAA/PCI/SOC2 applicable.*

---

## Quality

| File | Module |
|---|---|
| [architecture-audit.md](architecture-audit.md) | 05 — Component coupling, monolith risk, dead code |
| [testing-audit.md](testing-audit.md) | 06 — Test coverage (0 tests; costEngine risk) |
| [documentation-audit.md](documentation-audit.md) | 07 — README, runbook, CLAUDE.md gaps |
| [dependencies-audit.md](dependencies-audit.md) | 08 — CVEs (build-time only), EOL CRA, Firebase lag |
| [reuse-consolidation-audit.md](reuse-consolidation-audit.md) | 23 — Dead code, hook reuse |
| [workarounds-audit.md](workarounds-audit.md) | 24 — Tech debt markers, root-cause gaps |

---

## Performance

| File | Module |
|---|---|
| [performance-audit.md](performance-audit.md) | 09 — Firestore query patterns, offline cache |
| [speed-audit.md](speed-audit.md) | 10 — Core Web Vitals, CDN, View Transitions |
| [serverless-db-coldstart-audit.md](serverless-db-coldstart-audit.md) | 11 — FCM Cloud Functions cold-start |

---

## Operations

| File | Module |
|---|---|
| [devops-audit.md](devops-audit.md) | 12 — Deploy process, rules deploy gap, observability |
| [cost-audit.md](cost-audit.md) | 13 — Firebase Spark free tier usage ($0) |
| [engineering-practice-audit.md](engineering-practice-audit.md) | 14 — Commit discipline, uncommitted changes |

---

## Product

| File | Module |
|---|---|
| [ux-audit.md](ux-audit.md) | 15 — Nielsen heuristics, empty states, error UX |
| [product-gap-analysis.md](product-gap-analysis.md) | 16 — Missing features, offline gap, push onboarding |
| [frontend-modernization-audit.md](frontend-modernization-audit.md) | 17 — Baseline features, CRA → Vite path |
| [product-type-audit.md](product-type-audit.md) | 19 — PWA checklist, iOS install prompt |

*Modules 18 (AI/ML), 20 (i18n), 21 (SEO) skipped — not applicable.*

---

## Prior audits

| File | Date | Scope |
|---|---|---|
| [ship-readiness-2026-06-12.md](ship-readiness-2026-06-12.md) | 2026-06-12 | Security rules, auth, money math |

---

## Quick triage

**Must deploy before Jun 29:**
1. `firebase deploy --only firestore:rules,storage` — fixes gear list + all prior SEC findings
2. Brandon toggles `accountant` on for Chris
3. Commit pending `firebase.json` and `src/App.jsx` changes

**5-minute wins:**
- Fix vote toggle `null` → `deleteField()` in `EventsPage.jsx`
- Delete `src/components/AvatarRow.jsx`
- Add `.firebase/` to `.gitignore`
