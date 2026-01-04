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

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const userId = sessionStorage.getItem("profileUserId");
  if (!userId) return loadView("home");

  const profileSnap = await getDoc(doc(db, "users", userId));
  if (!profileSnap.exists()) return loadView("home");

  const user = profileSnap.data();
  sellerIsPremium = !!(user.isBusiness || user.isSellerPlus);

  // -------------------- Basic Profile Info --------------------
  setText("sellerName", user.name || user.displayName || "User");
  setText("streakCount", user.loginStreak || 0);
  setText("sellerBio", user.bio || "This user hasn't added a bio yet.");
  if (user.joined?.toDate) {
    setText("sellerReliability", `Member since ${user.joined.toDate().getFullYear()}`);
  }

  // -------------------- Avatar --------------------
  const avatar = document.getElementById("sellerAvatar");
  if (avatar) {
    if (user.avatarUrl) {
      avatar.style.backgroundImage = `url(${user.avatarUrl})`;
      avatar.textContent = "";
    } else {
      avatar.textContent = (user.name || "U").charAt(0).toUpperCase();
    }
  }

  // -------------------- Business Ribbon --------------------
  const ribbon = document.getElementById("businessRibbon");
  if (ribbon && user.isBusiness) ribbon.style.display = "flex";

  // -------------------- Load Followers & Ads --------------------
  await loadFollowerCount(userId);
  await loadSellerAds(userId);

  // -------------------- Back Button --------------------
  const backBtn = document.getElementById("backToPost");
  if (backBtn) backBtn.onclick = () => loadView("view-post", { forceInit: true });
}

/* -------------------- Load Seller Ads -------------------- */
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
      <label class="bundle-select">
        <input type="checkbox" class="bundle-tick" data-id="${post.id}" data-title="${post.title}" data-price="${post.price || 0}">
        <span></span>
      </label>
      <div class="post-image"><img src="${post.imageUrl || '/images/placeholder.webp'}"></div>
      <div class="post-body">
        <h3>${post.title}</h3>
        <p class="post-price">£${post.price || '0.00'}</p>
      </div>
    `;

    const checkbox = card.querySelector(".bundle-tick");
    if (checkbox) checkbox.addEventListener("change", updateActionDock);

    container.appendChild(card);
  });

  setupDockButton();
}

/* -------------------- Update Dock Button -------------------- */
function updateActionDock() {
  const selected = document.querySelectorAll(".bundle-tick:checked");
  const dockBtn = document.getElementById("combinedEnquiryBtn");
  const countEl = document.getElementById("selectedCount");

  if (!dockBtn) return;

  if (!selected.length) {
    dockBtn.style.display = "none";
    return;
  }

  dockBtn.style.display = "flex";
  if (countEl) countEl.textContent = selected.length;
}

/* -------------------- Dock Button Click -------------------- */
function setupDockButton() {
  const dockBtn = document.getElementById("combinedEnquiryBtn");
  if (!dockBtn) return;

  dockBtn.onclick = () => openPopup();
}

/* -------------------- Popup -------------------- */
function openPopup() {
  const selected = document.querySelectorAll(".bundle-tick:checked");
  if (!selected.length) return;

  const summary = document.getElementById("popupItemsSummary");
  const tally = document.getElementById("totalPriceAmount") ? document.getElementById("popupPriceTally") : null;
  const popup = document.getElementById("contactPopup");

  summary.innerHTML = "";
  let total = 0;

  selected.forEach(t => {
    const price = parseFloat(t.dataset.price || 0);
    total += price;

    summary.innerHTML += sellerIsPremium
      ? `<div class="summary-item"><span>${t.dataset.title}</span><span>£${price.toFixed(2)}</span></div>`
      : `<p class="plain-item">• ${t.dataset.title}</p>`;
  });

  if (tally) {
    tally.style.display = sellerIsPremium ? "flex" : "none";
    const totalEl = document.getElementById("totalPriceAmount");
    if (totalEl) totalEl.textContent = `£${total.toFixed(2)}`;
  }

  if (popup) popup.style.display = "flex";

  // Send button
  const sendBtn = document.getElementById("popupSendBtn");
  if (sendBtn) {
    sendBtn.onclick = () => {
      let msg = "Bundle Enquiry:\n\n";
      selected.forEach(t => {
        msg += `• ${t.dataset.title}`;
        if (sellerIsPremium) msg += ` (£${parseFloat(t.dataset.price).toFixed(2)})`;
        msg += "\n";
      });

      sessionStorage.setItem("pendingMessage", msg);
      loadView("chat", { forceInit: true });
    };
  }

  // Cancel button
  const cancelBtn = document.getElementById("popupCancelBtn");
  if (cancelBtn) cancelBtn.onclick = () => {
    if (popup) popup.style.display = "none";
  };
}

/* -------------------- Load Follower Count -------------------- */
async function loadFollowerCount(id) {
  const el = document.getElementById("followerCount");
  if (!el) return;

  const snap = await getDocs(collection(db, "users", id, "followers"));
  el.textContent = snap.size;
}

/* -------------------- Helpers -------------------- */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
