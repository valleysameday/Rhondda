console.log("🧩 widgets.js LOADED");// widgets.js — Dashboard Widgets
import { AI } from "/index/js/ai/assistant.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
export function renderWidgets(plan, auth, db) {
  const grid = document.getElementById("widgetGrid");
  if (!grid) return;
  grid.innerHTML = "";

  // Core widgets
  addWidget(grid, widgetActiveAds());
  addWidget(grid, widgetMessages());
  if (plan !== "free") addWidget(grid, widgetBundle());

  // Insights / Analytics
  if (plan === "free") addWidget(grid, widgetAnalyticsLocked());
  if (plan === "sellerplus" || plan === "business") addWidget(grid, widgetAnalytics());
  if (plan === "business") addWidget(grid, widgetPerformance());

  // Update counts dynamically
  updateWidgetCounts(auth, db);

  // AI feedback
  AI.speak("DASHBOARD_RENDERED", { plan });
}

function addWidget(grid, html) {
  const div = document.createElement("div");
  div.className = "widget slide-up";
  div.innerHTML = html;
  grid.appendChild(div);
}

/* --- Widget HTML templates --- */
function widgetActiveAds() {
  return `
    <div class="widget-title">Active Ads</div>
    <div class="widget-value" id="widgetAdCount">0</div>
    <div class="widget-sub">Live right now</div>
  `;
}

function widgetMessages() {
  return `
    <div class="widget-title">Unread Messages</div>
    <div class="widget-value" id="widgetMsgCount">0</div>
    <div class="widget-sub">People waiting to hear back</div>
  `;
}

function widgetBundle() {
  return `
    <div class="widget-title">Bundle Enquiries</div>
    <div class="widget-value" id="widgetBundleCount">0</div>
    <div class="widget-sub">Multi-item enquiries from your profile</div>
  `;
}

function widgetAnalyticsLocked() {
  return `
    <div class="locked-widget" onclick="showUpgradeModal()">
      <div class="widget-title">Insights</div>
      <div class="widget-value">🔒</div>
      <div class="widget-sub">Upgrade to see performance charts</div>
      <div class="locked-overlay">Tap to upgrade</div>
    </div>
  `;
}

function widgetAnalytics() {
  return `
    <div class="widget-title">Insights</div>
    <div class="widget-value">📈</div>
    <div class="widget-sub">Views & clicks over the last 7 days</div>
  `;
}

function widgetPerformance() {
  return `
    <div class="widget-title">Business Performance</div>
    <div class="widget-value">⭐</div>
    <div class="widget-sub">Full analytics & trends</div>
  `;
}

/* --- Dynamic widget counts --- */
async function updateWidgetCounts(auth, db) {
  if (!auth?.currentUser || !db) return;
  const uid = auth.currentUser.uid;

  try {
    // Active Ads
    const adsSnap = await getDocs(
      query(collection(db, "posts"), where("ownerId", "==", uid), where("status", "==", "active"))
    );
    document.getElementById("widgetAdCount").textContent = adsSnap.size;

    // Unread Messages
    const msgSnap = await getDocs(
      query(collection(db, "messages"), where("to", "==", uid), where("read", "==", false))
    );
    document.getElementById("widgetMsgCount").textContent = msgSnap.size;

    // Bundle Enquiries
    const bundleSnap = await getDocs(
      query(collection(db, "enquiries"), where("targetUid", "==", uid), where("type", "==", "bundle"))
    );
    document.getElementById("widgetBundleCount").textContent = bundleSnap.size;

  } catch (e) {
    console.warn("Failed to fetch widget counts:", e);
  }
}
