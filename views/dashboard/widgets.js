import { AI } from "/index/js/ai/assistant.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "/views/dashboard/dashboard-hub.js"; // Use your main exports

export async function renderWidgets(plan) {
  const grid = document.getElementById("widgetGrid");
  grid.innerHTML = "";

  // Core widgets
  addWidget(grid, widgetActiveAds());
  addWidget(grid, widgetMessages());
  addWidget(grid, widgetTrialStatus(plan));

  // Plan-based widgets
  if (plan === "free") addWidget(grid, widgetAnalyticsLocked());
  if (plan === "sellerplus") { 
    addWidget(grid, widgetAnalytics()); 
    addWidget(grid, widgetBundle()); 
  }
  if (plan === "business") { 
    addWidget(grid, widgetAnalytics()); 
    addWidget(grid, widgetPerformance()); 
    addWidget(grid, widgetBundle()); 
  }

  // Fetch live counts from Firestore
  updateWidgetCounts();

  // AI feedback after rendering widgets
  AI.speak("DASHBOARD_RENDERED", { plan });
}

function addWidget(grid, html) {
  const div = document.createElement("div");
  div.className = "widget slide-up";
  div.innerHTML = html;
  grid.appendChild(div);
}

/* --- Widget definitions --- */
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

function widgetTrialStatus(plan) {
  if (plan === "business" && window.currentUserData?.businessTrial?.active) {
    const daysLeft = Math.ceil((window.currentUserData.businessTrial.expiresAt - Date.now()) / (1000*60*60*24));
    return `
      <div class="widget-title">Trial Status</div>
      <div class="widget-value">${daysLeft}d</div>
      <div class="widget-sub">Days left in your 30-day trial</div>
    `;
  }
  return `
    <div class="widget-title">Plan</div>
    <div class="widget-value">${plan.charAt(0).toUpperCase() + plan.slice(1)}</div>
    <div class="widget-sub">Your current subscription plan</div>
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

function widgetBundle() { 
  return `
    <div class="widget-title">Bundle Enquiries</div>
    <div class="widget-value" id="widgetBundleCount">0</div>
    <div class="widget-sub">Multi‑item enquiries from your profile</div>
  `;
}

function widgetPerformance() { 
  return `
    <div class="widget-title">Business Performance</div>
    <div class="widget-value">⭐</div>
    <div class="widget-sub">Full analytics & trends</div>
  `;
}

/* --- Firestore counts --- */
async function updateWidgetCounts() {
  if (!auth.currentUser) return;

  const uid = auth.currentUser.uid;

  // Active Ads count
  try {
    const adsSnap = await getDocs(query(collection(db, "ads"), where("ownerId", "==", uid), where("status", "==", "active")));
    document.getElementById("widgetAdCount").textContent = adsSnap.size;
  } catch (e) { console.warn("Failed to fetch ads count:", e); }

  // Unread messages count
  try {
    const msgSnap = await getDocs(query(collection(db, "messages"), where("to", "==", uid), where("read", "==", false)));
    document.getElementById("widgetMsgCount").textContent = msgSnap.size;
  } catch (e) { console.warn("Failed to fetch messages count:", e); }

  // Bundle enquiries count
  try {
    const bundleSnap = await getDocs(query(collection(db, "enquiries"), where("targetUid", "==", uid), where("type", "==", "bundle")));
    document.getElementById("widgetBundleCount")?.textContent = bundleSnap.size;
  } catch (e) { console.warn("Failed to fetch bundle enquiries:", e); }
}
