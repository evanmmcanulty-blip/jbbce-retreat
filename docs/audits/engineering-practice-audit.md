# 14 — Engineering Practice Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Workflow

Solo developer, commits directly to `main`. No PRs, no code review, no branch protection. This is explicitly the right workflow for a private single-developer app.

Recent commit history shows:
- Semantic commit messages (`feat(...)`, `fix(...)`) — good practice
- Logical commit scoping (one feature/fix per commit)
- No force-pushes or history rewrites in recent log

---

## Findings

### ENG-01 — Medium — No pre-deploy checklist
There's no explicit "pre-deploy" checklist. The risk isn't the deploy itself (Firebase Hosting handles rollback) but the rules deploy order (see OPS-02). A dev under time pressure might run `firebase deploy` without the rules flag and push new feature code before updated rules are live.

**Fix:** 5-line `DEPLOY.md` (see DOC-01 in documentation audit).

### ENG-02 — Low — `.firebase/` cache committed to git
`.firebase/hosting.YnVpbGQ.cache` appears in the git status as modified. This is a Firebase Hosting deploy cache that doesn't belong in source control. It doesn't cause functional problems but adds noise.

**Fix:** Add `.firebase/` to `.gitignore` if it isn't already.

### ENG-03 — Informational — `firebase.json` modified but uncommitted
`firebase.json` shows as modified in the current git status. Verify the changes are intentional and commit before the trip.

### ENG-04 — Informational — `src/App.jsx` modified but uncommitted
`src/App.jsx` shows as modified. Likely part of recent feature work. Commit before the trip.

---

## Overall

Engineering practice is appropriate for a solo private app. The commit discipline is good. Pre-trip: commit pending changes and add `.firebase/` to `.gitignore`.
