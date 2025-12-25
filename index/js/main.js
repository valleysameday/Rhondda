import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import '/index/js/post-gate.js';

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let auth, db, storage;

/* =====================================================
   SPA VIEW LOADER (SINGLE VERSION)
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
      mod.init?.();
    } catch (err) {
      console.error("View JS error:", err);
    }
  }

  target.hidden = false;
}

window.loadView = loadView;

/* =====================================================
   INIT APP
===================================================== */
getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  console.log("✅ Firebase ready");

  onAuthStateChanged(auth, user => {
    window.currentUser = user || null;

    const label = document.querySelector("#openAccountModal .label-main");
    if (label) label.textContent = user ? "My Account" : "Login";
  });

  const start = () => {
    initUIRouter();
    loadView("home");
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start)
    : start();
});
