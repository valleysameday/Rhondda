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
  const fb = await getFirebase();
  db = fb.db;
  auth = fb.auth;
  storage = fb.storage;
}

// -------------------------------
//  GET POST ID
// -------------------------------
const urlParams = new URLSearchParams(window.location.search);
let postId = urlParams.get("id") || sessionStorage.getItem("viewPostId");

// -------------------------------
//  DOM ELEMENTS
// -------------------------------
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

// Seller
const sellerCardHeader = document.getElementById("sellerCardHeader");
const sellerAvatarEl = document.getElementById("sellerAvatar");
const sellerNameEl = document.getElementById("sellerName");
const sellerRibbonEl = document.getElementById("sellerRibbon");
const sellerBioEl = document.getElementById("sellerBio");
const sellerAreaEl = document.getElementById("sellerArea");
const sellerWebsiteEl = document.getElementById("sellerWebsite");
const bizPhoneMasked = document.getElementById("bizPhoneMasked");
const revealBizPhoneBtn = document.getElementById("revealBizPhoneBtn");

// Other ads
const otherAdsCarousel = document.getElementById("otherAdsCarousel");

// -------------------------------
//  STATE
// -------------------------------
let sellerUid = null;
let galleryImages = [];
let currentImageIndex = 0;

// -------------------------------
//  LOAD POST
// -------------------------------
async function loadPost() {
  if (!postId) return;

  const postSnap = await getDoc(doc(db, "posts", postId));
  if (!postSnap.exists()) return;

  const post = postSnap.data();

  postTitleEl.textContent = post.title || "Untitled";
  postPriceEl.textContent = post.price ? `£${post.price}` : "£0";
  postDescEl.textContent = post.description || "No description provided.";

  renderGallery(post);

  sellerUid = post.businessId || post.userId;

  post.businessId
    ? await loadBusinessSeller(post.businessId)
    : await loadPersonalSeller(post.userId);

  await loadOtherAds(sellerUid);
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
  document.body.style.overflow = "hidden"; // DISABLE BACKGROUND SCROLL
  preloadAdjacentImages();
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = ""; // RE-ENABLE SCROLL
}

function updateLightbox() {
  lightboxImg.src = galleryImages[currentImageIndex];
  preloadAdjacentImages();
}

function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
  updateLightbox();
}

function prevImage() {
  currentImageIndex =
    (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
  updateLightbox();
}

// -------------------------------
//  PRELOAD IMAGES
// -------------------------------
function preloadAdjacentImages() {
  const nextIndex = (currentImageIndex + 1) % galleryImages.length;
  const prevIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;

  const nextImg = new Image();
  nextImg.src = galleryImages[nextIndex];

  const prevImg = new Image();
  prevImg.src = galleryImages[prevIndex];
}

// -------------------------------
//  LIGHTBOX EVENTS
// -------------------------------
lightboxClose.onclick = closeLightbox;

lightbox.onclick = e => {
  if (e.target === lightbox) closeLightbox();
};

// SWIPE
let startX = 0;

lightbox.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
}, { passive: true });

lightbox.addEventListener("touchend", e => {
  const diff = e.changedTouches[0].clientX - startX;
  if (diff > 50) prevImage();
  if (diff < -50) nextImage();
});

// -------------------------------
//  SELLERS
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

  sellerWebsiteEl.style.display = "none";
  revealBizPhoneBtn.style.display = "none";
  bizPhoneMasked.style.display = "none";

  if (u.avatarUrl) {
    sellerAvatarEl.style.backgroundImage = `url(${u.avatarUrl})`;
    sellerAvatarEl.textContent = "";
  }
}

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
}

// -------------------------------
//  OTHER ADS
// -------------------------------
async function loadOtherAds(uid) {
  otherAdsCarousel.innerHTML = "";

  const q = query(collection(db, "posts"), where("userId", "==", uid));
  const snap = await getDocs(q);

  snap.forEach(d => {
    const p = d.data();
    const card = document.createElement("div");

    card.className = "carousel-card";
    card.onclick = () => {
      sessionStorage.setItem("viewPostId", d.id);
      location.reload();
    };

    card.innerHTML = `
      <img src="${p.imageUrls?.[0] || p.imageUrl || "/images/image-webholder.webp"}">
      <div class="carousel-price">£${p.price}</div>
    `;

    otherAdsCarousel.appendChild(card);
  });
}

// -------------------------------
//  INIT
// -------------------------------
(async () => {
  await initFirebase();
  await loadPost();
})();
