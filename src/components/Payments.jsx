import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCollection } from '../hooks/useCollection';
import { useDoc } from '../hooks/useDoc';
import { money } from '../constants';
import { calcOwed } from '../utils/costEngine';
import Avatar from './Avatar';

export default function Payments({ isAccountant, profile }) {
  const { docs: users } = useCollection('users');
  const { docs: payDocs } = useCollection('payments');
  const { data: costData } = useDoc('config/cost');
  const { owe } = calcOwed(users, costData);
  // Inline editor replaces the old window.prompt flows
  const [editing, setEditing] = useState(null); // { uid, field: 'logged'|'confirmed' }
  const [amt, setAmt] = useState('');

  function startEdit(uid, field) {
    const cur = payDocs.find(p=>p.uid===uid);
    setAmt(String(cur?.[field] ?? cur?.logged ?? ''));
    setEditing({ uid, field });
  }
  async function saveEdit() {
    const n = parseFloat(amt);
    if (isNaN(n) || n < 0) return;
    await setDoc(doc(db,'payments',editing.uid), { uid: editing.uid, [editing.field]: n }, { merge: true });
    setEditing(null); setAmt('');
  }

  const totalOwe = Object.values(owe).reduce((s,v)=>s+v,0);
  const totalConf = payDocs.reduce((s,p)=>s+(p.confirmed||0),0);

  return (
    <div>
      <div className="tip-box" style={{marginBottom:12}}>💳 Chris Ladeau collects house funds. Log what you've sent; Chris confirms receipt.</div>
      {users.map(u => {
        const pd = payDocs.find(p=>p.uid===u.uid) || {};
        const owed = owe[u.uid]||0;
        const hasRoom = !!u.room;
        const hasDates = !!u.arrivalDateRaw && !!u.departureDateRaw;
        const bal = owed - (pd.confirmed||0);
        const mine = u.uid===profile?.uid;
        let statusEl;
        if (!hasRoom) statusEl = <span style={{color:'var(--muted)',fontSize:13}}>No room — not in split</span>;
        else if (!hasDates) statusEl = <span style={{color:'var(--gold)',fontSize:13}}>⚠️ Set arrival/departure dates</span>;
        else if (bal<=0.01 && owed>0) statusEl = <span style={{fontWeight:'bold',color:'var(--sage)'}}>✓ Paid up</span>;
        else statusEl = <span style={{fontWeight:'bold',color:'var(--coral)'}}>{money(bal)} left</span>;
        const isEditing = editing?.uid === u.uid;
        return (
          <div key={u.uid}>
            <div className="pay-row">
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <Avatar user={u} size={26} />
                <div>
                  <div style={{fontWeight:'bold',fontSize:14}}>{u.displayName}</div>
                  <div style={{fontSize:11,color:'var(--muted)'}}>Owes {money(owed)} · logged {money(pd.logged||0)} · confirmed {money(pd.confirmed||0)}</div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                {statusEl}
                <div className="btn-row" style={{justifyContent:'flex-end',marginTop:4}}>
                  {mine && hasRoom && <button className="btn-mini" onClick={()=>startEdit(u.uid,'logged')}>Log payment</button>}
                  {isAccountant && <button className="btn-mini" onClick={()=>startEdit(u.uid,'confirmed')}>Confirm</button>}
                </div>
              </div>
            </div>
            {isEditing && (
              <div style={{display:'flex',gap:7,alignItems:'center',padding:'8px 0 10px',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:12,color:'var(--muted)',flexShrink:0}}>
                  {editing.field==='logged' ? 'Total sent to Chris so far ($)' : 'Confirm total received ($)'}
                </span>
                <input type="number" step="0.01" min="0" value={amt} onChange={e=>setAmt(e.target.value)}
                  autoFocus style={{maxWidth:110}} />
                <button className="btn btn-primary" style={{padding:'7px 13px',fontSize:13}} onClick={saveEdit}>Save</button>
                <button className="btn-mini" onClick={()=>setEditing(null)}>Cancel</button>
              </div>
            )}
          </div>
        );
      })}
      <div className="total-banner" style={{marginTop:12}}>
        <span style={{fontWeight:'bold',color:'var(--sage)'}}>Collected {money(totalConf)} of {money(totalOwe)}</span>
        <span style={{fontSize:12,color:'var(--muted)'}}>{money(totalOwe-totalConf)} outstanding</span>
      </div>
    </div>
  );
}
