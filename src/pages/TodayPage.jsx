import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useCollection } from '../hooks/useCollection';
import { useWeather } from '../hooks/useWeather';
import { TRIP_DAYS, MEAL_TYPES, MEAL_OPTIONS, PTOWN_RESTAURANTS, WEATHER_AVG, fmt12, fmtFull, fmtDOW, fmtMon, dayKey, isoDate, isNightEvent } from '../constants';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import { UtensilsIcon, CalendarIcon, SunIcon } from '../components/Icons';

export default function TodayPage() {
  const { profile } = useAuth();
  const { docs: events } = useCollection('events');
  const { docs: meals } = useCollection('meals');
  const { docs: users } = useCollection('users');
  const { weather, live: weatherLive } = useWeather();
  const today = new Date();
  const realIdx = TRIP_DAYS.findIndex(d => dayKey(d)===dayKey(today));
  const [viewIdx, setViewIdx] = useState(realIdx >= 0 ? realIdx : 0);
  const [voteModal, setVoteModal] = useState(null);
  const [pendingVote, setPendingVote] = useState('');
  const [flashMeal, setFlashMeal] = useState(null);
  const [restaurantModal, setRestaurantModal] = useState(null);

  const d = TRIP_DAYS[viewIdx];
  const beforeTrip = today < TRIP_DAYS[0];
  const w = weather[viewIdx] || weather[0];

  const eventsToday = events.filter(ev => ev.recurring || ev.dayIdx===viewIdx)
    .sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const strictOnes = eventsToday.filter(e=>e.strict);

  function getMealDoc(mt) { return meals.find(m=>m.id===`${mt}-${viewIdx}`); }
  function getWinner(mt) {
    const md = getMealDoc(mt);
    if (md?.final) return { opt: MEAL_OPTIONS.find(o=>o.value===md.final), final: true };
    const votes = Object.values(md?.votes||{});
    const counts = {};
    votes.forEach(v=>{counts[v]=(counts[v]||0)+1;});
    let best='',bn=0;
    Object.entries(counts).forEach(([k,n])=>{if(n>bn){bn=n;best=k;}});
    return best ? { opt: MEAL_OPTIONS.find(o=>o.value===best), final: false, votes: bn, total: votes.length } : null;
  }
  function cooksLine(mt) {
    const md = getMealDoc(mt);
    const cookUsers = (md?.cooks||[]).map(uid=>users.find(u=>u.uid===uid)).filter(Boolean);
    if (!cookUsers.length) return null;
    const names = cookUsers.map(u=>u.displayName?.split(' ')[0]);
    const verb = mt==='Breakfast'?'cooking breakfast':mt==='Lunch'?'making lunch':'making dinner';
    if (names.length===1) return `🍳 ${names[0]} is ${verb}!`;
    if (names.length===2) return `🍳 ${names[0]} and ${names[1]} are ${verb}!`;
    return `🍳 ${names.slice(0,-1).join(', ')} and ${names[names.length-1]} are ${verb}!`;
  }
  function rsvpStatus(ev, uid) {
    if (ev.recurring) return ev.rsvpsByDay?.[viewIdx]?.[uid] || 'none';
    return ev.rsvps?.[uid] || 'none';
  }
  async function submitVote() {
    if (!pendingVote || !voteModal) return;
    const mt = voteModal.mt;
    try {
      await setDoc(doc(db,'meals',`${mt}-${viewIdx}`), { votes: { [profile.uid]: pendingVote } }, { merge: true });
      setVoteModal(null); setPendingVote('');
      setFlashMeal(mt);
      setTimeout(() => setFlashMeal(null), 700);
    } catch {
      alert('Vote didn\'t save — check your connection and try again.');
    }
  }

  async function submitRestaurantVote(mt, rid) {
    try {
      await setDoc(doc(db,'meals',`${mt}-${viewIdx}`), { restaurantVotes: { [profile.uid]: rid } }, { merge: true });
    } catch {
      alert('Vote didn\'t save — try again.');
    }
  }

  const voteMealDoc = voteModal ? getMealDoc(voteModal.mt) : null;

  // Who lands or leaves on the viewed day — travel data already lives on each user
  const dayISO = isoDate(viewIdx);
  const arrivals = users.filter(u => u.arrivalDateRaw === dayISO);
  const departures = users.filter(u => u.departureDateRaw === dayISO);
  const travelLine = (u, kind) => {
    const time = kind==='arr' ? u.arrivalTime : u.departureTime;
    const mode = kind==='arr' ? u.travelModeArr : u.travelModeDep;
    const flight = kind==='arr' ? u.arrivalFlight : u.departureFlight;
    const ferry = kind==='arr' ? u.arrivalFerry : u.departureFerry;
    return [time && fmt12(time), mode, flight && `✈ ${flight}`, ferry && `⛴ ${ferry}`].filter(Boolean).join(' · ');
  };

  // Next event up today (only when viewing the real today)
  const nowHM = `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`;
  const nextUpId = realIdx === viewIdx
    ? eventsToday.find(ev => ev.time && ev.time >= nowHM)?.id
    : null;

  // Hero sky follows the real P-town clock (June: sunrise ~5:07a, sunset ~8:20p)
  const nowMin = today.getHours() * 60 + today.getMinutes();
  const [sky, skyIcon] =
    nowMin < 270 || nowMin >= 1320 ? ['sky-night', '🌙'] :
    nowMin < 390  ? ['sky-dawn', '🌅'] :
    nowMin < 1090 ? ['sky-day', '☀️'] :
    nowMin < 1250 ? ['sky-golden', '🌇'] : ['sky-dusk', '🌆'];

  return (
    <div className="page">
      {beforeTrip && <PreTripBanner users={users} events={events} />}

      {!beforeTrip && realIdx < 0 && (
        <div className="tip-box" style={{marginBottom:12}}>
          📅 Retreat wrapped — reliving the glory. Jump around with the day picker below.
        </div>
      )}

      {profile && !profile.room && (
        <div className="tip-box" style={{marginBottom:12}}>
          🛏 You're not in a room yet, so you're not in the cost split. Ask Brandon to assign you one,
          and set your real arrival & departure in ⚙️ Settings → Arrivals — your dates drive what you owe.
        </div>
      )}

      {!beforeTrip && (
        <>
          <div className={`today-hero ${sky}`}>
            <div className="bd"><span>{fmtFull(d)}</span><span>{skyIcon}</span></div>
            <div className="dl">DAY {viewIdx+1} OF {TRIP_DAYS.length} · JBBCE EXECUTIVE RETREAT</div>
          </div>

          <div style={{background:'var(--ol)',border:'1px solid var(--om)',borderRadius:8,padding:'9px 12px',display:'flex',alignItems:'center',gap:10,marginBottom:12,fontSize:14}}>
            <span style={{fontSize:22}}>{w.icon}</span>
            <div>
              {weatherLive
                ? <><b>{w.shortForecast || 'Forecast'}:</b> {w.hi}° high / {w.lo}° low</>
                : <><b>Typical late June:</b> {w.hi}° high / {w.lo}° low</>
              }
            </div>
          </div>
        </>
      )}

      {!beforeTrip && strictOnes.length>0 && (
        <div className="tip-box" style={{background:'var(--cl)',borderColor:'var(--coral)',color:'#8a3520',marginBottom:12}}>
          ⏱ <b>Don't be late:</b> {strictOnes.map(e=>`${e.title} at ${fmt12(e.time)}`).join(', ')}
        </div>
      )}

      {!beforeTrip && (arrivals.length>0 || departures.length>0) && (
        <div className="tip-box" style={{background:'var(--ol)',borderColor:'var(--om)',color:'var(--ocean)',marginBottom:12}}>
          {arrivals.map(u => (
            <div key={u.uid} style={{padding:'2px 0'}}>
              🛬 <b>{u.displayName?.split(' ')[0]} arrives</b>{travelLine(u,'arr') && <> — {travelLine(u,'arr')}</>}
              {u.arrivalFlight && (
                <> · <a href={`https://www.google.com/search?q=flight+${encodeURIComponent(u.arrivalFlight)}+status`} target="_blank" rel="noopener noreferrer" style={{color:'var(--ocean)'}}>status ↗</a></>
              )}
            </div>
          ))}
          {departures.map(u => (
            <div key={u.uid} style={{padding:'2px 0'}}>
              🛫 <b>{u.displayName?.split(' ')[0]} heads home</b>{travelLine(u,'dep') && <> — {travelLine(u,'dep')}</>}
            </div>
          ))}
        </div>
      )}

      {!beforeTrip && <div className="section-label"><UtensilsIcon size={14}/><span>Meals today</span></div>}
      {!beforeTrip && <div className="meal-cards">
        {MEAL_TYPES.map(mt => {
          const md = getMealDoc(mt);
          const myVote = md?.votes?.[profile?.uid] || '';
          const myOpt = myVote ? MEAL_OPTIONS.find(o=>o.value===myVote) : null;
          const winner = getWinner(mt);
          const cooks = cooksLine(mt);
          return (
            <div key={mt} className={`meal-card ${myVote?'voted':'no-vote'} ${flashMeal===mt?'flash':''}`}
              onClick={()=>{setVoteModal({mt});setPendingVote(myVote||'');}}>
              <div className="mc-label">{mt.toUpperCase()}</div>
              <div className="mc-plan">{cooks || (winner ? winner.opt.label : 'No plan yet')}</div>
              {/* A "winner" from a couple of votes is a leader, not a plan — say so */}
              {!cooks && winner && !winner.final && (
                <div style={{fontSize:10,color:'var(--muted)'}}>leading · {winner.votes} of {winner.total} vote{winner.total!==1?'s':''}</div>
              )}
              {!cooks && winner && winner.opt.value==='ill_cook' && <div style={{fontSize:11,color:'var(--muted)'}}>cook TBD — check Meals</div>}
              {winner && winner.opt.value==='eat_out' && (() => {
                const rvotes = md?.restaurantVotes||{};
                const myRid = rvotes[profile?.uid];
                const topRid = Object.entries(Object.entries(rvotes).reduce((a,[,r])=>{a[r]=(a[r]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1])[0]?.[0];
                const topRest = topRid ? PTOWN_RESTAURANTS.find(r=>r.id===topRid) : null;
                const voterCount = Object.keys(rvotes).length;
                return (
                  <div style={{fontSize:11,marginTop:2}}>
                    {topRest && <span style={{color:'var(--muted)'}}>Leaning: <b>{topRest.name}</b> ({voterCount}){' '}</span>}
                    <button className="rest-pick" onClick={e=>{e.stopPropagation();setRestaurantModal({mt});}}>
                      {myRid ? `📍 ${PTOWN_RESTAURANTS.find(r=>r.id===myRid)?.name||'?'} (change)` : 'Where? →'}
                    </button>
                  </div>
                );
              })()}
              {myOpt
                ? <div className="mc-you">Your vote: {myOpt.icon} {myOpt.label.replace(/^[^ ]+ /,'')} (tap to change)</div>
                : <div className="mc-vote-prompt">⚠️ You haven't voted — tap to vote!</div>}
            </div>
          );
        })}
      </div>}

      {!beforeTrip && <div className="section-label"><CalendarIcon size={14}/><span>Schedule</span></div>}
      {!beforeTrip && (eventsToday.length===0 ? (
        <div className="empty-note">Free day — check Plans for ideas!</div>
      ) : eventsToday.map(ev => {
        const mine = rsvpStatus(ev, profile?.uid);
        const goingUsers = users.filter(u=>rsvpStatus(ev,u.uid)==='going');
        return (
          <div key={ev.id} className="timeline-item">
            <div className="t-time">{ev.time?fmt12(ev.time):'TBD'}</div>
            <div className="t-body">
              <div style={{fontWeight:'bold',fontSize:14}}>
                {ev.title}
                {ev.id===nextUpId && <span className="badge badge-g" style={{marginLeft:6}}>next up</span>}
                {ev.strict && <span className="strict-flag">⏱</span>}
                {isNightEvent(ev) && <span className="badge badge-p" style={{marginLeft:6}}>night</span>}
                {ev.recurring && <span className="badge badge-o" style={{marginLeft:6}}>daily</span>}
              </div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{ev.desc}</div>
              {ev.cost && <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>Cost: {ev.cost}</div>}
              <div style={{display:'flex',gap:4,marginTop:5,alignItems:'center',flexWrap:'wrap'}}>
                {goingUsers.map(u => <Avatar key={u.uid} user={u} size={24} />)}
                {mine!=='none' && <span className={`badge badge-${mine==='going'?'s':mine==='maybe'?'g':'c'}`} style={{marginLeft:4}}>You: {mine}</span>}
              </div>
            </div>
          </div>
        );
      }))}

      {!beforeTrip && <div style={{marginTop:16,fontSize:12,fontWeight:'bold',color:'var(--muted)',marginBottom:6}}>Jump to a day:</div>}
      {!beforeTrip && <div className="day-strip">
        {TRIP_DAYS.map((day,i)=>(
          <div key={i} className={`day-chip ${i===viewIdx?'active':''} ${dayKey(day)===dayKey(today)?'today':''}`} onClick={()=>setViewIdx(i)}>
            <div className="dow">{fmtDOW(day)}</div>
            <div className="dn">{day.getDate()}</div>
            <div className="dmo">{fmtMon(day)}</div>
          </div>
        ))}
      </div>}

      <div className="section-label" style={{marginTop:14,color:'var(--muted)'}}><SunIcon size={13}/><span>Week at a glance</span></div>
      <div className="weather-strip">
        {TRIP_DAYS.map((day,i)=>{
          const ww = weather[i]||weather[0];
          return (
            <div key={i} className="weather-day" style={i===viewIdx?{borderColor:'var(--ocean)'}:{}} onClick={()=>setViewIdx(i)}>
              <div style={{fontSize:10,color:'var(--muted)'}}>{fmtDOW(day)} {day.getDate()}</div>
              <div style={{fontSize:20,margin:'3px 0'}}>{ww.icon}</div>
              <div style={{fontSize:13,fontWeight:'bold'}}>{ww.hi}°</div>
              <div style={{fontSize:11,color:'var(--muted)'}}>{ww.lo}°</div>
            </div>
          );
        })}
      </div>

      {restaurantModal && (() => {
        const md = getMealDoc(restaurantModal.mt);
        const rvotes = md?.restaurantVotes||{};
        return (
          <Modal title={`${restaurantModal.mt} — where to eat?`} onClose={()=>setRestaurantModal(null)}>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:10}}>Tap a spot to cast your vote. All votes visible to everyone.</div>
            <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:'60vh',overflowY:'auto'}}>
              {PTOWN_RESTAURANTS.map(r => {
                const votersForThis = users.filter(u=>rvotes[u.uid]===r.id);
                const myVote = rvotes[profile?.uid]===r.id;
                return (
                  <div key={r.id} onClick={()=>{submitRestaurantVote(restaurantModal.mt,r.id);setRestaurantModal(null);}}
                    style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 10px',borderRadius:8,cursor:'pointer',
                      background:myVote?'var(--ol)':'transparent',
                      border:`1px solid ${myVote?'var(--ocean)':'rgba(0,0,0,.1)'}`,
                      transition:'background .15s'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:'bold',fontSize:13}}>{r.name}</div>
                      <div style={{fontSize:11,color:'var(--muted)',marginTop:1}}>{r.vibe}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3,flexShrink:0}}>
                      <span style={{fontSize:11,color:'var(--muted)',fontFamily:'var(--font-label)'}}>{r.price}</span>
                      {votersForThis.length>0 && (
                        <div style={{display:'flex',gap:2}}>
                          {votersForThis.map(u=><Avatar key={u.uid} user={u} size={18} />)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:10,textAlign:'center'}}>
              <button className="btn-mini" onClick={()=>setRestaurantModal(null)}>Cancel</button>
            </div>
          </Modal>
        );
      })()}

      {!beforeTrip && voteModal && (
        <Modal title={`${voteModal.mt} — ${fmtFull(d)}`} onClose={()=>setVoteModal(null)}>
          {MEAL_OPTIONS.map(opt => {
            const votersFor = users.filter(u=>voteMealDoc?.votes?.[u.uid]===opt.value);
            return (
              <div key={opt.value} className={`vote-option ${pendingVote===opt.value?'selected':''}`} onClick={()=>setPendingVote(opt.value)}>
                <span style={{fontSize:20}}>{opt.icon}</span>
                <span style={{flex:1}}>{opt.label.replace(/^[^ ]+ /,'')}</span>
                <span style={{display:'flex',gap:2}}>
                  {votersFor.map(u=><Avatar key={u.uid} user={u} size={20} />)}
                </span>
              </div>
            );
          })}
          <div className="btn-row" style={{marginTop:14}}>
            <button className="btn btn-primary" onClick={submitVote} disabled={!pendingVote}>Submit my vote</button>
            <button className="btn-mini" onClick={()=>setVoteModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PreTripBanner({ users, events }) {
  const msLeft = TRIP_DAYS[0] - new Date();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  const day1Events = events.filter(ev => ev.dayIdx === 0 || ev.recurring).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const crew = users.filter(u => u.approved !== false);

  return (
    <div>
      <div style={{
        background:'var(--ol)',border:'1px solid var(--om)',borderRadius:12,
        padding:'20px 16px',marginBottom:14,textAlign:'center',
      }}>
        <div style={{fontSize:13,color:'var(--muted)',letterSpacing:'.08em',marginBottom:4}}>COUNTDOWN TO PTOWN</div>
        <div style={{fontSize:48,fontWeight:900,color:'var(--ocean)',lineHeight:1}}>{daysLeft}</div>
        <div style={{fontSize:15,color:'var(--muted)',marginTop:4}}>day{daysLeft!==1?'s':''} to go · Jun 29, Provincetown</div>
      </div>

      <div className="info-head" style={{marginTop:0}}>WHO'S IN ({crew.length})</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:16}}>
        {crew.map(u => (
          <div key={u.uid} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <Avatar user={u} size={36} />
            <div style={{fontSize:11,color:'var(--muted)'}}>{u.displayName?.split(' ')[0]}</div>
          </div>
        ))}
      </div>

      {day1Events.length > 0 && (
        <>
          <div className="info-head">DAY 1 PREVIEW — MON JUN 29</div>
          {day1Events.slice(0,4).map(ev => (
            <div key={ev.id} className="timeline-item" style={{opacity:.85}}>
              <div className="t-time">{ev.time ? fmt12(ev.time) : 'TBD'}</div>
              <div className="t-body">
                <div style={{fontWeight:'bold',fontSize:13}}>{ev.title}</div>
                {ev.desc && <div style={{fontSize:12,color:'var(--muted)'}}>{ev.desc}</div>}
              </div>
            </div>
          ))}
          {day1Events.length > 4 && (
            <div style={{fontSize:12,color:'var(--muted)',textAlign:'center',marginTop:4}}>+{day1Events.length-4} more · see Plans tab</div>
          )}
        </>
      )}
      {day1Events.length === 0 && (
        <div className="empty-note">No day 1 events yet — add them in Plans.</div>
      )}
    </div>
  );
}
