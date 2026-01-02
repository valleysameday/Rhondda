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
let sellerTier = "free";

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const userId = sessionStorage.getItem("profileUserId");
  if (!userId) return loadView("home");

  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return loadView("home");

  const user = snap.data();

  /* ---- Account Tier ---- */
  if (user.isBusiness) sellerTier = "business";
  else if (user.isSellerPlus) sellerTier = "seller+";

  /* ---- Header ---- */
  document.getElementById("sellerName").textContent = user.name || "User";
  document.getElementById("sellerBio").textContent = user.bio || "No bio provided.";

  if (user.joined?.toDate) {
    document.getElementById("sellerReliability").textContent =
      `Member since ${user.joined.toDate().getFullYear()}`;
  }

  if (sellerTier !== "free") {
    document.getElementById("businessRibbon").style.display = "block";
    document.getElementById("businessRibbon").textContent =
      sellerTier === "business" ? "Verified Business" : "Seller+";
  }

  loadStats(userId);
  loadSellerAds(userId);
}

async function loadStats(id) {
  document.getElementById("streakCount").textContent = 0;
  const f = await getDocs(collection(db, "users", id, "followers"));
  document.getElementById("followerCount").textContent = f.size;
}

async function loadSellerAds(id) {
  const grid = document.getElementById("sellerAdsContainer");
  const q = query(
    collection(db, "posts"),
    where("userId", "==", id),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  grid.innerHTML = "";

  snap.forEach(docSnap => {
    const p = docSnap.data();
    const card = document.createElement("div");
    card.className = "post-card";
    card.innerHTML = `
      <input type="checkbox" class="bundle-tick"
        data-title="${p.title}"
        data-price="${p.price || 0}">
      <div class="post-image">
        <img src="${p.imageUrl || '/images/placeholder.webp'}">
      </div>
      <div class="post-body">
        <h3>${p.title}</h3>
        ${sellerTier !== "free" ? `<div class="post-price">£${p.price || 0}</div>` : ""}
      </div>
    `;
    card.querySelector(".bundle-tick").onchange = updateBundleUI;
    grid.appendChild(card);
  });

  setupPopup();
}

function updateBundleUI() {
  const selected = document.querySelectorAll(".bundle-tick:checked");
  const btn = document.getElementById("combinedEnquiryBtn");
  document.getElementById("selectedCount").textContent = selected.length;
  btn.style.display = selected.length ? "block" : "none";
}

function setupPopup() {
  document.getElementById("combinedEnquiryBtn").onclick = () => {
    const selected = document.querySelectorAll(".bundle-tick:checked");
    const list = document.getElementById("popupItemsSummary");
    const tally = document.getElementById("popupPriceTally");
    let total = 0;

    list.innerHTML = "";
    selected.forEach(i => {
      const price = Number(i.dataset.price);
      total += price;
      list.innerHTML += `
        <div class="summary-item">
          <span>${i.dataset.title}</span>
          ${sellerTier === "business" ? `<span>£${price}</span>` : ""}
        </div>`;
    });

    tally.style.display = sellerTier === "business" ? "flex" : "none";
    document.getElementById("totalPriceAmount").textContent = `£${total}`;

    document.getElementById("contactPopup").style.display = "flex";
  };

  document.getElementById("popupCancelBtn").onclick = () =>
    document.getElementById("contactPopup").style.display = "none";
}
