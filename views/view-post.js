// ===============================
//  VIEW POST PAGE LOGIC (UNIFIED + UX ENHANCED)
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

import { loadView } from "/index/js/main.js";

// -------------------------------
//  FIREBASE INIT
// -------------------------------
let db, auth, storage;
async function initFirebase() {
  const fb = await getFirebase();
  db = fb.db;
  auth = fb.auth;
  storage = fb.storage;
}

// -------------------------------
//  TOAST SYSTEM (NO EXTRA FILES)
// -------------------------------
function showToast(message) {
  let toast = document.createElement("div");
  toast.textContent = message;

  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "rgba(0,0,0,0.85)";
  toast.style.color = "#fff";
  toast.style.padding = "12px 18px";
  toast.style.borderRadius = "8px";
  toast.style.fontSize = "15px";
  toast.style.zIndex = "999999";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";

  document.body.appendChild(toast);

  setTimeout(() => (toast.style.opacity = "1"), 10);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// -------------------------------
//  GET POST ID
// -------------------------------
const urlParams = new URLSearchParams(window.location.search);
let postId = urlParams.get("id") || sessionStorage.getItem("viewPostId");

// -------------------------------
//  DOM ELEMENTS
// -------------------------------

// Post
const postTitleEl = document.getElementById("postTitle");
const postPriceEl = document.getElementById("postPrice");
const postDescEl = document.getElementById("postDescription");

// Gallery
const galleryCount = document.getElementById("galleryCount");
const mainImage = document.getElementById("mainImage");
const thumb1 = document.getElementById("thumb1");
const thumb2 = document.getElementById("thumb2");

// Lightbox
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxBottom = document.getElementById("lightboxBottom");

// Seller
const sellerCardHeader = document.getElementById("sellerCardHeader");
const sellerAvatarEl = document.getElementById("sellerAvatar");
const sellerNameEl = document.getElementById("sellerName");
const sellerRibbonEl = document.getElementById("sellerRibbon");
const sellerBioEl = document.getElementById("sellerBio");
const sellerAreaEl = document.getElementById("sellerArea");
const bizPhoneMasked = document.getElementById("bizPhoneMasked");
const revealBizPhoneBtn = document.getElementById("revealBizPhoneBtn");

// Buttons
const messageSellerBtn = document.querySelector(".message-btn");
const followSellerBtn = document.getElementById("followSellerBtn");

// Other ads
const otherAdsCarousel = document.getElementById("otherAdsCarousel");

// Bundle modal
const openBundleModalBtn = document.getElementById("openBundleModalBtn");
const bundleModal = document.getElementById("bundleModal");
const bundleList = document.getElementById("bundleList");
const bundleTotalEl = document.getElementById("bundleTotal");
const sendBundleBtn = document.getElementById("sendBundleBtn");
const closeBundleModalBtn = document.querySelector(".close-modal");

// -------------------------------
//  STATE
// -------------------------------
let sellerUid = null;
let galleryImages = [];
let currentImageIndex = 0;
let bundleItems = [];


function renderPostDetails(post) {
  const box = document.getElementById("postDetails");
  if (!box) return;

  let html = `<h3>Details</h3>`;

  // PRICE
  if (post.price) {
    html += `<div class="detail-row"><span>Price:</span> £${post.price}</div>`;
  }

  // CONDITION (for sale)
  if (post.condition) {
    html += `<div class="detail-row"><span>Condition:</span> ${post.condition}</div>`;
  }

  // DELIVERY
  if (post.delivery) {
    html += `<div class="detail-row"><span>Delivery:</span> ${post.delivery}</div>`;
  }

  // PROPERTY TYPE
  if (post.propertyType) {
    html += `<div class="detail-row"><span>Property:</span> ${post.propertyType}</div>`;
  }

  // RENT FREQUENCY
  if (post.rentFrequency) {
    html += `<div class="detail-row"><span>Rent:</span> ${post.rentFrequency}</div>`;
  }

  // AREA
  if (post.area) {
    html += `<div class="detail-row"><span>Area:</span> ${post.area}</div>`;
  }

  // PROPERTY FEATURES
  if (post.propertyFeatures?.length > 0) {
    html += `<div class="detail-row"><span>Features:</span></div>`;
    html += `<div class="feature-badges">`;
    post.propertyFeatures.forEach(f => {
      html += `<div class="feature-badge">${f}</div>`;
    });
    html += `</div>`;
  }

  // JOB DETAILS
  if (post.jobType) {
    html += `<div class="detail-row"><span>Job type:</span> ${post.jobType}</div>`;
  }
  if (post.jobSalary) {
    html += `<div class="detail-row"><span>Salary:</span> ${post.jobSalary}</div>`;
  }
  if (post.jobExperience) {
    html += `<div class="detail-row"><span>Experience:</span> ${post.jobExperience}</div>`;
  }

  // EVENT DETAILS
  if (post.eventDate) {
    html += `<div class="detail-row"><span>Event date:</span> ${post.eventDate}</div>`;
  }
  if (post.eventStart) {
    html += `<div class="detail-row"><span>Starts:</span> ${post.eventStart}</div>`;
  }
  if (post.eventEnd) {
    html += `<div class="detail-row"><span>Ends:</span> ${post.eventEnd}</div>`;
  }
  if (post.eventVenue) {
    html += `<div class="detail-row"><span>Venue:</span> ${post.eventVenue}</div>`;
  }

  // COMMUNITY
  if (post.communityType) {
    html += `<div class="detail-row"><span>Community type:</span> ${post.communityType}</div>`;
  }

  // LOST & FOUND
  if (post.lostLocation) {
    html += `<div class="detail-row"><span>Last seen:</span> ${post.lostLocation}</div>`;
  }
  if (post.lostReward) {
    html += `<div class="detail-row"><span>Reward:</span> ${post.lostReward}</div>`;
  }

  box.innerHTML = html;
}
// -------------------------------
//  LOAD POST
// -------------------------------
async function loadPost() {
  if (!postId) return;

  const postSnap = await getDoc(doc(db, "posts", postId));
  if (!postSnap.exists()) {
    postTitleEl.textContent = "Post Not Found";
    return;
  }

  const post = postSnap.data();

  postTitleEl.textContent = post.title || "Untitled";
  postPriceEl.textContent = post.price ? `£${post.price}` : "£0";
  postDescEl.textContent = post.description || "No description provided.";

  renderGallery(post);
renderPostDetails(post);

  sellerUid = post.businessId || post.userId;

  
  if (post.businessId) {
    await loadBusinessSeller(post.businessId);
  } else {
    await loadPersonalSeller(post.userId);
  }

  await loadOtherAds(sellerUid);
  await updateFollowButtonState();
}

// -------------------------------
//  GALLERY
// -------------------------------
function renderGallery(post) {
  galleryImages = [
    ...(post.imageUrls || []),
    post.imageUrl,
    ...(post.images || [])
  ].filter(Boolean);

  if (!galleryImages.length) {
    mainImage.src = "/images/image-webholder.webp";
    galleryCount.textContent = "0 photos";
    return;
  }

  galleryCount.textContent = `${galleryImages.length} photos`;

  mainImage.src = galleryImages[0];
  thumb1.src = galleryImages[1] || galleryImages[0];
  thumb2.src = galleryImages[2] || galleryImages[0];

  mainImage.onclick = () => openLightbox(0);
  thumb1.onclick = () => openLightbox(1);
  thumb2.onclick = () => openLightbox(2);
}

// -------------------------------
//  LIGHTBOX
// -------------------------------
function openLightbox(index) {
  currentImageIndex = index;
  updateLightbox();
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
}

function updateLightbox() {
  lightboxImg.src = galleryImages[currentImageIndex];

  lightboxBottom.innerHTML = `
    <img src="/images/ad-placeholder.jpg" class="lightbox-ad" />
  `;

  preloadAdjacentImages();
}

function nextImage() {
  if (currentImageIndex < galleryImages.length - 1) {
    currentImageIndex++;
    updateLightbox();
  }
}

function prevImage() {
  if (currentImageIndex > 0) {
    currentImageIndex--;
    updateLightbox();
  }
}

function preloadAdjacentImages() {
  if (galleryImages[currentImageIndex + 1]) {
    new Image().src = galleryImages[currentImageIndex + 1];
  }
  if (galleryImages[currentImageIndex - 1]) {
    new Image().src = galleryImages[currentImageIndex - 1];
  }
}

if (lightboxClose) {
  lightboxClose.onclick = closeLightbox;
}

if (lightbox) {
  lightbox.onclick = e => {
    if (e.target === lightbox) closeLightbox();
  };

  let startX = 0;
  lightbox.addEventListener(
    "touchstart",
    e => (startX = e.touches[0].clientX),
    { passive: true }
  );
  lightbox.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].clientX - startX;
    if (diff > 50) prevImage();
    if (diff < -50) nextImage();
  });
}

// -------------------------------
//  LOAD PERSONAL SELLER
// -------------------------------
async function loadPersonalSeller(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return;
  const u = snap.data();

  sellerCardHeader.textContent = "About This Seller";
  sellerRibbonEl.style.display = "none";
  sellerNameEl.textContent = u.name || "Seller";
  sellerBioEl.textContent = u.bio || "No bio provided.";
  sellerAreaEl.textContent = u.area || "No area";

  
  revealBizPhoneBtn.style.display = "none";
  bizPhoneMasked.style.display = "none";

  if (u.avatarUrl) {
    sellerAvatarEl.style.backgroundImage = `url(${u.avatarUrl})`;
    sellerAvatarEl.textContent = "";
  } else {
    sellerAvatarEl.textContent = (u.name || "U").charAt(0).toUpperCase();
  }
}

// -------------------------------
//  LOAD BUSINESS SELLER
// -------------------------------
async function loadBusinessSeller(uid) {
  const snap = await getDoc(doc(db, "businesses", uid));
  if (!snap.exists()) return;
  const b = snap.data();

  sellerCardHeader.textContent = "About This Business";
  sellerRibbonEl.style.display = "inline-block";
  sellerNameEl.textContent = b.businessName || "Business";
  sellerBioEl.textContent = b.bio || "No description.";
  sellerAreaEl.textContent = b.area || "No area";

  if (b.website) {
    sellerWebsiteEl.href = b.website;
    sellerWebsiteEl.textContent = b.website;
    sellerWebsiteEl.style.display = "block";
  } else {
    sellerWebsiteEl.style.display = "none";
  }

  bizPhoneMasked.textContent = "••••••••••";
  revealBizPhoneBtn.style.display = "inline-block";
  bizPhoneMasked.style.display = "inline-block";

  revealBizPhoneBtn.onclick = async () => {
    bizPhoneMasked.textContent = b.phone || "No phone";
    revealBizPhoneBtn.style.display = "none";
    await updateDoc(doc(db, "businesses", uid), {
      leads: (b.leads || 0) + 1
    });
  };

  if (!b.avatarUrl) {
    sellerAvatarEl.textContent = (b.businessName || "B").charAt(0).toUpperCase();
  } else {
    sellerAvatarEl.style.backgroundImage = `url(${b.avatarUrl})`;
    sellerAvatarEl.textContent = "";
  }
}

// -------------------------------
//  LOAD OTHER ADS
// -------------------------------
async function loadOtherAds(uid) {
  otherAdsCarousel.innerHTML = "";

  const postsRef = collection(db, "posts");
  const snaps = [];

  const qUser = query(postsRef, where("userId", "==", uid));
  const snapUser = await getDocs(qUser);
  snapUser.forEach(d => snaps.push(d));

  const qBiz = query(postsRef, where("businessId", "==", uid));
  const snapBiz = await getDocs(qBiz);
  snapBiz.forEach(d => {
    if (!snaps.find(x => x.id === d.id)) snaps.push(d);
  });

  snaps.forEach(d => {
    const p = d.data();
    const card = document.createElement("div");
    card.className = "carousel-card";

    // Tap animation
    card.onmousedown = () => (card.style.transform = "scale(0.96)");
    card.onmouseup = () => (card.style.transform = "scale(1)");

    card.onclick = () => {
      sessionStorage.setItem("viewPostId", d.id);
      location.reload();
    };

    const imgSrc =
      p.imageUrls?.[0] ||
      p.imageUrl ||
      (p.images && p.images[0]) ||
      "/images/image-webholder.webp";

    card.innerHTML = `
      <img src="${imgSrc}">
      <div class="carousel-price">£${p.price}</div>
    `;

    otherAdsCarousel.appendChild(card);
  });
}

// -------------------------------
//  BUNDLE MODAL OPEN
// -------------------------------
if (openBundleModalBtn) {
  openBundleModalBtn.onclick = async () => {
    if (!sellerUid) return;

    bundleModal.style.display = "block";
    bundleModal.style.opacity = "0";
    setTimeout(() => (bundleModal.style.opacity = "1"), 10);

    bundleItems = [];
    bundleList.innerHTML = "";
    bundleTotalEl.textContent = "£0";

    const postsRef = collection(db, "posts");
    const rows = [];

    const qUser = query(postsRef, where("userId", "==", sellerUid));
    const snapUser = await getDocs(qUser);
    snapUser.forEach(d => rows.push(d));

    const qBiz = query(postsRef, where("businessId", "==", sellerUid));
    const snapBiz = await getDocs(qBiz);
    snapBiz.forEach(d => {
      if (!rows.find(x => x.id === d.id)) rows.push(d);
    });

    rows.forEach(d => {
      const p = d.data();
      const row = document.createElement("div");
      row.className = "bundle-row";

      const imgSrc =
        p.imageUrls?.[0] ||
        p.imageUrl ||
        (p.images && p.images[0]) ||
        "/images/image-webholder.webp";

      row.innerHTML = `
        <img src="${imgSrc}">
        <div class="bundle-title">${p.title || "Untitled"}</div>
        <div class="bundle-price">£${p.price || 0}</div>
        <button class="bundle-add-btn" data-id="${d.id}" data-price="${p.price || 0}">
          + Add
        </button>
      `;

      bundleList.appendChild(row);
    });

    setupBundleButtons();
  };
}

// -------------------------------
//  BUNDLE BUTTON LOGIC
// -------------------------------
function setupBundleButtons() {
  const buttons = document.querySelectorAll(".bundle-add-btn");

  buttons.forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const price = Number(btn.dataset.price) || 0;

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
//  SEND BUNDLE MESSAGE (POPUP ONLY)
// -------------------------------
if (sendBundleBtn) {
  sendBundleBtn.onclick = () => {
    if (bundleItems.length === 0) {
      showToast("Select at least one item to bundle.");
      return;
    }

    showToast("Bundle enquiry sent to seller.");
    bundleModal.style.opacity = "0";
    setTimeout(() => (bundleModal.style.display = "none"), 200);
  };
}

// -------------------------------
//  CLOSE BUNDLE MODAL
// -------------------------------
if (closeBundleModalBtn) {
  closeBundleModalBtn.onclick = () => {
    bundleModal.style.opacity = "0";
    setTimeout(() => (bundleModal.style.display = "none"), 200);
  };
}

// -------------------------------
//  MESSAGE SELLER → OPEN CHAT
// -------------------------------
if (messageSellerBtn) {
  messageSellerBtn.onclick = () => {
    const user = auth.currentUser;
    if (!user) {
      showToast("Please log in to message sellers.");
      return;
    }

    const convoId = `${user.uid}_${sellerUid}_${postId}`;
    sessionStorage.setItem("activeConversationId", convoId);

    loadView("chat", { forceInit: true });
  };
}

// -------------------------------
//  FOLLOW SELLER (REAL FIRESTORE)
// -------------------------------
async function updateFollowButtonState() {
  const user = auth.currentUser;
  if (!user) return;

  const sellerRef = doc(db, "users", sellerUid);
  const snap = await getDoc(sellerRef);
  if (!snap.exists()) return;

  const followers = snap.data().followers || {};

  if (followers[user.uid]) {
    followSellerBtn.textContent = "Following";
  } else {
    followSellerBtn.textContent = "Follow Seller";
  }
}

if (followSellerBtn) {
  followSellerBtn.onclick = async () => {
    const user = auth.currentUser;
    if (!user) {
      showToast("Please log in to follow sellers.");
      return;
    }

    if (user.uid === sellerUid) {
      showToast("You cannot follow yourself.");
      return;
    }

    const sellerRef = doc(db, "users", sellerUid);
    const snap = await getDoc(sellerRef);

    if (!snap.exists()) {
      showToast("Seller not found.");
      return;
    }

    const data = snap.data();
    const followers = data.followers || {};

    if (followers[user.uid]) {
      delete followers[user.uid];
      await updateDoc(sellerRef, { followers });
      followSellerBtn.textContent = "Follow Seller";
      showToast("Unfollowed.");
    } else {
      followers[user.uid] = true;
      await updateDoc(sellerRef, { followers });
      followSellerBtn.textContent = "Following";
      showToast("You are now following this seller.");
    }
  };
}

// -------------------------------
//  INIT
// -------------------------------
(async () => {
  await initFirebase();
  await loadPost();
})();
