// index/js/admin/overview.js
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function init({ db }) {
  await loadOverview(db);
}

async function loadOverview(db) {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const totalUsers = usersSnap.size;
    const businessUsers = usersSnap.docs.filter(d => d.data().isBusiness).length;

    const postsSnap = await getDocs(collection(db, "posts"));
    const totalPosts = postsSnap.size;

    document.getElementById("adminTotalUsers").textContent = totalUsers;
    document.getElementById("adminTotalBusinesses").textContent = businessUsers;
    document.getElementById("adminTotalPosts").textContent = totalPosts;

    // Site views
    const analyticsSnap = await getDocs(query(collection(db, "analyticsEvents"), where("type", "==", "site_view")));
    document.getElementById("adminTotalSiteViews").textContent = analyticsSnap.size;

    // Messages
    try {
      const messagesSnap = await getDocs(collection(db, "messages"));
      document.getElementById("adminTotalMessages").textContent = messagesSnap.size;
    } catch { document.getElementById("adminTotalMessages").textContent = 0; }

    // Active today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySnap = await getDocs(query(collection(db, "analyticsEvents"), where("timestamp", ">=", today)));
    const activeToday = new Set(todaySnap.docs.map(d => d.data().userId)).size;
    document.getElementById("adminActiveToday").textContent = activeToday;
  } catch (err) {
    console.error(err);
  }
}
