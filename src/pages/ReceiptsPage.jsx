import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useCollection } from '../hooks/useCollection';
import { useDoc } from '../hooks/useDoc';
import { PAYMENT_METHODS, money } from '../constants';
import { calcOwed } from '../utils/costEngine';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import { ScaleIcon, ReceiptIcon, CreditCardIcon } from '../components/Icons';
import CostSplit from '../components/CostSplit';
import Payments from '../components/Payments';

export default function ReceiptsPage() {
  const { profile } = useAuth();
  const { docs: receipts, loading } = useCollection('receipts');
  const { docs: users } = useCollection('users');
  const isAdmin = profile?.admin;
  const isAccountant = profile?.accountant || isAdmin;
  const [editReceipt, setEditReceipt] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [sub, setSub] = useState('settle');

  return (
    <div className="page">
      <div className="stabs">
        <button className={`stab ${sub==='settle'?'active':''}`} onClick={()=>setSub('settle')}><ScaleIcon size={13}/>Settle up</button>
        <button className={`stab ${sub==='receipts'?'active':''}`} onClick={()=>setSub('receipts')}><ReceiptIcon size={13}/>Receipts</button>
        <button className={`stab ${sub==='rent'?'active':''}`} onClick={()=>setSub('rent')}><CreditCardIcon size={13}/>House rent</button>
      </div>

      {sub==='settle' && (
        <SettleUp receipts={receipts} users={users} profile={profile} onLogPayment={setPayModal} />
      )}

      {sub==='receipts' && (
        <>
          <div className="section-sub">Upload shared expenses. You get paid back; you confirm payments. People tagged get an alert badge.</div>
          <UploadForm profile={profile} users={users} />
          {!loading && receipts.length===0 && <div className="empty-note">No receipts yet.</div>}
          {[...receipts].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(r => (
            <ReceiptItem key={r.id} r={r} users={users} profile={profile} isAdmin={isAdmin}
              onEdit={()=>setEditReceipt(r)} onLogPayment={()=>setPayModal(r)} />
          ))}
        </>
      )}

      {sub==='rent' && (
        <>
          <Payments isAccountant={isAccountant} profile={profile} />
          <div className="divider" />
          <div className="info-head" style={{marginTop:0}}><ScaleIcon size={12}/>HOW RENT SPLITS</div>
          <CostSplit isAccountant={isAccountant} />
        </>
      )}

      {editReceipt && <EditReceiptModal r={editReceipt} users={users} onClose={()=>setEditReceipt(null)} />}
      {payModal && <LogPaymentModal r={payModal} profile={profile} users={users} onClose={()=>setPayModal(null)} />}
    </div>
  );
}

/* ============ SETTLE UP — one net number per person instead of receipt-by-receipt math ============ */
// Brief one-shot confetti sprinkle in the beach palette — fires when the crew is
// all square. Renders nothing under prefers-reduced-motion.
function Confetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const C = ['#1a6b8a', '#d4715a', '#6b8c5a', '#c8a84b', '#8a5aaa'];
  const pieces = Array.from({ length: 16 }, (_, i) => ({
    left: (i * 6.1 + 3) % 96,
    dl: (i % 6) * 0.05,
    d: 0.9 + (i % 4) * 0.14,
    color: C[i % 5],
    r: ((i * 53) % 300 + 220) + 'deg',
    w: i % 3 === 0 ? 9 : 6,
    h: i % 3 === 0 ? 4 : 6,
  }));
  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece"
          style={{ left: p.left + '%', background: p.color, width: p.w, height: p.h, '--d': p.d + 's', '--dl': p.dl + 's', '--r': p.r }} />
      ))}
    </div>
  );
}

function SettleUp({ receipts, users, profile, onLogPayment }) {
  const { data: costData } = useDoc('config/cost');
  const { docs: payDocs } = useCollection('payments');
  if (!profile) return null;
  const me = profile.uid;

  // What I owe each uploader: even-split receipts I'm tagged in, not fully paid, nothing logged yet
  const debts = {}; // creditorUid -> [{ r, share }]
  let inFlight = 0;
  const manualPending = [];
  receipts.forEach(r => {
    if (r.fullyPaid || r.by === me || !r.whoIds?.includes(me)) return;
    const p = r.payments?.[me];
    if (p?.confirmed) return;
    if (p) { inFlight += p.amount || 0; return; }
    if (r.split === 'even' && r.whoIds.length) {
      (debts[r.by] = debts[r.by] || []).push({ r, share: r.amt / r.whoIds.length });
    } else if (r.split === 'manual') {
      manualPending.push(r);
    }
  });

  // What's still owed to me across my open receipts
  const owedToMe = receipts.filter(r => r.by === me && !r.fullyPaid).reduce((sum, r) => {
    const others = (r.whoIds || []).filter(uid => uid !== me);
    const confirmed = others.reduce((s, uid) => s + (r.payments?.[uid]?.confirmed ? (r.payments[uid].amount || 0) : 0), 0);
    const myPortion = r.split === 'manual' ? (r.myPortion || 0) : (r.whoIds?.length ? r.amt / r.whoIds.length : 0);
    return sum + Math.max(0, (r.amt || 0) - myPortion - confirmed);
  }, 0);

  // House fund balance (same math as House → Payments)
  const { owe } = calcOwed(users, costData);
  const housePaid = payDocs.find(p => p.uid === me)?.confirmed || 0;
  const houseLeft = Math.max(0, (owe[me] || 0) - housePaid);

  const creditorIds = Object.keys(debts);
  const totalIOwe = creditorIds.reduce((s, uid) => s + debts[uid].reduce((a, d) => a + d.share, 0), 0);
  const allSquare = !creditorIds.length && !manualPending.length && owedToMe < 0.01 && houseLeft < 0.01 && inFlight < 0.01;

  return (
    <div className="card" style={{borderColor:'var(--ocean)',position:'relative'}}>
      {allSquare && <Confetti />}
      <div className="card-body" style={{borderTop:'none',padding:'12px 14px'}}>
        <div style={{fontWeight:'bold',color:'var(--ocean)',fontSize:14,marginBottom:allSquare?0:8,display:'flex',alignItems:'center',gap:5}}>
          <ScaleIcon size={15}/>Settle up {allSquare && <span style={{color:'var(--sage)',fontWeight:'normal'}}>— ✓ all square, go enjoy the beach <span className="bob">🍹</span></span>}
        </div>
        {creditorIds.map(uid => {
          const u = users.find(x => x.uid === uid);
          const total = debts[uid].reduce((s, d) => s + d.share, 0);
          return (
            <div key={uid} style={{padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{fontSize:14,display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                You owe <Avatar user={u} size={20} /> <b>{u?.displayName || '?'}</b>{' '}
                <b style={{color:'var(--coral)'}}>{money(total)}</b>
                {debts[uid].length > 1 && <span style={{fontSize:12,color:'var(--muted)'}}> across {debts[uid].length} receipts</span>}
              </div>
              <div className="btn-row" style={{marginTop:4}}>
                {debts[uid].map(({ r, share }) => (
                  <button key={r.id} className="btn-mini" onClick={() => onLogPayment(r)}>
                    💸 {money(share)} — {r.desc}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {manualPending.length > 0 && (
          <div style={{fontSize:12,color:'var(--gold)',padding:'5px 0'}}>
            ✍️ {manualPending.length} manual-split receipt{manualPending.length > 1 ? 's' : ''} waiting for you to enter your portion:{' '}
            {manualPending.map(r => (
              <button key={r.id} className="btn-mini" style={{marginRight:4}} onClick={() => onLogPayment(r)}>{r.desc}</button>
            ))}
          </div>
        )}
        {inFlight > 0.01 && (
          <div style={{fontSize:12,color:'var(--muted)',padding:'5px 0'}}>⏳ {money(inFlight)} sent, waiting on confirmation</div>
        )}
        {owedToMe > 0.01 && (
          <div style={{fontSize:13,padding:'5px 0'}}>Owed to you from your receipts: <b style={{color:'var(--sage)'}}>{money(owedToMe)}</b></div>
        )}
        {houseLeft > 0.01 && (
          <div style={{fontSize:13,padding:'5px 0'}}>🏠 House fund: <b style={{color:'var(--coral)'}}>{money(houseLeft)}</b> left to send Chris — log it under the House rent tab</div>
        )}
        {!allSquare && totalIOwe > 0.01 && (
          <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>Tap a receipt to log your payment — the amount is prefilled.</div>
        )}
      </div>
    </div>
  );
}

function UploadForm({ profile, users }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ desc:'', amt:'', split:'even', payMethods:[], whoIds:[], myPortion:'' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Opening the form pre-selects whoever is at the house today (by arrival/departure dates)
  function openForm() {
    if (!open && form.whoIds.length === 0) {
      const now = new Date();
      const todayISO = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
      const present = users.filter(u =>
        u.uid !== profile.uid &&
        u.arrivalDateRaw && u.departureDateRaw &&
        u.arrivalDateRaw <= todayISO && u.departureDateRaw >= todayISO
      ).map(u => u.uid);
      if (present.length) set('whoIds', present);
    }
    setOpen(!open);
  }

  function toggle(k, val) {
    setForm(f => ({...f, [k]: f[k].includes(val) ? f[k].filter(x=>x!==val) : [...f[k], val]}));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.desc.trim()) { alert('Add a description'); return; }
    setUploading(true);
    try {
      let imageUrl = null;
      if (file) {
        const r = storageRef(storage, `receipts/${Date.now()}_${file.name}`);
        const snap = await uploadBytes(r, file);
        imageUrl = await getDownloadURL(snap.ref);
      }
      await addDoc(collection(db,'receipts'), {
        desc: form.desc.trim(), amt: parseFloat(form.amt)||0,
        split: form.split, payMethods: form.payMethods,
        whoIds: form.whoIds.includes(profile.uid) ? form.whoIds : [...form.whoIds, profile.uid],
        by: profile.uid, byName: profile.displayName,
        imageUrl, date: new Date().toISOString(),
        payments: {}, // { uid: { amount, method, confirmed } }
        myPortion: form.split==='manual' ? (parseFloat(form.myPortion)||0) : null,
        fullyPaid: false,
      });
      setForm({desc:'',amt:'',split:'even',payMethods:[],whoIds:[],myPortion:''});
      setFile(null); setOpen(false);
    } finally { setUploading(false); }
  }

  return (
    <div className="card">
      <div className="card-head" onClick={openForm}>
        <div className="card-title">+ Upload a receipt</div><span className={`chev ${open?'open':''}`}>▼</span>
      </div>
      {open && <div className="card-body" style={{paddingTop:12}}>
        <form onSubmit={submit}>
          <div className="form-group"><label>What's this for?</label><input value={form.desc} onChange={e=>set('desc',e.target.value)} placeholder="e.g. Grocery run, boat tip" required /></div>
          <div className="form-group"><label>Total amount ($)</label><input type="number" step="0.01" value={form.amt} onChange={e=>set('amt',e.target.value)} /></div>
          <div className="form-group"><label>Who was there?</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
              {users.map(u => (
                <div key={u.uid} className={`check-pill ${form.whoIds.includes(u.uid)||u.uid===profile.uid?'sel':''}`}
                  onClick={()=>u.uid!==profile.uid && toggle('whoIds',u.uid)}>
                  {u.avatar&&u.avatar!=='⭐'?u.avatar:'👤'} {u.displayName}{u.uid===profile.uid?' (you)':''}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group"><label>How to split</label>
            <select value={form.split} onChange={e=>set('split',e.target.value)}>
              <option value="even">Even split among those present</option>
              <option value="manual">Manual — each person enters their own portion</option>
            </select>
          </div>
          {form.split==='manual' && (
            <div className="form-group"><label>Your portion of the bill ($)</label>
              <input type="number" step="0.01" value={form.myPortion} onChange={e=>set('myPortion',e.target.value)} placeholder="What part of the total is yours" />
            </div>
          )}
          <div className="form-group"><label>How would you like to be paid back?</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
              {PAYMENT_METHODS.map(m => (
                <div key={m} className={`check-pill ${form.payMethods.includes(m)?'sel':''}`} onClick={()=>toggle('payMethods',m)}>{m}</div>
              ))}
            </div>
          </div>
          <div className="form-group"><label>Receipt photo (optional)</label>
            <input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])} style={{padding:4}} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={uploading}>{uploading?'Uploading…':'Upload receipt'}</button>
        </form>
      </div>}
    </div>
  );
}

function ReceiptItem({ r, users, profile, isAdmin, onEdit, onLogPayment }) {
  const iOwn = r.by === profile?.uid;
  const iAmTagged = r.whoIds?.includes(profile?.uid) && !iOwn;
  const others = (r.whoIds||[]).filter(uid => uid !== r.by);
  const whoUsers = users.filter(u => r.whoIds?.includes(u.uid));

  // Money math
  const evenShare = r.split==='even' && r.whoIds?.length ? r.amt / r.whoIds.length : null;
  const confirmedTotal = others.reduce((s,uid) => s + (r.payments?.[uid]?.confirmed ? (r.payments[uid].amount||0) : 0), 0);
  const uploaderPortion = r.split==='manual' ? (r.myPortion||0) : (evenShare||0);
  const owedToUploader = Math.max(0, (r.amt||0) - uploaderPortion);
  const remaining = Math.max(0, owedToUploader - confirmedTotal);
  const myPayment = r.payments?.[profile?.uid];

  return (
    <div className={`receipt-item ${r.fullyPaid?'receipt-paid':''}`}>
      {r.imageUrl ? (
        <img className="receipt-img" src={r.imageUrl} alt="receipt" onClick={()=>window.open(r.imageUrl,'_blank')} />
      ) : (
        <div className="receipt-img" style={{background:'var(--ol)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🧾</div>
      )}
      <div style={{flex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <div style={{fontWeight:'bold',fontSize:14}}>{r.desc}</div>
          {r.fullyPaid && <span className="badge badge-s">✓ Fully paid</span>}
          {iAmTagged && !myPayment?.confirmed && !r.fullyPaid && <span className="notif-dot">You owe!</span>}
        </div>
        <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>
          {money(r.amt)} total · {r.split==='even'?'even split':'manual split'} · by <b>{r.byName}</b> · {new Date(r.date).toLocaleDateString()}
        </div>
        {r.payMethods?.length>0 && <div style={{fontSize:12,marginTop:2}}>{r.byName} accepts: <b>{r.payMethods.join(' / ')}</b></div>}
        <div style={{fontSize:12,marginTop:3,display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
          Present: {whoUsers.map(u => (
            <span key={u.uid} style={{display:'inline-flex',alignItems:'center',gap:3}}>
              <Avatar user={u} size={18} /> {u.displayName?.split(' ')[0]}
            </span>
          ))}
        </div>
        {evenShare!=null && <div style={{fontSize:12,marginTop:2}}>Each person's share: <b>{money(evenShare)}</b></div>}
        {r.split==='manual' && <div style={{fontSize:12,marginTop:2}}>{r.byName}'s portion: <b>{money(r.myPortion||0)}</b> — others enter their own portion when paying</div>}
        <div style={{fontSize:13,marginTop:4}}>
          Remaining owed to {r.byName?.split(' ')[0]}: <b style={{color:remaining>0.01?'var(--coral)':'var(--sage)'}}>{money(remaining)}</b>
        </div>

        {/* Per-person payment status */}
        <div style={{marginTop:6}}>
          {others.map(uid => {
            const u = users.find(x=>x.uid===uid);
            const p = r.payments?.[uid];
            if (!u) return null;
            return (
              <div key={uid} style={{fontSize:12,padding:'3px 0',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                <span>{u.avatar&&u.avatar!=='⭐'?u.avatar:'👤'} {u.displayName?.split(' ')[0]}:</span>
                {p ? (
                  <span style={{color:p.confirmed?'var(--sage)':'var(--gold)'}}>
                    {p.confirmed ? '✓' : '⏳'} {money(p.amount)} via {p.method}{p.confirmed?' (confirmed)':' (pending confirmation)'}
                  </span>
                ) : (
                  <span style={{color:'var(--muted)'}}>nothing logged yet</span>
                )}
                {/* Uploader confirms or logs on behalf */}
                {iOwn && p && !p.confirmed && (
                  <button className="btn-mini" style={{fontSize:11,padding:'2px 8px'}}
                    onClick={async()=>{try{await updateDoc(doc(db,'receipts',r.id),{[`payments.${uid}.confirmed`]:true})}catch{alert('Couldn\'t save — check connection.');}}}>
                    Confirm received
                  </button>
                )}
                {iOwn && !p && (
                  <button className="btn-mini" style={{fontSize:11,padding:'2px 8px'}}
                    onClick={async()=>{
                      const amt = parseFloat(window.prompt(`How much did ${u.displayName} pay you?`));
                      if (isNaN(amt)) return;
                      const method = window.prompt(`How? (${PAYMENT_METHODS.join(' / ')})`, 'Apple Pay') || 'Cash';
                      try{await updateDoc(doc(db,'receipts',r.id),{[`payments.${uid}`]:{amount:amt,method,confirmed:true,loggedBy:profile.uid}})}catch{alert('Couldn\'t save — check connection.');}
                    }}>
                    Log their payment
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* My actions */}
        <div className="btn-row" style={{marginTop:8}}>
          {iAmTagged && !myPayment?.confirmed && (
            <button className="btn btn-secondary" style={{fontSize:12,padding:'6px 12px'}} onClick={onLogPayment}>
              {myPayment ? 'Update my payment' : `💸 Log my payment to ${r.byName?.split(' ')[0]}`}
            </button>
          )}
          {iOwn && (
            <>
              <button className="btn-mini" onClick={onEdit}>✏️ Edit receipt</button>
              <button className="btn-mini" style={r.fullyPaid?{borderColor:'var(--sage)',color:'var(--sage)'}:{}}
                onClick={async()=>{try{await updateDoc(doc(db,'receipts',r.id),{fullyPaid:!r.fullyPaid})}catch{alert('Couldn\'t save — check connection.');}}}>
                {r.fullyPaid?'✓ Marked fully paid (undo)':'Mark fully paid ✓'}
              </button>
            </>
          )}
          {(iOwn||isAdmin) && (
            <button className="btn btn-danger" onClick={async()=>{if(window.confirm('Delete this receipt?'))try{await deleteDoc(doc(db,'receipts',r.id))}catch{alert('Delete failed — check connection.');}}}>🗑</button>
          )}
        </div>
      </div>
    </div>
  );
}

function LogPaymentModal({ r, profile, users, onClose }) {
  const evenShare = r.split==='even' && r.whoIds?.length ? r.amt/r.whoIds.length : null;
  const existing = r.payments?.[profile?.uid];
  const [amount, setAmount] = useState(existing?.amount ?? (evenShare!=null ? evenShare.toFixed(2) : ''));
  const [method, setMethod] = useState(existing?.method || (r.payMethods?.[0] || PAYMENT_METHODS[0]));

  async function submit() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { alert('Enter how much you\'re sending'); return; }
    try {
      await updateDoc(doc(db,'receipts',r.id), {
        [`payments.${profile.uid}`]: { amount: amt, method, confirmed: false, at: new Date().toISOString() }
      });
      onClose();
    } catch {
      alert('Payment didn\'t save — check your connection and try again.');
    }
  }

  return (
    <Modal title={`Pay ${r.byName?.split(' ')[0]} back — ${r.desc}`} onClose={onClose}>
      {evenShare!=null && <div className="tip-box" style={{marginBottom:10}}>Your share of this even split: <b>{money(evenShare)}</b></div>}
      {r.split==='manual' && <div className="tip-box" style={{marginBottom:10}}>Manual split — enter the portion of the bill that was yours.</div>}
      <div className="form-group"><label>Amount I'm sending ($)</label>
        <input type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} autoFocus />
      </div>
      <div className="form-group"><label>How I'm sending it</label>
        <select value={method} onChange={e=>setMethod(e.target.value)}>
          {(r.payMethods?.length ? r.payMethods : PAYMENT_METHODS).map(m=><option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={submit}>Send for {r.byName?.split(' ')[0]}'s confirmation</button>
        <button className="btn-mini" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function EditReceiptModal({ r, users, onClose }) {
  const [form, setForm] = useState({
    desc: r.desc||'', amt: String(r.amt||''), split: r.split||'even',
    payMethods: r.payMethods||[], whoIds: r.whoIds||[], myPortion: String(r.myPortion??''),
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  function toggle(k, val) { setForm(f=>({...f,[k]:f[k].includes(val)?f[k].filter(x=>x!==val):[...f[k],val]})); }

  async function save() {
    try {
      await updateDoc(doc(db,'receipts',r.id), {
        desc: form.desc, amt: parseFloat(form.amt)||0, split: form.split,
        payMethods: form.payMethods, whoIds: form.whoIds,
        myPortion: form.split==='manual' ? (parseFloat(form.myPortion)||0) : null,
      });
      onClose();
    } catch {
      alert('Edit didn\'t save — check your connection and try again.');
    }
  }

  return (
    <Modal title="Edit receipt" onClose={onClose}>
      <div className="form-group"><label>Description</label><input value={form.desc} onChange={e=>set('desc',e.target.value)} /></div>
      <div className="form-group"><label>Total amount ($)</label><input type="number" step="0.01" value={form.amt} onChange={e=>set('amt',e.target.value)} /></div>
      <div className="form-group"><label>Who was there?</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
          {users.map(u => (
            <div key={u.uid} className={`check-pill ${form.whoIds.includes(u.uid)?'sel':''}`}
              onClick={()=>u.uid!==r.by && toggle('whoIds',u.uid)}>
              {u.avatar&&u.avatar!=='⭐'?u.avatar:'👤'} {u.displayName}{u.uid===r.by?' (uploader)':''}
            </div>
          ))}
        </div>
      </div>
      <div className="form-group"><label>Split</label>
        <select value={form.split} onChange={e=>set('split',e.target.value)}>
          <option value="even">Even split</option>
          <option value="manual">Manual portions</option>
        </select>
      </div>
      {form.split==='manual' && (
        <div className="form-group"><label>My portion ($)</label>
          <input type="number" step="0.01" value={form.myPortion} onChange={e=>set('myPortion',e.target.value)} />
        </div>
      )}
      <div className="form-group"><label>Pay me back via</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
          {PAYMENT_METHODS.map(m => (
            <div key={m} className={`check-pill ${form.payMethods.includes(m)?'sel':''}`} onClick={()=>toggle('payMethods',m)}>{m}</div>
          ))}
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={save}>Save changes</button>
        <button className="btn-mini" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
