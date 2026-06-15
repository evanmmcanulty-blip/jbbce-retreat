# 13 — Cost Analysis & Right-Sizing Audit

**Date:** 2026-06-15 · **Commit:** c7a6024

---

## Firebase free tier (Spark plan) limits vs projected usage

| Resource | Free limit | Projected usage (13 days, 12 users) | Status |
|---|---|---|---|
| Firestore reads | 50,000/day | ~5,000/day (12 users × ~400 reads) | Well within |
| Firestore writes | 20,000/day | ~500/day (receipts, votes, RSVPs) | Well within |
| Firestore deletes | 20,000/day | ~100/day | Well within |
| Firestore storage | 1 GB | ~5 MB | Well within |
| Firebase Storage (receipts) | 5 GB storage, 1 GB/day download | ~500 MB storage | Well within |
| Cloud Functions invocations | 2M/month | ~500/month (push triggers) | Well within |
| Firebase Hosting | 10 GB storage, 360 MB/day transfer | ~50 MB/day transfer | Well within |
| Firebase Auth | Unlimited (email/password) | 12 users | Well within |

**Verdict:** This app will never leave the Spark (free) tier during the trip. Firebase cost is $0.

---

## NWS API

Free. No rate limits for reasonable use. The 2-hour localStorage cache means ~12 API calls per user per day maximum — far below any fair-use threshold.

---

## Google Maps Places API

Currently disabled (commented out in `public/index.html`). If enabled: Maps API has a $200/month free credit. For 12 users making ~5 place lookups each, cost would be negligible (<$1).

---

## COST-01 — Informational — No cost monitoring configured
Firebase Budget Alerts are not configured. If usage somehow spiked (bot traffic, a loop writing to Firestore), there's no notification. Not worth setting up for a 13-day app, but worth knowing.

---

## Overall

Cost is $0. No action needed.
