import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import '/index/js/post-gate.js';
import { AI } from "/index/js/ai/assistant.js";

import { openLoginModal } from '/index/js/auth/loginModal.js';
import { openSignupModal } from '/index/js/auth/signupModal.js';
import { openForgotModal } from '/index/js/auth/forgotModal.js';

import { fsLoadUserProfile } from '/index/js/firebase/settings.js';

window.openLoginModal = openLoginModal;
window.openSignupModal = openSignupModal;
window.openForgotModal = openForgotModal;

let auth, db, storage;

/* =====================================================
   GLOBAL TIME FORMATTER
===================================================== */
window.timeAgo = function(timestamp) {
  if (!timestamp) return "";

  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

/* =====================================================
   SPA VIEW LOADER
===================================================== */
export async function loadView(view, options = {}) {
  if (view === "home") options.forceInit = true;
  if (window.currentView === view && !options.forceInit) return;

  window.currentView = view;

  const app = document.getElementById("app");
  if (!app) return;

  app.querySelectorAll(".view").forEach(v => v.hidden = true);

  let target = document.getElementById(`view-${view}`);
  if (!target) {
    target = document.createElement("div");
    target.id = `view-${view}`;
    target.className = "view";
    target.hidden = true;
    app.appendChild(target);
  }

  if (options.forceInit) delete target.dataset.loaded;

  if (!target.dataset.loaded) {
    target.innerHTML = await fetch(`/views/${view}.html`).then(r => r.text());
    target.dataset.loaded = "true";

    try {
      const mod = view === "dashboard-hub"
        ? await import(`/views/dashboard-hub.js?${Date.now()}`)
        : await import(`/views/${view}.js?${Date.now()}`);

      mod.init?.({ auth, db, storage });
    } catch (err) {
      console.error("❌ View JS error:", err);
    }
  }

  target.hidden = false;
}

/* =====================================================
   APP INIT
===================================================== */
getFirebase().then(fb => {

  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  window.currentUser = null;
  window.currentUserData = null;
  window.authReady = false;

  auth.onAuthStateChanged(async user => {

    window.currentUser = user || null;
    window.currentUserData = null;
    window.authReady = false;

    const statusDot = document.getElementById("accountStatusDot");
    if (statusDot) {
      statusDot.style.background = user ? "green" : "red";
      statusDot.classList.toggle("logged-out", !user);
    }

    if (!user) {
      window.authReady = true;
      return;
    }

    try {
      window.currentUserData = await fsLoadUserProfile(user.uid);

      const adminBtn = document.getElementById("openAdminDashboard");
      if (adminBtn) {
        adminBtn.style.display = window.currentUserData?.isAdmin
          ? "inline-block"
          : "none";
      }

    } catch (e) {
      console.warn("❌ User lookup failed:", e);
    }

    window.authReady = true;
  });

  const start = () => {
    initUIRouter();
    loadView("home");
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start)
    : start();
});
