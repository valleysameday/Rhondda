import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function logEvent(db, type, data = {}) {
  try {
    await addDoc(collection(db, "analyticsEvents"), {
      type,
      timestamp: serverTimestamp(),
      userId: window.currentUser?.uid || null,
      ...data
    });
  } catch (e) {
    console.warn("Analytics log failed", e);
  }
}
