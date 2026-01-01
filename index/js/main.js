import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import '/index/js/post-gate.js';

import { openLoginModal } from '/index/js/auth/loginModal.js';
import { openSignupModal } from '/index/js/auth/signupModal.js';
import { openForgotModal } from '/index/js/auth/forgotModal.js';

window.openLoginModal = openLoginModal;
window.openSignupModal = openSignupModal;
window.openForgotModal = openForgotModal;

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db, storage;

/* =====================================================
   SPA VIEW LOADER
===================================================== */
export async function loadView(view, options = {}) {
  console.log("🔵 loadView() →", view);

  const app = document.getElementById("app");
  if (!app) return console.log("❌ #app container missing");

  app.querySelectorAll(".view").forEach(v => v.hidden = true);

  let target = document.getElementById(`view-${view}`);
  if (!target) {
    console.log("🟡 Creating new view container:", view);
    target = document.createElement("div");
    target.id = `view-${view}`;
    target.className = "view";
    target.hidden = true;
    app.appendChild(target);
  }

  const shouldReload = options.forceInit || !target.dataset.loaded;

  if (shouldReload) {
    console.log("🟡 Loading HTML for:", view);
    const html = await fetch(`/views/${view}.html`).then(r => r.text());
    target.innerHTML = html;
    target.dataset.loaded = "true";

    try {
      console.log("🟡 Importing JS for:", view);

      // ⭐ ADMIN ROUTE PROTECTION
      if (view === "admin-dashboard") {
        if (!window.currentUserData?.isAdmin) {
          console.warn("❌ Not an admin, redirecting");
          return loadView("home");
        }
      }

      const mod = await import(`/views/${view}.js?cache=${Date.now()}`);
      mod.init?.({ auth, db, storage });
      console.log("🟢 View JS init complete:", view);
    } catch (err) {
      console.error("❌ View JS error:", err);
    }
  }

  console.log("🟢 Showing view:", view);
  target.hidden = false;
}

/* =====================================================
   APP INIT
===================================================== */
getFirebase().then(async fb => {
  console.log("🟢 Firebase ready");

  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  window.currentUser = null;
  window.currentUserData = null;
  window.isBusinessUser = false;
  window.authReady = false;

  /* =====================================================
     AUTH STATE LISTENER
  ===================================================== */
  auth.onAuthStateChanged(async user => {
    console.log("🔵 AUTH STATE CHANGED:", user ? user.uid : "no user");

    window.currentUser = user || null;
    window.currentUserData = null;
    window.isBusinessUser = false;
    window.authReady = false;

    const statusDot = document.getElementById("accountStatusDot");
    if (statusDot) {
      if (!user) {
        statusDot.style.background = "red";
        statusDot.classList.add("logged-out");
      } else {
        statusDot.style.background = "green";
        statusDot.classList.remove("logged-out");
      }
    }

    if (!user) {
      window.authReady = true;
      return;
    }

    try {
      const snap = await getDoc(doc(db, "users", user.uid));

      window.currentUserData = snap.exists() ? snap.data() : null;
      window.isBusinessUser = snap.exists() && snap.data().isBusiness === true;

      console.log("🟢 Business status:", window.isBusinessUser);
      console.log("🟢 Admin status:", window.currentUserData?.isAdmin);

      // ⭐ SHOW ADMIN BUTTON IF ADMIN
      const adminBtn = document.getElementById("openAdminDashboard");
      if (adminBtn) {
        adminBtn.style.display = window.currentUserData?.isAdmin ? "inline-block" : "none";
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
    console.log("🟢 App start()");
    initUIRouter();

    document.querySelectorAll('[data-value="login"]').forEach(btn =>
      btn.onclick = e => {
        e.preventDefault();
        openLoginModal(auth, db);
      }
    );

    document.getElementById("openChatList")?.addEventListener("click", e => {
      e.preventDefault();

      if (!auth.currentUser) {
        sessionStorage.setItem("redirectAfterLogin", "chat-list");
        openScreen("login");
        return;
      }

      loadView("chat-list");
    });

    document.querySelectorAll('[data-value="signup"]').forEach(btn =>
      btn.onclick = e => {
        e.preventDefault();
        openSignupModal(auth);
      }
    );

    document.querySelectorAll('[data-value="forgot"]').forEach(btn =>
      btn.onclick = e => {
        e.preventDefault();
        openForgotModal(auth);
      }
    );

    document.getElementById("openAccountModal")?.addEventListener("click", e => {
      e.preventDefault();

      if (!window.currentUser) {
        openLoginModal(auth, db);
        return;
      }

      const waitForRole = () => {
        if (!window.authReady) {
          requestAnimationFrame(waitForRole);
          return;
        }

        // ⭐ If admin → go straight to admin dashboard
        if (window.currentUserData?.isAdmin) {
          return loadView("admin-dashboard");
        }

        loadView(
          window.isBusinessUser
            ? "business-dashboard"
            : "general-dashboard"
        );
      };

      waitForRole();
    });

    // ⭐ ADMIN BUTTON CLICK HANDLER
    document.getElementById("openAdminDashboard")?.addEventListener("click", () => {
      if (!window.currentUserData?.isAdmin) {
        alert("Admin access only");
        return;
      }
      loadView("admin-dashboard");
    });

    console.log("🔵 Loading home view");
    loadView("home");
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start)
    : start();
});
