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
import './styles.css';

function AppShell() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('today');
  const { docs: receipts } = useCollection('receipts');
  const { docs: bulletins } = useCollection('bulletins');

  if (user === undefined) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontFamily:'Georgia,serif',color:'#1a6b8a',fontSize:18 }}>
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
    { id:'today', label:'☀ Today' },
    { id:'events', label:'📅 Events' },
    { id:'house', label:'🏠 House' },
    { id:'receipts', label:'🧾 Receipts', badge: myReceiptAlerts },
    { id:'info', label:'🗺 Info', badge: unseenBulletins },
  ];

  return (
    <div>
      <div className="hero">
        <h1>2026 JBBCE Executive Retreat</h1>
        <div className="sub">5–7 POINT ST #3, PROVINCETOWN, MA · JUNE 29 – JULY 11</div>
        <div className="ac">Joint Brotherhood of Beachside Cock Enthusiasts</div>
      </div>

      {/* User bar — name + avatar + gear on top */}
      <div className="user-bar">
        <span style={{fontSize:20}}>{profile?.avatar && profile.avatar!=='⭐' ? profile.avatar : '👤'}</span>
        <span style={{fontWeight:'bold',color:'var(--ocean)',fontSize:14}}>{profile?.displayName || profile?.email}</span>
        <button className="btn-mini" style={{marginLeft:'auto',fontSize:16,padding:'4px 10px'}}
          title="My settings" onClick={() => setTab('settings')}>⚙️</button>
        <button className="btn-mini" onClick={() => signOut(auth)}>Sign out</button>
      </div>

      {/* Main nav below user bar */}
      <div className="nav-wrap">
        <div className="nav">
          {TABS.map(t => (
            <button key={t.id} className={`nav-btn ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
              {t.label}{t.badge > 0 && <span className="notif-dot">{t.badge}</span>}
            </button>
          ))}
        </div>
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
