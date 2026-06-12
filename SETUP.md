# JBBCE Retreat App — Setup Guide

## What you need first
- Node.js installed (download free at nodejs.org — get the LTS version)
- Firebase CLI installed: open Terminal and run `npm install -g firebase-tools`
- Your Firebase project: provincetown-2026

---

## Step 1 — Get your Firebase config

1. Go to console.firebase.google.com
2. Click your project (provincetown-2026)
3. Click the gear icon ⚙ → Project Settings
4. Scroll down to "Your apps" → click the Web app (</>)
5. Copy the firebaseConfig object — it looks like:
   ```
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "provincetown-2026.firebaseapp.com",
     projectId: "provincetown-2026",
     storageBucket: "provincetown-2026.appspot.com",
     messagingSenderId: "12345678",
     appId: "1:12345678:web:abcdef"
   };
   ```

---

## Step 2 — Paste your config

1. Open this folder in VS Code (free at code.visualstudio.com)
2. Open the file: `src/firebase.js`
3. Replace the firebaseConfig object with your real values from Step 1
4. Save the file

---

## Step 3 — Enable Firebase services

In your Firebase console (console.firebase.google.com → provincetown-2026):

**Authentication:**
- Click Authentication → Get started → Email/Password → Enable → Save

**Firestore Database:**
- Click Firestore Database → Create database → Start in test mode → Next → Done
- Then click Rules tab and paste:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      function isSignedIn() { return request.auth != null; }
      function isAdmin() {
        return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true;
      }
      match /users/{uid} {
        allow read: if isSignedIn();
        allow write: if request.auth.uid == uid || isAdmin();
      }
      match /{collection}/{doc} {
        allow read: if isSignedIn();
        allow write: if isSignedIn();
      }
    }
  }
  ```
  Click Publish.

**Storage:**
- Click Storage → Get started → Next → Done
- Click Rules tab and paste:
  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /{allPaths=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```
  Click Publish.

---

## Step 4 — Deploy

Open Terminal (Mac: press Cmd+Space, type Terminal. Windows: press Win, type cmd).

Navigate to this folder:
```
cd path/to/jbbce-retreat
```
(Replace "path/to" with wherever you saved this folder — e.g. `cd ~/Desktop/jbbce-retreat`)

Then run these three commands one at a time:
```
npm install
firebase login
npm run deploy
```

The first time, `firebase login` will open a browser window — sign in with the Google account you use for Firebase. That's it.

When deploy finishes it will print a URL like `https://provincetown-2026.web.app` — that's your live app!

---

## Making yourself admin

After you sign up in the app:
1. Go to Firebase Console → Firestore Database
2. Click the `users` collection
3. Find your document (it will have your email)
4. Click the `admin` field and change it from `false` to `true`
5. Save

After that, the admin panel appears in your Me tab and you can grant admin to others from there.

---

## Setting your admin email

In `src/pages/AuthPage.jsx` line 6, change:
```
const ADMIN_EMAIL = 'brandonnwokocha@gmail.com';
```
to your actual email address. This auto-grants admin when you first sign up.

---

## Inviting the crew

Once the app is live, just text them the URL and say "create an account."
They create an account → you assign their room in Me → Guests & Rooms.

---

## Questions?
Any issues, just ask Claude and paste the error message you see.
