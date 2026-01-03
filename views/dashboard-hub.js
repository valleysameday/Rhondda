  import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db, userData;

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return;

  userData = snap.data();

  normalizePlan();
  handleBusinessTrialState();
  renderDashboard();
}

/* ------------------------------
   PLAN NORMALISATION
------------------------------ */
function normalizePlan() {
  if (!userData.plan) {
    userData.plan = "free";
  }
}

/* ------------------------------
   BUSINESS TRIAL HANDLING
   user.businessTrial = { startedAt: number, expiresAt: number, active: boolean }
------------------------------ */
function handleBusinessTrialState() {
  const trial = userData.businessTrial;
  if (!trial) return;

  const now = Date.now();
  if (trial.expiresAt && now > trial.expiresAt) {
    // Trial expired
    userData.businessTrial.active = false;
    if (userData.plan === "business") {
      userData.plan = "free"; // or "sellerplus" if you want a fallback
    }
  }
}

/* ------------------------------
   MAIN DASHBOARD RENDER
------------------------------ */
async function renderDashboard() {
  const plan = userData.plan;

  updatePlanBadge(plan);
  updateSidebar(plan);
  updateTrialBadges();
  renderWidgets(plan);
  await loadCounts();
  await loadRecentAds();
}

/* ------------------------------
   BADGES
------------------------------ */
function updatePlanBadge(plan) {
  const badge = document.getElementById("planBadge");
  badge.textContent =
    plan === "sellerplus" ? "Seller+ Member" :
    plan === "business" ? "Business Member" :
    "Free Member";

  badge.className = `plan-badge ${plan}`;
}

function updateTrialBadges() {
  const trial = userData.businessTrial;
  const trialBadge = document.getElementById("trialBadge");
  const sidebarTrialLabel = document.getElementById("sidebarTrialLabel");

  if (!trial || !trial.active) {
    trialBadge.style.display = "none";
    sidebarTrialLabel.textContent = "";
    return;
  }

  const daysLeft = Math.max(0, Math.ceil((trial.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)));

  trialBadge.style.display = "inline-block";
  trialBadge.textContent = `${daysLeft} days left (Business Trial)`;

  sidebarTrialLabel.textContent = `Business trial: ${daysLeft} days left`;
}

/* ------------------------------
   SIDEBAR
------------------------------ */
function updateSidebar(plan) {
  const box = document.getElementById("sidebarUpgradeBox");
  const label = document.getElementById("sidebarPlanLabel");

  label.textContent =
    plan === "sellerplus" ? "Seller+ Account" :
    plan === "business" ? "Business Account" :
    "Free Account";

  box.style.display = plan === "business" && userData.businessTrial && userData.businessTrial.active
    ? "block"
    : "block"; // always visible, but text changes
}

/* ------------------------------
   WIDGET SYSTEM
------------------------------ */
function renderWidgets(plan) {
  const grid = document.getElementById("widgetGrid");
  grid.innerHTML = "";

  addWidget(grid, widgetActiveAds());
  addWidget(grid, widgetMessages());
  addWidget(grid, widgetUnlockImpact(plan));

  if (plan === "free") {
    addWidget(grid, widgetAnalyticsLocked());
  }

  if (plan === "sellerplus") {
    addWidget(grid, widgetAnalytics());
    addWidget(grid, widgetBundle());
  }

  if (plan === "business") {
    addWidget(grid, widgetAnalytics());
    addWidget(grid, widgetPerformance());
    addWidget(grid, widgetBundle());
  }
}

function addWidget(grid, html) {
  const div = document.createElement("div");
  div.className = "widget slide-up";
  div.innerHTML = html;
  grid.appendChild(div);
}

/* ------------------------------
   WIDGET DEFINITIONS
------------------------------ */
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

function widgetUnlockImpact(plan) {
  if (plan === "free") {
    return `
      <div class="widget-title">Unlock Fees</div>
      <div class="widget-value" id="widgetUnlockCount">0</div>
      <div class="widget-sub">Your buyers paid £1.50 to see your number</div>
    `;
  } else {
    return `
      <div class="widget-title">Customer Savings</div>
      <div class="widget-value" id="widgetUnlockSavings">£0</div>
      <div class="widget-sub">You saved buyers unlock fees this month</div>
    `;
  }
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

/* ------------------------------
   COUNTS (ADS, MESSAGES, UNLOCKS)
   These are placeholders — wire to your collections.
------------------------------ */
async function loadCounts() {
  const user = auth.currentUser;
  if (!user) return;

  // Active ads
  const adsSnap = await getDocs(
    query(
      collection(db, "posts"),
      where("userId", "==", user.uid),
      where("status", "==", "active")
    )
  );
  const adCountEl = document.getElementById("widgetAdCount");
  if (adCountEl) adCountEl.textContent = adsSnap.size;

  // Unread messages (placeholder)
  const msgCountEl = document.getElementById("widgetMsgCount");
  if (msgCountEl) msgCountEl.textContent = 0;

  // Unlock impact / savings (placeholder)
  const unlockCountEl = document.getElementById("widgetUnlockCount");
  const unlockSavingsEl = document.getElementById("widgetUnlockSavings");

  if (unlockCountEl) unlockCountEl.textContent = 0;
  if (unlockSavingsEl) unlockSavingsEl.textContent = "£0";

  // Bundle enquiries count (placeholder)
  const bundleCountEl = document.getElementById("widgetBundleCount");
  if (bundleCountEl) bundleCountEl.textContent = 0;
}

/* ------------------------------
   RECENT ADS
------------------------------ */
async function loadRecentAds() {
  const list = document.getElementById("adsList");
  list.innerHTML = "";

  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "posts"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    list.innerHTML = `<p class="widget-sub">No ads yet. Post your first one!</p>`;
    return;
  }

  let count = 0;
  snap.forEach(docSnap => {
    if (count >= 5) return;
    const post = docSnap.data();
    const div = document.createElement("div");
    div.className = "mini-ad";
    div.innerHTML = `
      <img src="${post.imageUrl || '/images/image-webholder.webp'}" alt="">
      <p>${post.title || "Untitled"}</p>
    `;
    list.appendChild(div);
    count++;
  });
}

/* ------------------------------
   MODAL CONTROLS
------------------------------ */
window.showUpgradeModal = () => {
  document.getElementById("upgradeModal").style.display = "flex";
};

window.hideUpgradeModal = () => {
  document.getElementById("upgradeModal").style.display = "none";
};

/* ------------------------------
   SUBSCRIPTION / TRIAL HANDLER
------------------------------ */
window.handleSubscription = async (newPlan) => {
  const user = auth.currentUser;
  if (!user) return;

  if (newPlan === "business") {
    // Start 30‑day free trial, no card
    const now = Date.now();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

    userData.plan = "business";
    userData.businessTrial = {
      startedAt: now,
      expiresAt,
      active: true
    };

    await updateDoc(doc(db, "users", user.uid), {
      plan: "business",
      businessTrial: userData.businessTrial
    });

    alert("Your 30‑day Business trial has started!");
  } else if (newPlan === "sellerplus") {
    // Here you'd normally redirect to Stripe
    alert("Redirecting to secure payment for Seller+…");
    // After payment success:
    userData.plan = "sellerplus";
    await updateDoc(doc(db, "users", user.uid), {
      plan: "sellerplus"
    });
  } else if (newPlan === "free") {
    userData.plan = "free";
    await updateDoc(doc(db, "users", user.uid), {
      plan: "free"
    });
  }

  handleBusinessTrialState();
  await renderDashboard();
  hideUpgradeModal();
};

/* ------------------------------
   TAB SWITCHING
   (Hook into your SPA later)
------------------------------ */
window.switchTab = (tab) => {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  // For now, just log. Later: loadView('dashboard-' + tab)
  console.log("Switching to tab:", tab);
};
