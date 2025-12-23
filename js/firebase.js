import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: window.PUBLIC_FIREBASE_API_KEY,
  authDomain: window.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: window.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: window.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: window.PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// ⭐ EXPORTS — this is what fixes your error
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

console.log("Firebase initialised ✅");
