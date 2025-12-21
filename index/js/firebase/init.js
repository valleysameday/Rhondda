import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

async function initFirebase() {
  const res = await fetch('/.netlify/functions/firebaseConfig');
  const firebaseConfig = await res.json();

  const app = initializeApp(firebaseConfig);
  window.auth = getAuth(app);
  window.db = getFirestore(app);
  window.storage = getStorage(app);
}

initFirebase();
