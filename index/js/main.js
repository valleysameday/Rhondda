// =====================================================
// main.js — SECTION 1
// Imports, Globals, Helpers, View Registry, Exposed Modals
// =====================================================

import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';

import { openLoginModal } from '/index/js/auth/loginModal.js';
import { openSignupModal } from '/index/js/auth/signupModal.js';
import { openForgotModal } from '/index/js/auth/forgotModal.js';

import { initViewServices } from "/views/view-services.js";
import { initViewService } from "/views/view-service.js";

// Registry for view initialisers
const viewRegistry = {
  "view-services": initViewServices,
  "view-service": initViewService,
  // Additional views auto‑loaded dynamically
};

// Expose modals globally
window.openLoginModal = openLoginModal;
window.openSignupModal = openSignupModal;
window.openForgotModal = openForgotModal;

// Firebase globals
let auth = null;
let db = null;
let storage = null;
let settingsModule = null;

/* =====================================================
   GLOBAL TIME FORMATTER
===================================================== */
window.timeAgo = function (timestamp) {
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
   MANAGE MY BUSINESS POPUP
===================================================== */
window.openManageMyBusinessPopup = function (services) {
  const popup = document.getElementById("manageBusinessPopup");
  const grid = document.getElementById("manageBusinessGrid");
  const closeBtn = document.getElementById("closeManagePopup");

  grid.innerHTML = "";

  // Render existing listings
  services.forEach(s => {
    const card = document.createElement("div");
    card.className = "manage-card";

    card.innerHTML = `
      <img src="${s.logoUrl || '/assets/default-logo.png'}">
      <h4>${s.name || s.businessName}</h4>
      <p>${s.category}</p>

      <button class="btn-edit">Edit</button>
      <button class="btn-delete">Delete</button>
    `;

    // Edit
    card.querySelector(".btn-edit").addEventListener("click", () => {
      loadView("business-onboarding", { forceInit: true, editService: s });
      popup.classList.add("hidden");
    });

    // Delete
    card.querySelector(".btn-delete").addEventListener("click", async () => {
      if (!confirm("Delete this listing?")) return;

      await settingsModule.fsDeleteService(s.id);
      alert("Listing deleted");
      popup.classList.add("hidden");
    });

    grid.appendChild(card);
  });

  // Add New Listing Card
  const addCard = document.createElement("div");
  addCard.className = "manage-card add-card";

  const userHasTwo = services.length >= 2;

  addCard.innerHTML = userHasTwo
    ? `
      <span>🔒</span>
      <p>Upgrade to add more listings</p>
    `
    : `
      <span>+</span>
      <p>Add New Business</p>
    `;

  if (!userHasTwo) {
    addCard.addEventListener("click", () => {
      loadView("business-onboarding", { forceInit: true });
      popup.classList.add("hidden");
    });
  } else {
    addCard.classList.add("locked");
  }

  grid.appendChild(addCard);

  // Show popup
  popup.classList.remove("hidden");

  closeBtn.addEventListener("click", () => popup.classList.add("hidden"));
};


/* =====================================================
   SPA VIEW LOADER — CLEAN, STABLE, MODERN
===================================================== */
export async function loadView(view, options = {}) {
  console.log("🔄 Loading view:", view, options);

  // Home always reinitialises
  if (view === "home") options.forceInit = true;

  // Prevent unnecessary reloads
  if (window.currentView === view && !options.forceInit) {
    console.log("⏭️ View already active, skipping:", view);
    return;
  }

  window.currentView = view;

  const app = document.getElementById("app");
  if (!app) {
    console.error("❌ #app not found");
    return;
  }

  // Hide all views
  app.querySelectorAll(".view").forEach(v => (v.hidden = true));

  // Create or select target view container
  let target = document.getElementById(`view-${view}`);
  if (!target) {
    target = document.createElement("div");
    target.id = `view-${view}`;
    target.className = `view view-${view}`;
    target.hidden = true;
    app.appendChild(target);
  }

  // Force reload if needed
  if (options.forceInit) {
    delete target.dataset.loaded;
  }

  // Load HTML + JS if not loaded yet
  if (!target.dataset.loaded) {
    try {
      const html = await fetch(`/views/${view}.html`).then(r => r.text());
      target.innerHTML = html;
      target.dataset.loaded = "true";

      // Load JS module for this view
      try {
        const mod = await import(`/views/${view}.js`);
        mod.init?.({ auth, db, storage });
      } catch (err) {
        console.error(`❌ Error loading JS for view ${view}:`, err);
      }

      // Home feed requires special init
      if (view === "home") {
        try {
          const { initFeed } = await import("/index/js/feed.js");
          initFeed({ db });
        } catch (err) {
          console.error("❌ Feed init error:", err);
        }
      }

    } catch (err) {
      console.error("❌ Error loading view:", view, err);
    }
  }

  // Show the view
  target.hidden = false;

  /* =====================================================
     SUB‑TABS LOGIC (Vehicles, Property)
     — Only hide when leaving marketplace
===================================================== */
  const subTabs = document.querySelectorAll(".sub-tabs");

  const marketplaceViews = ["home", "vehicles", "property", "view-services", "view-service"];

  if (!marketplaceViews.includes(view)) {
    subTabs.forEach(el => el.classList.add("hidden"));
  }

  /* =====================================================
     ACCOUNT HEADER + CATEGORY BAR LOGIC
     — Hide ALL category bars on account pages
===================================================== */
  const accountHeader = document.getElementById("accountHeader");
  const categoryBars = document.querySelectorAll(".rctx-tabs"); // ALL category bars

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
    categoryBars.forEach(el => el.classList.add("hidden"));
  } else {
    accountHeader?.classList.add("hidden");
    categoryBars.forEach(el => el.classList.remove("hidden"));
  }

  /* =====================================================
     HIGHLIGHT ACTIVE ACCOUNT TAB
===================================================== */
  document.querySelectorAll(".account-tabs button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  /* =====================================================
     ALWAYS SCROLL TO TOP ON VIEW LOAD
     (Feed scroll restore handled in view-post.js)
===================================================== */
  window.scrollTo(0, 0);

  console.log("✅ View loaded:", view);
        }

// =====================================================
// main.js — SECTION 3
// Sidebar Renderer, Menu Logic, List‑My‑Business Handler
// =====================================================

/* =====================================================
   SIDEBAR MENU RENDERER
===================================================== */
function renderSideMenu() {
  console.log("📂 Rendering sidebar menu");

  const menu = document.getElementById("menuOptions");
  if (!menu) {
    console.error("❌ #menuOptions not found");
    return;
  }

  menu.innerHTML = "";

  const isLoggedIn = !!auth.currentUser;

  const options = isLoggedIn
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
      console.log("📌 Sidebar option clicked:", opt.label);
      document.getElementById("sideMenu")?.classList.add("hidden");
      opt.action();
    });

    menu.appendChild(item);
  });
}

/* =====================================================
   LIST MY BUSINESS HANDLER
===================================================== */
async function handleListMyBusiness() {
  console.log("🏢 List My Business clicked");

  const user = auth.currentUser;

  if (!user) {
    console.log("🔐 Not logged in → opening login modal");
    openLoginModal();
    return;
  }

  const services = await settingsModule.fsGetUserServices(user.uid);

  if (!services.length) {
    console.log("🆕 No services → opening onboarding");
    loadView("business-onboarding", { forceInit: true });
  } else {
    console.log("📂 User has services → opening manage popup");
    openManageMyBusinessPopup(services);
  }
}


// =====================================================
// main.js — SECTION 4
// Auth Listener, User Profile Loading, UI Updates
// =====================================================

/* =====================================================
   AUTH LISTENER
===================================================== */
auth.onAuthStateChanged(async user => {
  console.log("👤 Auth state changed:", user);

  window.currentUser = user || null;
  window.currentUserData = null;
  window.authReady = false;

  /* =====================================================
     STATUS DOT (GREEN / RED)
  ===================================================== */
  const statusDot = document.getElementById("accountStatusDot");
  if (statusDot) {
    statusDot.style.background = user ? "green" : "red";
    statusDot.classList.toggle("logged-out", !user);
  }

  /* =====================================================
     LOGIN / INBOX BUTTON VISIBILITY
  ===================================================== */
  const loginBtn = document.getElementById("auth-logged-out");
  const inboxBtn = document.getElementById("auth-messages");

  if (!user) {
    console.log("🔴 User logged out");

    loginBtn?.classList.remove("hidden");
    inboxBtn?.classList.add("hidden");

    window.authReady = true;
    return;
  }

  console.log("🟢 User logged in:", user.uid);

  loginBtn?.classList.add("hidden");
  inboxBtn?.classList.remove("hidden");

  /* =====================================================
     LOAD USER PROFILE
  ===================================================== */
  try {
    const fsLoadUserProfile = settingsModule.getUser;
    window.currentUserData = await fsLoadUserProfile(user.uid);

    console.log("📄 Loaded user profile:", window.currentUserData);

    /* =====================================================
       ADMIN BUTTON VISIBILITY
    ===================================================== */
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

// =====================================================
// main.js — SECTION 5
// start() initialiser + global event listeners
// =====================================================

const start = () => {
  console.log("🚀 App starting…");

  /* =====================================================
     INIT ROUTER + LOAD HOME
  ===================================================== */
  initUIRouter();
  loadView("home");

  /* =====================================================
     GLOBAL CLICK HANDLER (delegated)
  ===================================================== */
  document.addEventListener("click", e => {

    /* ============================
       LOGIN BUTTON
    ============================ */
    if (e.target.closest("#auth-logged-out")) {
      console.log("🔐 Login button clicked");
      openLoginModal(auth, db);
      return;
    }

    /* ============================
       LOGO → HOME
    ============================ */
    if (e.target.closest(".rctx-logo")) {
      console.log("🏠 Logo clicked → Home");
      loadView("home", { forceInit: true });
      window.scrollTo(0, 0);
      return;
    }

    /* ============================
       ACCOUNT TABS
    ============================ */
    const accountBtn = e.target.closest(".account-tabs button");
    if (accountBtn) {
      const view = accountBtn.dataset.view;
      console.log("📁 Account tab clicked:", view);
      loadView(view);
      window.scrollTo(0, 0);
      return;
    }

    /* ============================
       INBOX → CHAT LIST
    ============================ */
    if (e.target.closest("#auth-messages")) {
      console.log("💬 Inbox clicked → Chat List");

      const chatView = document.getElementById("view-chat-list");
      if (chatView) delete chatView.dataset.loaded;

      loadView("chat-list", { forceInit: true });
      window.scrollTo(0, 0);
      return;
    }

    /* ============================
       VEHICLES SUBCATEGORY LOGIC
    ============================ */
    const isVehicles = e.target.closest("#cat-vehicles");
    const isCategory = e.target.closest(".rctx-tabs");

    const subVehicles = document.getElementById("sub-vehicles");

    if (isVehicles) {
      console.log("🚗 Vehicles tab clicked → show sub-tabs");
      subVehicles?.classList.remove("hidden");
    } else if (isCategory) {
      console.log("📂 Category clicked → hide sub-tabs");
      subVehicles?.classList.add("hidden");
    }

    /* ============================
       POST AD BUTTON
    ============================ */
    if (e.target.closest("#post-ad-btn")) {
      console.log("📢 Post Ad clicked");

      if (!auth.currentUser) {
        console.log("🔐 Not logged in → open login modal");
        openLoginModal();
        return;
      }

      // Close all modals
      document.querySelectorAll(".modal").forEach(m => (m.style.display = "none"));

      // Open post modal
      const postModal = document.getElementById("posts-grid");
      postModal.style.display = "flex";

      // Reset steps + dots
      const steps = document.querySelectorAll("#posts-grid .post-step");
      const dots = document.querySelectorAll("#posts-grid .dot");

      steps.forEach(s => s.classList.remove("active"));
      dots.forEach(d => d.classList.remove("active"));

      steps[0]?.classList.add("active");
      dots[0]?.classList.add("active");

      return;
    }

    /* ============================
       SIDEBAR OPEN/CLOSE
    ============================ */
    if (e.target.closest("[title='Menu']")) {
      console.log("📂 Sidebar opened");
      renderSideMenu();
      document.getElementById("sideMenu")?.classList.remove("hidden");
      return;
    }

    if (e.target.closest(".close-menu")) {
      console.log("📂 Sidebar closed");
      document.getElementById("sideMenu")?.classList.add("hidden");
      return;
    }
  });
};

/* =====================================================
   DOM READY → START APP
===================================================== */
document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", start)
  : start();

/* =====================================================
   POST-GATE (AFTER APP LOADS)
===================================================== */
await import('/index/js/post-gate.js');

// =====================================================
// main.js — SECTION 6
// Firebase Init, Settings Init, App Bootstrap, Post‑Gate
// =====================================================

getFirebase().then(async fb => {
  console.log("🔥 Firebase loaded");

  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  // Expose globally (used by views)
  window.firebaseAuth = auth;
  window.firebaseDb = db;
  window.firebaseStorage = storage;

  /* =====================================================
     LOAD SETTINGS MODULE
  ===================================================== */
  settingsModule = await import("/index/js/firebase/settings.js");
  settingsModule.initFirebase({ auth, db, storage });

  window.currentUser = null;
  window.currentUserData = null;
  window.authReady = false;

  /* =====================================================
     AUTH LISTENER (from Section 4)
  ===================================================== */
  // Already defined above — runs automatically

  /* =====================================================
     START APP (from Section 5)
  ===================================================== */
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start)
    : start();

  /* =====================================================
     POST‑GATE (AFTER APP LOADS)
  ===================================================== */
  try {
    await import('/index/js/post-gate.js');
    console.log("🚪 Post‑gate loaded");
  } catch (err) {
    console.error("❌ Post‑gate failed:", err);
  }
});
