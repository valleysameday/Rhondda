// modals.js
export function initModals() {
  document.querySelectorAll(".modal .close").forEach(btn=>{
    btn.addEventListener("click", hideUpgradeModal);
  });
}

export function showUpgradeModal() {
  document.getElementById("upgradeModal").style.display="flex";
}
export function hideUpgradeModal() {
  document.getElementById("upgradeModal").style.display="none";
}
