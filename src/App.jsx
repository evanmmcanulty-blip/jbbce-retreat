import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { UsersProvider } from './hooks/UsersContext';
import { useCollection } from './hooks/useCollection';
import AuthPage from './pages/AuthPage';
import TodayPage from './pages/TodayPage';
import EventsPage from './pages/EventsPage';
import HousePage from './pages/HousePage';
import ReceiptsPage from './pages/ReceiptsPage';
import InfoPage from './pages/InfoPage';
import SettingsPage from './pages/SettingsPage';
import Avatar from './components/Avatar';
import Loader from './components/Loader';
import { SunIcon, CalendarIcon, HomeIcon, ReceiptIcon, MapIcon, SlidersIcon } from './components/Icons';
import './styles.css';

function AppShell() {
  const { user, profile } = useAuth();
  // A push tap opens /?n=<tab>; honor it once, then clean the URL.
  const [tab, setTab] = useState(() => {
    const n = new URLSearchParams(window.location.search).get('n');
    const valid = ['today', 'events', 'house', 'receipts', 'info', 'settings'];
    if (n && valid.includes(n)) {
      window.history.replaceState({}, '', window.location.pathname);
      return n;
    }
    return 'today';
  });
  // Fluid tab navigation: snapshot → swap → animate. flushSync makes React's
  // DOM update land synchronously so the View Transition captures the new
  // screen, not the old one. Degrades to an instant swap without the API or
  // when the user prefers reduced motion.
  // Tracks whether the current screen arrived via a View Transition. The VT glide
  // owns tab-to-tab nav; the per-section cascade owns cold load (no VT to conflict
  // with). This ref decides which entrance the incoming .tab-main gets.
  // Hold the boot loader for a beat even when auth restores instantly, so the
  // brand moment actually registers instead of flashing by in a few ms.
  const [minWait, setMinWait] = useState(true);
  useEffect(() => { const t = setTimeout(() => setMinWait(false), 900); return () => clearTimeout(t); }, []);

  // Detect new deploys: compare index.html ETag on each visibility restore
  const [swUpdate, setSwUpdate] = useState(false);
  useEffect(() => {
    let knownEtag = null;
    async function check() {
      try {
        const r = await fetch('/', { method: 'HEAD', cache: 'no-store' });
        const etag = r.headers.get('etag') || r.headers.get('last-modified');
        if (!etag) return;
        if (knownEtag === null) { knownEtag = etag; return; }
        if (etag !== knownEtag) setSwUpdate(true);
      } catch {}
    }
    check();
    const handler = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);
  const viaVT = useRef(false);
  const navigate = (t) => {
    if (t === tab) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce) { viaVT.current = false; setTab(t); return; }
    viaVT.current = true;
    // Tapping a new tab mid-transition aborts the running one, rejecting its
    // promise — expected (newest tap wins), so swallow it to keep the console clean.
    document.startViewTransition(() => flushSync(() => setTab(t))).finished.catch(() => {});
  };
  // Subscribe only once signed in and approved — otherwise rules deny and log noise
  const ready = user && profile?.approved !== false;
  const { docs: receipts } = useCollection(ready ? 'receipts' : null);
  const { docs: bulletins } = useCollection(ready ? 'bulletins' : null);

  if (user === undefined || minWait) return <Loader />;
  if (!user) return <AuthPage />;

  // Approval gate: new accounts wait for Brandon before seeing trip data
  if (profile?.approved === false) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:14,padding:24,textAlign:'center' }}>
      <div style={{ fontSize:44 }}>🛂</div>
      <div style={{ fontSize:18,fontWeight:'bold',color:'var(--ocean)' }}>Almost in, {profile.displayName?.split(' ')[0] || 'friend'}!</div>
      <div style={{ fontSize:14,color:'var(--muted)',maxWidth:320 }}>
        Your account is waiting for Brandon to wave you through. Give him a nudge in the group chat — this page updates by itself once he does.
      </div>
      <button className="btn-mini" onClick={() => signOut(auth)}>Sign out</button>
    </div>
  );

  // Receipts I'm tagged in, didn't upload, and haven't had a payment confirmed yet
  const myReceiptAlerts = receipts.filter(r =>
    r.whoIds?.includes(profile?.uid) &&
    r.by !== profile?.uid &&
    !r.fullyPaid &&
    !(r.payments?.[profile?.uid]?.confirmed)
  ).length;

  // Recent announcements (last 48h) I haven't tapped "Got it" on
  const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const unseenBulletins = bulletins.filter(b =>
    b.createdAt > cutoff &&
    b.by !== profile?.uid &&
    !b.gotIt?.includes(profile?.uid)
  ).length;

  const TABS = [
    { id:'today', label:'Today', Icon: SunIcon },
    { id:'events', label:'Plans', Icon: CalendarIcon },
    { id:'house', label:'House', Icon: HomeIcon },
    { id:'receipts', label:'Money', badge: myReceiptAlerts, Icon: ReceiptIcon },
    { id:'info', label:'Info', badge: unseenBulletins, Icon: MapIcon },
  ];

  return (
    <UsersProvider>
    <div>
      {swUpdate && (
        <div style={{position:'fixed',bottom:60,left:0,right:0,background:'var(--ocean)',color:'#fff',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:999,fontSize:14,boxShadow:'0 -2px 8px rgba(0,0,0,.2)'}}>
          <span>New version available</span>
          <button style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',borderRadius:8,padding:'5px 14px',cursor:'pointer',fontSize:14}} onClick={()=>window.location.reload()}>Refresh</button>
        </div>
      )}
      <header className="app-header">
        <div className="app-header-top">
          <Avatar user={profile} size={26} />
          <span className="header-name">{profile?.displayName?.split(' ')[0] || profile?.email}</span>
          <div className="header-actions">
            <button className="icon-btn" title="Me" onClick={() => navigate('settings')}>
              <SlidersIcon size={18} />
            </button>
            <button className="btn-mini" onClick={() => signOut(auth)}>Sign out</button>
          </div>
        </div>
        <div className="nav">
          {TABS.map(t => (
            <button key={t.id} className={`nav-btn ${tab===t.id?'active':''}`} onClick={()=>navigate(t.id)}>
              <div className="nav-icon-wrap">
                <t.Icon size={18} />
                {t.badge > 0 && <span className="notif-dot">{t.badge}</span>}
              </div>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="hero">
        <h1>2026 JBBCE Executive Retreat</h1>
        <div className="sub">5–7 POINT ST #3, PROVINCETOWN, MA · JUNE 29 – JULY 11</div>
        <div className="ac">Joint Brotherhood of Beachside Cock Enthusiasts</div>
      </div>

      <main className={`tab-main${viaVT.current ? '' : ' stagger'}`} key={tab}>
        {tab==='today' && <TodayPage />}
        {tab==='events' && <EventsPage />}
        {tab==='house' && <HousePage />}
        {tab==='receipts' && <ReceiptsPage />}
        {tab==='info' && <InfoPage />}
        {tab==='settings' && <SettingsPage />}
      </main>
    </div>
    </UsersProvider>
  );
}

export default function App() {
  return <AuthProvider><AppShell /></AuthProvider>;
}
