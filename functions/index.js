/* Push-notification triggers. Three high-signal events only:
   new bulletin, new receipt you're tagged in, your house payment confirmed.
   Data-only messages; the service worker renders them.
   Plus a daily morning briefing during the trip. */
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });
const db = admin.firestore();

// Gather {uid, token} pairs for a set of uids, so dead tokens can be traced back to an owner.
async function tokensFor(uids) {
  const out = [];
  const snaps = await Promise.all(uids.map((uid) => db.doc('users/' + uid).get()));
  snaps.forEach((s) => {
    if (!s.exists) return;
    (s.get('fcmTokens') || []).forEach((t) => out.push({ uid: s.id, token: t }));
  });
  return out;
}

async function send(pairs, data) {
  if (!pairs.length) return;
  const res = await admin.messaging().sendEachForMulticast({
    tokens: pairs.map((p) => p.token),
    data, // all values must be strings
    webpush: { headers: { Urgency: 'high' } }
  });
  const dead = [];
  res.responses.forEach((r, i) => {
    const code = !r.success && r.error && r.error.code;
    if (code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument') {
      dead.push(pairs[i]);
    }
  });
  await Promise.all(dead.map((p) =>
    db.doc('users/' + p.uid).update({ fcmTokens: admin.firestore.FieldValue.arrayRemove(p.token) })
  ));
}

async function approvedUidsExcept(exceptUid) {
  const snap = await db.collection('users').get();
  return snap.docs
    .filter((d) => d.get('approved') !== false && d.id !== exceptUid)
    .map((d) => d.id);
}

const firstName = (full) => (full || 'Someone').split(' ')[0];

function fmt12(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2,'0')}${ampm}`;
}

// Trip bounds: Jun 29 – Jul 11 2026. Day index 0–12.
const TRIP_START_MS = Date.UTC(2026, 5, 29, 4, 0, 0); // Jun 29 00:00 ET = 04:00 UTC

exports.morningBriefing = onSchedule({ schedule: 'every day 08:00', timeZone: 'America/New_York' }, async () => {
  const nowMs = Date.now();
  const dayIdx = Math.round((nowMs - TRIP_START_MS) / 86400000);
  if (dayIdx < 0 || dayIdx > 12) return; // outside trip window

  const snap = await db.collection('events').get();
  const todayEvents = snap.docs
    .map(d => ({ ...d.data(), id: d.id }))
    .filter(ev => ev.recurring || ev.dayIdx === dayIdx)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  if (!todayEvents.length) return;

  const summary = todayEvents.slice(0, 3)
    .map(ev => ev.time ? `${ev.title} ${fmt12(ev.time)}` : ev.title)
    .join(' · ');

  const allUids = await approvedUidsExcept(null);
  const pairs = await tokensFor(allUids);
  await send(pairs, {
    title: `📅 Day ${dayIdx + 1} in Ptown`,
    body: summary,
    tab: 'today',
  });
});

exports.notifyBulletin = onDocumentCreated('bulletins/{id}', async (event) => {
  const b = event.data.data();
  const pairs = await tokensFor(await approvedUidsExcept(b.by));
  await send(pairs, {
    title: '📣 ' + firstName(b.byName) + ' posted a heads-up',
    body: String(b.text || '').slice(0, 140),
    tab: 'info'
  });
});

exports.notifyReceipt = onDocumentCreated('receipts/{id}', async (event) => {
  const r = event.data.data();
  const targets = (r.whoIds || []).filter((uid) => uid !== r.by);
  if (!targets.length) return;
  const pairs = await tokensFor(targets);
  await send(pairs, {
    title: '🧾 New receipt from ' + firstName(r.byName),
    body: String(r.desc || 'Shared expense') + ' — check what you owe',
    tab: 'receipts'
  });
});

exports.notifyPaymentConfirmed = onDocumentUpdated('payments/{uid}', async (event) => {
  const before = event.data.before.data() || {};
  const after = event.data.after.data() || {};
  if ((after.confirmed || 0) <= (before.confirmed || 0)) return;
  const pairs = await tokensFor([event.params.uid]);
  await send(pairs, {
    title: '✅ Payment confirmed',
    body: 'Chris confirmed your house payment — you’re squared up.',
    tab: 'receipts'
  });
});
