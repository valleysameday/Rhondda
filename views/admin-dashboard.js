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

/* ============================================================
   INIT
============================================================ */
export async function init({ auth: a, db: d, storage: s }) {
  console.log("🛠️ Admin init called");

  auth = a;
  db = d;
  storage = s;

  if (!auth || !db) {
    console.warn("❌ Missing auth or db");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    console.warn("❌ No logged-in user");
    return;
  }

  if (!window.currentUserData || !window.currentUserData.isAdmin) {
    console.warn("⛔ User is not admin");
    return;
  }

  console.log("✅ Admin authenticated:", user.uid);

  initNav();
  await loadOverview();
  await loadTraffic();
  await loadBusinesses();
  await loadPostsAndReports();
  await loadSettings();
  await loadSubscriptions();

  console.log("✅ Admin dashboard loaded");
}

/* ============================================================
   NAVIGATION
============================================================ */
function initNav() {
  console.log("🧭 Initialising navigation");

  const buttons = document.querySelectorAll(".admin-nav-btn");
  const sections = document.querySelectorAll(".admin-section");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      console.log("➡️ Nav click:", btn.dataset.section);

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.dataset.section;
      sections.forEach(sec => {
        sec.style.display =
          sec.id === `admin-section-${target}` ? "block" : "none";
      });
    });
  });
}

/* ============================================================
   OVERVIEW
============================================================ */
async function loadOverview() {
  console.log("📊 Loading overview");

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
  } catch {
    console.warn("ℹ️ No messages collection");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let activeToday = 0;
  try {
    const todaySnap = await getDocs(
      query(collection(db, "analyticsEvents"), where("timestamp", ">=", today))
    );
    const users = new Set();
    todaySnap.forEach(d => d.data().userId && users.add(d.data().userId));
    activeToday = users.size;
  } catch {}

  document.getElementById("adminTotalUsers").textContent = totalUsers;
  document.getElementById("adminTotalBusinesses").textContent = businessUsers;
  document.getElementById("adminTotalPosts").textContent = totalPosts;
  document.getElementById("adminTotalSiteViews").textContent = totalSiteViews;
  document.getElementById("adminTotalMessages").textContent = totalMessages;
  document.getElementById("adminActiveToday").textContent = activeToday;

  console.log("✅ Overview loaded");
}

/* ============================================================
   TRAFFIC
============================================================ */
async function loadTraffic() {
  console.log("📈 Loading traffic");

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
    const cat = docSnap.data().category || "other";
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  topCatsEl.innerHTML = "";
  Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([cat, count]) => {
      const div = document.createElement("div");
      div.className = "admin-list-item";
      div.innerHTML = `
        <span>${cat}</span>
        <span>${count} posts</span>
      `;
      topCatsEl.appendChild(div);
    });

  console.log("✅ Traffic loaded");
}

/* ============================================================
   BUSINESSES
============================================================ */
async function loadBusinesses() {
  console.log("🏪 Loading businesses");

  const tbody = document.getElementById("adminBusinessesTable");
  tbody.innerHTML = "";

  const snap = await getDocs(
    query(collection(db, "users"), where("isBusiness", "==", true))
  );

  snap.docs.forEach(docSnap => {
    const d = docSnap.data();
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${d.name || d.displayName || "(no name)"}</td>
      <td>${d.area || "-"}</td>
      <td>${d.followersCount || 0}</td>
      <td>${d.adsCount || 0}</td>
      <td>${d.plan || "free"}</td>
      <td>${d.suspended ? "Suspended" : "Active"}</td>
      <td>
        <button data-action="upgrade" data-id="${docSnap.id}">Upgrade</button>
        <button data-action="downgrade" data-id="${docSnap.id}">Downgrade</button>
        <button data-action="toggleSuspend" data-id="${docSnap.id}">
          ${d.suspended ? "Unsuspend" : "Suspend"}
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.onclick = async e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    console.log("🛠️ Business action:", btn.dataset.action, btn.dataset.id);

    const ref = doc(db, "users", btn.dataset.id);

    if (btn.dataset.action === "upgrade") await updateDoc(ref, { plan: "premium" });
    if (btn.dataset.action === "downgrade") await updateDoc(ref, { plan: "free" });
    if (btn.dataset.action === "toggleSuspend") {
      const snap = await getDoc(ref);
      await updateDoc(ref, { suspended: !snap.data().suspended });
    }

    await loadBusinesses();
    await loadSubscriptions();
  };
}

/* ============================================================
   POSTS & REPORTS
============================================================ */
async function loadPostsAndReports() {
  console.log("📝 Loading posts & reports");

  const postsTbody = document.getElementById("adminPostsTable");
  const reportsTbody = document.getElementById("adminReportsTable");

  postsTbody.innerHTML = "";
  reportsTbody.innerHTML = "";

  const postsSnap = await getDocs(
    query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(100))
  );

  postsSnap.docs.forEach(docSnap => {
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
        <button data-post-action="delete" data-id="${docSnap.id}">Delete</button>
      </td>
    `;

    postsTbody.appendChild(tr);
  });

  postsTbody.onclick = async e => {
    const btn = e.target.closest("button[data-post-action]");
    if (!btn) return;

    console.log("🗑️ Deleting post:", btn.dataset.id);

    if (!confirm("Delete this post?")) return;

    await updateDoc(doc(db, "posts", btn.dataset.id), { deleted: true });
    await loadPostsAndReports();
  };

  const reportsSnap = await getDocs(
    query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100))
  );

  reportsSnap.docs.forEach(docSnap => {
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
        <button data-report-action="resolve" data-id="${docSnap.id}">Resolve</button>
        <button data-report-action="dismiss" data-id="${docSnap.id}">Dismiss</button>
      </td>
    `;

    reportsTbody.appendChild(tr);
  });

  reportsTbody.onclick = async e => {
    const btn = e.target.closest("button[data-report-action]");
    if (!btn) return;

    console.log("🚨 Report action:", btn.dataset.reportAction, btn.dataset.id);

    const ref = doc(db, "reports", btn.dataset.id);
    if (btn.dataset.reportAction === "resolve") await updateDoc(ref, { status: "resolved" });
    if (btn.dataset.reportAction === "dismiss") await updateDoc(ref, { status: "dismissed" });

    await loadPostsAndReports();
  };
}

/* ============================================================
   SETTINGS
============================================================ */
async function loadSettings() {
  console.log("⚙️ Loading settings");

  const settingsRef = doc(db, "settings", "global");
  let snap = await getDoc(settingsRef);

  if (!snap.exists()) {
    console.warn("⚠️ Global settings missing, creating defaults");
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

  document.getElementById("toggleBusinessPremium").checked = !!d.businessPremiumEnabled;
  document.getElementById("togglePostingEnabled").checked = !!d.postingEnabled;
  document.getElementById("toggleSignupsEnabled").checked = !!d.newSignupsEnabled;
  document.getElementById("adminBannerInput").value = d.homepageBanner || "";
  document.getElementById("adminFeaturedBusinessId").value = d.homepageFeaturedBusinessId || "";
}

/* ============================================================
   SUBSCRIPTIONS
============================================================ */
async function loadSubscriptions() {
  console.log("💳 Loading subscriptions");

  const tbody = document.getElementById("adminSubscriptionsTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  const snap = await getDocs(
    query(collection(db, "users"), where("isBusiness", "==", true))
  );

  snap.docs.forEach(docSnap => {
    const d = docSnap.data();
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${d.name || d.displayName || "(no name)"}</td>
      <td>${d.plan || "free"}</td>
      <td>${d.stripeStatus || "-"}</td>
      <td>${d.nextBillingDate || "-"}</td>
      <td>
        <button data-sub-action="upgrade" data-id="${docSnap.id}">Upgrade</button>
        <button data-sub-action="downgrade" data-id="${docSnap.id}">Downgrade</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.onclick = async e => {
    const btn = e.target.closest("button[data-sub-action]");
    if (!btn) return;

    console.log("💳 Subscription action:", btn.dataset.subAction, btn.dataset.id);

    const ref = doc(db, "users", btn.dataset.id);
    if (btn.dataset.subAction === "upgrade") await updateDoc(ref, { plan: "premium" });
    if (btn.dataset.subAction === "downgrade") await updateDoc(ref, { plan: "free" });

    await loadSubscriptions();
    await loadBusinesses();
  };
    }
