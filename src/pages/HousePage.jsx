import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useCollection } from '../hooks/useCollection';
import { useDoc } from '../hooks/useDoc';
import { HomeIcon, UsersIcon, MapPinIcon, KeyIcon, ClipboardIcon } from '../components/Icons';
import GuestsRooms from '../components/GuestsRooms';

export default function HousePage() {
  const { profile } = useAuth();
  const { docs: users } = useCollection('users');
  const [sub, setSub] = useState('info');
  const isAdmin = profile?.admin;

  return (
    <div className="page">
      <div className="stabs">
        <button className={`stab ${sub==='info'?'active':''}`} onClick={()=>setSub('info')}><HomeIcon size={13}/>House Info</button>
        <button className={`stab ${sub==='guests'?'active':''}`} onClick={()=>setSub('guests')}><UsersIcon size={13}/>Guests & Rooms</button>
      </div>
      {sub==='info' && <HouseInfo isAdmin={isAdmin} />}
      {sub==='guests' && <GuestsRooms users={users} isAdmin={isAdmin} />}
    </div>
  );
}

function HouseInfo({ isAdmin }) {
  const { data: houseData } = useDoc('config/house');
  const [editing, setEditing] = useState(false);
  const [codes, setCodes] = useState(null);
  const [rules, setRules] = useState(null);

  const defaultCodes = [{label:'Front door',value:'emailed week prior'},{label:'Wifi network',value:'set me'},{label:'Wifi password',value:'set me'}];
  const defaultRules = ['Quiet hours after midnight.','Strip your bed + towel pile on departure day.','Label your food in the fridge.','Last one out locks up + AC off.','Chris is collecting house funds — see Money → House rent.'];
  const currentCodes = houseData?.codes || defaultCodes;
  const currentRules = houseData?.rules || defaultRules;

  async function save() {
    await setDoc(doc(db,'config','house'), { codes, rules: rules.split('\n').filter(Boolean) }, { merge: true });
    setEditing(false);
  }

  return (
    <div>
      <div className="info-head" style={{marginTop:0}}><MapPinIcon size={12}/>ADDRESS</div>
      <div className="link-card">
        <div className="link-icon">🏠</div>
        <div>
          <div style={{fontWeight:'bold',fontSize:14}}>5–7 Point St #3, Provincetown, MA 02657</div>
          <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>Owner: Kevin Quinn · (617) 233-9549 · Check-in Jun 29 3pm · Check-out Jul 11 10am</div>
          <a className="link-url" href="https://www.google.com/maps/search/5-7+Point+St+Provincetown+MA+02657" target="_blank" rel="noopener noreferrer">Open in Maps ↗</a>
        </div>
      </div>
      <div className="divider" />
      <div className="info-head"><KeyIcon size={12}/>ACCESS CODES</div>
      {currentCodes.map((c,i) => (
        <div key={i} style={{marginBottom:10}}>
          <div style={{fontSize:11,color:'var(--muted)',letterSpacing:'.05em'}}>{c.label.toUpperCase()}</div>
          <span className="code-box">{c.value}</span>
        </div>
      ))}
      <div className="divider" />
      <div className="info-head"><ClipboardIcon size={12}/>HOUSE RULES</div>
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
