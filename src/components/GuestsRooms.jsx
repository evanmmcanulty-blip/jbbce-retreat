import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ROOMS } from '../constants';

export default function GuestsRooms({ users, isAdmin }) {
  async function setRoom(uid, room) { await updateDoc(doc(db,'users',uid), { room }); }
  return (
    <div>
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
