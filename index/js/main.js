import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import { initFeed } from '/index/js/feed.js';
import '/index/js/post-gate.js';

let auth, db, storage;

getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  console.log("✅ Firebase ready in main.js");

  // ✅ Ensure UI loads even if DOM is already ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initUIRouter();
      initFeed();
    });
  } else {
    initUIRouter();
    initFeed();
  }
});
