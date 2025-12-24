import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import '/index/js/post-gate.js';

let auth, db, storage;

/* ---------------- SPA VIEW LOADER ---------------- */
export async function loadView(view) {
  const app = document.getElementById("app");
  if (!app) return;

  // Load HTML fragment
  const html = await fetch(`/views/${view}.html`).then(r => r.text());
  app.innerHTML = html;

  // Dynamically import the view JS after HTML is in the DOM
  try {
    const mod = await import(`/views/${view}.js?cache=${Date.now()}`);
    if (mod.init) mod.init(); // run the view init function
  } catch (err) {
    console.error("View JS error:", err);
  }
}
window.loadView = loadView;

/* ---------------- INITIALISE APP ---------------- */
getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  console.log("✅ Firebase ready");

  const start = () => {
    initUIRouter();    // Modals, categories, action bar
    loadView("home");  // Load home view and init feed safely
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
});

/* ---------------- GLOBAL NAVIGATION ---------------- */
window.navigateToDashboard = function () {
  if (!window.currentUser) {
    window.openScreen("login");
    return;
  }
  if (window.firebaseUserDoc?.isBusiness) {
    loadView("business-dashboard");
  } else {
    loadView("customer-dashboard");
  }
};
