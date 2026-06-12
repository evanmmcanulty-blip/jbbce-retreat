import React, { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useCollection } from '../hooks/useCollection';
import { useDoc } from '../hooks/useDoc';
import { TRIP_DAYS, ROOMS, TOTAL_NIGHTS, money } from '../constants';
import { calcOwed, computeCostTotal } from '../utils/costEngine';
import Avatar from '../components/Avatar';

export default function HousePage() {
  const { profile } = useAuth();
  const [sub, setSub] = useState('info');
  const isAdmin = profile?.admin;
  const isAccountant = profile?.accountant || isAdmin;

  return (
    <div className="page">
      <div className="stabs">
        <button className={`stab ${sub==='info'?'active':''}`} onClick={()=>setSub('info')}>🏠 House Info</button>
        <button className={`stab ${sub==='cost'?'active':''}`} onClick={()=>setSub('cost')}>💰 Cost Split</button>
        <button className={`stab ${sub==='pay'?'active':''}`} onClick={()=>setSub('pay')}>💳 Payments</button>
      </div>
      {sub==='info' && <HouseInfo isAdmin={isAdmin} />}
      {sub==='cost' && <CostSplit isAccountant={isAccountant} />}
      {sub==='pay' && <Payments isAccountant={isAccountant} profile={profile} />}
    </div>
  );
}

function HouseInfo({ isAdmin }) {
  const { data: houseData } = useDoc('config/house');
  const [editing, setEditing] = useState(false);
  const [codes, setCodes] = useState(null);
  const [rules, setRules] = useState(null);

  const defaultCodes = [{label:'Front door',value:'emailed week prior'},{label:'Wifi network',value:'set me'},{label:'Wifi password',value:'set me'}];
  const defaultRules = ['Quiet hours after midnight.','Strip your bed + towel pile on departure day.','Label your food in the fridge.','Last one out locks up + AC off.','Chris is collecting house funds — see Payments tab.'];
  const currentCodes = houseData?.codes || defaultCodes;
  const currentRules = houseData?.rules || defaultRules;

  async function save() {
    await setDoc(doc(db,'config','house'), { codes, rules: rules.split('\n').filter(Boolean) }, { merge: true });
    setEditing(false);
  }

  return (
    <div>
      <div className="info-head" style={{marginTop:0}}>📍 ADDRESS</div>
      <div className="link-card">
        <div className="link-icon">🏠</div>
        <div>
          <div style={{fontWeight:'bold',fontSize:14}}>5–7 Point St #3, Provincetown, MA 02657</div>
          <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>Owner: Kevin Quinn · (617) 233-9549 · Check-in Jun 29 3pm · Check-out Jul 11 10am</div>
          <a className="link-url" href="https://www.google.com/maps/search/5-7+Point+St+Provincetown+MA+02657" target="_blank" rel="noopener noreferrer">Open in Maps ↗</a>
        </div>
      </div>
      <div className="divider" />
      <div className="info-head">🔑 ACCESS CODES</div>
      {currentCodes.map((c,i) => (
        <div key={i} style={{marginBottom:10}}>
          <div style={{fontSize:11,color:'var(--muted)',letterSpacing:'.05em'}}>{c.label.toUpperCase()}</div>
          <span className="code-box">{c.value}</span>
        </div>
      ))}
      <div className="divider" />
      <div className="info-head">📋 HOUSE RULES</div>
      <ul style={{paddingLeft:18,fontSize:13,lineHeight:1.9}}>
        {currentRules.map((r,i)=><li key={i}>{r}</li>)}
      </ul>
      {isAdmin && !editing && (
        <button className="btn btn-secondary" style={{marginTop:14}}
          onClick={()=>{setCodes(currentCodes.map(c=>({...c})));setRules(currentRules.join('\n'));setEditing(true);}}>
          Edit codes & rules (admin)
        </button>
      )}
      {isAdmin && editing && (
        <div style={{marginTop:14}}>
          {codes.map((c,i)=>(
            <div key={i} className="grid2" style={{marginBottom:8}}>
              <div className="form-group"><label>Label</label><input value={c.label} onChange={e=>{const n=[...codes];n[i]={...n[i],label:e.target.value};setCodes(n);}} /></div>
              <div className="form-group"><label>Value</label><input value={c.value} onChange={e=>{const n=[...codes];n[i]={...n[i],value:e.target.value};setCodes(n);}} /></div>
            </div>
          ))}
          <div className="form-group"><label>Rules (one per line)</label><textarea style={{minHeight:100}} value={rules} onChange={e=>setRules(e.target.value)} /></div>
          <div className="btn-row"><button className="btn btn-primary" onClick={save}>Save</button><button className="btn-mini" onClick={()=>setEditing(false)}>Cancel</button></div>
        </div>
      )}
    </div>
  );
}

function CostSplit({ isAccountant }) {
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
          <span style={{fontSize:12,color:'var(--muted)'}}>Room assignments & dates drive this — update in ⚙️ Settings</span>
        </div>
      </div>
      <div className="tip-box" style={{marginTop:12}}>
        💡 This table reflects whoever is in each room right now. Change rooms in ⚙️ → Guests & Rooms and it updates instantly. People without a room aren't charged. People without dates set show a ⚠️ warning.
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

function Payments({ isAccountant, profile }) {
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
