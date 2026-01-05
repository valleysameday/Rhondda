// ===============================
//  VIEW POST PAGE LOGIC (UNIFIED)
// ===============================

import { getFirebase } from "/index/js/firebase/init.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
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
//  GET POST ID (SPA + URL SUPPORT)
// -------------------------------
const urlParams = new URLSearchParams(window.location.search);
let postId = urlParams.get("id");

if (!postId) {
  postId = sessionStorage.getItem("viewPostId");
  console.log("[VIEW POST] Loaded postId from sessionStorage:", postId);
}

console.log("[VIEW POST] Final postId:", postId);

// -------------------------------
//  DOM ELEMENTS
// -------------------------------
const postTitleEl = document.getElementById("postTitle");
const postPriceEl = document.getElementById("postPrice");
const postDescEl = document.getElementById("postDescription");

// Gallery
const galleryWrapper = document.getElementById("postGallery");
const galleryCount = document.getElementById("galleryCount");
const mainImage = document.getElementById("mainImage");
const thumb1 = document.getElementById("thumb1");
const thumb2 = document.getElementById("thumb2");

// Lightbox
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");

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

// Other Ads
const otherAdsCarousel = document.getElementById("otherAdsCarousel");

// Bundle Modal
const openBundleModalBtn = document.getElementById("openBundleModalBtn");
const bundleModal = document.getElementById("bundleModal");
const bundleList = document.getElementById("bundleList");
const bundleTotalEl = document.getElementById("bundleTotal");
const sendBundleBtn = document.getElementById("sendBundleBtn");

// -------------------------------
//  STATE
// -------------------------------
let sellerUid = null;
let bundleItems = [];

// -------------------------------
//  LOAD POST
// -------------------------------
async function loadPost() {
  if (!postId) {
    postTitleEl.textContent = "Post Not Found";
    return;
  }

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    postTitleEl.textContent = "Post Not Found";
    return;
  }

  const post = postSnap.data();
  console.log("[POST]", post);

  // Fill UI
  postTitleEl.textContent = post.title || "Untitled";
  postPriceEl.textContent = post.price ? `£${post.price}` : "£0";
  postDescEl.textContent = post.description || "No description provided.";

  // Render gallery
  renderGallery(post);

  // Detect seller
  sellerUid = post.businessId || post.userId;

  if (post.businessId) {
    await loadBusinessSeller(post.businessId);
  } else {
    await loadPersonalSeller(post.userId);
  }

  await loadOtherAds(sellerUid);
}

// -------------------------------
//  GALLERY RENDERING
// -------------------------------
function renderGallery(post) {
  const images = [
    ...(post.imageUrls || []),
    post.imageUrl,
    ...(post.images || [])
  ].filter(Boolean);

  if (images.length === 0) {
    mainImage.src = "/images/image-webholder.webp";
    galleryCount.textContent = "0 photos";
    return;
  }

  // Count badge
  galleryCount.textContent = `${images.length} photos`;

  // Main image
  mainImage.src = images[0];

  // Thumbnails
  thumb1.src = images[1] || images[0];
  thumb2.src = images[2] || images[0];

  // Lightbox handlers
  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.style.display = "flex";
  }

  mainImage.onclick = () => openLightbox(images[0]);
  thumb1.onclick = () => openLightbox(images[1] || images[0]);
  thumb2.onclick = () => openLightbox(images[2] || images[0]);

  lightboxClose.onclick = () => {
    lightbox.style.display = "none";
  };
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

  if (user.avatarUrl) {
    sellerAvatarEl.style.backgroundImage = `url(${user.avatarUrl})`;
    sellerAvatarEl.textContent = "";
  } else {
    sellerAvatarEl.textContent = (user.name || "U").charAt(0).toUpperCase();
  }

  sellerNameEl.textContent = user.name || "Seller";
  sellerBioEl.textContent = user.bio || "This seller has not added a bio.";
  sellerAreaEl.textContent = user.area || "No area listed";

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

  if (biz.avatarUrl) {
    sellerAvatarEl.style.backgroundImage = `url(${biz.avatarUrl})`;
    sellerAvatarEl.textContent = "";
  } else {
    sellerAvatarEl.textContent = (biz.businessName || "B").charAt(0).toUpperCase();
  }

  sellerNameEl.textContent = biz.businessName || "Business";
  sellerBioEl.textContent = biz.bio || "This business has not added a description.";
  sellerAreaEl.textContent = biz.area || "No area listed";

  if (biz.website) {
    sellerWebsiteEl.textContent = biz.website;
    sellerWebsiteEl.href = biz.website;
    sellerWebsiteEl.style.display = "block";
  } else {
    sellerWebsiteEl.style.display = "none";
  }

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
      sessionStorage.setItem("viewPostId", docSnap.id);
      loadView("view-post", { forceInit: true });
    };

    card.innerHTML = `
      <img src="${p.imageUrls?.[0] || p.imageUrl || "/images/image-webholder.webp"}">
      <div class="carousel-price">£${p.price}</div>
    `;

    otherAdsCarousel.appendChild(card);
  });
}

// -------------------------------
//  BUNDLE MODAL
// -------------------------------
openBundleModalBtn.onclick = async () => {
  bundleModal.style.display = "block";
  bundleItems = [];
  bundleList.innerHTML = "";
  bundleTotalEl.textContent = "£0";

  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("userId", "==", sellerUid));
  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const p = docSnap.data();

    const row = document.createElement("div");
    row.className = "bundle-row";

    row.innerHTML = `
      <img src="${p.imageUrls?.[0] || p.imageUrl}">
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

sendBundleBtn.onclick = () => {
  if (bundleItems.length === 0) return alert("Select at least one item.");
  alert("Bundle message sent (placeholder).");
  bundleModal.style.display = "none";
};

// -------------------------------
//  BUSINESS LEADS
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
(async () => {
  await initFirebase();
  await loadPost();
})();
