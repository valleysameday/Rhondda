// index/js/auth/state.js

let currentUser = null;
const listeners = [];

/**
 * Initialize auth state tracking
 * @param {import("firebase/auth").Auth} auth - Firebase Auth instance
 */
export function initAuth(auth) {
  auth.onAuthStateChanged(user => {
    currentUser = user;
    listeners.forEach(cb => cb(user));
  });
}

/**
 * Get current logged-in user
 * @returns {import("firebase/auth").User | null}
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Register a callback for when auth state is ready/changes
 * @param {function(import("firebase/auth").User|null):void} callback 
 */
export function onAuthReady(callback) {
  listeners.push(callback);
  if (currentUser !== null) callback(currentUser);
}
