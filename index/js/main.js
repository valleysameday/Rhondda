import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import { initFeed } from '/index/js/feed.js';
import '/index/js/post-gate.js'; // post-gate loads firebase on its own

let auth, db, storage;

// ✅ Load Firebase FIRST
getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  console.log("✅ Firebase ready in main.js");

  // ✅ Now safe to run your UI + feed logic
  document.addEventListener('DOMContentLoaded', () => {
    initUIRouter();
    initFeed();
  });
});
