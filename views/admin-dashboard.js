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
  addDoc,
  serverTimestamp,
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

  // ⭐ Add real-time updates for dashboard and switches
  initRealtimeListeners();
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

    if (action === "upgrade") await updateDoc(userRef, { plan: "premium" });
    if (action === "downgrade") await updateDoc(userRef, { plan: "free" });

    if (action === "toggleSuspend") {
      const snap = await getDoc(userRef);
      await updateDoc(userRef, { suspended: !snap.data().suspended });
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
    const tr = document.createElement("tr");

    const created = d.createdAt?.toDate
      ? d.createdAt.toDate().toLocaleDateString()
      : "-";

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

    await deleteDoc(doc(db, "posts", id));
    await loadPostsAndReports();
  });

  const reportsSnap = await getDocs(
    query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(200))
  );

  for (const docSnap of reportsSnap.docs) {
    const d = docSnap.data();
    const tr = document.createElement("tr");

    const created = d.createdAt?.toDate
      ? d.createdAt.toDate().toLocaleString()
      : "-";

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

    if (action === "resolve") await updateDoc(ref, { status: "resolved" });
    if (action === "dismiss") await updateDoc(ref, { status: "dismissed" });

    await loadPostsAndReports();
  });
}

/* ============================================================
   SETTINGS (INCLUDING GENERAL SWITCH)
============================================================ */
async function loadSettings() {
  const settingsRef = doc(db, "settings", "global");
  let snap = await getDoc(settingsRef);

  if (!snap.exists()) {
    await updateDoc(settingsRef, {
      businessPremiumEnabled: false,
      postingEnabled: true,
      newSignupsEnabled: true,
      generalDashboardUpgradeEnabled: false,
      homepageBanner: "",
      homepageFeaturedBusinessId: null
    }).catch(() => {});
    snap = await getDoc(settingsRef);
  }

  const d = snap.data() || {};

  const toggleBusinessPremium = document.getElementById("toggleBusinessPremium");
  const togglePostingEnabled = document.getElementById("togglePostingEnabled");
  const toggleSignupsEnabled = document.getElementById("toggleSignupsEnabled");
  const toggleGeneralDashboard = document.getElementById("toggleGeneralDashboard"); // ✅ NEW
  const bannerInput = document.getElementById("adminBannerInput");
  const bannerBtn = document.getElementById("adminSaveBannerBtn");
  const featuredInput = document.getElementById("adminFeaturedBusinessId");
  const featuredBtn = document.getElementById("adminSaveFeaturedBusinessBtn");

  toggleBusinessPremium.checked = !!d.businessPremiumEnabled;
  togglePostingEnabled.checked = !!d.postingEnabled;
  toggleSignupsEnabled.checked = !!d.newSignupsEnabled;
  toggleGeneralDashboard.checked = !!d.generalDashboardUpgradeEnabled; // ✅ NEW
  bannerInput.value = d.homepageBanner || "";
  featuredInput.value = d.homepageFeaturedBusinessId || "";

  toggleBusinessPremium.addEventListener("change", async () => {
    await updateDoc(settingsRef, { businessPremiumEnabled: toggleBusinessPremium.checked });
  });

  togglePostingEnabled.addEventListener("change", async () => {
    await updateDoc(settingsRef, { postingEnabled: togglePostingEnabled.checked });
  });

  toggleSignupsEnabled.addEventListener("change", async () => {
    await updateDoc(settingsRef, { newSignupsEnabled: toggleSignupsEnabled.checked });
  });

  toggleGeneralDashboard.addEventListener("change", async () => {
    await updateDoc(settingsRef, { generalDashboardUpgradeEnabled: toggleGeneralDashboard.checked });
  });

  bannerBtn.addEventListener("click", async () => {
    await updateDoc(settingsRef, { homepageBanner: bannerInput.value.trim() });
  });

  featuredBtn.addEventListener("click", async () => {
    const val = featuredInput.value.trim() || null;
    await updateDoc(settingsRef, { homepageFeaturedBusinessId: val });
  });
}

/* ============================================================
   SUBSCRIPTIONS
============================================================ */
async function loadSubscriptions() {
  const tbody = document.getElementById("adminSubscriptionsTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  const snap = await getDocs(
    query(collection(db, "users"), where("isBusiness", "==", true))
  );

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

    if (action === "upgrade") await updateDoc(userRef, { plan: "premium" });
    if (action === "downgrade") await updateDoc(userRef, { plan: "free" });

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

    if (action === "toggleSuspend") {
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      await updateDoc(ref, { suspended: !snap.data().suspended });
      return loadUsers();
    }

    if (action === "deleteUser") {
      if (!confirm("Delete this user and ALL their data?")) return;
      await deleteUserAndData(uid);
      return loadUsers();
    }

    if (action === "view") {
      openUserModal(uid);
    }
  });
}

/* ============================================================
   DELETE USER + ALL DATA
============================================================ */
async function deleteUserAndData(uid) {
  // Delete posts
  const postsSnap = await getDocs(query(collection(db, "posts"), where("userId", "==", uid)));
  for (const p of postsSnap.docs) {
    await deleteDoc(doc(db, "posts", p.id));
  }

  // Delete followers
  const followersSnap = await getDocs(collection(db, "users", uid, "followers"));
  for (const f of followersSnap.docs) {
    await deleteDoc(doc(db, "users", uid, "followers", f.id));
  }

  // Delete user doc
  await deleteDoc(doc(db, "users", uid));

  console.warn("⚠️ Firebase Auth deletion must be done via Admin SDK or Cloud Function");
}

/* ============================================================
   VIEW USER MODAL (DETAILED INFO)
============================================================ */
async function openUserModal(uid) {
  const modal = document.getElementById("adminUserModal");
  const body = document.getElementById("adminUserModalBody");

  if (!modal || !body) return;

  const snap = await getDoc(doc(db, "users", uid));
  const d = snap.data();

  if (!d) {
    body.innerHTML = `<p>User not found.</p>`;
    modal.style.display = "flex";
    return;
  }

  // Format dates
  const createdAt = d.createdAt?.toDate
    ? d.createdAt.toDate().toLocaleString()
    : "Unknown";

  const lastLogin = d.lastLogin?.toDate
    ? d.lastLogin.toDate().toLocaleString()
    : "Unknown";

  // Build modal content
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

  // Close handler
  document.getElementById("adminCloseUserModal").onclick = () => {
    modal.style.display = "none";
  };

  // Close when clicking outside
  modal.onclick = e => {
    if (e.target === modal) modal.style.display = "none";
  };
}

/* ============================================================
   REAL-TIME FIRESTORE LISTENERS
============================================================ */
function initRealtimeListeners() {
  // Users count update
  onSnapshot(collection(db, "users"), () => loadOverview());

  // Posts count update
  onSnapshot(collection(db, "posts"), () => {
    loadOverview();
    loadTraffic();
    loadPostsAndReports();
  });

  // Reports count update
  onSnapshot(collection(db, "reports"), () => loadPostsAndReports());

  // Business / Subscriptions update
  onSnapshot(query(collection(db, "users"), where("isBusiness", "==", true)), () => {
    loadBusinesses();
    loadSubscriptions();
  });

  // Settings / dashboard switches
  const settingsRef = doc(db, "settings", "global");
  onSnapshot(settingsRef, snap => {
    const d = snap.data() || {};
    const toggleGeneralDashboard = document.getElementById("toggleGeneralDashboard");
    if (toggleGeneralDashboard) toggleGeneralDashboard.checked = !!d.generalDashboardUpgradeEnabled;
  });
    }
