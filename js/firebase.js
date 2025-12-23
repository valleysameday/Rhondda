// /index/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// --------------------------
// CONFIG (Netlify env variables example)
// Replace these with your Netlify environment variable names
// process.env.YOUR_VAR_NAME is how Netlify exposes env vars in builds
// --------------------------
const firebaseConfig = {
  apiKey: window.PUBLIC_FIREBASE_API_KEY,
  authDomain: window.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: window.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: window.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: window.PUBLIC_FIREBASE_APP_ID
};

// --------------------------
// INITIALIZE FIREBASE
// --------------------------
const app = initializeApp(firebaseConfig);

// --------------------------
// GLOBAL VARIABLES
// --------------------------
window.db = getFirestore(app);
window.auth = getAuth(app);
window.storage = getStorage(app);

console.log("Firebase initialised ✅");
