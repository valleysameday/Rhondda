/// /index/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let firebaseInstance = null;

export async function getFirebase() {
  if (firebaseInstance) return firebaseInstance;

  // ✅ Fetch config from Netlify Function
  const res = await fetch("/.netlify/functions/firebaseConfig");
  if (!res.ok) throw new Error("Failed to load Firebase config");

  const firebaseConfig = await res.json();

  const app = initializeApp(firebaseConfig);

  firebaseInstance = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app)
  };

  console.log("🔥 Firebase initialised");
  return firebaseInstance;
}
