import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import '/index/js/post-gate.js';

let auth, db, storage;

/* ---------------- SPA VIEW LOADER ---------------- */
/* ---------------- SPA VIEW LOADER (PERSISTENT VIEWS) ---------------- */
export async function loadView(view) {
  const container = document.getElementById("app");
  if (!container) return;

  // Hide all views
  const views = container.querySelectorAll(".view");
  views.forEach(v => v.hidden = true);

  // Target view element
  let target = document.getElementById(`view-${view}`);

  // If the view container doesn't exist yet, create it
  if (!target) {
    target = document.createElement("div");
    target.id = `view-${view}`;
    target.className = "view";
    target.hidden = true;
    container.appendChild(target);
  }

  // Load HTML only once
  if (!target.dataset.loaded) {
    const html = await fetch(`/views/${view}.html`).then(r => r.text());
    target.innerHTML = html;
    target.dataset.loaded = "true";

    // Load JS for this view
    try {
      const mod = await import(`/views/${view}.js?cache=${Date.now()}`);
      if (mod.init) mod.init();
    } catch (err) {
      console.error("View JS error:", err);
    }
  }

  // Show the view
  target.hidden = false;
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
