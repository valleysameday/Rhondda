import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  initializeAuth,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

export async function getFirebase() {
  try {
    const res = await fetch('/.netlify/functions/firebaseConfig');
    const firebaseConfig = await res.json();

    const app = initializeApp(firebaseConfig);

    // ✅ CRITICAL FIX — do NOT use getAuth()
    const auth = initializeAuth(app, {
      persistence: browserLocalPersistence
    });

    const db = getFirestore(app);
    const storage = getStorage(app);

    return { auth, db, storage };
  } catch (err) {
    console.error("Firebase init failed:", err);
    throw err;
  }
}
