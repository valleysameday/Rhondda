// ===============================
//  VIEW POST PAGE LOGIC (UNIFIED)
//  Firebase loaded via getFirebase()
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
    console.log("[INIT] Initialising Firebase...");
    const fb = await getFirebase();
    db = fb.db;
    auth = fb.auth;
    storage = fb.storage;
    console.log("[INIT] Firebase ready:", { db: !!db, auth: !!auth, storage: !!storage });
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

// Other Ads
const otherAdsCarousel = document.getElementById("otherAdsCarousel");

// Bundle Modal
const openBundleModalBtn = document.getElementById("openBundleModalBtn");
const bundleModal = document.getElementById("bundleModal");
const bundleList = document.getElementById("bundleList");
const bundleTotalEl = document.getElementById("bundleTotal");
const sendBundleBtn = document.getElementById("sendBundleBtn");

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
//  BUNDLE STATE
// -------------------------------
let bundleItems = [];
let sellerUid = null;

// -------------------------------
//  LOAD POST
// -------------------------------
async function loadPost() {
  try {
    if (!postId) {
      console.warn("[LOAD POST] No postId found");
      postTitleEl.textContent = "Post Not Found";
      return;
    }

    console.log("[LOAD POST] Fetching post:", postId);
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      console.warn("[LOAD POST] Post does not exist:", postId);
      postTitleEl.textContent = "Post Not Found";
      return;
    }

    const post = postSnap.data();
    console.log("[LOAD POST] Post data:", post);

    // Fill post UI
    postTitleEl.textContent = post.title || "Untitled";
    postPriceEl.textContent = post.price ? `£${post.price}` : "£0";
    postDescEl.textContent = post.description || "No description provided.";
    postImageEl.src =
  post.imageUrls?.[0] ||
  post.imageUrl ||
  post.images?.[0] ||
  "/images/image-webholder.webp";

    // Detect seller type
    sellerUid = post.businessId || post.userId;
    console.log("[LOAD POST] sellerUid:", sellerUid);

    if (post.businessId) {
      await loadBusinessSeller(post.businessId);
    } else if (post.userId) {
      await loadPersonalSeller(post.userId);
    } else {
      console.warn("[LOAD POST] No seller ID found on post");
    }

    if (sellerUid) {
      await loadOtherAds(sellerUid);
    }
  } catch (err) {
    console.error("[LOAD POST] Error:", err);
  }
}

// -------------------------------
//  LOAD PERSONAL SELLER
// -------------------------------
async function loadPersonalSeller(uid) {
  try {
    console.log("[SELLER] Loading personal seller:", uid);

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn("[SELLER] Personal seller not found:", uid);
      return;
    }

    const user = userSnap.data();
    console.log("[SELLER] Personal seller data:", user);

    sellerCardHeader.textContent = "About This Seller";
    sellerRibbonEl.style.display = "none";

    // Avatar
    if (user.avatarUrl) {
      sellerAvatarEl.style.backgroundImage = `url(${user.avatarUrl})`;
      sellerAvatarEl.textContent = "";
    } else {
      sellerAvatarEl.style.backgroundImage = "";
      sellerAvatarEl.textContent = (user.name || "U").charAt(0).toUpperCase();
    }

    sellerNameEl.textContent = user.name || "Seller";
    sellerBioEl.textContent = user.bio || "This seller has not added a bio.";
    sellerAreaEl.textContent = user.area || "No area listed";

    sellerWebsiteEl.style.display = "none";
    revealBizPhoneBtn.style.display = "none";
    bizPhoneMasked.style.display = "none";
  } catch (err) {
    console.error("[SELLER] Error loading personal seller:", err);
  }
}

// -------------------------------
//  LOAD BUSINESS SELLER
// -------------------------------
async function loadBusinessSeller(uid) {
  try {
    console.log("[SELLER] Loading business seller:", uid);

    const bizRef = doc(db, "businesses", uid);
    const bizSnap = await getDoc(bizRef);

    if (!bizSnap.exists()) {
      console.warn("[SELLER] Business seller not found:", uid);
      return;
    }

    const biz = bizSnap.data();
    console.log("[SELLER] Business seller data:", biz);

    sellerCardHeader.textContent = "About This Business";
    sellerRibbonEl.style.display = "inline-block";

    // Avatar
    if (biz.avatarUrl) {
      sellerAvatarEl.style.backgroundImage = `url(${biz.avatarUrl})`;
      sellerAvatarEl.textContent = "";
    } else {
      sellerAvatarEl.style.backgroundImage = "";
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
  } catch (err) {
    console.error("[SELLER] Error loading business seller:", err);
  }
}

// -------------------------------
//  LOAD OTHER ADS
// -------------------------------
async function loadOtherAds(uid) {
  try {
    console.log("[OTHER ADS] Loading ads for seller:", uid);

    otherAdsCarousel.innerHTML = "";

    const postsRef = collection(db, "posts");
    const q = query(postsRef, where("userId", "==", uid));
    const snap = await getDocs(q);

    console.log("[OTHER ADS] Found:", snap.size);

    snap.forEach(docSnap => {
      const p = docSnap.data();

      const card = document.createElement("div");
      card.className = "carousel-card";
      card.onclick = () => {
        sessionStorage.setItem("viewPostId", docSnap.id);
        loadView("view-post", { forceInit: true });
      };

      card.innerHTML = `
        <img src="${p.imageUrls?.[0] || "/img/placeholder.png"}">
        <div class="carousel-price">£${p.price}</div>
      `;

      otherAdsCarousel.appendChild(card);
    });
  } catch (err) {
    console.error("[OTHER ADS] Error:", err);
  }
}

// -------------------------------
//  OPEN BUNDLE MODAL
// -------------------------------
openBundleModalBtn.onclick = async () => {
  try {
    console.log("[BUNDLE] Opening modal for seller:", sellerUid);

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
  } catch (err) {
    console.error("[BUNDLE] Error:", err);
  }
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
  if (bundleItems.length === 0) {
    alert("Select at least one item.");
    return;
  }

  alert("Bundle message sent (placeholder).");
  bundleModal.style.display = "none";
};

// -------------------------------
//  INCREMENT BUSINESS LEADS
// -------------------------------
async function incrementBusinessLead(uid) {
  try {
    const bizRef = doc(db, "businesses", uid);
    const bizSnap = await getDoc(bizRef);
    if (!bizSnap.exists()) return;

    const current = bizSnap.data().leads || 0;

    await updateDoc(bizRef, {
      leads: current + 1
    });

    console.log("[LEADS] Incremented:", current + 1);
  } catch (err) {
    console.error("[LEADS] Error:", err);
  }
}

// -------------------------------
//  INIT
// -------------------------------
(async () => {
  console.log("[INIT] Starting view-post flow");
  await initFirebase();
  await loadPost();
})();
