// firebase/init.js

// ✅ Firebase config from environment variables only
const firebaseConfig = {
  apiKey: import.meta.env.RN_FIREBASE_API_KEY || null,
  authDomain: import.meta.env.RN_FIREBASE_AUTH_DOMAIN || null,
  projectId: import.meta.env.RN_FIREBASE_PROJECT_ID || null,
  storageBucket: import.meta.env.RN_FIREBASE_STORAGE_BUCKET || null,
  messagingSenderId: import.meta.env.RN_FIREBASE_MESSAGING_SENDER_ID || null,
  appId: import.meta.env.RN_FIREBASE_APP_ID || null
};

// ⚠️ Make sure no values are hard-coded here

// Initialize Firebase only if keys exist
if (
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
) {
  firebase.initializeApp(firebaseConfig);

  // Export services for your app
  export const auth = firebase.auth();
  export const db = firebase.firestore();
  export const storage = firebase.storage();
} else {
  console.warn(
    "Firebase keys missing! Make sure your environment variables are set."
  );
  // Provide dummy objects so your code doesn't break locally
  export const auth = null;
  export const db = null;
  export const storage = null;
}
