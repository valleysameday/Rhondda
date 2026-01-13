// ========================== view-post.js ==========================

import { getPost, getUser, toggleFollowSeller } from "/index/js/firebase/settings.js";

/* ---------------- DOM REFS ---------------- */
let titleEl, priceEl, descEl, timeEl;
let mainImage, galleryCount, thumbnailsWrap;
let callBtn, whatsappBtn, followBtn;
let sellerNameEl, sellerPostingSinceEl, sellerLastActiveEl;
let lightbox, lightboxImg, lightboxClose;

/* ---------------- STATE ---------------- */
let galleryImages = [];
let currentIndex = 0;
let postId = null;
let sellerUid = null;
let following = false;

/* ===================================================== */
export async function init({ auth }) {
  console.log("📄 View post init");

  // ---------------- RESET STATE ----------------
  galleryImages = [];
  currentIndex = 0;
  following = false;
  postId = sessionStorage.getItem("viewPostId");
  sellerUid = null;

  if (!postId) {
    console.warn("❌ No postId found");
    return;
  }

  // ---------------- REBIND DOM ----------------
  bindDOM();

  // ---------------- LOAD POST ----------------
  const post = await getPost(postId);
  if (!post) {
    descEl.textContent = "This post is no longer available.";
    return;
  }

  renderPost(post);

  // ---------------- LOAD SELLER ----------------
  sellerUid = post.uid;
  if (sellerUid) {
    const seller = await getUser(sellerUid);
    renderSeller(seller, auth?.currentUser);
  }
}

/* ===================================================== */
/* ---------------- DOM BIND ---------------- */
function bindDOM() {
  titleEl = document.getElementById("postTitle");
  priceEl = document.getElementById("postPrice");
  descEl = document.getElementById("postDescription");
  timeEl = document.getElementById("postTime");

  mainImage = document.getElementById("mainImage");
  galleryCount = document.getElementById("galleryCount");
  thumbnailsWrap = document.getElementById("postThumbnails");

  callBtn = document.getElementById("callSellerBtn");
  whatsappBtn = document.getElementById("whatsappSellerBtn");
  followBtn = document.getElementById("followSellerBtn");

  sellerNameEl = document.getElementById("sellerName");
  sellerPostingSinceEl = document.getElementById("sellerPostingSince");
  sellerLastActiveEl = document.getElementById("sellerLastActive");

  lightbox = document.getElementById("lightbox");
  lightboxImg = document.getElementById("lightboxImage");
  lightboxClose = document.getElementById("lightboxClose");

  // Clear previous listeners
  mainImage.onclick = null;
  lightboxClose?.addEventListener("click", () => lightbox.classList.remove("show"));
}

/* ===================================================== */
/* ---------------- POST RENDER ---------------- */
function renderPost(post) {
  titleEl.textContent = post.title || "";
  priceEl.textContent = post.price ? `£${post.price}` : "";
  descEl.textContent = post.description || "";
  timeEl.textContent = post.createdAt?.toDate?.().toLocaleString() || "";

  galleryImages = post.images || [];
  if (!galleryImages.length) galleryImages = ["/assets/default-thumb.jpg"];

  currentIndex = 0;
  updateMainImage();
  renderThumbnails();
}

/* ===================================================== */
/* ---------------- GALLERY ---------------- */
function updateMainImage() {
  mainImage.src = galleryImages[currentIndex];
  galleryCount.textContent =
    galleryImages.length > 1 ? `${currentIndex + 1}/${galleryImages.length}` : "";

  mainImage.onclick = () => openLightbox(currentIndex);
}

function renderThumbnails() {
  if (!thumbnailsWrap) return;

  thumbnailsWrap.innerHTML = "";

  galleryImages.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.className = i === currentIndex ? "active" : "";
    img.onclick = () => {
      currentIndex = i;
      updateMainImage();
      renderThumbnails();
    };
    thumbnailsWrap.appendChild(img);
  });
}

/* ===================================================== */
/* ---------------- LIGHTBOX ---------------- */
function openLightbox(index) {
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = galleryImages[index];
  lightbox.classList.add("show");
}

/* ===================================================== */
/* ---------------- SELLER ---------------- */
async function renderSeller(user, currentUser) {
  if (!user) {
    sellerNameEl.textContent = "Seller unavailable";
    followBtn.style.display = "none";
    return;
  }

  sellerNameEl.textContent = user.displayName || "Seller";
  sellerPostingSinceEl.textContent =
    user.createdAt?.toDate?.().getFullYear() || "";
  sellerLastActiveEl.textContent =
    user.lastActive?.toDate?.().toLocaleDateString() || "";

  // ---------------- CONTACT ----------------
  if (user.phone) {
    const phone = user.phone.replace(/\s+/g, "");
    callBtn.onclick = () => (window.location.href = `tel:${phone}`);
    whatsappBtn.onclick = () => window.open(`https://wa.me/${phone}`, "_blank");
  } else {
    callBtn.disabled = true;
    whatsappBtn.disabled = true;
  }

  // ---------------- FOLLOW ----------------
  if (!currentUser || currentUser.uid === user.uid) {
    followBtn.style.display = "none";
    return;
  }

  following = await checkFollowing(currentUser.uid, user.uid);
  updateFollowBtn();

  followBtn.onclick = async () => {
    following = await toggleFollowSeller(currentUser.uid, user.uid);
    updateFollowBtn();
    showToast(following ? "You are now following this seller" : "You unfollowed this seller");
  };
}

/* ===================================================== */
/* ---------------- FOLLOW HELPERS ---------------- */
function updateFollowBtn() {
  followBtn.textContent = following ? "Following" : "Follow";
  followBtn.classList.toggle("active", following);
}

async function checkFollowing(userUid, sellerUid) {
  if (!userUid || !sellerUid) return false;
  const snap = await getUser(sellerUid);
  if (!snap) return false;
  const followers = snap.followers || {};
  return !!followers[userUid];
}

/* ===================================================== */
/* ---------------- TOAST ---------------- */
function showToast(msg, duration = 2000) {
  let toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => toast.classList.remove("show"), duration);
  setTimeout(() => toast.remove(), duration + 300);
}
