const firebaseConfig = {
  apiKey: import.meta.env.RN_FIREBASE_API_KEY || window.RN_FIREBASE_API_KEY,
  authDomain: import.meta.env.RN_FIREBASE_AUTH_DOMAIN || window.RN_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.RN_FIREBASE_PROJECT_ID || window.RN_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.RN_FIREBASE_STORAGE_BUCKET || window.RN_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.RN_FIREBASE_MESSAGING_SENDER_ID || window.RN_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.RN_FIREBASE_APP_ID || window.RN_FIREBASE_APP_ID
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
