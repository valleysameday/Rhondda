import { getFirebase } from "/index/js/firebase/init.js";
import { openLoginModal } from "/index/js/auth/loginModal.js";
import { openSignupModal } from "/index/js/auth/signupModal.js";
import { openForgotModal } from "/index/js/auth/forgotModal.js";
import { initViewServices } from "/views/view-services.js";
import { initViewService } from "/views/view-service.js";

let auth, db, storage, settingsModule = null;

// Registry for special views
const viewRegistry = {
  "view-services": initViewServices,
  "view-service": initViewService
};

// ------------------------------------------------------
// SPA VIEW LOADER (HASH-BASED, NO PUSHSTATE)
// ------------------------------------------------------
export async function loadView(view, options = {}) {
  // Update hash WITHOUT triggering popstate
  if (location.hash !== "#" + view) {
    location.hash = view;
  }

  window.currentViewOptions = options;

  // Force re-init for home
  if (view === "home") options.forceInit = true;

  // Prevent duplicate loads
  if (window.currentView === view && !options.forceInit) return;
  window.currentView = view;

  const app = document.getElementById("app");
  if (!app) return;

  // Hide all views
  app.querySelectorAll(".view").forEach(v => (v.hidden = true));

  // Create or select view container
  let target = document.getElementById(`view-${view}`);
  if (!target) {
    target = document.createElement("div");
    target.id = `view-${view}`;
    target.className = "view view-" + view;
    target.hidden = true;
    app.appendChild(target);
  }

  // Force reload if needed
  if (options.forceInit) delete target.dataset.loaded;

  // Load HTML + JS for the view
  if (!target.dataset.loaded) {
    target.innerHTML = await fetch(`/views/${view}.html`).then(r => r.text());
    target.dataset.loaded = "true";

    try {
      const mod = await import(`/views/${view}.js`);
      mod.init?.({ auth, db, storage });
    } catch (err) {
      console.error("❌ View JS error:", err);
    }
  }

  // Show the view
  target.hidden = false;

  // Hide sub-tabs globally
  document.querySelectorAll(".sub-tabs").forEach(el =>
    el.classList.add("hidden")
  );

  // Header visibility logic
  const accountHeader = document.getElementById("accountHeader");
  const mainTabs = document.querySelectorAll(".main-tabs, .rctx-search");

  const accountViews = [
    "my-ads",
    "favourites",
    "list-business",
    "chat-list",
    "account-details",
    "stats"
  ];

  if (accountViews.includes(view)) {
    accountHeader?.classList.remove("hidden");
    mainTabs.forEach(el => el.classList.add("hidden"));
  } else {
    accountHeader?.classList.add("hidden");
    mainTabs.forEach(el => el.classList.remove("hidden"));
  }

  // Highlight active account tab
  document.querySelectorAll(".account-tabs button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
}

// ------------------------------------------------------
// HASH-BASED ROUTER (REPLACES POPSTATE COMPLETELY)
// ------------------------------------------------------
window.addEventListener("hashchange", () => {
  const view = location.hash.replace("#", "") || "home";
  loadView(view, { forceInit: true });
});

// ------------------------------------------------------
// SIDE MENU RENDERING
// ------------------------------------------------------
function renderSideMenu() {
  const menu = document.getElementById("menuOptions");
  if (!menu) return;

  menu.innerHTML = "";

  const loggedIn = !!auth.currentUser;

  const items = loggedIn
    ? [
        { label: "Home", action: () => loadView("home") },
        { label: "Post an Ad", action: () => document.getElementById("post-ad-btn")?.click() },
        { label: "Messages", action: () => loadView("chat-list") },
        { label: "Favourites", action: () => loadView("favourites") },
        { label: "My Ads", action: () => loadView("my-ads") },
        { label: "My Details", action: () => loadView("account-details") },
        { label: "List My Business", action: () => handleListMyBusiness() },
        { label: "Stats", action: () => loadView("stats") },
        { label: "Help & Contact", action: () => loadView("help") },
        { label: "Logout", action: () => auth.signOut() }
      ]
    : [
        { label: "Home", action: () => loadView("home") },
        { label: "Post an Ad", action: () => openLoginModal() },
        { label: "List My Business", action: () => openLoginModal() },
        { label: "Stats", action: () => openLoginModal() },
        { label: "Help & Contact", action: () => loadView("help") },
        { label: "Login", action: () => openLoginModal() }
      ];

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "menu-item";
    div.innerHTML = `
      <span>${item.label}</span>
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    div.addEventListener("click", () => {
      document.getElementById("sideMenu")?.classList.add("hidden");
      item.action();
    });
    menu.appendChild(div);
  });
}

// ------------------------------------------------------
// BUSINESS HANDLER
// ------------------------------------------------------
async function handleListMyBusiness() {
  const user = auth.currentUser;
  if (!user) {
    openLoginModal();
    return;
  }

  const services = await settingsModule.fsGetUserServices(user.uid);
  if (services.length) {
    openManageMyBusinessPopup(services);
  } else {
    loadView("business-onboarding", { forceInit: true });
  }
}

// ------------------------------------------------------
// APP INITIALISATION
// ------------------------------------------------------
getFirebase().then(async fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  settingsModule = await import("/index/js/firebase/settings.js");
  settingsModule.initFirebase({ auth, db, storage });

  // Auth state
  const getUser = settingsModule.getUser;

  window.currentUser = null;
  window.currentUserData = null;
  window.authReady = false;

  auth.onAuthStateChanged(async user => {
    window.currentUser = user || null;
    window.currentUserData = null;
    window.authReady = false;

    const dot = document.getElementById("accountStatusDot");
    if (dot) {
      dot.style.background = user ? "green" : "red";
      dot.classList.toggle("logged-out", !user);
    }

    const loggedOut = document.getElementById("auth-logged-out");
    const messages = document.getElementById("auth-messages");

    if (!user) {
      loggedOut?.classList.remove("hidden");
      messages?.classList.add("hidden");
      window.authReady = true;
      return;
    }

    loggedOut?.classList.add("hidden");
    messages?.classList.remove("hidden");

    try {
      window.currentUserData = await getUser(user.uid);
      const adminBtn = document.getElementById("openAdminDashboard");
      if (adminBtn) {
        adminBtn.style.display = window.currentUserData?.isAdmin
          ? "inline-block"
          : "none";
      }
    } catch (err) {
      console.warn("❌ User lookup failed:", err);
    }

    window.authReady = true;
  });

  // Initial load
  const start = () => {
    const initialView = location.hash.replace("#", "") || "home";
    loadView(initialView, { forceInit: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
});
