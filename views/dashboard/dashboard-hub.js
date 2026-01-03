// dashboard-hub.js — Main orchestrator
import { initBadges, updateTrialBadges } from "./badges.js";
import { updateSidebar } from "./sidebar.js";
import { renderWidgets } from "./widgets.js";
import { loadCounts } from "./counts.js";
import { loadRecentAds } from "./recent-ads.js";
import { initModals, showUpgradeModal, hideUpgradeModal } from "./modals.js";
import { handleSubscription } from "./subscription.js";
import { switchTab as switchTabLogic } from "./tabs.js";

import { AI } from "/index/js/ai/assistant.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db;
let userData;

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return;

  userData = snap.data();
  normalizePlan();
  handleBusinessTrialState();
  await renderDashboard();
  initModals(); // wire modal listeners
  wireButtons();    // wire all buttons

  // AI trigger for first login / dashboard open
  AI.speak("DASHBOARD_OPENED", { name: userData.name });
}

function normalizePlan() {
  if (!userData.plan) userData.plan = "free";
}

function handleBusinessTrialState() {
  const trial = userData.businessTrial;
  if (!trial) return;

  const now = Date.now();
  if (trial.expiresAt && now > trial.expiresAt) {
    userData.businessTrial.active = false;
    if (userData.plan === "business") userData.plan = "free";
  }
}

export async function renderDashboard() {
  const plan = userData.plan;
  initBadges(userData);
  updateSidebar(userData);
  updateTrialBadges(userData);
  renderWidgets(plan);
  await loadCounts(auth, db);
  await loadRecentAds(auth, db);
}

function wireButtons() {
  // Sidebar nav
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Upgrade sidebar
  document.getElementById("upgradeSidebarBtn")?.addEventListener("click", showUpgradeModal);

  // Upgrade modal close
  document.getElementById("closeUpgradeModalBtn")?.addEventListener("click", hideUpgradeModal);

  // Tier action buttons
  document.querySelectorAll(".tier-action-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const plan = btn.dataset.plan;
      handleSubscription(plan);
    });
  });

  // "See all" ads
  document.getElementById("seeAllAdsBtn")?.addEventListener("click", () => {
    switchTab("my-ads");
  });
}

// SPA tab switch (wrap imported logic)
function switchTab(tab) {
  switchTabLogic(tab); // keep modular
  const titleMap = {
    "overview": "Overview",
    "my-ads": "My Ads",
    "messages": "Messages",
    "payments": "Payments",
    "settings": "Settings"
  };
  const title = document.getElementById("viewTitle");
  if (title) title.textContent = titleMap[tab] || "Overview";

  // active button UI
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
}

// Export for testing if needed
export { userData, auth, db, showUpgradeModal, hideUpgradeModal, handleSubscription, switchTab };
