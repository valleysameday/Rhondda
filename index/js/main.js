// index/js/main.js

import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import '/index/js/post-gate.js';

import { openLoginModal } from '/index/js/auth/loginModal.js';
import { openSignupModal } from '/index/js/auth/signupModal.js';
import { openForgotModal } from '/index/js/auth/forgotModal.js';

import { doc, getDoc } from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db, storage;

/* =====================================================
   SPA VIEW LOADER
===================================================== */
export async function loadView(view) {
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

  if (!target.dataset.loaded) {
    const html = await fetch(`/views/${view}.html`).then(r => r.text());
    target.innerHTML = html;
    target.dataset.loaded = "true";

    try {
      const mod = await import(`/views/${view}.js?cache=${Date.now()}`);
      mod.init?.({ auth, db, storage });
    } catch (err) {
      console.error("View JS error:", err);
    }
  }

  target.hidden = false;
}

window.loadView = loadView;

/* =====================================================
   APP INIT
===================================================== */
getFirebase().then(async fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  window.currentUser = null;
  window.isBusinessUser = false;
  window.authReady = false;

  auth.onAuthStateChanged(async user => {
    window.currentUser = user || null;
    window.isBusinessUser = false;
    window.authReady = false;

    if (!user) {
      window.authReady = true;
      return;
    }

    try {
      const snap = await getDoc(doc(db, "businesses", user.uid));
      window.isBusinessUser = snap.exists();
    } catch (e) {
      console.warn("Business lookup failed:", e);
    }

    window.authReady = true;
  });

  const start = () => {
    initUIRouter();

    document.querySelectorAll('[data-value="login"]').forEach(btn =>
      btn.onclick = e => {
        e.preventDefault();
        openLoginModal(auth, db);
      }
    );

    document.querySelectorAll('[data-value="signup"]').forEach(btn =>
      btn.onclick = e => {
        e.preventDefault();
        openSignupModal(auth);
      }
    );

    document.querySelectorAll('[data-value="forgot"]').forEach(btn =>
      btn.onclick = e => {
        e.preventDefault();
        openForgotModal(auth);
      }
    );

    document.getElementById("openAccountModal")?.addEventListener("click", e => {
      e.preventDefault();

      if (!window.currentUser) {
        openLoginModal(auth, db);
        return;
      }

      const waitForRole = () => {
        if (!window.authReady) {
          requestAnimationFrame(waitForRole);
          return;
        }

        loadView(
          window.isBusinessUser
            ? "business-dashboard"
            : "general-dashboard"
        );
      };

      waitForRole();
    });

    loadView("home");
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start)
    : start();
});
