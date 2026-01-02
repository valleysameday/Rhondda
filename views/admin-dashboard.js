// /index/js/admin-dashboard.js

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db, storage;

/* ============================================================
   INIT
============================================================ */
export async function init({ auth: a, db: d, storage: s }) {
  auth = a;
  db = d;
  storage = s;

  if (!auth || !db) return;

  if (!window.currentUserData?.isAdmin) {
    console.warn("Not an admin");
    return;
  }

  initNav();
  await loadOverview();
  await loadTraffic();
  await loadBusinesses();
  await loadPostsAndReports();
  await loadSettings();
  await loadSubscriptions();
  await loadUsers();
}

/* ============================================================
   NAVIGATION
============================================================ */
function initNav() {
  const buttons = document.querySelectorAll(".admin-nav-btn");
  const sections = document.querySelectorAll(".admin-section");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.dataset.section;
      sections.forEach(sec => {
        sec.style.display = sec.id === `admin-section-${target}` ? "block" : "none";
      });
    });
  });
}

/* ============================================================
   TOAST FEEDBACK SYSTEM
============================================================ */
function showToast(message, success = true) {
  let toast = document.createElement("div");
  toast.className = `admin-toast ${success ? "success" : "error"}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ============================================================
   OVERVIEW
============================================================ */
async function loadOverview() {
  const usersSnap = await getDocs(collection(db, "users"));
  const totalUsers = usersSnap.size;
  const businessUsers = usersSnap.docs.filter(d => d.data().isBusiness).length;

  const postsSnap = await getDocs(collection(db, "posts"));
  const totalPosts = postsSnap.size;

  const analyticsSnap = await getDocs(
    query(collection(db, "analyticsEvents"), where("type", "==", "site_view"))
  );
  const totalSiteViews = analyticsSnap.size;

  let totalMessages = 0;
  try {
    const messagesSnap = await getDocs(collection(db, "messages"));
    totalMessages = messagesSnap.size;
  } catch {}

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let activeToday = 0;
  try {
    const todaySnap = await getDocs(
      query(collection(db, "analyticsEvents"), where("timestamp", ">=", today))
    );
    const uniqueUsers = new Set();
    todaySnap.forEach(doc => {
      const d = doc.data();
      if (d.userId) uniqueUsers.add(d.userId);
    });
    activeToday = uniqueUsers.size;
  } catch {}

  document.getElementById("adminTotalUsers").textContent = totalUsers;
  document.getElementById("adminTotalBusinesses").textContent = businessUsers;
  document.getElementById("adminTotalPosts").textContent = totalPosts;
  document.getElementById("adminTotalSiteViews").textContent = totalSiteViews;
  document.getElementById("adminTotalMessages").textContent = totalMessages;
  document.getElementById("adminActiveToday").textContent = activeToday;
}

/* ============================================================
   TRAFFIC
============================================================ */
async function loadTraffic() {
  const topPostsEl = document.getElementById("adminTopPosts");
  const topCatsEl = document.getElementById("adminTopCategories");

  const postsSnap = await getDocs(
    query(collection(db, "posts"), orderBy("views", "desc"), limit(5))
  );

  topPostsEl.innerHTML = "";
  postsSnap.forEach(docSnap => {
    const d = docSnap.data();
    const div = document.createElement("div");
    div.className = "admin-list-item";
    div.innerHTML = `
      <span>${d.title || "Untitled"}</span>
      <span>${d.views || 0} views</span>
    `;
    topPostsEl.appendChild(div);
  });

  const allPostsSnap = await getDocs(collection(db, "posts"));
  const catCounts = {};
  allPostsSnap.forEach(docSnap => {
    const d = docSnap.data();
    const cat = d.category || "other";
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  const sortedCats = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  topCatsEl.innerHTML = "";
  sortedCats.forEach(([cat, count]) => {
    const div = document.createElement("div");
    div.className = "admin-list-item";
    div.innerHTML = `
      <span>${cat}</span>
      <span>${count} posts</span>
    `;
    topCatsEl.appendChild(div);
  });
}

/* ============================================================
   BUSINESSES
============================================================ */
async function loadBusinesses() {
  const tbody = document.getElementById("adminBusinessesTable");
  tbody.innerHTML = "";

  const snap = await getDocs(
    query(collection(db, "users"), where("isBusiness", "==", true))
  );

  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const tr = document.createElement("tr");
    const plan = d.plan || "free";
    const status = d.suspended ? "Suspended" : "Active";

    tr.innerHTML = `
      <td>${d.name || d.displayName || "(no name)"}</td>
      <td>${d.area || "-"}</td>
      <td>${d.followersCount || 0}</td>
      <td>${d.adsCount || 0}</td>
      <td>${plan}</td>
      <td>${status}</td>
      <td>
        <button class="admin-btn small" data-action="upgrade" data-id="${docSnap.id}">Upgrade</button>
        <button class="admin-btn small secondary" data-action="downgrade" data-id="${docSnap.id}">Downgrade</button>
        <button class="admin-btn small danger" data-action="toggleSuspend" data-id="${docSnap.id}">
          ${d.suspended ? "Unsuspend" : "Suspend"}
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  }

  tbody.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const userRef = doc(db, "users", id);

    try {
      if (action === "upgrade") await updateDoc(userRef, { plan: "premium" });
      if (action === "downgrade") await updateDoc(userRef, { plan: "free" });
      if (action === "toggleSuspend") {
        const snap = await getDoc(userRef);
        await updateDoc(userRef, { suspended: !snap.data().suspended });
      }
      showToast("Action applied successfully", true);
    } catch (err) {
      showToast("Action failed: " + err.message, false);
    }

    await loadBusinesses();
    await loadSubscriptions();
  });
}

/* ============================================================
   POSTS & REPORTS
============================================================ */
async function loadPostsAndReports() {
  const postsTbody = document.getElementById("adminPostsTable");
  const reportsTbody = document.getElementById("adminReportsTable");
  postsTbody.innerHTML = "";
  reportsTbody.innerHTML = "";

  const postsSnap = await getDocs(
    query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(200))
  );

  for (const docSnap of postsSnap.docs) {
    const d = docSnap.data();
    const created = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString() : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.title || "Untitled"}</td>
      <td>${d.userId || "-"}</td>
      <td>${d.category || "-"}</td>
      <td>${d.views || 0}</td>
      <td>${created}</td>
      <td>
        <button class="admin-btn small danger" data-post-action="delete" data-id="${docSnap.id}">Delete</button>
      </td>
    `;
    postsTbody.appendChild(tr);
  }

  postsTbody.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-post-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (!confirm("Delete this post?")) return;
    try {
      await deleteDoc(doc(db, "posts", id));
      showToast("Post deleted successfully", true);
    } catch {
      showToast("Failed to delete post", false);
    }
    await loadPostsAndReports();
  });

  const reportsSnap = await getDocs(
    query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(200))
  );

  for (const docSnap of reportsSnap.docs) {
    const d = docSnap.data();
    const created = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString() : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.postId}</td>
      <td>${d.reason || "-"}</td>
      <td>${d.reportedBy || "-"}</td>
      <td>${created}</td>
      <td>${d.status || "open"}</td>
      <td>
        <button class="admin-btn small" data-report-action="resolve" data-id="${docSnap.id}">Resolve</button>
        <button class="admin-btn small secondary" data-report-action="dismiss" data-id="${docSnap.id}">Dismiss</button>
      </td>
    `;
    reportsTbody.appendChild(tr);
  }

  reportsTbody.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-report-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.reportAction;
    const ref = doc(db, "reports", id);

    try {
      if (action === "resolve") await updateDoc(ref, { status: "resolved" });
      if (action === "dismiss") await updateDoc(ref, { status: "dismissed" });
      showToast("Report updated", true);
    } catch {
      showToast("Failed to update report", false);
    }

    await loadPostsAndReports();
  });
}

/* ============================================================
   SETTINGS WITH LIVE TOGGLES
============================================================ */
async function loadSettings() {
  const toggleBusinessPremium = document.getElementById("toggleBusinessPremium");
  const toggleGeneralUpgrades = document.getElementById("toggleGeneralUpgrades");
  const togglePostingEnabled = document.getElementById("togglePostingEnabled");
  const toggleSignupsEnabled = document.getElementById("toggleSignupsEnabled");
  const bannerInput = document.getElementById("adminBannerInput");
  const bannerBtn = document.getElementById("adminSaveBannerBtn");
  const featuredInput = document.getElementById("adminFeaturedBusinessId");
  const featuredBtn = document.getElementById("adminSaveFeaturedBusinessBtn");

  const settingsRef = doc(db, "settings", "global");

  // REAL-TIME LISTENER
  onSnapshot(settingsRef, snap => {
    const d = snap.data() || {};

    toggleBusinessPremium.checked = !!d.businessPremiumEnabled;
    toggleGeneralUpgrades.checked = !!d.generalDashboardUpgradeEnabled;
    togglePostingEnabled.checked = !!d.postingEnabled;
    toggleSignupsEnabled.checked = !!d.newSignupsEnabled;

    if (d.generalDashboardUpgradeEnabled) {
      document.body.classList.add("dashboard-upgraded");
    } else {
      document.body.classList.remove("dashboard-upgraded");
    }
  });

  // HANDLERS
  const setupToggle = (element, key) => {
    element.addEventListener("change", async () => {
      try {
        await updateDoc(settingsRef, { [key]: element.checked });
        showToast(`${key} updated successfully`, true);
      } catch {
        element.checked = !element.checked; // revert
        showToast(`Failed to update ${key}`, false);
      }
    });
  };

  setupToggle(toggleBusinessPremium, "businessPremiumEnabled");
  setupToggle(toggleGeneralUpgrades, "generalDashboardUpgradeEnabled");
  setupToggle(togglePostingEnabled, "postingEnabled");
  setupToggle(toggleSignupsEnabled, "newSignupsEnabled");

  // Banner / Featured business
  bannerBtn.addEventListener("click", async () => {
    try {
      await updateDoc(settingsRef, { homepageBanner: bannerInput.value.trim() });
      showToast("Homepage banner updated", true);
    } catch {
      showToast("Failed to update banner", false);
    }
  });

  featuredBtn.addEventListener("click", async () => {
    try {
      await updateDoc(settingsRef, { homepageFeaturedBusinessId: featuredInput.value.trim() || null });
      showToast("Featured business updated", true);
    } catch {
      showToast("Failed to update featured business", false);
    }
  });
}

/* ============================================================
   SUBSCRIPTIONS
============================================================ */
async function loadSubscriptions() {
  const tbody = document.getElementById("adminSubscriptionsTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  const snap = await getDocs(query(collection(db, "users"), where("isBusiness", "==", true)));

  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const tr = document.createElement("tr");
    const plan = d.plan || "free";

    tr.innerHTML = `
      <td>${d.name || d.displayName || "(no name)"}</td>
      <td>${plan}</td>
      <td>${d.stripeStatus || "-"}</td>
      <td>${d.nextBillingDate || "-"}</td>
      <td>
        <button class="admin-btn small" data-sub-action="upgrade" data-id="${docSnap.id}">Upgrade</button>
        <button class="admin-btn small secondary" data-sub-action="downgrade" data-id="${docSnap.id}">Downgrade</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-sub-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.subAction;
    const userRef = doc(db, "users", id);

    try {
      if (action === "upgrade") await updateDoc(userRef, { plan: "premium" });
      if (action === "downgrade") await updateDoc(userRef, { plan: "free" });
      showToast("Subscription updated", true);
    } catch {
      showToast("Failed to update subscription", false);
    }

    await loadSubscriptions();
    await loadBusinesses();
  });
}

/* ============================================================
   USERS & ACCOUNTS
============================================================ */
async function loadUsers() {
  const tbody = document.getElementById("adminUsersTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  const snap = await getDocs(collection(db, "users"));

  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const uid = docSnap.id;
    const type = d.isAdmin ? "Admin" : d.isBusiness ? "Business" : "User";
    const plan = d.plan || "free";
    const status = d.suspended ? "Suspended" : "Active";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.name || d.displayName || "(no name)"}</td>
      <td>${d.email || "-"}</td>
      <td>${type}</td>
      <td>${plan}</td>
      <td>${d.area || "-"}</td>
      <td>${d.followersCount || 0}</td>
      <td>${d.adsCount || 0}</td>
      <td>${status}</td>
      <td>
        <button class="admin-btn small" data-action="view" data-id="${uid}">View</button>
        <button class="admin-btn small secondary" data-action="toggleSuspend" data-id="${uid}">
          ${d.suspended ? "Unsuspend" : "Suspend"}
        </button>
        <button class="admin-btn small danger" data-action="deleteUser" data-id="${uid}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const uid = btn.dataset.id;
    const action = btn.dataset.action;

    try {
      if (action === "toggleSuspend") {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        await updateDoc(ref, { suspended: !snap.data().suspended });
        showToast("User status toggled", true);
        return loadUsers();
      }

      if (action === "deleteUser") {
        if (!confirm("Delete this user and ALL their data?")) return;
        await deleteUserAndData(uid);
        showToast("User deleted", true);
        return loadUsers();
      }

      if (action === "view") {
        openUserModal(uid);
      }
    } catch (err) {
      showToast("Action failed: " + err.message, false);
    }
  });
}

/* ============================================================
   DELETE USER + ALL DATA
============================================================ */
async function deleteUserAndData(uid) {
  try {
    // Delete posts
    const postsSnap = await getDocs(query(collection(db, "posts"), where("userId", "==", uid)));
    for (const p of postsSnap.docs) {
      await deleteDoc(doc(db, "posts", p.id));
    }

    // Delete followers (if any)
    const followersSnap = await getDocs(collection(db, "users", uid, "followers"));
    for (const f of followersSnap.docs) {
      await deleteDoc(doc(db, "users", uid, "followers", f.id));
    }

    // Delete user document
    await deleteDoc(doc(db, "users", uid));

    // ⚠️ Note: Firebase Auth deletion must be handled via Admin SDK or Cloud Function
    showToast("User and related data deleted (Auth deletion must be done separately)", true);
  } catch (err) {
    showToast("Failed to delete user: " + err.message, false);
  }
}

/* ============================================================
   VIEW USER MODAL (DETAILED INFO)
============================================================ */
async function openUserModal(uid) {
  const modal = document.getElementById("adminUserModal");
  const body = document.getElementById("adminUserModalBody");

  if (!modal || !body) return;

  try {
    const snap = await getDoc(doc(db, "users", uid));
    const d = snap.data();

    if (!d) {
      showToast("User data not found", false);
      return;
    }

    const createdAt = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString() : "Unknown";
    const lastLogin = d.lastLogin?.toDate ? d.lastLogin.toDate().toLocaleString() : "Unknown";

    body.innerHTML = `
      <h3>${d.name || d.displayName || "(no name)"}</h3>
      <p><strong>Email:</strong> ${d.email || "-"}</p>
      <p><strong>Type:</strong> ${d.isAdmin ? "Admin" : d.isBusiness ? "Business" : "User"}</p>
      <p><strong>Plan:</strong> ${d.plan || "free"}</p>
      <p><strong>Status:</strong> ${d.suspended ? "Suspended" : "Active"}</p>
      <hr>
      <p><strong>Area:</strong> ${d.area || "-"}</p>
      <p><strong>Followers:</strong> ${d.followersCount || 0}</p>
      <p><strong>Ads:</strong> ${d.adsCount || 0}</p>
      <hr>
      <p><strong>Created At:</strong> ${createdAt}</p>
      <p><strong>Last Login:</strong> ${lastLogin}</p>
      <hr>
      <h4>User JSON</h4>
      <pre style="background:#f3f4f6;padding:10px;border-radius:6px;max-height:200px;overflow:auto;">
${JSON.stringify(d, null, 2)}
      </pre>
      <button id="adminCloseUserModal" class="admin-btn secondary" style="margin-top:10px;">Close</button>
    `;

    // Show modal
    modal.style.display = "flex";

    // Close button
    document.getElementById("adminCloseUserModal").onclick = () => modal.style.display = "none";

    // Close clicking outside
    modal.onclick = e => {
      if (e.target === modal) modal.style.display = "none";
    };

  } catch (err) {
    showToast("Failed to load user: " + err.message, false);
  }
}

/* ============================================================
   EXPORTS (for init)
============================================================ */
export default {
  init
};
