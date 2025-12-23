// /index/js/app.js
import { getFirebase } from '/index/js/firebase.js';
import { initUIRouter } from '/index/js/ui-router.js';

let auth, db, storage;

export async function loadView(view) {
  const app = document.getElementById("app");
  if (!app) return;

  // fetch HTML
  const html = await fetch(`/views/${view}.html`).then(r => r.text());
  app.innerHTML = html;

  // dynamically import the view JS
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

  initUIRouter();   // initialize router once
  loadView("home"); // load initial view
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
