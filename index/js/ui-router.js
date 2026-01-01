// ui-router.js
import { openLoginModal } from "/index/js/auth/loginModal.js";
import { openSignupModal } from "/index/js/auth/signupModal.js";
import { openForgotModal } from "/index/js/auth/forgotModal.js";
import { getFirebase } from "/index/js/firebase/init.js";

let auth, db;

getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
});

export function initUIRouter() {

  const routes = {
    login: document.getElementById('login'),
    signup: document.getElementById('signup'),
    forgot: document.getElementById('forgot'),
    resetConfirm: document.getElementById('resetConfirm'),
    post: document.getElementById('posts-grid')
  };

  /* =====================================================
     OPEN MODAL
  ===================================================== */
  function openScreen(name) {
    closeAll();

    const modal = routes[name];
    if (!modal) {
      console.warn("Modal not found:", name);
      return;
    }

    document.body.classList.add('modal-open');
    modal.style.display = 'flex';

    if (name === "login") openLoginModal(auth, db);
    if (name === "signup") openSignupModal(auth);
    if (name === "forgot") openForgotModal(auth);
  }

  /* =====================================================
     CLOSE ALL MODALS
  ===================================================== */
  function closeAll() {
    document.body.classList.remove('modal-open');
    Object.values(routes).forEach(m => {
      if (m) m.style.display = 'none';
    });
  }

  window.openScreen = openScreen;
  window.closeScreens = closeAll;

  /* =====================================================
     BUTTON HANDLERS
  ===================================================== */

  document.getElementById('openPostModal')?.addEventListener('click', e => {
    e.preventDefault();
    openScreen('post');
  });

  document.getElementById('openLoginModal')?.addEventListener('click', e => {
    e.preventDefault();
    openScreen('login');
  });

  document.getElementById('opensignupModal')?.addEventListener('click', e => {
    e.preventDefault();
    openScreen('signup');
  });

  /* =====================================================
     CLOSE HANDLERS
  ===================================================== */
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', closeAll);
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeAll();
    });
  });

  /* =====================================================
     GENERIC DATA-ACTION HANDLER
  ===================================================== */
  document.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    const value = e.target.dataset.value;

    if (!action) return;

    if (action === "open-screen") openScreen(value);
    if (action === "close-screens") closeAll();
  });

  /* =====================================================
     ⭐ ADMIN BUTTON HANDLER
  ===================================================== */
  document.getElementById("openAdminDashboard")?.addEventListener("click", () => {
    if (!window.currentUserData?.isAdmin) {
      alert("Admin access only");
      return;
    }
    loadView("admin-dashboard");
  });
}
