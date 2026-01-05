// ===============================
//  SELLER PROFILE PAGE LOGIC
// ===============================

import {
  getFirestore, doc, getDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// -------------------------------
//  DOM ELEMENTS
// -------------------------------
const sellerNameEl = document.getElementById("sellerName");
const sellerAvatarEl = document.getElementById("sellerAvatar");
const sellerBioEl = document.getElementById("sellerBio");
const sellerReliabilityEl = document.getElementById("sellerReliability");
const sellerAdsContainer = document.getElementById("sellerAdsContainer");
const businessRibbon = document.getElementById("businessRibbon");

// Business Info Section
const businessInfoSection = document.getElementById("businessInfoSection");
const bizPhoneMasked = document.getElementById("bizPhoneMasked");
const revealBizPhoneBtn = document.getElementById("revealBizPhoneBtn");
const bizWebsiteLink = document.getElementById("bizWebsiteLink");
const bizAreaValue = document.getElementById("bizAreaValue");
const bizBioValue = document.getElementById("bizBioValue");

// Personal Bio Section
const personalBioSection = document.getElementById("personalBioSection");

// -------------------------------
//  GET USER ID FROM URL
// -------------------------------
const urlParams = new URLSearchParams(window.location.search);
const profileUid = urlParams.get("uid");

// -------------------------------
//  LOAD PROFILE
// -------------------------------
async function loadProfile() {
  if (!profileUid) return;

  const userRef = doc(db, "users", profileUid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    sellerNameEl.textContent = "User Not Found";
    return;
  }

  const userData = userSnap.data();

  // Check if this is a business account
  const isBusiness = userData.isBusiness === true;

  if (isBusiness) {
    await loadBusinessProfile(profileUid);
  } else {
    await loadPersonalProfile(userData);
  }

  await loadUserAds(profileUid, isBusiness);
}

// -------------------------------
//  LOAD PERSONAL PROFILE
// -------------------------------
async function loadPersonalProfile(userData) {
  businessInfoSection.style.display = "none";
  personalBioSection.style.display = "block";
  businessRibbon.style.display = "none";

  sellerNameEl.textContent = userData.name || "Unnamed Seller";
  sellerBioEl.textContent = userData.bio || "This seller has not added a bio yet.";
  sellerReliabilityEl.textContent = userData.reliability || "";

  // Avatar
  if (userData.avatarUrl) {
    sellerAvatarEl.style.backgroundImage = `url(${userData.avatarUrl})`;
    sellerAvatarEl.textContent = "";
  } else {
    sellerAvatarEl.textContent = (userData.name || "U").charAt(0).toUpperCase();
  }
}

// -------------------------------
//  LOAD BUSINESS PROFILE
// -------------------------------
async function loadBusinessProfile(uid) {
  const bizRef = doc(db, "businesses", uid);
  const bizSnap = await getDoc(bizRef);

  if (!bizSnap.exists()) {
    sellerNameEl.textContent = "Business Not Found";
    return;
  }

  const biz = bizSnap.data();

  // Show business UI
  businessInfoSection.style.display = "block";
  personalBioSection.style.display = "none";
  businessRibbon.style.display = "inline-block";

  // Header
  sellerNameEl.textContent = biz.businessName || "Unnamed Business";
  sellerReliabilityEl.textContent = "Business Account";

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
}

// -------------------------------
//  LOAD ADS (PERSONAL OR BUSINESS)
// -------------------------------
async function loadUserAds(uid, isBusiness) {
  sellerAdsContainer.innerHTML = "";

  const postsRef = collection(db, "posts");
  const q = query(
    postsRef,
    where(isBusiness ? "businessId" : "uid", "==", uid)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    sellerAdsContainer.innerHTML = "<p>No ads yet.</p>";
    return;
  }

  snap.forEach(docSnap => {
    const p = docSnap.data();

    const card = document.createElement("div");
    card.className = "post-card";
    card.onclick = () => {
      window.location.href = `/view-post.html?id=${docSnap.id}`;
    };

    card.innerHTML = `
      <div class="post-image">
        <img src="${p.imageUrls?.[0] || "/img/placeholder.png"}">
      </div>
      <div class="post-body">
        <div class="post-price">£${p.price}</div>
        <div>${p.title}</div>
      </div>
    `;

    sellerAdsContainer.appendChild(card);
  });
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
loadProfile();
