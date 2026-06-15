# 08 — Dependencies & Supply Chain Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Runtime versions

| Dependency | In use | Latest | Notes |
|---|---|---|---|
| `firebase` | 10.14.1 | 12.14.0 | Two major versions behind; breaking changes in 11 (modular API stable), 12 (new init API) |
| `react` / `react-dom` | 18.3.1 | 19.2.7 | React 19 released; 18.3.1 is current stable-18 |
| `react-scripts` | 5.0.1 | 5.0.1 (EOL) | CRA is archived upstream; no further patches |
| `lucide-react` | Current | — | Icon library, regularly updated; check for security advisories |

**Firebase Admin SDK (Cloud Functions):** `^12.6.0` — matches major of latest Firebase JS SDK direction. OK.

**Node.js (Functions):** 20 — current LTS as of 2026-06-15. OK.

---

## Vulnerability scan

`npm audit` output (2026-06-15):

```
53 vulnerabilities (4 low, 37 moderate, 12 high)
```

**All 53 are in the CRA build-time chain** — `nth-check`, `postcss`, `serialize-javascript`, `webpack-bundle-analyzer`, `svgo`, and related build tooling. None are in the application runtime bundle delivered to users' browsers. Firebase SDK, React, and lucide-react have 0 known vulnerabilities.

### DEP-01 — Informational — All CVEs are build-time only
The 53 audit findings cannot be exploited by app users because they live in CRA's webpack/postcss pipeline, not the deployed bundle. No user data or Firebase keys are at risk. The build runs on a local dev machine (not a shared CI environment), which further reduces exposure.

**Risk:** Low for this private app. Would be High for an open CI system.

**Fix:** Migrate from CRA to Vite (post-trip). Vite's dependency tree is dramatically smaller and these CVEs evaporate.

### DEP-02 — Medium — Firebase SDK is two major versions behind
`firebase@10.14.1` vs `12.14.0`. Firebase 11 introduced breaking changes in how `getApp`/`initializeApp` work and deprecated the `compat` layer (not used here — this app uses modular SDK). Firebase 12 has further init API changes.

**Impact:** No immediate defects (the modular API used in this codebase is stable), but running an EOL-ish version means missing:
- Bug fixes to `persistentLocalCache`
- FCM token refresh improvements
- Security patches (if any are issued for 10.x)

**Fix:** Upgrade `firebase` to 12.x after the trip. Read the 11.x and 12.x migration guides — the modular import paths changed slightly.

### DEP-03 — High — `react-scripts` is effectively EOL
CRA (`react-scripts@5.0.1`) is the tool that bundles and serves the app. The upstream `create-react-app` GitHub org has been archived; no further patches will be issued. Security advisories in the build pipeline (DEP-01) will never be resolved through normal `npm update`.

**Impact:** Ongoing accumulation of build-time CVEs; no upstream fixes. The app still builds and deploys correctly today. This becomes a supply chain concern if the CI environment (if one is added) runs on the dev machine.

**Fix:** Migrate to Vite. Estimated effort: 1-2 hours for this codebase. High priority post-trip.

---

## SBOM (software bill of materials)

No formal SBOM exists. For a 12-user private app, this creates no compliance obligation. `npm list --prod --depth=0` produces the runtime dependency list on demand.

---

## Supply chain posture

| Control | State |
|---|---|
| `package-lock.json` committed | Yes — lockfile present, reproducible installs |
| npm scripts run untrusted code | No `postinstall` scripts from suspicious packages |
| Firebase keys client-exposed | Yes — by design; security is in Firestore/Storage rules |
| Secrets in source | No `.env` with real secrets in repo |
| Dependency pinning | Inexact (`^` for all) — standard for app code, acceptable |

---

## Out of scope
SBOM tooling (CycloneDX, SPDX), artifact signing (Sigstore), npm provenance attestation — all N/A for this private trip app.
