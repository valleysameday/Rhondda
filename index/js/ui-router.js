ttt/// /index/js/ui-router.js
// Central UI + SPA action router
// This file MUST export initUIRouter

export function initUIRouter() {
  console.log("🧭 UI Router initialised");

  /* ---------------------------------
     GLOBAL CLICK HANDLER
     (event delegation – very important)
  ---------------------------------- */
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const value = btn.dataset.value;
    const id = btn.dataset.id;  // for posts

    switch (action) {
      case "navigate":
        if (value) window.loadView?.(value);
        break;

      case "open-screen":
        if (value) window.openScreen?.(value);
        break;

      case "close-screens":
        window.closeScreens?.();
        break;

      case "logout":
        window.logoutUser?.();
        break;

      // NEW: Feed post actions
      case "edit":
        if (id) window.editAd?.(id);
        break;

      case "repost":
        if (id) window.repostAd?.(id);
        break;

      case "share":
        if (id) window.shareAd?.(id);
        break;

      default:
        console.warn("Unknown UI action:", action);
    }
  });

  /* ---------------------------------
     ESC KEY — CLOSE MODALS
  ---------------------------------- */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      window.closeScreens?.();
    }
  });
}

/* ---------------------------------
   OPTIONAL HELPERS (GLOBAL)
---------------------------------- */

/**
 * Opens a modal/screen by id
 * <div class="modal" id="login">
 */
window.openScreen = function (id) {
  document.querySelectorAll(".modal.active")
    .forEach(m => m.classList.remove("active"));

  const el = document.getElementById(id);
  if (!el) return;

  el.classList.add("active");
  document.body.classList.add("modal-open");
};

/**
 * Closes all modals/screens
 */
window.closeScreens = function () {
  document.querySelectorAll(".modal.active")
    .forEach(m => m.classList.remove("active"));

  document.body.classList.remove("modal-open");
};
