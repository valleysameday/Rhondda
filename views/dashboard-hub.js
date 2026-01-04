import { initBadges, updateTrialBadges } from "./dashboard/badges.js";
import { updateSidebar } from "./dashboard/sidebar.js";
import { renderWidgets } from "./dashboard/widgets.js";
import { loadCounts } from "./dashboard/counts.js";
import { loadRecentAds } from "./dashboard/recent-ads.js";
import { initModals, showUpgradeModal, hideUpgradeModal } from "./dashboard/modals.js";
import { handleSubscription } from "./dashboard/subscription.js";
import { switchTab as switchTabLogic } from "./dashboard/tabs.js";
import { renderMessages } from "./messages/renderMessages.js";
import { AI } from "/index/js/ai/assistant.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db;
let userData;

/* =====================================================
   INIT
===================================================== */
export async function init({ auth: a, db: d }) {
  console.log("🚀 dashboard-hub.js init() START");
  console.log("➡ auth passed in:", a);
  console.log("➡ db passed in:", d);

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

  console.log("🔥 Calling renderDashboard()");
  await renderDashboard();

  console.log("🛠 Calling initModals()");
  initModals();

  console.log("🛠 Calling wireButtons()");
  wireButtons();

  console.log("🤖 AI.speak → DASHBOARD_OPENED");
  AI.speak("DASHBOARD_OPENED", { name: userData.name });

  console.log("🚀 dashboard-hub.js init() END");
}

/* =====================================================
   PLAN NORMALISATION
===================================================== */
function normalizePlan() {
  console.log("🔧 normalizePlan() — before:", userData.plan);
  if (!userData.plan) userData.plan = "free";
  console.log("🔧 normalizePlan() — after:", userData.plan);
}

/* =====================================================
   TRIAL HANDLING
===================================================== */
function handleBusinessTrialState() {
  console.log("🔧 handleBusinessTrialState()");

  const trial = userData.businessTrial;
  console.log("➡ trial object:", trial);

  if (!trial) return;

  const now = Date.now();
  if (trial.expiresAt && now > trial.expiresAt) {
    console.warn("⚠ Business trial EXPIRED");
    userData.businessTrial.active = false;

    if (userData.plan === "business") {
      console.warn("⚠ Downgrading expired business trial → free");
      userData.plan = "free";
    }
  }
}

/* =====================================================
   MAIN DASHBOARD RENDER
===================================================== */
export async function renderDashboard() {
  console.log("🔥 renderDashboard() START");
  console.log("➡ userData:", userData);

  const plan = userData.plan;
  console.log("➡ Detected plan:", plan);

  try {
    console.log("➡ initBadges()");
    initBadges(userData);
  } catch (e) {
    console.error("❌ initBadges() FAILED:", e);
  }

  try {
    console.log("➡ updateSidebar()");
    updateSidebar(userData);
  } catch (e) {
    console.error("❌ updateSidebar() FAILED:", e);
  }

  try {
    console.log("➡ updateTrialBadges()");
    updateTrialBadges(userData);
  } catch (e) {
    console.error("❌ updateTrialBadges() FAILED:", e);
  }

  try {
    console.log("➡ renderWidgets(plan, auth, db)");
    requestAnimationFrame(() => {
      renderWidgets(plan, auth, db);
    });
  } catch (e) {
    console.error("❌ renderWidgets() FAILED:", e);
  }

  try {
    console.log("➡ loadCounts()");
    await loadCounts(auth, db);
  } catch (e) {
    console.error("❌ loadCounts() FAILED:", e);
  }

  try {
    console.log("➡ loadRecentAds()");
    await loadRecentAds(auth, db);
  } catch (e) {
    console.error("❌ loadRecentAds() FAILED:", e);
  }


   
 try {
  console.log("➡ renderMessages()");
  await renderMessages(auth, db);
} catch (e) {
  console.error("❌ renderMessages FAILED:", e);
 }  
   
   console.log("🔥 renderDashboard() END");
}

/* =====================================================
   BUTTON WIRING
===================================================== */
function wireButtons() {
  console.log("🟦 wireButtons() START");

  // Sidebar nav
  document.querySelectorAll(".nav-item").forEach(btn => {
    console.log("🟦 Wiring nav-item:", btn.dataset.tab);
    btn.addEventListener("click", () => {
      console.log("🟦 Nav clicked:", btn.dataset.tab);
      switchTab(btn.dataset.tab);
    });
  });

  // Upgrade sidebar
  document.getElementById("upgradeSidebarBtn")?.addEventListener("click", () => {
    console.log("🟦 upgradeSidebarBtn clicked");
    showUpgradeModal();
  });

  // Upgrade modal close
  document.getElementById("closeUpgradeModalBtn")?.addEventListener("click", () => {
    console.log("🟦 closeUpgradeModalBtn clicked");
    hideUpgradeModal();
  });

  // Tier action buttons
  document.querySelectorAll(".tier-action-btn").forEach(btn => {
    console.log("🟦 Found tier button:", btn.dataset.plan);
    btn.addEventListener("click", () => {
      console.log("🟦 Tier clicked:", btn.dataset.plan);
      handleSubscription(btn.dataset.plan);
    });
  });

  // "See all" ads
  document.getElementById("seeAllAdsBtn")?.addEventListener("click", () => {
    console.log("🟦 seeAllAdsBtn clicked");
    switchTab("my-ads");
  });

  console.log("🟦 wireButtons() END");
}

/* =====================================================
   TAB SWITCH WRAPPER — FIXED
===================================================== */
function switchTab(tab) {
  console.log("🔵 switchTab() called:", tab);

  // Run your internal tab logic
  try {
    switchTabLogic(tab);
  } catch (e) {
    console.error("❌ switchTabLogic FAILED:", e);
  }

  // Hide all tab-content sections
  document.querySelectorAll(".tab-content").forEach(sec => {
    sec.style.display = "none";
  });

  // Show the selected tab-content
  const target = document.querySelector(`.tab-content[data-tab="${tab}"]`);
  if (target) {
    target.style.display = "block";
  }

  // Update title
  const titleMap = {
    "overview": "Overview",
    "my-ads": "My Ads",
    "messages": "Messages",
    "payments": "Payments",
    "settings": "Settings"
  };

  const title = document.getElementById("viewTitle");
  if (title) {
    console.log("🔵 Updating title:", titleMap[tab]);
    title.textContent = titleMap[tab] || "Overview";
  }

  // Update sidebar active state
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
}

/* =====================================================
   EXPORTS
===================================================== */
export {
  userData,
  auth,
  db,
  showUpgradeModal,
  hideUpgradeModal,
  handleSubscription,
  switchTab
};
