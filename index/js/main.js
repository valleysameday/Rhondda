// index/js/main.js

import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import '/index/js/post-gate.js';

import { openLoginModal } from '/index/js/auth/loginModal.js';
import { openSignupModal } from '/index/js/auth/signupModal.js';
import { openForgotModal } from '/index/js/auth/forgotModal.js';

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db, storage;

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

  console.log("✅ Firebase ready");

  auth.onAuthStateChanged(async user => {
    window.currentUser = user || null;
    window.firebaseUserDoc = null;

    const label = document.querySelector("#openAccountModal .label-main");
    if (label) label.textContent = user ? "My Account" : "Login";

    if (!user) return;

    // ✅ MODULAR Firestore check (FIXED)
    try {
      const ref = doc(db, "businesses", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        window.firebaseUserDoc = snap.data();
      }
    } catch (err) {
      console.warn("Business lookup failed:", err);
    }
  });

  const start = () => {
    initUIRouter();

    // Auth buttons
    document.querySelectorAll('[data-value="login"]').forEach(btn =>
      btn.addEventListener("click", e => {
        e.preventDefault();
        openLoginModal(auth);
      })
    );

    document.querySelectorAll('[data-value="signup"]').forEach(btn =>
      btn.addEventListener("click", e => {
        e.preventDefault();
        openSignupModal(auth);
      })
    );

    document.querySelectorAll('[data-value="forgot"]').forEach(btn =>
      btn.addEventListener("click", e => {
        e.preventDefault();
        openForgotModal(auth);
      })
    );

    // Account button
    document.getElementById("openAccountModal")?.addEventListener("click", e => {
      e.preventDefault();

      if (!window.currentUser) {
        openLoginModal(auth);
      } else {
        loadView(
          window.firebaseUserDoc
            ? "business-dashboard"
            : "general-dashboard"
        );
      }
    });

    loadView("home");
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start)
    : start();
});
