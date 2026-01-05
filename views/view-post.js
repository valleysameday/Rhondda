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
console.log("[VIEW POST] URL postId:", postId);

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
      console.warn("[LOAD POST] No postId in URL");
      postTitleEl.textContent = "Post Not Found";
      return;
    }

    if (!db) {
      console.error("[LOAD POST] Firestore db is not initialised");
      postTitleEl.textContent = "Error loading post";
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
    postImageEl.src = post.imageUrls?.[0] || "/img/placeholder.png";

    // Detect seller type
    sellerUid = post.businessId || post.userId;
    console.log("[LOAD POST] sellerUid resolved to:", sellerUid, "businessId:", post.businessId, "userId:", post.userId);

    if (!sellerUid) {
      console.warn("[LOAD POST] No sellerUid found on post");
    }

    if (post.businessId) {
      console.log("[LOAD POST] Loading business seller:", post.businessId);
      await loadBusinessSeller(post.businessId);
    } else if (post.userId) {
      console.log("[LOAD POST] Loading personal seller:", post.userId);
      await loadPersonalSeller(post.userId);
    } else {
      console.warn("[LOAD POST] Post has neither businessId nor userId");
    }

    if (sellerUid) {
      await loadOtherAds(sellerUid);
    } else {
      console.warn("[LOAD POST] Skipping other ads, sellerUid is null");
    }
  } catch (err) {
    console.error("[LOAD POST] Error:", err);
    postTitleEl.textContent = "Error loading post";
  }
}

// -------------------------------
//  LOAD PERSONAL SELLER
// -------------------------------
async function loadPersonalSeller(uid) {
  try {
    if (!uid) {
      console.warn("[LOAD PERSONAL SELLER] No uid provided");
      return;
    }

    console.log("[LOAD PERSONAL SELLER] Fetching user:", uid);
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.warn("[LOAD PERSONAL SELLER] User not found:", uid);
      return;
    }

    const user = userSnap.data();
    console.log("[LOAD PERSONAL SELLER] User data:", user);

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

    // Hide business-only fields
    sellerWebsiteEl.style.display = "none";
    revealBizPhoneBtn.style.display = "none";
    bizPhoneMasked.style.display = "none";
  } catch (err) {
    console.error("[LOAD PERSONAL SELLER] Error:", err);
  }
}

// -------------------------------
//  LOAD BUSINESS SELLER
// -------------------------------
async function loadBusinessSeller(uid) {
  try {
    if (!uid) {
      console.warn("[LOAD BUSINESS SELLER] No uid provided");
      return;
    }

    console.log("[LOAD BUSINESS SELLER] Fetching business:", uid);
    const bizRef = doc(db, "businesses", uid);
    const bizSnap = await getDoc(bizRef);
    if (!bizSnap.exists()) {
      console.warn("[LOAD BUSINESS SELLER] Business not found:", uid);
      return;
    }

    const biz = bizSnap.data();
    console.log("[LOAD BUSINESS SELLER] Business data:", biz);

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
    console.error("[LOAD BUSINESS SELLER] Error:", err);
  }
}

// -------------------------------
//  LOAD OTHER ADS
// -------------------------------
async function loadOtherAds(uid) {
  try {
    console.log("[OTHER ADS] Loading other ads for seller:", uid);
    otherAdsCarousel.innerHTML = "";

    const postsRef = collection(db, "posts");
    const q = query(postsRef, where("userId", "==", uid));
    const snap = await getDocs(q);

    console.log("[OTHER ADS] Found posts:", snap.size);

    snap.forEach(docSnap => {
      const p = docSnap.data();
      console.log("[OTHER ADS] Post:", docSnap.id, p);

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
  } catch (err) {
    console.error("[OTHER ADS] Error:", err);
  }
}

// -------------------------------
//  OPEN BUNDLE MODAL
// -------------------------------
openBundleModalBtn.onclick = async () => {
  try {
    console.log("[BUNDLE] Opening bundle modal for seller:", sellerUid);
    bundleModal.style.display = "block";
    bundleItems = [];
    bundleList.innerHTML = "";
    bundleTotalEl.textContent = "£0";

    if (!sellerUid) {
      console.warn("[BUNDLE] No sellerUid, cannot load bundle items");
      return;
    }

    const postsRef = collection(db, "posts");
    // IMPORTANT: use userId, not uid
    const q = query(postsRef, where("userId", "==", sellerUid));
    const snap = await getDocs(q);

    console.log("[BUNDLE] Found posts for bundle:", snap.size);

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
  console.log("[BUNDLE] Setting up bundle buttons");
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
  console.log("[BUNDLE] Updated total:", total);
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

  console.log("[BUNDLE] Sending bundle message with items:", bundleItems);
  alert("Bundle message sent (placeholder).");
  bundleModal.style.display = "none";
};

// -------------------------------
//  INCREMENT BUSINESS LEADS
// -------------------------------
async function incrementBusinessLead(uid) {
  try {
    console.log("[LEADS] Incrementing lead for business:", uid);
    const bizRef = doc(db, "businesses", uid);
    const bizSnap = await getDoc(bizRef);
    if (!bizSnap.exists()) {
      console.warn("[LEADS] Business not found:", uid);
      return;
    }

    const current = bizSnap.data().leads || 0;

    await updateDoc(bizRef, {
      leads: current + 1
    });

    console.log("[LEADS] New lead count:", current + 1);
  } catch (err) {
    console.error("[LEADS] Error incrementing lead:", err);
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
