// ========================== view-post.js ==========================

import {
  getPost,
  getUser,
  followUser,
  unfollowUser,
  isFollowing
} from "/index/js/firebase/settings.js";

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

/* ---------------- INIT ---------------- */
export async function init({ auth }) {
  console.log("📄 View post init");

  /* -------- RESET STATE -------- */
  galleryImages = [];
  currentIndex = 0;
  following = false;
  postId = sessionStorage.getItem("viewPostId");
  sellerUid = null;

  if (!postId) {
    showToast("No post selected");
    return;
  }

  /* -------- REBIND DOM -------- */
  bindDOM();

  /* -------- LOAD POST -------- */
  const post = await getPost(postId);
  if (!post) {
    descEl.textContent = "This post is no longer available.";
    return;
  }
  renderPost(post);

  /* -------- LOAD SELLER -------- */
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

  // Close lightbox
  lightboxClose?.addEventListener("click", () => {
    lightbox.classList.remove("show");
    document.body.style.overflow = "";
  });

  // Lightbox swipe
  let startX = 0;
  lightbox?.addEventListener("touchstart", e => startX = e.touches[0].clientX, { passive: true });
  lightbox?.addEventListener("touchend", e => handleSwipe(e.changedTouches[0].clientX));
}

function handleSwipe(endX) {
  const diff = currentIndex - endX;
  if (Math.abs(diff) < 40) return;
  if (diff > 0) currentIndex = (currentIndex + 1) % galleryImages.length;
  else currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
  lightboxImg.src = galleryImages[currentIndex];
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
  document.body.style.overflow = "hidden";
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

  /* ---- Contact ---- */
  if (user.phone) {
    const phone = user.phone.replace(/\s+/g, "");
    callBtn.onclick = () => {
      showToast(`Calling ${phone}`);
      window.location.href = `tel:${phone}`;
    };
    whatsappBtn.onclick = () => {
      showToast(`Opening WhatsApp chat`);
      window.open(`https://wa.me/${phone}`, "_blank");
    };
  } else {
    callBtn.disabled = true;
    whatsappBtn.disabled = true;
  }

  /* ---- Follow ---- */
  if (!currentUser || currentUser.uid === user.uid) {
    followBtn.style.display = "none";
    return;
  }

  following = await isFollowing(currentUser.uid, user.uid);
  updateFollowBtn();

  followBtn.onclick = async () => {
    try {
      if (following) await unfollowUser(currentUser.uid, user.uid);
      else await followUser(currentUser.uid, user.uid);
      following = !following;
      updateFollowBtn();
      showToast(following ? "Now following" : "Unfollowed");
    } catch (err) {
      console.error(err);
      showToast("Action failed");
    }
  };
}

function updateFollowBtn() {
  followBtn.textContent = following ? "Following" : "Follow";
  followBtn.classList.toggle("active", following);
}

/* ===================================================== */
/* ---------------- TOAST ---------------- */
export function showToast(msg, duration = 2000) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.85);
    color: #fff;
    padding: 12px 18px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 999999;
    opacity: 0;
    transition: opacity 0.3s ease;
    max-width: 90%;
    text-align: center;
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => (el.style.opacity = "1"));
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, duration);
}
