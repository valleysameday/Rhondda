// Using ES Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Use Netlify env variables injected at build time
const firebaseConfig = {
  apiKey: NETLIFY_ENV.RN_FIREBASE_API_KEY,
  authDomain: NETLIFY_ENV.RN_FIREBASE_AUTH_DOMAIN,
  projectId: NETLIFY_ENV.RN_FIREBASE_PROJECT_ID,
  storageBucket: NETLIFY_ENV.RN_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: NETLIFY_ENV.RN_FIREBASE_MESSAGING_SENDER_ID,
  appId: NETLIFY_ENV.RN_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
