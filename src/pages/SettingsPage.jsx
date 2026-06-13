import React, { useState } from 'react';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useCollection } from '../hooks/useCollection';
import { ROOMS, TRAVEL_MODES_ARR, TRAVEL_MODES_DEP } from '../constants';
import Avatar from '../components/Avatar';
import { UserIcon, LogInIcon, LogOutIcon, SlidersIcon } from '../components/Icons';

export default function SettingsPage() {
  const { profile } = useAuth();
  const { docs: users } = useCollection('users');
  const isAdmin = profile?.admin;
  const [sub, setSub] = useState('me');

  return (
    <div className="page">
      <div className="stabs">
        <button className={`stab ${sub==='me'?'active':''}`} onClick={()=>setSub('me')}><UserIcon size={13}/>My Profile</button>
        <button className={`stab ${sub==='arrivals'?'active':''}`} onClick={()=>setSub('arrivals')}><LogInIcon size={13}/>Arrivals</button>
        <button className={`stab ${sub==='departures'?'active':''}`} onClick={()=>setSub('departures')}><LogOutIcon size={13}/>Departures</button>
        {isAdmin && <button className={`stab ${sub==='admin'?'active':''}`} onClick={()=>setSub('admin')}><SlidersIcon size={13}/>Admin</button>}
      </div>
      {sub==='me' && <MyProfile profile={profile} />}
      {sub==='arrivals' && <TravelTab kind="arr" users={users} profile={profile} isAdmin={isAdmin} />}
      {sub==='departures' && <TravelTab kind="dep" users={users} profile={profile} isAdmin={isAdmin} />}
      {isAdmin && sub==='admin' && <AdminTab users={users} profile={profile} />}
    </div>
  );
}

function MyProfile({ profile }) {
  // Avatar holds a single emoji; strip any stray initials/digits that crept in.
  const [avatar, setAvatar] = useState((profile?.avatar || '').replace(/[A-Za-z0-9\s]/g, ''));
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [fullName, setFullName] = useState(profile?.fullName || profile?.displayName || '');
  const [saved, setSaved] = useState(false);
  const roomName = ROOMS.find(r => r.id === profile?.room)?.name;

  async function save() {
    await updateDoc(doc(db, 'users', profile.uid), {
      avatar: avatar.replace(/[A-Za-z0-9\s]/g, '').trim() || '⭐',
      displayName: displayName.trim(),
      fullName: fullName.trim(),
    });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:16 }}>
        <span style={{ fontSize:42 }}>{avatar && avatar!=='⭐' ? avatar : '👤'}</span>
        <div>
          <div style={{ fontSize:18,fontWeight:'bold' }}>{profile?.displayName || profile?.email}</div>
          <div style={{ fontSize:12,color:'var(--muted)' }}>{profile?.email}</div>
          <div style={{ fontSize:13,color:'var(--ocean)',fontWeight:'bold',marginTop:2 }}>
            {roomName ? `🛏 ${roomName}` : 'No room assigned yet'}
          </div>
        </div>
      </div>
      <div className="form-group">
        <label>Display name (what everyone sees)</label>
        <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="e.g. Brandon N" />
      </div>
      <div className="form-group">
        <label>Full name</label>
        <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="e.g. Brandon Nwokocha" />
      </div>
      <div className="form-group">
        <label>Your avatar — type any emoji</label>
        <input value={avatar} onChange={e=>setAvatar(e.target.value)} maxLength={4}
          style={{ fontSize:28,textAlign:'center' }} placeholder="🏖️" />
        <div style={{ fontSize:11,color:'var(--muted)',marginTop:3 }}>
          iPhone: tap 🌐 key · Android: emoji button · Mac: ⌘+Ctrl+Space · Windows: Win+.
        </div>
      </div>
      <button className="btn btn-primary" onClick={save}>{saved ? 'Saved! ✓' : 'Save changes'}</button>
    </div>
  );
}

function TravelTab({ kind, users, profile, isAdmin }) {
  const [editUid, setEditUid] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [savedUid, setSavedUid] = useState(null);
  const MODES = kind==='arr' ? TRAVEL_MODES_ARR : TRAVEL_MODES_DEP;
  const needsFlight = m => /Flight/i.test(m||'');
  const needsFerry = m => /Ferry/i.test(m||'');

  function startEdit(u) {
    setError('');
    setEditUid(u.uid);
    setForm(kind==='arr' ? {
      mode: u.travelModeArr || TRAVEL_MODES_ARR[0],
      dateRaw: u.arrivalDateRaw || '',
      time: u.arrivalTime || '',
      ferry: u.arrivalFerry || '',
      flightNum: u.arrivalFlight || '',
      notes: u.arrivalNotes || '',
    } : {
      mode: u.travelModeDep || TRAVEL_MODES_DEP[0],
      dateRaw: u.departureDateRaw || '',
      time: u.departureTime || '',
      ferry: u.departureFerry || '',
      flightNum: u.departureFlight || '',
      notes: u.departureNotes || '',
    });
  }

  async function save(uid) {
    // REQUIRED DATE VALIDATION
    if (!form.dateRaw) {
      setError(kind==='arr' ? '⚠️ Arrival date missing — date is required to save.' : '⚠️ Departure date is required to save.');
      return;
    }
    setError('');
    const upd = kind==='arr' ? {
      travelModeArr: form.mode, arrivalDateRaw: form.dateRaw, arrivalTime: form.time,
      arrivalFerry: form.ferry, arrivalFlight: form.flightNum, arrivalNotes: form.notes,
    } : {
      travelModeDep: form.mode, departureDateRaw: form.dateRaw, departureTime: form.time,
      departureFerry: form.ferry, departureFlight: form.flightNum, departureNotes: form.notes,
    };
    await updateDoc(doc(db, 'users', uid), upd);
    setSavedUid(uid);
    setTimeout(() => setSavedUid(null), 2000);
    setEditUid(null);
  }

  return (
    <div>
      <div className="section-sub">{kind==='arr'?'Arrivals':'Departures'} — tap a card to edit (yours, or anyone's if admin). Dates drive the cost split.</div>
      {users.map(u => {
        const canEdit = u.uid === profile?.uid || isAdmin;
        const dateRaw = kind==='arr' ? u.arrivalDateRaw : u.departureDateRaw;
        const time = kind==='arr' ? u.arrivalTime : u.departureTime;
        const mode = kind==='arr' ? u.travelModeArr : u.travelModeDep;
        const flight = kind==='arr' ? u.arrivalFlight : u.departureFlight;
        const ferry = kind==='arr' ? u.arrivalFerry : u.departureFerry;
        const notes = kind==='arr' ? u.arrivalNotes : u.departureNotes;
        const isEditing = editUid === u.uid;
        return (
          <div key={u.uid} className="card">
            <div className="card-head" onClick={() => canEdit && (isEditing ? setEditUid(null) : startEdit(u))}>
              <div>
                <div className="card-title" style={{display:'flex',alignItems:'center',gap:8}}>
                  <Avatar user={u} size={24} />
                  {u.displayName}
                  {savedUid===u.uid && <span className="badge badge-s">Saved ✓</span>}
                </div>
                <div className="card-sub">
                  {mode || 'Not set'}{dateRaw ? ` · ${dateRaw}` : ' · ⚠️ no date set'}{time ? ` · ${time}` : ''}
                </div>
                {flight && needsFlight(mode) && (
                  <div style={{fontSize:11,marginTop:2}}>
                    ✈ {flight} ·{' '}
                    <a href={`https://www.google.com/search?q=flight+${encodeURIComponent(flight)}+status`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:'var(--ocean)'}}>status ↗</a>
                  </div>
                )}
                {ferry && needsFerry(mode) && <div style={{fontSize:11,marginTop:2}}>⛴ {ferry}</div>}
                {notes && <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{notes}</div>}
              </div>
              {canEdit && <span className={`chev ${isEditing?'open':''}`}>▼</span>}
            </div>
            {isEditing && canEdit && (
              <div className="card-body" style={{paddingTop:12}}>
                {error && <div className="error-msg">{error}</div>}
                <div className="form-group"><label>Mode</label>
                  <select value={form.mode} onChange={e=>setForm(f=>({...f,mode:e.target.value}))}>
                    {MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="grid2">
                  <div className="form-group">
                    <label>{kind==='arr'?'Arrival date':'Departure date'} <span style={{color:'var(--coral)'}}>*required</span></label>
                    <input type="date" value={form.dateRaw} min="2026-06-29" max="2026-07-11"
                      onChange={e=>setForm(f=>({...f,dateRaw:e.target.value}))} />
                  </div>
                  <div className="form-group"><label>Time (optional)</label>
                    <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} />
                  </div>
                </div>
                {needsFerry(form.mode) && (
                  <div className="form-group"><label>Ferry details (optional)</label>
                    <input value={form.ferry} onChange={e=>setForm(f=>({...f,ferry:e.target.value}))} placeholder="e.g. Bay State 3:30pm from WTC" />
                  </div>
                )}
                {needsFlight(form.mode) && (
                  <div className="form-group"><label>Flight number (optional)</label>
                    <input value={form.flightNum} onChange={e=>setForm(f=>({...f,flightNum:e.target.value}))} placeholder="e.g. 9K 123" />
                  </div>
                )}
                <div className="form-group"><label>Notes</label>
                  <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
                </div>
                <div className="btn-row">
                  <button className="btn btn-primary" onClick={()=>save(u.uid)}>Save</button>
                  <button className="btn-mini" onClick={()=>{setEditUid(null);setError('');}}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const EXPORT_COLLECTIONS = ['users','events','ideas','meals','receipts','bulletins','groceries','infoCustom','payments','config'];

function AdminTab({ users, profile }) {
  const [exporting, setExporting] = useState(false);
  async function toggleAdmin(uid, cur) { await updateDoc(doc(db,'users',uid), { admin: !cur }); }
  async function toggleAccountant(uid, cur) { await updateDoc(doc(db,'users',uid), { accountant: !cur }); }
  async function approve(uid) { await updateDoc(doc(db,'users',uid), { approved: true }); }

  // Full-data JSON backup — Firestore free tier has no backups; this is the safety net
  async function exportAll() {
    setExporting(true);
    try {
      const dump = { exportedAt: new Date().toISOString() };
      for (const name of EXPORT_COLLECTIONS) {
        const snap = await getDocs(collection(db, name));
        dump[name] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      const url = URL.createObjectURL(new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `jbbce-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  }

  const pending = users.filter(u => u.approved === false);

  return (
    <div>
      <div className="section-sub">Toggle admin for other users. Admins can edit/delete anything and manage rooms. The accountant (Chris) can edit cost line items and confirm house-fund payments.</div>

      {pending.length > 0 && (
        <div style={{marginBottom:14}}>
          <div className="info-head" style={{marginTop:0}}>⏳ WAITING FOR APPROVAL</div>
          {pending.map(u => (
            <div key={u.uid} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:15}}>{u.displayName} <span style={{fontSize:11,color:'var(--muted)'}}>{u.email}</span></span>
              <button className="btn btn-primary" style={{fontSize:12,padding:'6px 12px'}} onClick={()=>approve(u.uid)}>✓ Approve</button>
            </div>
          ))}
        </div>
      )}

      <div className="tip-box" style={{marginBottom:14,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <span style={{flex:1}}>💾 Download everything (receipts, payments, events…) as a JSON file. Do this weekly and on the last day — there are no other backups.</span>
        <button className="btn btn-secondary" disabled={exporting} onClick={exportAll}>{exporting?'Exporting…':'Export backup'}</button>
      </div>
      {users.filter(u => u.uid !== profile.uid).map(u => (
        <div key={u.uid} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'8px 0',borderBottom:'1px solid var(--border)',flexWrap:'wrap'}}>
          <span style={{fontSize:16}}>{u.avatar && u.avatar!=='⭐' ? u.avatar : '👤'} {u.displayName}</span>
          <div className="btn-row">
            <button className="btn-mini" style={u.admin?{borderColor:'var(--sage)',color:'var(--sage)'}:{}}
              onClick={()=>toggleAdmin(u.uid, u.admin)}>
              {u.admin ? '✓ Admin — remove' : 'Make admin'}
            </button>
            <button className="btn-mini" style={u.accountant?{borderColor:'var(--sage)',color:'var(--sage)'}:{}}
              onClick={()=>toggleAccountant(u.uid, u.accountant)}>
              {u.accountant ? '✓ Accountant — remove' : 'Make accountant'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
