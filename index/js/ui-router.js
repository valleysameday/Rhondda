import { openLoginModal } from "/index/js/auth/loginModal.js";
import { openSignupModal } from "/index/js/auth/signupModal.js";
import { openForgotModal } from "/index/js/auth/forgotModal.js";
import { loadView } from "/index/js/main.js";

let uiRouterInitialized = false;

export function initUIRouter() {

  if (uiRouterInitialized) return;
  uiRouterInitialized = true;

  const routes = {
    login: document.getElementById("login"),
    signup: document.getElementById("signup"),
    forgot: document.getElementById("forgot"),
    post: document.getElementById("posts-grid")
  };

  function closeAll() {
    document.body.classList.remove("modal-open");
    Object.values(routes).forEach(m => m && (m.style.display = "none"));
  }

  function openScreen(name) {
    closeAll();

    const modal = routes[name];
    if (!modal) return;

    document.body.classList.add("modal-open");
    modal.style.display = "flex";

    if (name === "login") openLoginModal();
    if (name === "signup") openSignupModal();
    if (name === "forgot") openForgotModal();
  }

  window.openScreen = openScreen;
  window.closeScreens = closeAll;

  document.getElementById("openLoginModal")?.addEventListener("click", e => {
    e.preventDefault();
    openScreen("login");
  });

  document.getElementById("opensignupModal")?.addEventListener("click", e => {
    e.preventDefault();
    openScreen("signup");
  });

  document.querySelectorAll(".close").forEach(btn =>
    btn.addEventListener("click", closeAll)
  );

  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeAll();
    });
  });

  document.addEventListener("click", e => {
    const action = e.target.dataset.action;
    const value = e.target.dataset.value;
    if (action === "open-screen") openScreen(value);
    if (action === "close-screens") closeAll();
  });

  document.getElementById("openAdminDashboard")?.addEventListener("click", () => {
    if (!window.currentUserData?.isAdmin) {
      alert("Admin access only");
      return;
    }
    loadView("admin-dashboard");
  });

  document.getElementById("openChatList")?.addEventListener("click", e => {
    e.preventDefault();
    loadView("chat-list", { forceInit: true });
  });

  document.getElementById("openAccountModal")?.addEventListener("click", e => {
    e.preventDefault();
    loadView("dashboard-hub", { forceInit: true });
  });
}
