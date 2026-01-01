import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db, storage;

export async function init({ auth: a, db: d, storage: s }) {
  auth = a;
  db = d;
  storage = s;

  if (!auth || !db) return;

  const user = auth.currentUser;
  if (!user) return;

  // You should have loaded user data somewhere globally
  if (!window.currentUserData || !window.currentUserData.isAdmin) {
    return; // extra safety
  }

  initNav();
  await loadOverview();
  await loadTraffic();
  await loadBusinesses();
  await loadPostsAndReports();
  await loadSettings();
  await loadSubscriptions();
}

/* ============================================================
   NAVIGATION BETWEEN SECTIONS
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
  // Total users
  const usersSnap = await getDocs(collection(db, "users"));
  const totalUsers = usersSnap.size;
  const businessUsers = usersSnap.docs.filter(d => d.data().isBusiness).length;

  // Total posts
  const postsSnap = await getDocs(collection(db, "posts"));
  const totalPosts = postsSnap.size;

  // Site views (from analyticsEvents)
  const analyticsSnap = await getDocs(
    query(collection(db, "analyticsEvents"), where("type", "==", "site_view"))
  );
  const totalSiteViews = analyticsSnap.size;

  // Messages (conversations or messages collection)
  let totalMessages = 0;
  try {
    const messagesSnap = await getDocs(collection(db, "messages"));
    totalMessages = messagesSnap.size;
  } catch (e) {
    // if you don't have messages collection yet, ignore
  }

  // Active today (users with any event today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let activeToday = 0;
  try {
    const todaySnap = await getDocs(
      query(
        collection(db, "analyticsEvents"),
        where("timestamp", ">=", today)
      )
    );
    const uniqueUsers = new Set();
    todaySnap.forEach(doc => {
      const d = doc.data();
      if (d.userId) uniqueUsers.add(d.userId);
    });
    activeToday = uniqueUsers.size;
  } catch (e) {}

  document.getElementById("adminTotalUsers").textContent = totalUsers;
  document.getElementById("adminTotalBusinesses").textContent = businessUsers;
  document.getElementById("adminTotalPosts").textContent = totalPosts;
  document.getElementById("adminTotalSiteViews").textContent = totalSiteViews;
  document.getElementById("adminTotalMessages").textContent = totalMessages;
  document.getElementById("adminActiveToday").textContent = activeToday;
}

/* ============================================================
   TRAFFIC & ENGAGEMENT
============================================================ */
async function loadTraffic() {
  const topPostsEl = document.getElementById("adminTopPosts");
  const topCatsEl = document.getElementById("adminTopCategories");

  // Top viewed posts
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

  // Top categories (simple count)
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
   BUSINESSES & PLANS
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

    if (action === "upgrade") {
      await updateDoc(userRef, { plan: "premium" });
    }
    if (action === "downgrade") {
      await updateDoc(userRef, { plan: "free" });
    }
    if (action === "toggleSuspend") {
      const snap = await getDoc(userRef);
      const d = snap.data();
      await updateDoc(userRef, { suspended: !d.suspended });
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

  // Posts
  const postsSnap = await getDocs(
    query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(100))
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

    await updateDoc(doc(db, "posts", id), { deleted: true });
    // or deleteDoc if you prefer
    await loadPostsAndReports();
  });

  // Reports
  const reportsSnap = await getDocs(
    query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100))
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

    if (action === "resolve") {
      await updateDoc(ref, { status: "resolved" });
    }
    if (action === "dismiss") {
      await updateDoc(ref, { status: "dismissed" });
    }

    await loadPostsAndReports();
  });
}

/* ============================================================
   SETTINGS
============================================================ */
async function loadSettings() {
  const settingsRef = doc(db, "settings", "global");
  let snap = await getDoc(settingsRef);

  if (!snap.exists()) {
    await updateDoc(settingsRef, {
      businessPremiumEnabled: false,
      postingEnabled: true,
      newSignupsEnabled: true,
      homepageBanner: "",
      homepageFeaturedBusinessId: null
    }).catch(() => {});
    snap = await getDoc(settingsRef);
  }

  const d = snap.data() || {};

  const toggleBusinessPremium = document.getElementById("toggleBusinessPremium");
  const togglePostingEnabled = document.getElementById("togglePostingEnabled");
  const toggleSignupsEnabled = document.getElementById("toggleSignupsEnabled");
  const bannerInput = document.getElementById("adminBannerInput");
  const bannerBtn = document.getElementById("adminSaveBannerBtn");
  const featuredInput = document.getElementById("adminFeaturedBusinessId");
  const featuredBtn = document.getElementById("adminSaveFeaturedBusinessBtn");

  toggleBusinessPremium.checked = !!d.businessPremiumEnabled;
  togglePostingEnabled.checked = !!d.postingEnabled;
  toggleSignupsEnabled.checked = !!d.newSignupsEnabled;
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

  bannerBtn.addEventListener("click", async () => {
    await updateDoc(settingsRef, { homepageBanner: bannerInput.value.trim() });
  });

  featuredBtn.addEventListener("click", async () => {
    const val = featuredInput.value.trim() || null;
    await updateDoc(settingsRef, { homepageFeaturedBusinessId: val });
  });
}

/* ============================================================
   PAYMENTS & SUBSCRIPTIONS (PLAN VIEW)
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

    if (action === "upgrade") {
      await updateDoc(userRef, { plan: "premium" });
    }
    if (action === "downgrade") {
      await updateDoc(userRef, { plan: "free" });
    }

    await loadSubscriptions();
    await loadBusinesses();
  });
      }
