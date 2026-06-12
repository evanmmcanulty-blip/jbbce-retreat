import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export function useCollection(path, order) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ref = collection(db, path);
    const q = order ? query(ref, orderBy(order)) : ref;
    const unsub = onSnapshot(q, snap => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [path, order]);
  return { docs, loading };
}
