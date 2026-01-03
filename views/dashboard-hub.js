import { initBadges, updateTrialBadges } from "./dashboard/badges.js";
import { updateSidebar } from "./dashboard/sidebar.js";
import { loadCounts } from "./dashboard/counts.js";
import { loadRecentAds } from "./dashboard/recent-ads.js";
import { initModals, showUpgradeModal, hideUpgradeModal } from "./dashboard/modals.js";
import { handleSubscription } from "./dashboard/subscription.js";
import { switchTab as switchTabLogic } from "./dashboard/tabs.js";

import { renderWidgets, updateWidgetCounts } from "./dashboard/widgets.js";
import { AI } from "/index/js/ai/assistant.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db;
let userData;

/* =====================================================
   INIT
===================================================== */
export async function init({ auth: a, db: d }) {
  console.log("🚀 dashboard-hub.js init() START");

  auth = a;
  db = d;

  const user = auth.currentUser;
  console.log("👤 Current user:", user);

  if (!user) {
    console.warn("❌ No user logged in — dashboard aborted");
    return;
  }

  console.log("📄 Fetching Firestore user doc:", user.uid);
  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    console.warn("❌ Firestore user doc does NOT exist");
    return;
  }

  userData = snap.data();
  console.log("📦 Loaded userData:", userData);

  normalizePlan();
  handleBusinessTrialState();

  await renderDashboard();

  initModals();
  wireButtons();

  AI.speak("DASHBOARD_OPENED", { name: userData.name });

  console.log("🚀 dashboard-hub.js init() END");
}

/* =====================================================
   PLAN NORMALISATION
===================================================== */
function normalizePlan() {
  if (!userData.plan) userData.plan = "free";
}

/* =====================================================
   TRIAL HANDLING
===================================================== */
function handleBusinessTrialState() {
  const trial = userData.businessTrial;
  if (!trial) return;

  const now = Date.now();
  if (trial.expiresAt && now > trial.expiresAt) {
    userData.businessTrial.active = false;

    if (userData.plan === "business") {
      userData.plan = "free";
    }
  }
}

/* =====================================================
   MAIN DASHBOARD RENDER
===================================================== */
export async function renderDashboard() {
  console.log("🔥 renderDashboard() START");

  const plan = userData.plan;

  try { initBadges(userData); } catch (e) { console.error(e); }
  try { updateSidebar(userData); } catch (e) { console.error(e); }
  try { updateTrialBadges(userData); } catch (e) { console.error(e); }

  /* =====================================================
     STATIC WIDGETS (NO MORE DYNAMIC IMPORT)
  ====================================================== */
  try {
    console.log("➡ renderWidgets()");
    renderWidgets(plan);
    updateWidgetCounts(auth, db);
  } catch (e) {
    console.error("❌ renderWidgets() FAILED:", e);
  }

  try { await loadCounts(auth, db); } catch (e) { console.error(e); }
  try { await loadRecentAds(auth, db); } catch (e) { console.error(e); }

  console.log("🔥 renderDashboard() END");
}

/* =====================================================
   BUTTON WIRING
===================================================== */
function wireButtons() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  document.getElementById("upgradeSidebarBtn")?.addEventListener("click", showUpgradeModal);
  document.getElementById("closeUpgradeModalBtn")?.addEventListener("click", hideUpgradeModal);

  document.querySelectorAll(".tier-action-btn").forEach(btn => {
    btn.addEventListener("click", () => handleSubscription(btn.dataset.plan));
  });

  document.getElementById("seeAllAdsBtn")?.addEventListener("click", () => switchTab("my-ads"));
}

/* =====================================================
   TAB SWITCH WRAPPER
===================================================== */
function switchTab(tab) {
  try { switchTabLogic(tab); } catch (e) { console.error(e); }

  const titleMap = {
    overview: "Overview",
    "my-ads": "My Ads",
    messages: "Messages",
    payments: "Payments",
    settings: "Settings"
  };

  const title = document.getElementById("viewTitle");
  if (title) title.textContent = titleMap[tab] || "Overview";

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
}

/* =====================================================
   EXPORTS
===================================================== */
export { userData, auth, db, showUpgradeModal, hideUpgradeModal, handleSubscription, switchTab };
