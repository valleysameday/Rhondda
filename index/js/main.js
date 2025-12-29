import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import '/index/js/post-gate.js';

import { openLoginModal } from '/index/js/auth/loginModal.js';
import { openSignupModal } from '/index/js/auth/signupModal.js';
import { openForgotModal } from '/index/js/auth/forgotModal.js';

let auth, db, storage;

getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  console.log("✅ Firebase ready");

  // Auth state
  auth.onAuthStateChanged(user => {
    window.currentUser = user || null;
    const label = document.querySelector("#openAccountModal .label-main");
    if (label) label.textContent = user ? "My Account" : "Login";
  });

  const start = () => {
    initUIRouter();

    // Wire SPA login/signup/forgot buttons
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
    const btn = document.getElementById("openAccountModal");
    if (btn) {
      btn.addEventListener("click", e => {
        e.preventDefault();
        if (!window.currentUser) {
          openLoginModal();
        } else {
          // replace with your account view logic
          window.loadView(
  window.firebaseUserDoc?.isBusiness
    ? "views/business-dashboard"
    : "views/general-dashboard"
);
        }
      });
    }

    loadView("home");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
});
