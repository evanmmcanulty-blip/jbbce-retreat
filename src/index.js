import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// A denied/failed Firestore write should never be silent — every handler in
// the app is a bare async onClick, so rejections land here.
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.name === 'FirebaseError') {
    alert("⚠️ That change didn't save: " + (e.reason.message || 'unknown error'));
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
