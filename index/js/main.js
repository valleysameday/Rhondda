import { getFirebase } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import '/index/js/post-gate.js';

import { openLoginModal } from '/index/js/auth/loginModal.js';
import { openSignupModal } from '/index/js/auth/signupModal.js';
import { openForgotModal } from '/index/js/auth/forgotModal.js';

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

  // Always reload HTML if forceReload is true
  const shouldReload = options.forceInit || !target.dataset.loaded;

  if (shouldReload) {
    console.log("🟡 Loading HTML for:", view);
    const html = await fetch(`/views/${view}.html`).then(r => r.text());
    target.innerHTML = html;
    target.dataset.loaded = "true";

    try {
      console.log("🟡 Importing JS for:", view);
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
  window.isBusinessUser = false;
  window.authReady = false;

  /* =====================================================
     AUTH STATE LISTENER
  ===================================================== */
  auth.onAuthStateChanged(async user => {
    console.log("🔵 AUTH STATE CHANGED:", user ? user.uid : "no user");

    window.currentUser = user || null;
    window.isBusinessUser = false;
    window.authReady = false;

    // ⭐ Account Status Dot
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
      console.log("🟡 No user logged in");
      window.authReady = true;
      return;
    }

    try {
      console.log("🟡 Checking business status for:", user.uid);
      const snap = await getDoc(doc(db, "users", user.uid));
      window.isBusinessUser = snap.exists() && snap.data().isBusiness === true;
      console.log("🟢 Business status:", window.isBusinessUser);
    } catch (e) {
      console.warn("❌ Business lookup failed:", e);
    }

    window.authReady = true;
    console.log("🟢 authReady = true");
  });

  /* =====================================================
     START APP
  ===================================================== */
  const start = () => {
    console.log("🟢 App start()");
    initUIRouter();

    /* LOGIN BUTTONS */
    document.querySelectorAll('[data-value="login"]').forEach(btn =>
      btn.onclick = e => {
        e.preventDefault();
        console.log("🔵 Login button clicked (main.js)");
        openLoginModal(auth, db);
      }
    );

    /* MESSAGES BUTTON */
    document.getElementById("openChatList")?.addEventListener("click", e => {
      e.preventDefault();

      if (!auth.currentUser) {
        sessionStorage.setItem("redirectAfterLogin", "chat-list");
        openScreen("login");
        return;
      }

      loadView("chat-list");
    });

    /* SIGNUP BUTTONS */
    document.querySelectorAll('[data-value="signup"]').forEach(btn =>
      btn.onclick = e => {
        e.preventDefault();
        console.log("🔵 Signup button clicked");
        openSignupModal(auth);
      }
    );

    /* FORGOT PASSWORD BUTTONS */
    document.querySelectorAll('[data-value="forgot"]').forEach(btn =>
      btn.onclick = e => {
        e.preventDefault();
        console.log("🔵 Forgot password clicked");
        openForgotModal(auth);
      }
    );

    /* ACCOUNT BUTTON */
    document.getElementById("openAccountModal")?.addEventListener("click", e => {
      e.preventDefault();
      console.log("🔵 Account button clicked");

      if (!window.currentUser) {
        console.log("🟡 No user → opening login modal");
        openLoginModal(auth, db);
        return;
      }

      console.log("🟡 User logged in, waiting for role…");

      const waitForRole = () => {
        if (!window.authReady) {
          requestAnimationFrame(waitForRole);
          return;
        }

        console.log("🟢 Role ready. isBusinessUser =", window.isBusinessUser);

        loadView(
          window.isBusinessUser
            ? "business-dashboard"
            : "general-dashboard"
        );
      };

      waitForRole();
    });

    console.log("🔵 Loading home view");
    loadView("home");
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start)
    : start();
});
