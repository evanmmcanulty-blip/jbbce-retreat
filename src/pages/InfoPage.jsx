import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useCollection } from '../hooks/useCollection';
import { safeUrl } from '../constants';
import Avatar from '../components/Avatar';

const BUILTINS = [
  { h:'⛴ FERRY & TRANSPORT', items:[
    { t:'Bay State Cruise Co. — Boston', d:'Fast ferry 90 min from World Trade Center. Book ahead!', u:'https://www.baystatecruisecompany.com' },
    { t:'City Cruises — Boston', d:'Alternative fast ferry from Boston.', u:'https://www.cityexperiences.com/provincetown' },
    { t:'Provincetown Fast Ferry — Plymouth', d:'90-min ferry, easier parking.', u:'https://www.p-townferry.com' },
  ]},
  { h:'🚲 BIKE RENTALS — PRICE-MATCH HACK', tip:'All three shops compete. Tell any of them you got a cheaper quote elsewhere — they will match it.',
    items:[
      { t:'Provincetown Bike Rentals', d:'Will match others.', u:'https://www.google.com/search?q=Provincetown+Bike+Rentals' },
      { t:'Ptown Bikes', d:'Bradford St. Cruisers, e-bikes.', u:'https://www.ptownbikes.com' },
      { t:'The Bike Shack', d:'Third competitor for the price match.', u:'https://www.google.com/search?q=The+Bike+Shack+Provincetown' },
    ]},
  { h:'🎭 SHOWS & TICKETS', items:[
    { t:'Miss Richfield 1981 — MUST SEE', d:'Book early — sells out.', u:'https://www.missrichfield.com' },
    { t:'Crown & Anchor', d:'Drag, cabaret, piano bar.', u:'https://onlyatthecrown.com' },
    { t:'Post Office Cabaret', d:'Nightly performers.', u:'https://www.google.com/search?q=Post+Office+Cabaret+Provincetown+tickets' },
  ]},
  { h:'🍴 FOOD & DRINKS', items:[
    { t:"Scott's Cakes", d:'353 Commercial St. Non-negotiable.', u:"https://www.google.com/maps/search/Scott's+Cakes+353+Commercial+St+Provincetown" },
    { t:'Happy Hour at The Red Inn', d:'15 Commercial St. Golden-hour waterfront.', u:'https://www.theredinn.com' },
    { t:'Tea Dance at the Boatslip', d:'161 Commercial St, 4–7pm daily. Week pass day one!', u:'https://www.boatslipresort.com' },
    { t:'Mussel Beach Health Club', d:'Day $10 / week $99.', u:'https://www.musselbeachprovincetown.com' },
  ]},
];

export default function InfoPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.admin;
  const [sub, setSub] = useState('board');

  return (
    <div className="page">
      <div className="stabs">
        <button className={`stab ${sub==='board'?'active':''}`} onClick={()=>setSub('board')}>📌 Bulletin Board</button>
        <button className={`stab ${sub==='grocery'?'active':''}`} onClick={()=>setSub('grocery')}>🛒 Groceries</button>
        <button className={`stab ${sub==='links'?'active':''}`} onClick={()=>setSub('links')}>🔗 Links & Tips</button>
      </div>
      {sub==='board' && <BulletinBoard profile={profile} isAdmin={isAdmin} />}
      {sub==='grocery' && <GroceryList profile={profile} isAdmin={isAdmin} />}
      {sub==='links' && <LinksTab profile={profile} isAdmin={isAdmin} />}
    </div>
  );
}

function BulletinBoard({ profile, isAdmin }) {
  const { docs: bulletins } = useCollection('bulletins');
  const { docs: users } = useCollection('users');
  const [text, setText] = useState('');

  async function post(e) {
    e.preventDefault();
    if (!text.trim()) return;
    await addDoc(collection(db,'bulletins'), {
      text: text.trim(), by: profile.uid, byName: profile.displayName,
      gotIt: [], createdAt: new Date().toISOString(),
    });
    setText('');
  }
  async function toggleGotIt(b) {
    const has = b.gotIt?.includes(profile.uid);
    await updateDoc(doc(db,'bulletins',b.id), {
      gotIt: has ? b.gotIt.filter(x=>x!==profile.uid) : [...(b.gotIt||[]), profile.uid]
    });
  }

  return (
    <div>
      <div className="section-sub">Announcements, reminders, things the crew needs to know. Hit "Got it" to confirm you saw it.</div>
      <form onSubmit={post} style={{marginBottom:14}}>
        <div className="form-group">
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder='e.g. "Boat leaves 9am SHARP tomorrow" or "We need more sunscreen"' />
        </div>
        <button className="btn btn-primary" type="submit">Post announcement</button>
      </form>
      {bulletins.length===0 && <div className="empty-note">No announcements yet.</div>}
      {[...bulletins].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).map(b => {
        const confirmedUsers = users.filter(u=>b.gotIt?.includes(u.uid));
        const iGotIt = b.gotIt?.includes(profile?.uid);
        return (
          <div key={b.id} className="bulletin-item">
            <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
              <div>
                <div style={{fontSize:12,fontWeight:'bold',color:'var(--ocean)'}}>{b.byName}</div>
                <div style={{fontSize:14,marginTop:2}}>{b.text}</div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:3}}>{new Date(b.createdAt).toLocaleString()}</div>
              </div>
              {(isAdmin||b.by===profile?.uid) && (
                <button className="btn btn-danger" onClick={async()=>{if(window.confirm('Delete?'))await deleteDoc(doc(db,'bulletins',b.id));}}>🗑</button>
              )}
            </div>
            <div className="gotit-row">
              <button className={`btn-mini ${iGotIt?'':''}`} style={iGotIt?{borderColor:'var(--sage)',color:'var(--sage)'}:{}}
                onClick={()=>toggleGotIt(b)}>
                {iGotIt?'✓ Got it':'Got it?'}
              </button>
              {confirmedUsers.map(u => <Avatar key={u.uid} user={u} size={22} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroceryList({ profile, isAdmin }) {
  const { docs: groceries } = useCollection('groceries');
  const { docs: users } = useCollection('users');
  const [item, setItem] = useState('');
  const [note, setNote] = useState('');

  async function add(e) {
    e.preventDefault();
    if (!item.trim()) return;
    await addDoc(collection(db,'groceries'), {
      item: item.trim(), note: note.trim(),
      addedBy: profile.uid, addedByName: profile.displayName,
      claimedBy: null, claimedByName: null, purchased: false,
      createdAt: new Date().toISOString(),
    });
    setItem(''); setNote('');
  }
  async function claim(g) {
    if (g.claimedBy === profile.uid) {
      await updateDoc(doc(db,'groceries',g.id), { claimedBy:null, claimedByName:null });
    } else {
      await updateDoc(doc(db,'groceries',g.id), { claimedBy:profile.uid, claimedByName:profile.displayName });
    }
  }
  async function togglePurchased(g) {
    await updateDoc(doc(db,'groceries',g.id), { purchased: !g.purchased });
  }

  const open = groceries.filter(g=>!g.purchased);
  const done = groceries.filter(g=>g.purchased);

  return (
    <div>
      <div className="section-sub">Add what the house needs. Tap "I'll get it" to claim an item, check it off once it's bought.</div>
      <form onSubmit={add} style={{marginBottom:14}}>
        <div className="grid2">
          <div className="form-group"><label>Item</label><input value={item} onChange={e=>setItem(e.target.value)} placeholder="e.g. Paper towels" /></div>
          <div className="form-group"><label>Note (optional)</label><input value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. the big pack" /></div>
        </div>
        <button className="btn btn-primary" type="submit">Add to list</button>
      </form>

      <div className="info-head" style={{marginTop:0}}>🛒 NEEDED ({open.length})</div>
      {open.length===0 && <div className="empty-note">Nothing needed right now!</div>}
      {open.map(g => {
        const claimer = users.find(u=>u.uid===g.claimedBy);
        const iClaimed = g.claimedBy===profile?.uid;
        return (
          <div key={g.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid var(--border)',flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:160}}>
              <div style={{fontSize:14,fontWeight:'bold'}}>{g.item}</div>
              {g.note && <div style={{fontSize:12,color:'var(--muted)'}}>{g.note}</div>}
              <div style={{fontSize:11,color:'var(--muted)'}}>added by {g.addedByName}</div>
            </div>
            {claimer ? (
              <span className="badge badge-s" style={{display:'flex',alignItems:'center',gap:4}}>
                <Avatar user={claimer} size={18} /> {claimer.displayName?.split(' ')[0]} is getting it
              </span>
            ) : (
              <span style={{fontSize:12,color:'var(--muted)'}}>unclaimed</span>
            )}
            <div className="btn-row">
              <button className="btn-mini" style={iClaimed?{borderColor:'var(--sage)',color:'var(--sage)'}:{}}
                onClick={()=>claim(g)}>
                {iClaimed ? "✓ I'll get it (unclaim)" : "I'll get it"}
              </button>
              {(iClaimed||isAdmin) && <button className="btn-mini" onClick={()=>togglePurchased(g)}>✓ Bought</button>}
              {(g.addedBy===profile?.uid||isAdmin) && (
                <button className="btn btn-danger" onClick={async()=>{if(window.confirm('Remove item?'))await deleteDoc(doc(db,'groceries',g.id));}}>🗑</button>
              )}
            </div>
          </div>
        );
      })}

      {done.length>0 && (
        <>
          <div className="info-head">✓ PURCHASED ({done.length})</div>
          {done.map(g => (
            <div key={g.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid var(--border)',opacity:.6}}>
              <div style={{flex:1}}>
                <span style={{fontSize:13,textDecoration:'line-through'}}>{g.item}</span>
                {g.claimedByName && <span style={{fontSize:11,color:'var(--muted)'}}> — got by {g.claimedByName.split(' ')[0]}</span>}
              </div>
              <button className="btn-mini" onClick={()=>togglePurchased(g)}>Undo</button>
              {(g.addedBy===profile?.uid||isAdmin) && (
                <button className="btn btn-danger" onClick={async()=>await deleteDoc(doc(db,'groceries',g.id))}>🗑</button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function LinksTab({ profile, isAdmin }) {
  const { docs: custom } = useCollection('infoCustom');
  const [form, setForm] = useState({ t:'',d:'',u:'' });

  async function add(e) {
    e.preventDefault();
    if (!form.t.trim()) return;
    await addDoc(collection(db,'infoCustom'), { ...form, by:profile.uid, byName:profile.displayName, createdAt:new Date().toISOString() });
    setForm({t:'',d:'',u:''});
  }

  return (
    <div>
      {BUILTINS.map(sec => (
        <div key={sec.h}>
          <div className="info-head">{sec.h}</div>
          {sec.tip && <div className="tip-box" style={{marginBottom:9}}>💡 {sec.tip}</div>}
          {sec.items.map(it => (
            <div key={it.t} className="link-card">
              <div className="link-icon">🔗</div>
              <div>
                <div style={{fontWeight:'bold',fontSize:14}}>{it.t}</div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{it.d}</div>
                <a className="link-url" href={it.u} target="_blank" rel="noopener noreferrer">Open ↗</a>
              </div>
            </div>
          ))}
        </div>
      ))}
      <div className="divider" />
      <div className="info-head">✨ CREW ADDITIONS</div>
      {custom.length===0 && <div style={{fontSize:13,color:'var(--muted)',marginBottom:8}}>No additions yet — add the first spot!</div>}
      {custom.map(it => (
        <div key={it.id} className="link-card">
          <div className="link-icon" style={{background:'var(--gl)'}}>✨</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:'bold',fontSize:14}}>{it.t}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{it.d} · {it.byName}</div>
            {safeUrl(it.u) && <a className="link-url" href={safeUrl(it.u)} target="_blank" rel="noopener noreferrer">Open ↗</a>}
          </div>
          {(isAdmin||it.by===profile?.uid) && (
            <button className="btn btn-danger" onClick={async()=>{if(window.confirm('Remove?'))await deleteDoc(doc(db,'infoCustom',it.id));}}>🗑</button>
          )}
        </div>
      ))}
      <form onSubmit={add} style={{marginTop:10}}>
        <div className="form-group"><label>Name</label><input value={form.t} onChange={e=>setForm(f=>({...f,t:e.target.value}))} /></div>
        <div className="form-group"><label>Why check it out</label><input value={form.d} onChange={e=>setForm(f=>({...f,d:e.target.value}))} /></div>
        <div className="form-group"><label>Link</label><input value={form.u} onChange={e=>setForm(f=>({...f,u:e.target.value}))} placeholder="https://..." /></div>
        <button className="btn btn-primary" type="submit">Add it</button>
      </form>
    </div>
  );
}
