# Push Notifications — Design Spec

**Date:** 2026-06-13
**App:** PTown '26 retreat (CRA + Firebase, iPhone-first PWA, ~9 users)
**Goal:** Assistive push for genuinely important, low-frequency events — reach the crew
when they aren't staring at the app, without overwhelming them.

---

## Triggers (v1 — exactly three)

| # | Event (Firestore write) | Who gets pinged | Example body |
|---|---|---|---|
| 1 | New **bulletin** posted (`bulletins` create) | everyone **except** the author | "📣 Brandon: boat leaves 9am SHARP" |
| 2 | New **receipt you're tagged in** (`receipts` create) | the tagged `whoIds` **except** uploader | "Evan added a receipt — Groceries, you owe $24" |
| 3 | Your **house payment confirmed** (`payments/{uid}` update, `confirmed` increased) | the payer (`uid`) only | "Chris confirmed your house payment — you're square ✓" |

**Explicitly NOT notified:** RSVPs, meal/event votes, idea proposals, edits, day-to-day
changes. The discipline lives here — three high-signal triggers, nothing else.

---

## Architecture

```
Firestore write ──▶ Cloud Function (Blaze) ──▶ FCM ──▶ installed PWA ──▶ tap ──▶ deep-link to tab
```

- **Receiving:** Firebase Cloud Messaging (FCM) web push via a service worker. iOS requires
  the app be **installed to the Home Screen** (Safari tabs cannot receive push).
- **Sending:** Firebase Cloud Functions (v2), triggered by Firestore writes. Uses the Admin
  SDK so the FCM secret never touches the client.
- **Token storage:** `users/{uid}.fcmTokens` — an array of device tokens (multi-device).
  Dead tokens pruned automatically when FCM reports `registration-token-not-registered`.
- **Deep link:** notification carries `data.tab` (+ optional subtab). The service worker's
  `notificationclick` focuses an open tab or opens `/?n=<tab>`; `App.jsx` reads `?n=` on load
  to set the initial tab, then clears the param.

---

## Components to build

### 1. Client — token registration + opt-in (`src/lib/push.js`, Me → My Profile)
- `enablePush()`: verify running as installed PWA + request `Notification` permission →
  `getToken(messaging, { vapidKey })` → `arrayUnion` the token onto the user's doc.
- `disablePush()`: `deleteToken()` + `arrayRemove` from the user doc.
- **"Notifications" section in Me → My Profile:** a toggle reflecting permission/registration
  state. If NOT an installed PWA (esp. iOS Safari tab), show a one-time **"Share → Add to Home
  Screen"** nudge instead of letting the toggle fail silently.
- `onMessage` foreground handler: a minimal in-app toast when a push arrives while the app is
  open (optional polish; can ship after).

### 2. Service worker — `public/firebase-messaging-sw.js`
- `importScripts` Firebase compat (app + messaging); `initializeApp(publicConfig)`.
- `onBackgroundMessage` → `showNotification(title, { body, icon: '/icon-192.png', badge, data })`.
- `notificationclick` → focus existing client or `clients.openWindow('/?n=' + data.tab)`.

### 3. Cloud Functions — `functions/index.js` (firebase-functions v2, firebase-admin)
- `onBulletinCreate` → all user tokens minus author.
- `onReceiptCreate` → tokens for `whoIds` minus uploader, with desc + per-head share.
- `onPaymentUpdate` → if `confirmed` increased, the payer's token(s).
- Shared `send(tokens, payload)` helper: `getMessaging().sendEachForMulticast(...)`, then
  prune any token that returns `registration-token-not-registered`.

---

## Preconditions (USER actions — Claude cannot do these)

1. **Upgrade the Firebase project to the Blaze (pay-as-you-go) plan** in the console —
   Cloud Functions require it. At ~9 users the free tier (≈2M calls/mo) means realistic
   cost is **$0**. **Set a $1 budget alert** at the same time as a safety net.
   *(Claude will not enter billing details — this is yours to do.)*
2. **Firebase console → Cloud Messaging → generate a Web Push (VAPID) key pair.** The
   **public** key is safe to commit / put in the app; hand it over or drop it in `.env`.
3. **Each crew member, once:** Add to Home Screen → open the app → toggle Notifications on →
   tap Allow.

---

## Anti-overwhelm rules

- Never notify the actor about their own action.
- Only the three triggers above. No batching needed at this volume.
- **Opt-in, default off.** One clear off switch in Me.
- Future (not v1): per-category preferences, quiet hours.

---

## Edge cases

- Permission denied or later revoked → toggle reflects real state; dead tokens pruned on next send.
- Multiple devices per user → token array handles it.
- iOS, not installed → cannot enable; show the Add-to-Home-Screen steps.
- Author is also a recipient (e.g. tagged themselves) → excluded.
- No tokens for a target → function no-ops cleanly.

---

## Security

- Public Firebase config + VAPID **public** key are safe to expose (standard for web push).
- Firestore rule: a user may write only their **own** `fcmTokens`.
- Functions run server-side (Admin SDK); the FCM secret is never in client code.
- Budget alert guards against runaway cost.

---

## Out of scope (v1)

Scheduled / day-of event reminders, per-category preferences, quiet hours, an in-app
notification center, Android/desktop refinements beyond defaults.

## Honest caveat

iOS PWA push is an **assist, not a guarantee** — it requires each person to have installed
the app, and delivery isn't always instant. For minute-critical logistics, the group text
remains the backstop. This feature's job is to *reach* people about heads-ups and money when
they're not in the app.
