import { getCurrentUser } from "/index/js/auth/state.js";
import { openLoginModal } from "/index/js/auth/loginModal.js";
import { loadView } from "/index/js/router.js";

export function initAccountButton() {
  const accountBtn = document.getElementById("openAccountModal");
  if (!accountBtn) return;

  accountBtn.addEventListener("click", e => {
    e.preventDefault(); // 🚫 stop normal navigation

    const user = getCurrentUser();

    if (!user) {
      openLoginModal();       // 🔐 NOT logged in
    } else {
      loadView("/account");  // 👤 Logged in
    }
  });
}
