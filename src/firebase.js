import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDI-BmY2wbvkFgNuX6ZwUz-DnbYdUNKL-o",
  authDomain: "provincetown-2026.firebaseapp.com",
  databaseURL: "https://provincetown-2026-default-rtdb.firebaseio.com",
  projectId: "provincetown-2026",
  storageBucket: "provincetown-2026.firebasestorage.app",
  messagingSenderId: "594123686763",
  appId: "1:594123686763:web:99a670965c6924cb2a822e",
  measurementId: "G-SFEVZQ2VWC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
