// /index/js/app.js
import { getFirebase } from '/index/js/firebase.js';
import { initUIRouter } from '/index/js/ui-router.js';

let auth, db, storage;

export async function loadView(view) {
  const app = document.getElementById("app");
  if (!app) return;

  const html = await fetch(`/views/${view}.html`).then(r => r.text());
  app.innerHTML = html;

  import(`/views/${view}.js?cache=${Date.now()}`)
    .catch(err => console.error("View JS error:", err));
}

window.loadView = loadView;

async function startApp() {
  const fb = await getFirebase();
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  // expose globally for view scripts
  window.auth = auth;
  window.db = db;
  window.storage = storage;

  initUIRouter();   // ✅ FIXED
  loadView("home");
}

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", startApp)
  : startApp();
