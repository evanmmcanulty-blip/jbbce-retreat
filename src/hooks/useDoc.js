import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function useDoc(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!path) return;
    const unsub = onSnapshot(doc(db, path), snap => {
      setData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
    return unsub;
  }, [path]);
  return { data, loading };
}
