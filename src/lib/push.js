// Web push (FCM) client helpers. The VAPID key below is the PUBLIC Web Push key —
// safe to ship in client code. Sending is done server-side by Cloud Functions.
import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import app, { db } from '../firebase';

const VAPID_KEY = 'BJjeiY8nOFfqoOWu1vOejvhFEJ0ohudvXtrVdt-OVOgFQkecWxiBULz2p4NJH7xVWq-_XrdGSlR_ryuuZxiHSlM';
const SW_PATH = '/firebase-messaging-sw.js';
const LS_KEY = 'pushEnabled';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export function isInstalledPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

let _messaging = null;
async function messaging() {
  if (_messaging) return _messaging;
  if (!(await isSupported())) return null;
  _messaging = getMessaging(app);
  return _messaging;
}

// UI state for the toggle: 'unsupported' | 'needs-install' | 'denied' | 'on' | 'off'
export async function pushState() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !(await isSupported())) return 'unsupported';
  if (isIOS() && !isInstalledPWA()) return 'needs-install';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted' && localStorage.getItem(LS_KEY) === '1') return 'on';
  return 'off';
}

export async function enablePush(uid) {
  const m = await messaging();
  if (!m) throw new Error('unsupported');
  if (isIOS() && !isInstalledPWA()) throw new Error('needs-install');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('denied');
  const reg = await navigator.serviceWorker.register(SW_PATH);
  const token = await getToken(m, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
  if (!token) throw new Error('no-token');
  await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) });
  localStorage.setItem(LS_KEY, '1');
  return token;
}

export async function disablePush(uid) {
  const m = await messaging();
  localStorage.removeItem(LS_KEY);
  if (!m) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
    const token = await getToken(m, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (token) {
      await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayRemove(token) });
      await deleteToken(m);
    }
  } catch (e) { /* best-effort — local flag is already cleared */ }
}
