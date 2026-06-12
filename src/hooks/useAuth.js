import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let unsubProfile = null;
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }
      if (!firebaseUser) { setUser(null); setProfile(null); return; }
      setUser(firebaseUser);
      const ref = doc(db, 'users', firebaseUser.uid);
      // Live subscription — profile always current, fixes "sometimes saves sometimes doesn't"
      unsubProfile = onSnapshot(ref, async (snap) => {
        if (snap.exists()) {
          setProfile({ uid: snap.id, ...snap.data() });
        }
        // If doc doesn't exist, AuthPage signup creates it — nothing to do here
      });
    });
    return () => { if (unsubProfile) unsubProfile(); unsubAuth(); };
  }, []);

  return <AuthContext.Provider value={{ user, profile }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
