import { initBadges, updateTrialBadges } from "./dashboard/badges.js";
import { renderWidgets } from "./dashboard/widgets.js";
import { loadCounts } from "./dashboard/counts.js";
import { loadRecentAds } from "./dashboard/recent-ads.js";
import { initModals, showUpgradeModal, hideUpgradeModal } from "./dashboard/modals.js";
import { handleSubscription } from "./dashboard/subscription.js";
import { switchTab as switchTabLogic } from "./dashboard/tabs.js";
import { initSettingsModule, renderSettingsTab } from "./dashboard/settings.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db;
let userData;

/* INIT */
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
  initModals();
  wireButtons();

  initSettingsModule(auth, db);
}

/* PLAN NORMALISATION */
function normalizePlan() {
  if (!userData.plan) userData.plan = "free";
}

/* TRIAL HANDLING */
function handleBusinessTrialState() {
  const trial = userData.businessTrial;
  if (!trial) return;

  const now = Date.now();
  if (trial.expiresAt && now > trial.expiresAt) {
    userData.businessTrial.active = false;
    if (userData.plan === "business") userData.plan = "free";
  }
}

/* MAIN RENDER */
export async function renderDashboard() {
  const plan = userData.plan;

  initBadges(userData);
  updateTrialBadges(userData);

  requestAnimationFrame(() => {
    renderWidgets(plan, auth, db);
  });

  await loadCounts(auth, db);
  await loadRecentAds(auth, db);
}

/* BUTTON WIRING */
function wireButtons() {
  document.querySelectorAll(".top-nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
    });
  });

  document.getElementById("seeAllAdsBtn")?.addEventListener("click", () => {
    switchTab("my-ads");
  });

  document.getElementById("closeUpgradeModalBtn")?.addEventListener("click", hideUpgradeModal);

  document.querySelectorAll(".tier-action-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      handleSubscription(btn.dataset.plan);
    });
  });
}

/* TAB SWITCH */
function switchTab(tab) {
  switchTabLogic(tab);

  document.querySelectorAll(".tab-content").forEach(sec => {
    sec.classList.remove("active");
  });

  const target = document.querySelector(`.tab-content[data-tab="${tab}"]`);
  if (target) target.classList.add("active");

  if (tab === "settings") renderSettingsTab();

  const titleMap = {
    "overview": "Overview",
    "my-ads": "My Ads",
    "settings": "Settings"
  };

  const title = document.getElementById("viewTitle");
  if (title) title.textContent = titleMap[tab] || "Overview";

  document.querySelectorAll(".top-nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
}

/* EXPORTS */
export {
  userData,
  auth,
  db,
  showUpgradeModal,
  hideUpgradeModal,
  handleSubscription,
  switchTab
};
