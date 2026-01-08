// ========================== main.js ==========================
import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';

import { openLoginModal } from '/index/js/auth/loginModal.js';
import { openSignupModal } from '/index/js/auth/signupModal.js';
import { openForgotModal } from '/index/js/auth/forgotModal.js';

// Expose modals globally
window.openLoginModal = openLoginModal;
window.openSignupModal = openSignupModal;
window.openForgotModal = openForgotModal;

let auth, db, storage;
let settingsModule = null;

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
      const mod = await import(`/views/${view}.js?${Date.now()}`);
      mod.init?.({ auth, db, storage });

      // ✅ If it's home, call initFeed directly after HTML is loaded
      if (view === "home") {
        const feed = document.getElementById("feed");
        if (feed) {
          const { initFeed } = await import("/index/js/feed.js");
          initFeed({ db });
        }
      }

    } catch (err) {
      console.error("❌ View JS error:", err);
    }
  }

  target.hidden = false;
}

/* =====================================================
   SIDEBAR MENU RENDERER
===================================================== */
function renderSideMenu() {
  const menu = document.getElementById("menuOptions");
  if (!menu) return;

  menu.innerHTML = "";

  const isLoggedIn = !!auth.currentUser;

  const options = isLoggedIn
    ? [
        { label: "Home", action: () => loadView("home") },
        { label: "Post an Ad", action: () => document.getElementById("post-ad-btn")?.click() },
        { label: "Messages", action: () => loadView("chat-list") },
        { label: "Favourites", action: () => loadView("favourites") },
        { label: "My Details", action: () => loadView("account-details") },
        { label: "Stats", action: () => loadView("stats") },
        { label: "Help & Contact", action: () => loadView("help") },
        { label: "Logout", action: () => auth.signOut() }
      ]
    : [
        { label: "Home", action: () => loadView("home") },
        { label: "Post an Ad", action: () => openLoginModal() },
        { label: "Stats", action: () => openLoginModal() },
        { label: "Help & Contact", action: () => loadView("help") },
        { label: "Login", action: () => openLoginModal() }
      ];

  options.forEach(opt => {
    const item = document.createElement("div");
    item.className = "menu-item";
    item.innerHTML = `
      <span>${opt.label}</span>
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    item.addEventListener("click", () => {
      document.getElementById("sideMenu")?.classList.add("hidden");
      opt.action();
    });
    menu.appendChild(item);
  });
}

/* =====================================================
   APP INITIALIZATION
===================================================== */
getFirebase().then(async fb => {

  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  window.firebaseAuth = auth;
  window.firebaseDb = db;
  window.firebaseStorage = storage;

  settingsModule = await import("/index/js/firebase/settings.js");
  settingsModule.initFirebase({ auth, db, storage });
  const fsLoadUserProfile = settingsModule.getUser;

  window.currentUser = null;
  window.currentUserData = null;
  window.authReady = false;

  /* =====================================================
     AUTH LISTENER
  ===================================================== */
  auth.onAuthStateChanged(async user => {
    window.currentUser = user || null;
    window.currentUserData = null;
    window.authReady = false;

    const statusDot = document.getElementById("accountStatusDot");
    if (statusDot) {
      statusDot.style.background = user ? "green" : "red";
      statusDot.classList.toggle("logged-out", !user);
    }

    const loginBtn = document.getElementById("auth-logged-out");
    const inboxBtn = document.getElementById("auth-messages");

    if (!user) {
      loginBtn?.classList.remove("hidden");
      inboxBtn?.classList.add("hidden");
      window.authReady = true;
      return;
    }

    loginBtn?.classList.add("hidden");
    inboxBtn?.classList.remove("hidden");

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

  /* =====================================================
     START APP
  ===================================================== */
  const start = () => {
    initUIRouter();
    loadView("home");

    // LOGIN BUTTON
    document.addEventListener("click", e => {
      if (e.target.closest("#auth-logged-out")) openLoginModal(auth, db);
    });

    // LOGO → HOME
    document.addEventListener("click", e => {
      if (e.target.closest(".rctx-logo")) {
        loadView("home", { forceInit: true });
        window.scrollTo(0, 0);
      }
    });

    // INBOX → CHAT LIST
    document.addEventListener("click", e => {
      if (e.target.closest("#auth-messages")) {
        const chatView = document.getElementById("view-chat-list");
        if (chatView) delete chatView.dataset.loaded;
        loadView("chat-list", { forceInit: true });
        window.scrollTo(0, 0);
      }
    });

    // VEHICLES SUBCATEGORY
    const subVehicles = document.getElementById("sub-vehicles");
    document.addEventListener("click", e => {
      const isVehicles = e.target.closest("#cat-vehicles");
      const isCategory = e.target.closest(".rctx-tabs");

      if (isVehicles) subVehicles?.classList.remove("hidden");
      else if (isCategory) subVehicles?.classList.add("hidden");
    });

    // POST AD BUTTON
    document.addEventListener("click", e => {
      if (!e.target.closest("#post-ad-btn")) return;

      if (!auth.currentUser) {
        openLoginModal();
        return;
      }

      document.querySelectorAll(".modal").forEach(m => m.style.display = "none");

      const postModal = document.getElementById("posts-grid");
      postModal.style.display = "flex";

      const steps = document.querySelectorAll("#posts-grid .post-step");
      const dots = document.querySelectorAll("#posts-grid .dot");

      steps.forEach(s => s.classList.remove("active"));
      dots.forEach(d => d.classList.remove("active"));

      steps[0]?.classList.add("active");
      dots[0]?.classList.add("active");
    });

    // MENU BUTTON → SIDEBAR
    document.addEventListener("click", e => {
      if (e.target.closest("[title='Menu']")) {
        renderSideMenu();
        document.getElementById("sideMenu")?.classList.remove("hidden");
      }

      if (e.target.closest(".close-menu")) {
        document.getElementById("sideMenu")?.classList.add("hidden");
      }
    });
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start)
    : start();

  await import('/index/js/post-gate.js');
});
