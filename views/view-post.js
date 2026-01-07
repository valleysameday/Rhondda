import { loadView } from "/index/js/main.js";
import {
  getPost,
  getUser,
  getBusiness,
  getSellerPosts,
  incrementLeads,
  toggleFollowSeller
} from "/index/js/firebase/settings.js";

// -------------------------------
//  TOAST
// -------------------------------
export function showToast(message) {
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
const postTitleEl = document.getElementById("postTitle");
const postPriceEl = document.getElementById("postPrice");
const postDescEl = document.getElementById("postDescription");

const galleryCount = document.getElementById("galleryCount");
const mainImage = document.getElementById("mainImage");
const thumb1 = document.getElementById("thumb1");
const thumb2 = document.getElementById("thumb2");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxBottom = document.getElementById("lightboxBottom");

const sellerCardHeader = document.getElementById("sellerCardHeader");
const sellerAvatarEl = document.getElementById("sellerAvatar");
const sellerNameEl = document.getElementById("sellerName");
const sellerRibbonEl = document.getElementById("sellerRibbon");
const sellerBioEl = document.getElementById("sellerBio");
const sellerAreaEl = document.getElementById("sellerArea");
const bizPhoneMasked = document.getElementById("bizPhoneMasked");
const revealBizPhoneBtn = document.getElementById("revealBizPhoneBtn");
const sellerWebsiteEl = document.getElementById("sellerWebsite");

const messageSellerBtn = document.querySelector(".message-btn");
const followSellerBtn = document.getElementById("followSellerBtn");

const otherAdsCarousel = document.getElementById("otherAdsCarousel");

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

// -------------------------------
//  RENDER POST DETAILS
// -------------------------------
function renderPostDetails(post) {
  const box = document.getElementById("postDetails");
  if (!box) return;

  let html = `<h3>Details</h3>`;
  const fields = [
    ["Price", post.price],
    ["Condition", post.condition],
    ["Delivery", post.delivery],
    ["Property", post.propertyType],
    ["Rent", post.rentFrequency],
    ["Area", post.area],
    ["Job type", post.jobType],
    ["Salary", post.jobSalary],
    ["Experience", post.jobExperience],
    ["Event date", post.eventDate],
    ["Starts", post.eventStart],
    ["Ends", post.eventEnd],
    ["Venue", post.eventVenue],
    ["Community type", post.communityType],
    ["Last seen", post.lostLocation],
    ["Reward", post.lostReward],
  ];

  fields.forEach(([label, value]) => {
    if (value) html += `<div class="detail-row"><span>${label}:</span> ${value}</div>`;
  });

  // Features
  if (post.propertyFeatures?.length) {
    html += `<div class="detail-row"><span>Features:</span></div>`;
    html += `<div class="feature-badges">`;
    post.propertyFeatures.forEach(f => {
      html += `<div class="feature-badge">${f}</div>`;
    });
    html += `</div>`;
  }

  box.innerHTML = html;
}

// -------------------------------
//  GALLERY
// -------------------------------
function renderGallery(post) {
  galleryImages = [...(post.imageUrls || []), post.imageUrl, ...(post.images || [])].filter(Boolean);

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
  lightboxBottom.innerHTML = `<img src="/images/ad-placeholder.jpg" class="lightbox-ad" />`;
  preloadAdjacentImages();
}

function nextImage() {
  if (currentImageIndex < galleryImages.length - 1) currentImageIndex++;
  updateLightbox();
}

function prevImage() {
  if (currentImageIndex > 0) currentImageIndex--;
  updateLightbox();
}

function preloadAdjacentImages() {
  if (galleryImages[currentImageIndex + 1]) new Image().src = galleryImages[currentImageIndex + 1];
  if (galleryImages[currentImageIndex - 1]) new Image().src = galleryImages[currentImageIndex - 1];
}

if (lightboxClose) lightboxClose.onclick = closeLightbox;
if (lightbox) {
  lightbox.onclick = e => { if (e.target === lightbox) closeLightbox(); };
  let startX = 0;
  lightbox.addEventListener("touchstart", e => startX = e.touches[0].clientX, { passive: true });
  lightbox.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].clientX - startX;
    if (diff > 50) prevImage();
    if (diff < -50) nextImage();
  });
}

// -------------------------------
//  LOAD POST & SELLER
// -------------------------------
export async function loadViewPost(auth, db) {
  if (!postId) return;

  const post = await getPost(postId);
  if (!post) {
    postTitleEl.textContent = "Post Not Found";
    return;
  }

  postTitleEl.textContent = post.title || "Untitled";
  postPriceEl.textContent = post.price ? `£${post.price}` : "£0";
  postDescEl.textContent = post.description || "No description provided.";

  renderGallery(post);
  renderPostDetails(post);

  sellerUid = post.businessId || post.userId;

  // Load seller info
  let sellerData;
  if (post.businessId) sellerData = await getBusiness(post.businessId);
  else sellerData = await getUser(post.userId);

  if (sellerData) loadSellerUI(sellerData, !!post.businessId);

  // Load other ads
  const otherPosts = await getSellerPosts(sellerUid);
  loadOtherAds(otherPosts);

  // Follow button state
  await updateFollowButtonState(auth);
}

// -------------------------------
//  LOAD SELLER UI
// -------------------------------
function loadSellerUI(data, isBusiness) {
  sellerCardHeader.textContent = isBusiness ? "About This Business" : "About This Seller";
  sellerRibbonEl.style.display = isBusiness ? "inline-block" : "none";

  sellerNameEl.textContent = data.businessName || data.name || "Seller";
  sellerBioEl.textContent = data.bio || "No description.";
  sellerAreaEl.textContent = data.area || "No area";

  if (isBusiness) {
    bizPhoneMasked.textContent = "••••••••••";
    revealBizPhoneBtn.style.display = "inline-block";
    bizPhoneMasked.style.display = "inline-block";

    revealBizPhoneBtn.onclick = async () => {
      bizPhoneMasked.textContent = data.phone || "No phone";
      revealBizPhoneBtn.style.display = "none";
      await incrementLeads(data.uid);
    };
    if (data.avatarUrl) {
      sellerAvatarEl.style.backgroundImage = `url(${data.avatarUrl})`;
      sellerAvatarEl.textContent = "";
    } else sellerAvatarEl.textContent = (data.businessName || "B").charAt(0).toUpperCase();
  } else {
    revealBizPhoneBtn.style.display = "none";
    bizPhoneMasked.style.display = "none";
    if (data.avatarUrl) {
      sellerAvatarEl.style.backgroundImage = `url(${data.avatarUrl})`;
      sellerAvatarEl.textContent = "";
    } else sellerAvatarEl.textContent = (data.name || "U").charAt(0).toUpperCase();
  }

  if (data.website) {
    sellerWebsiteEl.href = data.website;
    sellerWebsiteEl.textContent = data.website;
    sellerWebsiteEl.style.display = "block";
  } else sellerWebsiteEl.style.display = "none";
}

// -------------------------------
//  OTHER ADS CAROUSEL
// -------------------------------
function loadOtherAds(posts) {
  otherAdsCarousel.innerHTML = "";

  posts.forEach(p => {
    const card = document.createElement("div");
    card.className = "carousel-card";
    card.onmousedown = () => (card.style.transform = "scale(0.96)");
    card.onmouseup = () => (card.style.transform = "scale(1)");
    card.onclick = () => {
      sessionStorage.setItem("viewPostId", p.id);
      location.reload();
    };

    const imgSrc = p.imageUrls?.[0] || p.imageUrl || (p.images && p.images[0]) || "/images/image-webholder.webp";

    card.innerHTML = `<img src="${imgSrc}"><div class="carousel-price">£${p.price}</div>`;
    otherAdsCarousel.appendChild(card);
  });
}

// -------------------------------
//  FOLLOW SELLER
// -------------------------------
async function updateFollowButtonState(auth) {
  const user = auth.currentUser;
  if (!user) return;

  const isFollowing = await toggleFollowSeller(user.uid, sellerUid, false);
  followSellerBtn.textContent = isFollowing ? "Following" : "Follow Seller";

  if (followSellerBtn) {
    followSellerBtn.onclick = async () => {
      if (!user) { showToast("Please log in to follow sellers."); return; }
      if (user.uid === sellerUid) { showToast("You cannot follow yourself."); return; }

      const following = await toggleFollowSeller(user.uid, sellerUid, true);
      followSellerBtn.textContent = following ? "Following" : "Follow Seller";
      showToast(following ? "You are now following this seller." : "Unfollowed.");
    };
  }
}

// -------------------------------
//  BUNDLE MODAL LOGIC
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

    // Fetch all seller posts (using settings.js helper)
    const rows = await getSellerPosts(sellerUid);

    rows.forEach(d => {
      const imgSrc =
        d.imageUrls?.[0] ||
        d.imageUrl ||
        (d.images && d.images[0]) ||
        "/images/image-webholder.webp";

      const row = document.createElement("div");
      row.className = "bundle-row";
      row.innerHTML = `
        <img src="${imgSrc}">
        <div class="bundle-title">${d.title || "Untitled"}</div>
        <div class="bundle-price">£${d.price || 0}</div>
        <button class="bundle-add-btn" data-id="${d.id}" data-price="${d.price || 0}">
          + Add
        </button>
      `;
      bundleList.appendChild(row);
    });

    setupBundleButtons();
  };
}

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

// SEND BUNDLE MESSAGE (UI only)
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

// CLOSE BUNDLE MODAL
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
export function init({ auth }) {
  loadViewPost({ currentUser: auth.currentUser });
} 

}
