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

  const profileSnap = await getDoc(doc(db, "users", userId));
  if (!profileSnap.exists()) return loadView("home");

  const user = profileSnap.data();

  sellerIsPremium = !!(user.isBusiness || user.isSellerPlus);

  /* Reliability */
  const reliabilityEl = document.getElementById("sellerReliability");
  if (reliabilityEl && user.joined?.toDate) {
    reliabilityEl.textContent = `Member since ${user.joined.toDate().getFullYear()}`;
  }

  setText("sellerName", user.name || user.displayName || "User");
  setText("sellerBio", user.bio || "This user hasn't added a bio yet.");
  setText("streakCount", user.loginStreak || 0);

  /* Avatar */
  const avatar = document.getElementById("sellerAvatar");
  if (avatar) {
    if (user.avatarUrl) {
      avatar.style.backgroundImage = `url(${user.avatarUrl})`;
      avatar.textContent = "";
    } else {
      avatar.textContent = (user.name || "U").charAt(0).toUpperCase();
    }
  }

  /* Business Ribbon */
  const ribbon = document.getElementById("businessRibbon");
  if (ribbon && user.isBusiness) ribbon.style.display = "flex";

  await loadFollowerCount(userId);
  await loadSellerAds(userId);

  const backBtn = document.getElementById("backToPost");
  if (backBtn) backBtn.onclick = () => loadView("view-post", { forceInit: true });
}

/* ===============================
   LOAD ADS
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
      <label class="bundle-select">
        <input
          type="checkbox"
          class="bundle-tick"
          data-id="${post.id}"
          data-title="${post.title}"
          data-price="${post.price || 0}"
        >
        <span></span>
      </label>

      <div class="post-image">
        <img src="${post.imageUrl || '/images/placeholder.webp'}">
      </div>

      <div class="post-body">
        <h3>${post.title}</h3>
        <p class="post-price">£${post.price || "0.00"}</p>
      </div>
    `;

    card.querySelector(".bundle-tick")
      .addEventListener("change", updateActionDock);

    container.appendChild(card);
  });

  setupDockButton(sellerId);
}

/* ===============================
   ACTION DOCK (STICKY BUTTON)
================================ */
function updateActionDock() {
  const selected = document.querySelectorAll(".bundle-tick:checked");
  const dockBtn = document.getElementById("combinedEnquiryBtn");
  const countEl = document.getElementById("selectedCount");

  if (!dockBtn) return;

  if (!selected.length) {
    dockBtn.style.display = "none";
    closePopup();
    return;
  }

  dockBtn.style.display = "flex";
  if (countEl) countEl.textContent = selected.length;
}

function setupDockButton(sellerId) {
  const dockBtn = document.getElementById("combinedEnquiryBtn");
  if (!dockBtn) return;

  dockBtn.onclick = () => openPopup(sellerId);
}

/* ===============================
   POPUP
================================ */
function openPopup(sellerId) {
  const selected = document.querySelectorAll(".bundle-tick:checked");
  if (!selected.length) return;

  const summary = document.getElementById("popupItemsSummary");
  const tally = document.getElementById("popupPriceTally");
  const popup = document.getElementById("contactPopup");

  let total = 0;
  summary.innerHTML = "";

  selected.forEach(t => {
    const price = parseFloat(t.dataset.price || 0);
    total += price;

    summary.innerHTML += sellerIsPremium
      ? `<div class="summary-item">
           <span>${t.dataset.title}</span>
           <span>£${price.toFixed(2)}</span>
         </div>`
      : `<p class="plain-item">• ${t.dataset.title}</p>`;
  });

  if (tally) {
    tally.style.display = sellerIsPremium ? "flex" : "none";
    const totalEl = document.getElementById("totalPriceAmount");
    if (totalEl) totalEl.textContent = `£${total.toFixed(2)}`;
  }

  popup.style.display = "flex";

  const sendBtn = document.getElementById("popupSendBtn");
  if (sendBtn) {
    sendBtn.onclick = () => {
      let msg = "Bundle Enquiry:\n\n";
      selected.forEach(t => msg += `• ${t.dataset.title}\n`);

      sessionStorage.setItem("pendingMessage", msg);
      loadView("chat", { forceInit: true });
    };
  }
}

function closePopup() {
  const popup = document.getElementById("contactPopup");
  if (popup) popup.style.display = "none";
}

/* Cancel button */
const cancelBtn = document.getElementById("popupCancelBtn");
if (cancelBtn) cancelBtn.onclick = closePopup;

/* ===============================
   FOLLOWERS
================================ */
async function loadFollowerCount(id) {
  const el = document.getElementById("followerCount");
  if (!el) return;

  const snap = await getDocs(collection(db, "users", id, "followers"));
  el.textContent = snap.size;
}

/* ===============================
   HELPERS
================================ */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
