// main.js — SPA orchestrator
import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import '/index/js/post-gate.js';

import { openLoginModal } from '/index/js/auth/loginModal.js';
import { openSignupModal } from '/index/js/auth/signupModal.js';
import { openForgotModal } from '/index/js/auth/forgotModal.js';

window.openLoginModal = openLoginModal;
window.openSignupModal = openSignupModal;
window.openForgotModal = openForgotModal;

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db, storage;

/* =====================================================
   SPA VIEW LOADER
===================================================== */
export async function loadView(view, options = {}) {

  if (window.currentView === view) return;
  window.currentView = view;

  const app = document.getElementById("app");
  if (!app) return console.log("❌ #app missing");

  // Hide all views
  app.querySelectorAll(".view").forEach(v => v.hidden = true);

  // Create container if missing
  let target = document.getElementById(`view-${view}`);
  if (!target) {
    target = document.createElement("div");
    target.id = `view-${view}`;
    target.className = "view";
    target.hidden = true;
    app.appendChild(target);
  }

  const shouldReload = options.forceInit || !target.dataset.loaded;

  if (shouldReload) {
    // Fetch HTML
    const html = await fetch(`/views/${view}.html`).then(r => r.text());
    target.innerHTML = html;
    target.dataset.loaded = "true";

    try {
      // Admin protection
      if (view === "admin-dashboard" && !window.currentUserData?.isAdmin) {
        return loadView("home");
      }

      // Dynamic import of the view JS
      const mod = await import(`/views/${view}/${view}.js?cache=${Date.now()}`);
      // All dashboard modules should export init({ auth, db, storage })
      await mod.init?.({ auth, db, storage });

      // Optionally expose AI popup globally
      if (mod.AI) window.AI = mod.AI;

    } catch (err) {
      console.error("❌ View JS error:", err);
    }
  }

  target.hidden = false;
}

/* =====================================================
   APP INIT
===================================================== */
getFirebase().then(async fb => {

  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  window.currentUser = null;
  window.currentUserData = null;
  window.authReady = false;

  /* =====================================================
     AUTH STATE LISTENER
  ===================================================== */
  auth.onAuthStateChanged(async user => {

    window.currentUser = user || null;
    window.currentUserData = null;
    window.authReady = false;

    // Update account dot
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
      let snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        await new Promise(r => setTimeout(r, 200));
        snap = await getDoc(doc(db, "users", user.uid));
      }

      window.currentUserData = snap.exists() ? snap.data() : {};

      // Normalize plan
      if (!window.currentUserData.plan) window.currentUserData.plan = "free";

      // Business trial check
      const trial = window.currentUserData.businessTrial;
      if (trial?.active && Date.now() > trial.expiresAt) {
        window.currentUserData.plan = "free";
        window.currentUserData.businessTrial.active = false;
      }

      // Admin button visibility
      const adminBtn = document.getElementById("openAdminDashboard");
      if (adminBtn) adminBtn.style.display = window.currentUserData?.isAdmin ? "inline-block" : "none";

    } catch (e) {
      console.warn("❌ User lookup failed:", e);
    }

    window.authReady = true;
  });

  /* =====================================================
     START APP
  ===================================================== */
  const start = () => {

    initUIRouter();

    // Auth modals
    document.querySelectorAll('[data-value="login"]').forEach(btn =>
      btn.onclick = e => { e.preventDefault(); openLoginModal(auth, db); }
    );
    document.querySelectorAll('[data-value="signup"]').forEach(btn =>
      btn.onclick = e => { e.preventDefault(); openSignupModal(auth); }
    );
    document.querySelectorAll('[data-value="forgot"]').forEach(btn =>
      btn.onclick = e => { e.preventDefault(); openForgotModal(auth); }
    );

    // Chat list
    document.getElementById("openChatList")?.addEventListener("click", e => {
      e.preventDefault();
      if (!auth.currentUser) {
        sessionStorage.setItem("redirectAfterLogin", "chat-list");
        openLoginModal(auth, db);
        return;
      }
      loadView("chat-list");
    });

    // Account button → Dashboard hub
    document.getElementById("openAccountModal")?.addEventListener("click", e => {
      e.preventDefault();

      if (!window.currentUser) {
        openLoginModal(auth, db);
        return;
      }

      const waitForAuth = () => {
        if (!window.authReady) return requestAnimationFrame(waitForAuth);
        loadView("dashboard-hub", { forceInit: true });
      };

      waitForAuth();
    });

    // Admin dashboard
    document.getElementById("openAdminDashboard")?.addEventListener("click", e => {
      if (!e.isTrusted) return;
      if (!window.currentUserData?.isAdmin) return alert("Admin access only");
      loadView("admin-dashboard");
    });

    // Default view
    loadView("home");
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start)
    : start();
});
