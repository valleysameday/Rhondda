// ===============================
//  VIEW POST PAGE LOGIC
// ===============================

import {
  getFirestore, doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// -------------------------------
//  DOM ELEMENTS
// -------------------------------
const postTitleEl = document.getElementById("postTitle");
const postPriceEl = document.getElementById("postPrice");
const postDescEl = document.getElementById("postDescription");
const postImageEl = document.getElementById("postImage");

const sellerBox = document.getElementById("sellerBox");
const sellerNameEl = document.getElementById("sellerName");
const sellerAvatarEl = document.getElementById("sellerAvatar");
const sellerRibbonEl = document.getElementById("sellerRibbon");

const bizInfoSection = document.getElementById("bizInfoSection");
const bizPhoneMasked = document.getElementById("bizPhoneMasked");
const revealBizPhoneBtn = document.getElementById("revealBizPhoneBtn");
const bizWebsiteLink = document.getElementById("bizWebsiteLink");
const bizAreaValue = document.getElementById("bizAreaValue");
const bizBioValue = document.getElementById("bizBioValue");

const viewProfileBtn = document.getElementById("viewProfileBtn");

// -------------------------------
//  GET POST ID
// -------------------------------
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

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

  // Detect business ad
  if (post.businessId) {
    await loadBusinessSeller(post.businessId);
  } else {
    await loadPersonalSeller(post.uid);
  }
}

// -------------------------------
//  LOAD PERSONAL SELLER
// -------------------------------
async function loadPersonalSeller(uid) {
  bizInfoSection.style.display = "none";
  sellerRibbonEl.style.display = "none";

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const user = userSnap.data();

  sellerNameEl.textContent = user.name || "Seller";

  if (user.avatarUrl) {
    sellerAvatarEl.style.backgroundImage = `url(${user.avatarUrl})`;
    sellerAvatarEl.textContent = "";
  } else {
    sellerAvatarEl.textContent = (user.name || "U").charAt(0).toUpperCase();
  }

  viewProfileBtn.onclick = () => {
    window.location.href = `/seller-profile.html?uid=${uid}`;
  };
}

// -------------------------------
//  LOAD BUSINESS SELLER
// -------------------------------
async function loadBusinessSeller(uid) {
  const bizRef = doc(db, "businesses", uid);
  const bizSnap = await getDoc(bizRef);

  if (!bizSnap.exists()) return;

  const biz = bizSnap.data();

  // Show business UI
  bizInfoSection.style.display = "block";
  sellerRibbonEl.style.display = "inline-block";

  sellerNameEl.textContent = biz.businessName || "Business";

  // Avatar
  if (biz.avatarUrl) {
    sellerAvatarEl.style.backgroundImage = `url(${biz.avatarUrl})`;
    sellerAvatarEl.textContent = "";
  } else {
    sellerAvatarEl.textContent = (biz.businessName || "B").charAt(0).toUpperCase();
  }

  // Business Info
  bizPhoneMasked.textContent = "••••••••••";
  revealBizPhoneBtn.style.display = "inline-block";

  revealBizPhoneBtn.onclick = () => {
    bizPhoneMasked.textContent = biz.phone || "No phone listed";
    revealBizPhoneBtn.style.display = "none";
    incrementBusinessLead(uid);
  };

  bizWebsiteLink.textContent = biz.website || "";
  bizWebsiteLink.href = biz.website || "#";

  bizAreaValue.textContent = biz.area || "No area listed";
  bizBioValue.textContent = biz.bio || "This business has not added a description.";

  // View Profile Button
  viewProfileBtn.onclick = () => {
    window.location.href = `/seller-profile.html?uid=${uid}`;
  };
}

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
loadPost();
