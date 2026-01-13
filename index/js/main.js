// ========================== main.js (SPA) ==========================

import { getFirebase } from "/index/js/firebase/init.js";
import { openLoginModal } from "/index/js/auth/loginModal.js";
import { openSignupModal } from "/index/js/auth/signupModal.js";
import { openForgotModal } from "/index/js/auth/forgotModal.js";

/* =====================================================
   VIEW REGISTRY
===================================================== */
const viewRegistry = {
  "view-services": "/views/view-services.js",
  "view-service": "/views/view-service.js",
  "home": "/views/home.js",
  "view-post": "/views/view-post.js"
};

/* =====================================================
   GLOBAL MODALS
===================================================== */
window.openLoginModal = () => {
  history.pushState({ type: "modal", modal: "login" }, "", "/login");
  openLoginModal();
};

window.openSignupModal = () => {
  history.pushState({ type: "modal", modal: "signup" }, "", "/signup");
  openSignupModal();
};

window.openForgotModal = () => {
  history.pushState({ type: "modal", modal: "forgot" }, "", "/forgot");
  openForgotModal();
};

function closeAllModals() {
  document.body.classList.remove("modal-open");
  document.querySelectorAll(".modal").forEach(m => {
    m.style.display = "none";
    m.classList.remove("active");
  });
}

/* =====================================================
   FIREBASE
===================================================== */
let auth, db, storage;
let settingsModule = null;

/* =====================================================
   SPA VIEW LOADER
===================================================== */
export async function loadView(view, options = {}) {
  if (window.currentView === view && !options.forceInit) return;
  window.currentView = view;

  if (!options.skipHistory) {
    history.pushState({ type: "view", view }, "", "/" + view);
  }

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
      const mod = await import(`/views/${view}.js`);
      mod.init?.({ auth, db, storage });
    } catch (err) {
      console.error("❌ View JS error:", err);
    }
  }

  target.hidden = false;
  window.scrollTo(0, 0);
}

/* =====================================================
   BACK BUTTON HANDLER
===================================================== */
window.addEventListener("popstate", (event) => {
  const state = event.state;
  closeAllModals();

  if (!state) {
    loadView("home", { forceInit: true, skipHistory: true });
    return;
  }

  if (state.type === "view") {
    loadView(state.view, { forceInit: true, skipHistory: true });
  }
});

/* =====================================================
   SIDEBAR MENU
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
        { label: "Stats", action: () => loadView("stats") },
        { label: "Help & Contact", action: () => loadView("help") },
        { label: "Logout", action: () => auth.signOut() }
      ]
    : [
        { label: "Home", action: () => loadView("home") },
        { label: "Login", action: () => openLoginModal() },
        { label: "Help & Contact", action: () => loadView("help") }
      ];

  options.forEach(opt => {
    const item = document.createElement("div");
    item.className = "menu-item";
    item.textContent = opt.label;
    item.onclick = () => {
      document.getElementById("sideMenu")?.classList.add("hidden");
      opt.action();
    };
    menu.appendChild(item);
  });
}

/* =====================================================
   GLOBAL CATEGORY HANDLING
===================================================== */
function initGlobalCategories() {
  const mainCategoryBtns = document.querySelectorAll(".main-tabs .category-btn");
  const subVehicleBtns   = document.querySelectorAll("#sub-vehicles .category-btn");
  const subPropertyBtns  = document.querySelectorAll("#sub-property .category-btn");

  mainCategoryBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.category;
      if (!cat) return;

      sessionStorage.setItem("feedCategory", cat);
      sessionStorage.setItem("feedSubCategory", "");

      if (cat === "services") {
        loadView("view-services", { forceInit: true });
        return;
      }

      loadView("home", { forceInit: true });
    });
  });

  subVehicleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const sub = btn.dataset.category;
      sessionStorage.setItem("feedCategory", "vehicles");
      sessionStorage.setItem("feedSubCategory", sub);
      loadView("home", { forceInit: true });
    });
  });

  subPropertyBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const sub = btn.dataset.category;
      sessionStorage.setItem("feedCategory", "property");
      sessionStorage.setItem("feedSubCategory", sub);
      loadView("home", { forceInit: true });
    });
  });
}

/* =====================================================
   APP INITIALISATION
===================================================== */
getFirebase().then(async fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  settingsModule = await import("/index/js/firebase/settings.js");
  settingsModule.initFirebase({ auth, db, storage });

  auth.onAuthStateChanged(() => renderSideMenu());

  const start = () => {
    initGlobalCategories();

    loadView("home", { skipHistory: true });

    /* ----------------------------------------------
       DIRECT, SAFE EVENT LISTENERS (NO GLOBAL CATCH)
    ---------------------------------------------- */

    // Logo → Home
    document.querySelector(".rctx-logo")?.addEventListener("click", () => {
      loadView("home");
    });

    // Login button
    document.getElementById("auth-logged-out")?.addEventListener("click", () => {
      openLoginModal();
    });

    // Post Ad button
    document.getElementById("post-ad-btn")?.addEventListener("click", () => {
      if (!auth.currentUser) {
        openLoginModal();
        return;
      }

      history.pushState({ type: "modal", modal: "post" }, "", "/post");
      const postModal = document.getElementById("posts-grid");
      postModal.style.display = "flex";
      document.body.classList.add("modal-open");
    });

    // Menu open
    document.querySelector("[title='Menu']")?.addEventListener("click", () => {
      renderSideMenu();
      document.getElementById("sideMenu")?.classList.remove("hidden");
    });

    // Menu close
    document.querySelector(".close-menu")?.addEventListener("click", () => {
      document.getElementById("sideMenu")?.classList.add("hidden");
    });
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start)
    : start();
});
