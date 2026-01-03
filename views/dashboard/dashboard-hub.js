// dashboard-hub.js — Main orchestrator
import { initBadges, updateTrialBadges } from "./badges.js";
import { updateSidebar } from "./sidebar.js";
import { renderWidgets } from "./widgets.js";
import { loadCounts } from "./counts.js";
import { loadRecentAds } from "./recent-ads.js";
import { initModals, showUpgradeModal, hideUpgradeModal } from "./modals.js";
import { handleSubscription } from "./subscription.js";
import { switchTab } from "./tabs.js";

import { AI } from "/index/js/ai/assistant.js"; // AI assistant triggers
import { showAIPopup } from "./assistant-ui.js"; // AI popup UI

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

  // AI trigger for first login / dashboard open
  AI.speak("DASHBOARD_OPENED", { name: userData.name });

  // Example popup
  showAIPopup(`Welcome back, ${userData.name}! Your dashboard is ready.`);
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

export { userData, auth, db, showUpgradeModal, hideUpgradeModal, handleSubscription, switchTab };
