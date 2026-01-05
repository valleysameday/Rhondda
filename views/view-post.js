// ===============================
//  VIEW POST PAGE LOGIC (UNIFIED)
//  Firebase loaded via getFirebase()
// ===============================

import { getFirebase } from "/index/js/firebase/init.js";

import {
  doc, getDoc, updateDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// -------------------------------
//  FIREBASE INIT
// -------------------------------
let db, auth, storage;

async function initFirebase() {
  try {
    const fb = await getFirebase();
    db = fb.db;
    auth = fb.auth;
    storage = fb.storage;
  } catch (err) {
    console.error("Firebase init failed:", err);
  }
}

// -------------------------------
//  DOM ELEMENTS
// -------------------------------
const postTitleEl = document.getElementById("postTitle");
const postPriceEl = document.getElementById("postPrice");
const postDescEl = document.getElementById("postDescription");
const postImageEl = document.getElementById("postImage");

// Seller Card
const sellerCardHeader = document.getElementById("sellerCardHeader");
const sellerAvatarEl = document.getElementById("sellerAvatar");
const sellerNameEl = document.getElementById("sellerName");
const sellerRibbonEl = document.getElementById("sellerRibbon");
const sellerBioEl = document.getElementById("sellerBio");
const sellerAreaEl = document.getElementById("sellerArea");
const sellerWebsiteEl = document.getElementById("sellerWebsite");
const bizPhoneMasked = document.getElementById("bizPhoneMasked");
const revealBizPhoneBtn = document.getElementById("revealBizPhoneBtn");
const followSellerBtn = document.getElementById("followSellerBtn");

// Other Ads
const otherAdsCarousel = document.getElementById("otherAdsCarousel");

// Bundle Modal
const openBundleModalBtn = document.getElementById("openBundleModalBtn");
const bundleModal = document.getElementById("bundleModal");
const bundleList = document.getElementById("bundleList");
const bundleTotalEl = document.getElementById("bundleTotal");
const sendBundleBtn = document.getElementById("sendBundleBtn");

// -------------------------------
//  GET POST ID
// -------------------------------
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

// -------------------------------
//  BUNDLE STATE
// -------------------------------
let bundleItems = [];
let sellerUid = null;

// -------------------------------
//  LOAD POST
// -------------------------------
async function loadPost() {
  if (!postId) return;

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    postTitleEl.textContent = "Post Not Found";
    return;
  }

  const post = postSnap.data();

  // Fill post UI
  postTitleEl.textContent = post.title;
  postPriceEl.textContent = `£${post.price}`;
  postDescEl.textContent = post.description;
  postImageEl.src = post.imageUrls?.[0] || "/img/placeholder.png";

  // Detect seller type
  sellerUid = post.businessId || post.userId;

  if (post.businessId) {
    await loadBusinessSeller(post.businessId);
  } else {
    await loadPersonalSeller(post.userId);
  }

  await loadOtherAds(sellerUid);
}

// -------------------------------
//  LOAD PERSONAL SELLER
// -------------------------------
async function loadPersonalSeller(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const user = userSnap.data();

  sellerCardHeader.textContent = "About This Seller";
  sellerRibbonEl.style.display = "none";

  // Avatar
  if (user.avatarUrl) {
    sellerAvatarEl.style.backgroundImage = `url(${user.avatarUrl})`;
    sellerAvatarEl.textContent = "";
  } else {
    sellerAvatarEl.textContent = (user.name || "U").charAt(0).toUpperCase();
  }

  sellerNameEl.textContent = user.name || "Seller";
  sellerBioEl.textContent = user.bio || "This seller has not added a bio.";
  sellerAreaEl.textContent = user.area || "No area listed";

  // Hide business-only fields
  sellerWebsiteEl.style.display = "none";
  revealBizPhoneBtn.style.display = "none";
  bizPhoneMasked.style.display = "none";
}

// -------------------------------
//  LOAD BUSINESS SELLER
// -------------------------------
async function loadBusinessSeller(uid) {
  const bizRef = doc(db, "businesses", uid);
  const bizSnap = await getDoc(bizRef);
  if (!bizSnap.exists()) return;

  const biz = bizSnap.data();

  sellerCardHeader.textContent = "About This Business";
  sellerRibbonEl.style.display = "inline-block";

  // Avatar
  if (biz.avatarUrl) {
    sellerAvatarEl.style.backgroundImage = `url(${biz.avatarUrl})`;
    sellerAvatarEl.textContent = "";
  } else {
    sellerAvatarEl.textContent = (biz.businessName || "B").charAt(0).toUpperCase();
  }

  sellerNameEl.textContent = biz.businessName || "Business";
  sellerBioEl.textContent = biz.bio || "This business has not added a description.";
  sellerAreaEl.textContent = biz.area || "No area listed";

  // Website
  if (biz.website) {
    sellerWebsiteEl.textContent = biz.website;
    sellerWebsiteEl.href = biz.website;
    sellerWebsiteEl.style.display = "block";
  } else {
    sellerWebsiteEl.style.display = "none";
  }

  // Phone reveal
  bizPhoneMasked.textContent = "••••••••••";
  revealBizPhoneBtn.style.display = "inline-block";
  bizPhoneMasked.style.display = "inline-block";

  revealBizPhoneBtn.onclick = () => {
    bizPhoneMasked.textContent = biz.phone || "No phone listed";
    revealBizPhoneBtn.style.display = "none";
    incrementBusinessLead(uid);
  };
}

// -------------------------------
//  LOAD OTHER ADS
// -------------------------------
async function loadOtherAds(uid) {
  otherAdsCarousel.innerHTML = "";

  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("userId", "==", uid));
  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const p = docSnap.data();

    const card = document.createElement("div");
    card.className = "carousel-card";
    card.onclick = () => {
      window.location.href = `/view-post.html?id=${docSnap.id}`;
    };

    card.innerHTML = `
      <img src="${p.imageUrls?.[0] || "/img/placeholder.png"}">
      <div class="carousel-price">£${p.price}</div>
    `;

    otherAdsCarousel.appendChild(card);
  });
}

// -------------------------------
//  OPEN BUNDLE MODAL
// -------------------------------
openBundleModalBtn.onclick = async () => {
  bundleModal.style.display = "block";
  bundleItems = [];
  bundleList.innerHTML = "";
  bundleTotalEl.textContent = "£0";

  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("uid", "==", sellerUid));
  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const p = docSnap.data();

    const row = document.createElement("div");
    row.className = "bundle-row";

    row.innerHTML = `
      <img src="${p.imageUrls?.[0] || "/img/placeholder.png"}">
      <div class="bundle-title">${p.title}</div>
      <div class="bundle-price">£${p.price}</div>
      <button class="bundle-add-btn" data-id="${docSnap.id}" data-price="${p.price}">
        + Add
      </button>
    `;

    bundleList.appendChild(row);
  });

  setupBundleButtons();
};

// -------------------------------
//  BUNDLE BUTTON LOGIC
// -------------------------------
function setupBundleButtons() {
  const buttons = document.querySelectorAll(".bundle-add-btn");

  buttons.forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const price = Number(btn.dataset.price);

      const exists = bundleItems.find(i => i.id === id);

      if (exists) {
        bundleItems = bundleItems.filter(i => i.id !== id);
        btn.textContent = "+ Add";
        btn.classList.remove("added");
      } else {
        bundleItems.push({ id, price });
        btn.textContent = "✓ Added";
        btn.classList.add("added");
      }

      updateBundleTotal();
    };
  });
}

function updateBundleTotal() {
  const total = bundleItems.reduce((sum, item) => sum + item.price, 0);
  bundleTotalEl.textContent = `£${total}`;
}

// -------------------------------
//  SEND BUNDLE MESSAGE
// -------------------------------
sendBundleBtn.onclick = () => {
  if (bundleItems.length === 0) return alert("Select at least one item.");

  alert("Bundle message sent (placeholder).");
  bundleModal.style.display = "none";
};

// -------------------------------
//  INCREMENT BUSINESS LEADS
// -------------------------------
async function incrementBusinessLead(uid) {
  const bizRef = doc(db, "businesses", uid);
  const bizSnap = await getDoc(bizRef);
  if (!bizSnap.exists()) return;

  const current = bizSnap.data().leads || 0;

  await updateDoc(bizRef, {
    leads: current + 1
  });
}

// -------------------------------
//  INIT
// -------------------------------
await initFirebase();
loadPost();
