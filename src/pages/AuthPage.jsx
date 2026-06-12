import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COLORS } from '../constants';

const ADMIN_EMAIL = 'bnwokocha@gmail.com';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  async function handleReset() {
    setError(''); setResetMsg('');
    if (!email) { setError('Enter your email above first, then tap reset.'); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg(`Reset link sent to ${email} — check your inbox (and spam).`);
    } catch (err) {
      setError(err.message.replace('Firebase: ','').replace(/\(auth.*\)/,''));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const idx = Math.floor(Math.random() * COLORS.length);
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          email,
          displayName: displayName.trim(),
          avatar: avatar.trim() || '⭐',
          color: COLORS[idx],
          room: '',
          admin: email.toLowerCase() === ADMIN_EMAIL,
          // New accounts need admin approval before they can see trip data (door codes etc.)
          approved: email.toLowerCase() === ADMIN_EMAIL,
          arrivalDateRaw: '2026-06-29',
          departureDateRaw: '2026-07-11',
          travelModeArr: 'Ferry (Bay State Cruises)',
          travelModeDep: 'Ferry (Bay State Cruises)',
          createdAt: new Date().toISOString(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ','').replace(/\(auth.*\)/,''));
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 11, letterSpacing: '.24em', color: '#7a6a56', marginBottom: 6 }}>EST. 2026 · PROVINCETOWN</div>
          <div style={{ fontSize: 31, fontStyle: 'italic', color: '#1a6b8a', lineHeight: 1.15, marginBottom: 7 }}>
            The JBBCE<br />Executive Retreat
          </div>
          <div style={{ fontSize: 10, color: '#7a6a56', fontStyle: 'italic' }}>
            Joint Brotherhood of Beachside Cock Enthusiasts
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
            <span style={{ height: 1, width: 34, background: 'rgba(44,36,22,.25)' }} />
            <span style={{ fontSize: 11, color: '#7a6a56', letterSpacing: '.06em' }}>5–7 Point St #3 · Jun 29 – Jul 11</span>
            <span style={{ height: 1, width: 34, background: 'rgba(44,36,22,.25)' }} />
          </div>
        </div>

        <div className="auth-card">
          <h2>{mode === 'login' ? 'Welcome back' : 'Join the crew'}</h2>
          <p className="sub">{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</p>

          {error && <div className="error-msg">{error}</div>}
          {resetMsg && <div className="tip-box" style={{ marginBottom: 10 }}>📬 {resetMsg}</div>}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="form-group">
                  <label>Full name</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. Brandon Nwokocha" required />
                </div>
                <div className="form-group">
                  <label>Your avatar — type any emoji</label>
                  <input value={avatar} onChange={e => setAvatar(e.target.value)}
                    placeholder="🏖️" maxLength={2} style={{ fontSize: 24, textAlign: 'center', letterSpacing: 4 }} />
                  <div style={{ fontSize: 11, color: '#7a6a56', marginTop: 3 }}>
                    Open your emoji keyboard (⊞ Win+. or ⌘+Ctrl+Space on Mac, or 🌐 on iPhone) and pick any emoji
                  </div>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: 4 }}>
                  <button type="button" onClick={handleReset}
                    style={{ background: 'none', border: 'none', color: '#1a6b8a', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', padding: 0 }}>
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#7a6a56' }}>
            {mode === 'login' ? (
              <>First time? <button onClick={() => setMode('signup')} style={{ background: 'none', border: 'none', color: '#1a6b8a', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Create account</button></>
            ) : (
              <>Already have one? <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: '#1a6b8a', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Sign in</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
