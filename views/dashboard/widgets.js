console.log("🧩 widgets.js LOADED");

import { AI } from "/index/js/ai/assistant.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* =====================================================
   SHOW / HIDE WIDGETS BASED ON PLAN
===================================================== */
export function renderWidgets(plan) {

  // Bundle widget
  document.getElementById("widget-bundle").style.display =
    plan === "free" ? "none" : "block";

  // Insights widget
  document.getElementById("widget-insights").style.display =
    plan === "free" ? "none" : "block";

  // Business performance widget
  document.getElementById("widget-performance").style.display =
    plan === "business" ? "block" : "none";

  // AI feedback
  AI.speak("DASHBOARD_RENDERED", { plan });
}

/* =====================================================
   UPDATE WIDGET COUNTS
===================================================== */
export async function updateWidgetCounts(auth, db) {
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
