// sidebar.js
export function updateSidebar(userData) {
  const plan = userData.plan;
  const box = document.getElementById("sidebarUpgradeBox");
  const label = document.getElementById("sidebarPlanLabel");

  label.textContent =
    plan === "sellerplus" ? "Seller+ Account" :
    plan === "business" ? "Business Account" :
    "Free Account";

  box.style.display = "block"; // always visible
}
