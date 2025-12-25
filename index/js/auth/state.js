import { getAuth, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const auth = getAuth();

let currentUser = null;
const listeners = [];

onAuthStateChanged(auth, user => {
  currentUser = user;
  listeners.forEach(cb => cb(user));
});

export function getCurrentUser() {
  return currentUser;
}

export function onAuthReady(callback) {
  listeners.push(callback);
  if (currentUser !== null) callback(currentUser);
}
