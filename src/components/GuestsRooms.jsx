import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ROOMS } from '../constants';
import Avatar from './Avatar';
import { UsersIcon } from './Icons';

const chipStyle = { display:'inline-flex',alignItems:'center',justifyContent:'center',width:40,height:40,borderRadius:8,border:'1px solid var(--border)',background:'#fff',textDecoration:'none',fontSize:16,lineHeight:1 };

// Contact data (phone, venmoHandle) is collected in Settings but otherwise only
// surfaced when you owe someone money — this unburies it as a tap-to-reach roster.
function CrewContacts({ users }) {
  const crew = users.filter(u => u.approved !== false)
    .sort((a,b) => (a.displayName||'').localeCompare(b.displayName||''));
  const digits = s => String(s||'').replace(/\D/g,'');
  return (
    <div style={{marginBottom:18}}>
      <div className="info-head" style={{marginTop:0}}><UsersIcon size={12}/>REACH THE CREW</div>
      <div className="section-sub" style={{marginTop:0}}>Tap to text, call, or Venmo anyone — handy when the group splits up around town.</div>
      {crew.map(u => {
        const ph = digits(u.phone);
        const vh = (u.venmoHandle||'').replace(/^@/,'');
        return (
          <div key={u.uid} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
            <Avatar user={u} size={30} />
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:'bold'}}>{u.displayName}</div>
              {!ph && !vh && <div style={{fontSize:11,color:'var(--muted)'}}>No contact info added yet</div>}
            </div>
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              {ph && <a style={chipStyle} href={`sms:${ph}`} aria-label={`Text ${u.displayName}`}>💬</a>}
              {ph && <a style={chipStyle} href={`tel:${ph}`} aria-label={`Call ${u.displayName}`}>📞</a>}
              {vh && <a style={{...chipStyle,color:'#3D95CE',fontWeight:'bold',fontSize:16}} href={`https://venmo.com/${vh}`} target="_blank" rel="noopener noreferrer" aria-label={`Venmo ${u.displayName}`}>V</a>}
            </div>
          </div>
        );
      })}
      <div className="divider" />
    </div>
  );
}

export default function GuestsRooms({ users, isAdmin }) {
  async function setRoom(uid, room) { await updateDoc(doc(db,'users',uid), { room }); }
  return (
    <div>
      <CrewContacts users={users} />
      <div className="section-sub">{isAdmin ? 'Assign rooms — the cost split updates instantly.' : 'Current room assignments:'}</div>
      {ROOMS.map(rm => {
        const occ = users.filter(u => u.room === rm.id);
        return (
          <div key={rm.id} className="card">
            <div className="card-body" style={{borderTop:'none',padding:'11px 14px'}}>
              <b>{rm.name}</b>
              <div style={{marginTop:5,display:'flex',gap:8,flexWrap:'wrap'}}>
                {occ.length ? occ.map(u => (
                  <span key={u.uid} className="check-pill sel" style={{cursor:'default'}}>
                    {u.avatar && u.avatar!=='⭐' ? u.avatar : '👤'} {u.displayName}
                  </span>
                )) : <span style={{fontSize:13,color:'var(--muted)'}}>Empty — open nights absorbed by occupied rooms</span>}
              </div>
            </div>
          </div>
        );
      })}
      {isAdmin && (
        <div style={{marginTop:14}}>
          <div className="info-head">ASSIGN ROOMS</div>
          {users.map(u => (
            <div key={u.uid} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:15}}>{u.avatar && u.avatar!=='⭐' ? u.avatar : '👤'} {u.displayName}</span>
              <select style={{width:140}} value={u.room||''} onChange={e=>setRoom(u.uid, e.target.value)}>
                <option value="">No room</option>
                {ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          ))}
          <div className="tip-box" style={{marginTop:10}}>💡 Fill-in guest taking over a vacated room? Assign them the room here and set their arrival date in Me → Arrivals — the cost engine handles the rest.</div>
        </div>
      )}
    </div>
  );
}
