// index/js/main.js

import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import '/index/js/post-gate.js';

import { openLoginModal } from '/index/js/auth/loginModal.js';
import { openSignupModal } from '/index/js/auth/signupModal.js';
import { openForgotModal } from '/index/js/auth/forgotModal.js';
import { initAuth, getCurrentUser, onAuthReady } from '/index/js/auth/state.js';

let auth, db, storage;

getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  console.log("✅ Firebase ready");

  // Initialize auth state
  initAuth(auth);

  // Update account label dynamically
  onAuthReady(user => {
    const label = document.querySelector("#openAccountModal .label-main");
    if (label) label.textContent = user ? "My Account" : "Login";
  });

  const start = () => {
    initUIRouter();

    // SPA login/signup/forgot links
    document.querySelectorAll('[data-value="login"]').forEach(btn => {
      btn.addEventListener("click", e => { e.preventDefault(); openLoginModal(); });
    });
    document.querySelectorAll('[data-value="signup"]').forEach(btn => {
      btn.addEventListener("click", e => { e.preventDefault(); openSignupModal(); });
    });
    document.querySelectorAll('[data-value="forgot"]').forEach(btn => {
      btn.addEventListener("click", e => { e.preventDefault(); openForgotModal(); });
    });

    // Account button
    const accountBtn = document.getElementById("openAccountModal");
    if (accountBtn) {
      accountBtn.addEventListener("click", e => {
        e.preventDefault();
        const user = getCurrentUser();
        if (!user) {
          openLoginModal();
        } else {
          // Replace with your account view logic
          window.loadView(
            window.firebaseUserDoc?.isBusiness
              ? "views/business-dashboard"
              : "views/general-dashboard"
          );
        }
      });
    }

    // Load home view
    loadView("home");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
});

/* =====================================================
   SPA VIEW LOADER
===================================================== */
export async function loadView(view) {
  const container = document.getElementById("app");
  if (!container) return;

  container.querySelectorAll(".view").forEach(v => v.hidden = true);

  let target = document.getElementById(`view-${view}`);
  if (!target) {
    target = document.createElement("div");
    target.id = `view-${view}`;
    target.className = "view";
    target.hidden = true;
    container.appendChild(target);
  }

  if (!target.dataset.loaded) {
    const html = await fetch(`/views/${view}.html`).then(r => r.text());
    target.innerHTML = html;
    target.dataset.loaded = "true";

    try {
      const mod = await import(`/views/${view}.js?cache=${Date.now()}`);
      mod.init?.({ db, auth, storage });
    } catch (err) {
      console.error("View JS error:", err);
    }
  }

  target.hidden = false;
}

window.loadView = loadView;
