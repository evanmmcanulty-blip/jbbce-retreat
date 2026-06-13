import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCollection } from '../hooks/useCollection';
import { useDoc } from '../hooks/useDoc';
import { ROOMS, TOTAL_NIGHTS, money } from '../constants';
import { calcOwed, computeCostTotal } from '../utils/costEngine';

export default function CostSplit({ isAccountant }) {
  const { docs: users } = useCollection('users');
  const { data: costData } = useDoc('config/cost');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const { cost, disc, sub, tax, total } = computeCostTotal(costData);
  const { owe, nights, nightly } = calcOwed(users, costData);

  async function save() {
    await setDoc(doc(db,'config','cost'), form, { merge: true });
    setEditing(false);
  }

  return (
    <div>
      <div style={{fontSize:14,color:'var(--muted)',marginBottom:14}}>
        Total <b style={{color:'var(--ocean)'}}>{money(total)}</b> · {TOTAL_NIGHTS} nights · {money(nightly)}/night house · {money(nightly/ROOMS.length)}/room/night
      </div>
      <table className="cost-table">
        <thead><tr><th>Line item</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
        <tbody>
          <tr><td>Base rent (12 nights)</td><td>{money(cost.baseRent)}</td></tr>
          <tr><td>Discount ({cost.discountPct}%)</td><td style={{color:'var(--coral)'}}>-{money(disc)}</td></tr>
          <tr><td>Cleaning fee #1</td><td>{money(cost.cleaning1)}</td></tr>
          <tr><td>Cleaning fee #2 (mid-stay)</td><td>{money(cost.cleaning2)}</td></tr>
          {(cost.extras||[]).map((x,i)=><tr key={i}><td>{x.label}</td><td>{money(x.amount)}</td></tr>)}
          <tr><td>Lodging tax ({cost.taxPct}%)</td><td>{money(tax)}</td></tr>
          <tr className="room-row"><td><b>TOTAL</b></td><td>{money(total)}</td></tr>
        </tbody>
      </table>

      <div style={{marginTop:16}}>
        <table className="cost-table">
          <thead><tr><th>Room / Person</th><th style={{textAlign:'right'}}>Nights</th><th style={{textAlign:'right'}}>Owes</th></tr></thead>
          <tbody>
            {ROOMS.map(rm => {
              const occ = users.filter(u=>u.room===rm.id);
              return [
                <tr key={rm.id} className="room-row">
                  <td colSpan={3}>
                    {rm.name} — {occ.length>0 ? occ.map(u=>u.displayName).join(' + ') : 'empty (open nights absorbed by occupied rooms)'}
                  </td>
                </tr>,
                ...occ.map(u => (
                  <tr key={u.uid} className="person-row">
                    <td>↳ {u.avatar&&u.avatar!=='⭐'?u.avatar+' ':''}{u.displayName}{!u.arrivalDateRaw||!u.departureDateRaw?' ⚠️ dates not set':''}</td>
                    <td>{nights[u.uid]||0} nights</td>
                    <td>{money(owe[u.uid]||0)}</td>
                  </tr>
                ))
              ];
            })}
            {users.filter(u=>!u.room).length>0 && [
              <tr key="noroom" className="room-row"><td colSpan={3}>No room assigned — not in the split yet</td></tr>,
              ...users.filter(u=>!u.room).map(u => (
                <tr key={u.uid} className="person-row">
                  <td>↳ {u.displayName}</td><td>—</td><td>—</td>
                </tr>
              ))
            ]}
          </tbody>
        </table>
        <div className="total-banner">
          <span style={{fontWeight:'bold',color:'var(--sage)'}}>Allocated {money(Object.values(owe).reduce((s,v)=>s+v,0))}</span>
          <span style={{fontSize:12,color:'var(--muted)'}}>Room assignments & dates drive this — update in House → Guests & Rooms</span>
        </div>
      </div>
      <div className="tip-box" style={{marginTop:12}}>
        💡 This table reflects whoever is in each room right now. Change rooms in House → Guests & Rooms and it updates instantly. People without a room aren't charged. People without dates set show a ⚠️ warning.
      </div>

      {isAccountant && !editing && <button className="btn btn-secondary" style={{marginTop:14}} onClick={()=>{setForm({...cost});setEditing(true);}}>Edit line items</button>}
      {editing && (
        <div style={{marginTop:14}}>
          <div className="grid2">
            <div className="form-group"><label>Base rent ($)</label><input type="number" value={form.baseRent} onChange={e=>setForm(f=>({...f,baseRent:+e.target.value}))} /></div>
            <div className="form-group"><label>Discount (%)</label><input type="number" value={form.discountPct} onChange={e=>setForm(f=>({...f,discountPct:+e.target.value}))} /></div>
          </div>
          <div className="grid2">
            <div className="form-group"><label>Cleaning #1 ($)</label><input type="number" value={form.cleaning1} onChange={e=>setForm(f=>({...f,cleaning1:+e.target.value}))} /></div>
            <div className="form-group"><label>Cleaning #2 ($)</label><input type="number" value={form.cleaning2} onChange={e=>setForm(f=>({...f,cleaning2:+e.target.value}))} /></div>
          </div>
          <div className="form-group"><label>Lodging tax %</label><input type="number" value={form.taxPct} onChange={e=>setForm(f=>({...f,taxPct:+e.target.value}))} /></div>
          <div className="btn-row"><button className="btn btn-primary" onClick={save}>Save</button><button className="btn-mini" onClick={()=>setEditing(false)}>Cancel</button></div>
        </div>
      )}
    </div>
  );
}
