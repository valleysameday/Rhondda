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

  setText("sellerName", user.name || user.displayName || "User");
  setText("streakCount", user.loginStreak || 0);
  setText("sellerBio", user.bio || "This user hasn't added a bio yet.");

  if (user.joined?.toDate) {
    setText("sellerReliability", `Member since ${user.joined.toDate().getFullYear()}`);
  }

  const avatar = document.getElementById("sellerAvatar");
  if (avatar) {
    if (user.avatarUrl) {
      avatar.style.backgroundImage = `url(${user.avatarUrl})`;
      avatar.textContent = "";
    } else {
      avatar.textContent = (user.name || "U").charAt(0).toUpperCase();
    }
  }

  const ribbon = document.getElementById("businessRibbon");
  if (ribbon && user.isBusiness) ribbon.style.display = "flex";

  await loadFollowerCount(userId);
  await loadSellerAds(userId);

  const backBtn = document.getElementById("backToPost");
  if (backBtn) backBtn.onclick = () => loadView("view-post", { forceInit: true });

  createToastContainer();
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
    if (checkbox) checkbox.addEventListener("change", updateToast);

    container.appendChild(card);
  });
}

/* -------------------- Toast -------------------- */
function createToastContainer() {
  let existing = document.getElementById("bundleToast");
  if (existing) return;

  const toast = document.createElement("div");
  toast.id = "bundleToast";
  toast.className = "bundle-toast";

  toast.innerHTML = `
    <h4>Bundle Selected</h4>
    <div id="toastItems"></div>
    <textarea id="toastMessage" placeholder="Add a message..."></textarea>
    <div class="toast-actions">
      <button id="toastSendBtn">Send</button>
      <button id="toastCancelBtn">Cancel</button>
    </div>
  `;

  document.body.appendChild(toast);

  // ⭐ FIXED: Send button no longer jumps to chat
  const sendBtn = document.getElementById("toastSendBtn");
  sendBtn.addEventListener("click", () => {
    const selected = document.querySelectorAll(".bundle-tick:checked");
    if (!selected.length) return;

    const extraMsg = document.getElementById("toastMessage").value.trim();
    let msg = "Bundle Enquiry:\n\n";

    selected.forEach(t => {
      msg += `• ${t.dataset.title}`;
      if (sellerIsPremium) msg += ` (£${parseFloat(t.dataset.price).toFixed(2)})`;
      msg += "\n";
    });

    if (extraMsg) msg += `\nMessage: ${extraMsg}`;

    // Save message for chat page
    sessionStorage.setItem("pendingMessage", msg);

    // Close toast
    toast.style.display = "none";

    // Show confirmation
    showBundleConfirmation();
  });

  // Cancel button
  const cancelBtn = document.getElementById("toastCancelBtn");
  cancelBtn.addEventListener("click", () => {
    toast.style.display = "none";
  });
}

/* -------------------- Confirmation Toast -------------------- */
function showBundleConfirmation() {
  const div = document.createElement("div");
  div.className = "bundle-confirm";
  div.textContent = "Bundle message saved. Open chat to send.";
  document.body.appendChild(div);

  setTimeout(() => div.remove(), 2500);
}

function updateToast() {
  const selected = document.querySelectorAll(".bundle-tick:checked");
  const toast = document.getElementById("bundleToast");
  const toastItems = document.getElementById("toastItems");
  const toastMsg = document.getElementById("toastMessage");

  if (!toast || !toastItems || !toastMsg) return;

  if (!selected.length) {
    toast.style.display = "none";
    toastItems.innerHTML = "";
    toastMsg.value = "";
    return;
  }

  toastItems.innerHTML = "";
  selected.forEach(t => {
    const div = document.createElement("div");
    div.textContent = sellerIsPremium
      ? `${t.dataset.title} (£${parseFloat(t.dataset.price).toFixed(2)})`
      : t.dataset.title;
    div.style.marginBottom = "4px";
    toastItems.appendChild(div);
  });

  toast.style.display = "block";
}

/* -------------------- Followers -------------------- */
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
