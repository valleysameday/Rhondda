// widgets.js
import { AI } from "/index/js/ai/assistant.js";

export function renderWidgets(plan) {
  const grid = document.getElementById("widgetGrid");
  grid.innerHTML = "";

  addWidget(grid, widgetActiveAds());
  addWidget(grid, widgetMessages());
  addWidget(grid, widgetUnlockImpact(plan));

  if (plan === "free") addWidget(grid, widgetAnalyticsLocked());
  if (plan === "sellerplus") { addWidget(grid, widgetAnalytics()); addWidget(grid, widgetBundle()); }
  if (plan === "business") { addWidget(grid, widgetAnalytics()); addWidget(grid, widgetPerformance()); addWidget(grid, widgetBundle()); }

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
function widgetActiveAds() { return `<div class="widget-title">Active Ads</div><div class="widget-value" id="widgetAdCount">0</div><div class="widget-sub">Live right now</div>`; }
function widgetMessages() { return `<div class="widget-title">Unread Messages</div><div class="widget-value" id="widgetMsgCount">0</div><div class="widget-sub">People waiting to hear back</div>`; }
function widgetUnlockImpact(plan) { return plan === "free" ? `<div class="widget-title">Unlock Fees</div><div class="widget-value" id="widgetUnlockCount">0</div><div class="widget-sub">Your buyers paid £1.50 to see your number</div>` : `<div class="widget-title">Customer Savings</div><div class="widget-value" id="widgetUnlockSavings">£0</div><div class="widget-sub">You saved buyers unlock fees this month</div>`; }
function widgetAnalyticsLocked() { return `<div class="locked-widget" onclick="showUpgradeModal()"><div class="widget-title">Insights</div><div class="widget-value">🔒</div><div class="widget-sub">Upgrade to see performance charts</div><div class="locked-overlay">Tap to upgrade</div></div>`; }
function widgetAnalytics() { return `<div class="widget-title">Insights</div><div class="widget-value">📈</div><div class="widget-sub">Views & clicks over the last 7 days</div>`; }
function widgetBundle() { return `<div class="widget-title">Bundle Enquiries</div><div class="widget-value" id="widgetBundleCount">0</div><div class="widget-sub">Multi‑item enquiries from your profile</div>`; }
function widgetPerformance() { return `<div class="widget-title">Business Performance</div><div class="widget-value">⭐</div><div class="widget-sub">Full analytics & trends</div>`; }
