import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useCollection } from './hooks/useCollection';
import AuthPage from './pages/AuthPage';
import TodayPage from './pages/TodayPage';
import EventsPage from './pages/EventsPage';
import HousePage from './pages/HousePage';
import ReceiptsPage from './pages/ReceiptsPage';
import InfoPage from './pages/InfoPage';
import SettingsPage from './pages/SettingsPage';
import Avatar from './components/Avatar';
import { SunIcon, CalendarIcon, HomeIcon, ReceiptIcon, MapIcon, SlidersIcon } from './components/Icons';
import './styles.css';

function AppShell() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('today');
  // Subscribe only once signed in and approved — otherwise rules deny and log noise
  const ready = user && profile?.approved !== false;
  const { docs: receipts } = useCollection(ready ? 'receipts' : null);
  const { docs: bulletins } = useCollection(ready ? 'bulletins' : null);

  if (user === undefined) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontFamily:"'Barlow',system-ui,sans-serif",color:'#1a6b8a',fontSize:18 }}>
      Loading...
    </div>
  );
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
    { id:'events', label:'Events', Icon: CalendarIcon },
    { id:'house', label:'House', Icon: HomeIcon },
    { id:'receipts', label:'Receipts', badge: myReceiptAlerts, Icon: ReceiptIcon },
    { id:'info', label:'Info', badge: unseenBulletins, Icon: MapIcon },
  ];

  return (
    <div>
      <header className="app-header">
        <div className="app-header-top">
          <Avatar user={profile} size={26} />
          <span className="header-name">{profile?.displayName?.split(' ')[0] || profile?.email}</span>
          <div className="header-actions">
            <button className="icon-btn" title="Settings" onClick={() => setTab('settings')}>
              <SlidersIcon size={18} />
            </button>
            <button className="btn-mini" onClick={() => signOut(auth)}>Sign out</button>
          </div>
        </div>
        <div className="nav">
          {TABS.map(t => (
            <button key={t.id} className={`nav-btn ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
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

      {tab==='today' && <TodayPage />}
      {tab==='events' && <EventsPage />}
      {tab==='house' && <HousePage />}
      {tab==='receipts' && <ReceiptsPage />}
      {tab==='info' && <InfoPage />}
      {tab==='settings' && <SettingsPage />}
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppShell /></AuthProvider>;
}
