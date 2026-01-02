// index/js/admin/overview.js
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "/index/js/admin/utils.js";

let db;

export async function init({ db: d }) {
  db = d;
  console.log("🔹 Overview module init");
  await loadOverview();
}

export async function loadOverview() {
  const totalUsersEl = document.getElementById("adminTotalUsers");
  const businessUsersEl = document.getElementById("adminTotalBusinesses");
  const totalPostsEl = document.getElementById("adminTotalPosts");
  const siteViewsEl = document.getElementById("adminTotalSiteViews");
  const messagesEl = document.getElementById("adminTotalMessages");
  const activeTodayEl = document.getElementById("adminActiveToday");

  if (!totalUsersEl || !businessUsersEl || !totalPostsEl || !siteViewsEl || !messagesEl || !activeTodayEl) {
    console.error("❌ Overview module: Some DOM elements not found");
    return;
  }

  console.log("🔹 Loading overview metrics from Firestore...");

  try {
    // Users
    const usersSnap = await getDocs(collection(db, "users"));
    const totalUsers = usersSnap.size;
    const businessUsers = usersSnap.docs.filter(d => d.data().isBusiness).length;

    totalUsersEl.textContent = totalUsers;
    businessUsersEl.textContent = businessUsers;
    console.log(`✅ Users loaded: total=${totalUsers}, business=${businessUsers}`);

    // Posts
    const postsSnap = await getDocs(collection(db, "posts"));
    const totalPosts = postsSnap.size;
    totalPostsEl.textContent = totalPosts;
    console.log(`✅ Posts loaded: ${totalPosts}`);

    // Site views
    const analyticsSnap = await getDocs(query(collection(db, "analyticsEvents"), where("type", "==", "site_view")));
    siteViewsEl.textContent = analyticsSnap.size;
    console.log(`✅ Site views loaded: ${analyticsSnap.size}`);

    // Messages
    try {
      const messagesSnap = await getDocs(collection(db, "messages"));
      messagesEl.textContent = messagesSnap.size;
      console.log(`✅ Messages loaded: ${messagesSnap.size}`);
    } catch (err) {
      messagesEl.textContent = 0;
      console.warn("⚠️ Failed to load messages, defaulting to 0", err);
    }

    // Active today
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySnap = await getDocs(query(collection(db, "analyticsEvents"), where("timestamp", ">=", today)));
      const activeToday = new Set(todaySnap.docs.map(d => d.data().userId)).size;
      activeTodayEl.textContent = activeToday;
      console.log(`✅ Active today loaded: ${activeToday}`);
    } catch (err) {
      activeTodayEl.textContent = 0;
      console.warn("⚠️ Failed to calculate active today", err);
    }

    showToast("✅ Overview metrics loaded successfully");
  } catch (err) {
    console.error("❌ Overview module failed:", err);
    showToast("❌ Failed to load overview metrics", false);
  }
}
