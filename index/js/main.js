import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import { initFeed } from '/index/js/feed.js';
import '/index/js/post-gate.js';

let auth, db, storage;

/* ---------------- SPA VIEW LOADER ---------------- */
export async function loadView(view) {
  const app = document.getElementById("app");

  // Load HTML fragment
  const html = await fetch(`/views/${view}.html`).then(r => r.text());
  app.innerHTML = html;

  // Load JS for that view
  import(`/views/${view}.js`).catch(err => console.error("View JS error:", err));
}
window.loadView = loadView;
/* ---------------- INITIALISE APP ---------------- */
getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  console.log("✅ Firebase ready in main.js");

  const start = () => {
    initUIRouter();   // modals, categories, action bar
    initFeed();       // homepage feed
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
});

/* ---------------- GLOBAL NAVIGATION HOOKS ---------------- */
window.navigateToDashboard = function () {
  if (!window.currentUser) {
    openScreen("login");
    return;
  }

  if (window.firebaseUserDoc?.isBusiness) {
    loadView("business-dashboard");
  } else {
    loadView("customer-dashboard");
  }
};
