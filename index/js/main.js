import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import '/index/js/post-gate.js';

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let auth, db, storage;

/* =====================================================
   SPA VIEW LOADER (PERSISTENT VIEWS)
===================================================== */
export async function loadView(view) {
  const container = document.getElementById("app");
  if (!container) return;

  // Hide all views
  const views = container.querySelectorAll(".view");
  views.forEach(v => v.hidden = true);

  // Target view
  let target = document.getElementById(`view-${view}`);

  // Create container if missing
  if (!target) {
    target = document.createElement("div");
    target.id = `view-${view}`;
    target.className = "view";
    target.hidden = true;
    container.appendChild(target);
  }

  // Load HTML once
  if (!target.dataset.loaded) {
    const html = await fetch(`/views/${view}.html`).then(r => r.text());
    target.innerHTML = html;
    target.dataset.loaded = "true";

    // Load JS once
    try {
      const mod = await import(`/views/${view}.js?cache=${Date.now()}`);
      if (mod.init) mod.init();
    } catch (err) {
      console.error("View JS error:", err);
    }
  }

  // Show view
  target.hidden = false;
}

window.loadView = loadView;

/* =====================================================
   ACCOUNT BUTTON HANDLER
===================================================== */
function initAccountButton() {
  const accountBtn = document.getElementById("openAccountModal");
  if (!accountBtn) return;

  accountBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // 🔐 Not logged in → open login modal
    if (!window.currentUser) {
      window.openScreen("login");
      return;
    }

    // 👤 Logged in → dashboard
    if (window.firebaseUserDoc?.isBusiness) {
      loadView("business-dashboard");
    } else {
      loadView("customer-dashboard");
    }
  });
}

/* =====================================================
   INITIALISE APP
===================================================== */
getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  console.log("✅ Firebase ready");

  // 🔐 Auth state watcher
  onAuthStateChanged(auth, user => {
    window.currentUser = user || null;

    // Update account label
    const label = document.querySelector("#openAccountModal .label-main");
    if (label) {
      label.textContent = user ? "My Account" : "Login";
    }
  });

  const start = () => {
    initUIRouter();      // modals, categories, action bar
    initAccountButton(); // ✅ account click logic
    loadView("home");    // load initial SPA view
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
});

/* =====================================================
   GLOBAL NAV HELPERS
===================================================== */
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
