import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { loadView } from "/index/js/main.js";

let auth, db;
let sellerIsPremium = false;

/* ===============================
   INIT
================================ */
export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const userId = sessionStorage.getItem("profileUserId");
  if (!userId) return loadView("home");

  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return loadView("home");

  const user = snap.data();

  /* ---------------- Seller Tier ---------------- */
  sellerIsPremium = !!(user.isBusiness || user.isSellerPlus);

  /* ---------------- Reliability ---------------- */
  let reliability = "Verified Member";
  if (user.joined?.toDate) {
    reliability = `Member since ${user.joined.toDate().getFullYear()}`;
  }
  setText("sellerReliability", reliability);

  /* ---------------- Profile Data ---------------- */
  setText("sellerName", user.name || user.displayName || "User");
  setText("streakCount", user.loginStreak || 0);
  setText("sellerBio", user.bio || "This user hasn't added a bio yet.");

  /* ---------------- Avatar ---------------- */
  const avatar = document.getElementById("sellerAvatar");
  if (avatar) {
    if (user.avatarUrl) {
      avatar.style.backgroundImage = `url(${user.avatarUrl})`;
      avatar.textContent = "";
    } else {
      avatar.textContent = (user.name || "U").charAt(0).toUpperCase();
    }
  }

  /* ---------------- Business Ribbon ---------------- */
  const ribbon = document.getElementById("businessRibbon");
  if (ribbon && user.isBusiness) ribbon.style.display = "flex";

  /* ---------------- Load Data ---------------- */
  await loadFollowerCount(userId);
  await loadSellerAds(userId);
  setupFollowBtn();

  /* ---------------- Back Button ---------------- */
  const backBtn = document.getElementById("backToPost");
  if (backBtn) backBtn.onclick = () => loadView("view-post", { forceInit: true });

  /* ---------------- Popup Cancel ---------------- */
  const cancelBtn = document.getElementById("popupCancelBtn");
  if (cancelBtn) cancelBtn.onclick = closeBundlePopup;
}

/* ===============================
   LOAD SELLER ADS
================================ */
async function loadSellerAds(sellerId) {
  const container = document.getElementById("sellerAdsContainer");
  if (!container) return;

  container.innerHTML = "";

  const q = query(
    collection(db, "posts"),
    where("userId", "==", sellerId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "<p class='empty-msg'>No other ads found.</p>";
    return;
  }

  snap.forEach(docSnap => {
    const post = { id: docSnap.id, ...docSnap.data() };

    const card = document.createElement("div");
    card.className = "post-card";
    card.innerHTML = `
      <input
        type="checkbox"
        class="bundle-tick"
        data-id="${post.id}"
        data-title="${post.title}"
        data-price="${post.price || 0}"
      >
      <div class="post-image">
        <img src="${post.imageUrl || "/images/placeholder.webp"}">
      </div>
      <div class="post-body">
        <h3>${post.title}</h3>
        <p class="post-price">£${post.price || "0.00"}</p>
      </div>
    `;

    card
      .querySelector(".bundle-tick")
      .addEventListener("change", handleBundleChange);

    container.appendChild(card);
  });
}

/* ===============================
   BUNDLE POPUP FLOW
================================ */
function handleBundleChange() {
  const selected = document.querySelectorAll(".bundle-tick:checked");
  if (!selected.length) {
    closeBundlePopup();
    return;
  }
  openBundlePopup();
}

function openBundlePopup() {
  const selected = document.querySelectorAll(".bundle-tick:checked");
  const popup = document.getElementById("contactPopup");
  const summary = document.getElementById("popupItemsSummary");
  const tally = document.getElementById("popupPriceTally");
  const totalEl = document.getElementById("totalPriceAmount");

  let total = 0;
  summary.innerHTML = "";

  selected.forEach(t => {
    const price = parseFloat(t.dataset.price || 0);
    total += price;

    summary.innerHTML += `
      <div class="summary-item">
        <span>${t.dataset.title}</span>
        ${
          sellerIsPremium
            ? `<span>£${price.toFixed(2)}</span>`
            : ""
        }
      </div>
    `;
  });

  if (sellerIsPremium) {
    tally.style.display = "flex";
    totalEl.textContent = `£${total.toFixed(2)}`;
  } else {
    tally.style.display = "none";
  }

  popup.style.display = "flex";

  const sendBtn = document.getElementById("popupSendBtn");
  if (sendBtn) sendBtn.onclick = sendBundleMessage;
}

function closeBundlePopup() {
  const popup = document.getElementById("contactPopup");
  if (popup) popup.style.display = "none";
}

function sendBundleMessage() {
  const selected = document.querySelectorAll(".bundle-tick:checked");
  if (!selected.length) return;

  let msg = "Bundle Enquiry:\n\n";
  selected.forEach(t => {
    msg += `• ${t.dataset.title}`;
    if (sellerIsPremium) {
      msg += ` (£${parseFloat(t.dataset.price || 0).toFixed(2)})`;
    }
    msg += "\n";
  });

  sessionStorage.setItem("pendingMessage", msg);
  loadView("chat", { forceInit: true });
}

/* ===============================
   FOLLOWERS
================================ */
async function loadFollowerCount(id) {
  const el = document.getElementById("followerCount");
  if (!el) return;

  const snap = await getDocs(collection(db, "users", id, "followers"));
  el.textContent = snap.size;
}

function setupFollowBtn() {
  const btn = document.getElementById("followSellerBtn");
  if (!btn) return;

  btn.onclick = () => {
    btn.classList.toggle("following");
    btn.textContent = btn.classList.contains("following")
      ? "Following ✓"
      : "Follow Seller";
  };
}

/* ===============================
   HELPERS
================================ */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
