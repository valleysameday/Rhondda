// ========================== main.js ==========================

import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import { openLoginModal } from '/index/js/auth/loginModal.js';
import { openSignupModal } from '/index/js/auth/signupModal.js';
import { openForgotModal } from '/index/js/auth/forgotModal.js';

import { initViewServices } from "/views/view-services.js";
import { initViewService } from "/views/view-service.js";

const viewRegistry = {
  "view-services": initViewServices,
  "view-service": initViewService,
  // …existing views
};

window.openManageMyBusinessPopup = function(services) {
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
// Expose modals globally
window.openLoginModal = openLoginModal;
window.openSignupModal = openSignupModal;
window.openForgotModal = openForgotModal;

let auth, db, storage;
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
   DAYS SINCE (for expiry logic)
===================================================== */
window.daysSince = function (timestamp) {
  if (!timestamp) return 999; // treat missing timestamps as expired

  const diff = Date.now() - timestamp;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/* =====================================================
   SPA VIEW LOADER
===================================================== */
export async function loadView(view, options = {}) {
  window.currentViewOptions = options;
  if (view === "home") options.forceInit = true;
  if (window.currentView === view && !options.forceInit) return;

  window.currentView = view;

  const app = document.getElementById("app");
  if (!app) return;

  // Hide all views
  app.querySelectorAll(".view").forEach(v => (v.hidden = true));

  let target = document.getElementById(`view-${view}`);
  if (!target) {
    target = document.createElement("div");
    target.id = `view-${view}`;
    target.className = "view view-" + view;
    target.hidden = true;
    app.appendChild(target);
  }

  if (options.forceInit) delete target.dataset.loaded;

  if (!target.dataset.loaded) {
    target.innerHTML = await fetch(`/views/${view}.html`).then(r => r.text());
    target.dataset.loaded = "true";

    try {
      const mod = await import(`/views/${view}.js`);
      mod.init?.({ auth, db, storage });

      // 🔥 IMPORTANT: Home feed must be manually initialised
      if (view === "home") {
        const { initFeed } = await import("/index/js/feed.js");
        initFeed({ db });
      }
    } catch (err) {
      console.error("❌ View JS error:", err);
    }
  }

  target.hidden = false;
document.querySelectorAll(".sub-tabs").forEach(el =>
  el.classList.add("hidden")
);
  /* ===============================
     ACCOUNT HEADER VISIBILITY LOGIC
  =============================== */
  const accountHeader = document.getElementById("accountHeader");
  const categoryBars = document.querySelectorAll(".main-tabs, .rctx-search");

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

  // Highlight active account tab
  document.querySelectorAll(".account-tabs button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
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
  const user = auth.currentUser;

  if (!user) {
    openLoginModal();
    return;
  }

  const services = await settingsModule.fsGetUserServices(user.uid);

  if (!services.length) {
    loadView("business-onboarding", { forceInit: true });
  } else {
    openManageMyBusinessPopup(services);
  }
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
// ACCOUNT TABS → LOAD VIEW
document.addEventListener("click", e => {
  const btn = e.target.closest(".account-tabs button");
  if (!btn) return;

  const view = btn.dataset.view;
  loadView(view);
  window.scrollTo(0, 0);
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


const postGate = await import('/index/js/post-gate.js');
postGate.initPostGate();
  
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start)
    : start();

  await import('/index/js/post-gate.js');
});
