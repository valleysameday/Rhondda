// ========================== view-post.js ==========================

import {
  getPost,
  getUser,
  toggleFollowSeller
} from "/index/js/firebase/settings.js";

/* ---------------- DOM REFS ---------------- */
let titleEl, priceEl, descEl;
let mainImage, galleryCount;
let callBtn, whatsappBtn, followBtn, shareBtn, postActions;
let sellerNameEl, sellerPostingSinceEl, sellerLastActiveEl, postTimeEl;
let lightbox, lightboxImg, lightboxClose;

/* ---------------- STATE ---------------- */
let galleryImages = [];
let currentIndex = 0;
let postId = null;
let sellerUid = null;
let following = false;
let currentPost = null;

/* ===================================================== */
export async function init({ auth }) {
  console.log("📄 View post init");

  /* -------- RESET STATE -------- */
  galleryImages = [];
  currentIndex = 0;
  following = false;
  currentPost = null;
  sellerUid = null;

  postId = sessionStorage.getItem("viewPostId");

  if (!postId) {
    console.warn("❌ No postId found");
    return;
  }

  bindDOM();

  /* -------- LOAD POST -------- */
  const post = await getPost(postId);

  if (!post) {
    descEl.textContent = "This post is no longer available.";
    return;
  }

  currentPost = post;
  renderPost(post);

  /* -------- LOAD SELLER -------- */
  sellerUid = post.userId || post.sellerId || null;

  if (!sellerUid) {
    sellerNameEl.textContent = "Seller unavailable";
    followBtn.style.display = "block";
    followBtn.onclick = () => showToast("Sign in to follow sellers");
    return;
  }

  const seller = await getUser(sellerUid);
  await renderSeller(seller, auth?.currentUser);

  /* -------- SHARE BUTTON -------- */
  shareBtn.onclick = () => handleShare(post);
}

/* ===================================================== */
/* ---------------- DOM BIND ---------------- */
function bindDOM() {
  titleEl = document.getElementById("postTitle");
  priceEl = document.getElementById("postPrice");
  descEl = document.getElementById("postDescription");

  mainImage = document.getElementById("mainImage");
  galleryCount = document.getElementById("galleryCount");

  callBtn = document.getElementById("callSellerBtn");
  whatsappBtn = document.getElementById("whatsappSellerBtn");
  followBtn = document.getElementById("followSellerBtn");
  shareBtn = document.getElementById("sharePostBtn");
  postActions = document.getElementById("postActions");

  sellerNameEl = document.getElementById("sellerName");
  sellerPostingSinceEl = document.getElementById("sellerPostingSince");
  sellerLastActiveEl = document.getElementById("sellerLastActive");
  postTimeEl = document.getElementById("postTime");

  lightbox = document.getElementById("lightbox");
  lightboxImg = document.getElementById("lightboxImage");
  lightboxClose = document.getElementById("lightboxClose");

  mainImage.onclick = null;
  lightboxClose?.addEventListener("click", () =>
    lightbox.classList.remove("active")
  );
}

/* ===================================================== */
/* ---------------- POST RENDER ---------------- */
function renderPost(post) {
  titleEl.textContent = post.title || "";
  priceEl.textContent = post.price ? `£${post.price}` : "";
  descEl.textContent = post.description || "";

  // Time since posted
  if (post.createdAt) {
    const created =
      typeof post.createdAt === "number"
        ? new Date(post.createdAt)
        : post.createdAt.toDate
        ? post.createdAt.toDate()
        : null;

    postTimeEl.textContent = created ? timeAgo(created) : "";
  } else {
    postTimeEl.textContent = "";
  }

  galleryImages =
    Array.isArray(post.images) && post.images.length
      ? post.images
      : ["/assets/default-thumb.jpg"];

  currentIndex = 0;
  updateMainImage();
}

/* ===================================================== */
/* ---------------- TIME AGO HELPER ---------------- */
function timeAgo(date) {
  const now = new Date();
  const diffMs = now - date;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "1 day ago" : `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;

  const years = Math.floor(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

/* ===================================================== */
/* ---------------- GALLERY ---------------- */
function updateMainImage() {
  const src = galleryImages[currentIndex];
  mainImage.src = src;

  galleryCount.textContent =
    galleryImages.length > 1
      ? `${currentIndex + 1}/${galleryImages.length}`
      : "";

  mainImage.onclick = () => openLightbox(currentIndex);
}

function openLightbox(index) {
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = galleryImages[index];
  lightbox.classList.add("active");
}

/* ===================================================== */
/* ---------------- SELLER ---------------- */
async function renderSeller(user, currentUser) {
  if (!user) {
    sellerNameEl.textContent = "Seller unavailable";
    followBtn.style.display = "block";
    followBtn.onclick = () => showToast("Sign in to follow sellers");
    sellerPostingSinceEl.textContent = "";
    sellerLastActiveEl.textContent = "";
    return;
  }

  sellerNameEl.textContent =
    user.displayName || user.name || "Seller";

  /* -------- MEMBER SINCE (CREATED AT) -------- */
  let joinedDate = null;

  if (user.createdAt) {
    if (typeof user.createdAt === "number") {
      joinedDate = new Date(user.createdAt);
    } else if (user.createdAt.toDate) {
      joinedDate = user.createdAt.toDate();
    }
  }

  sellerPostingSinceEl.textContent =
    joinedDate ? `Member since ${joinedDate.getFullYear()}` : "";

  /* -------- LAST ACTIVE (if you ever store it) -------- */
  if (user.lastActive) {
    const last =
      typeof user.lastActive === "number"
        ? new Date(user.lastActive)
        : user.lastActive.toDate
        ? user.lastActive.toDate()
        : null;
    sellerLastActiveEl.textContent = last ? `Active ${timeAgo(last)}` : "";
  } else {
    sellerLastActiveEl.textContent = "";
  }

  /* -------- CONTACT BUTTONS -------- */
  let phone = null;

  if (currentPost?.phone) {
    phone = currentPost.phone;
  } else if (user.phone) {
    phone = user.phone;
  }

  let anyContactVisible = false;

  if (!phone) {
    callBtn.style.display = "none";
    whatsappBtn.style.display = "none";
  } else {
    const clean = phone.replace(/\s+/g, "");

    callBtn.style.display = "inline-flex";
    callBtn.onclick = () => (window.location.href = `tel:${clean}`);
    anyContactVisible = true;

    if (currentPost.whatsappAllowed) {
      whatsappBtn.style.display = "inline-flex";
      whatsappBtn.onclick = () =>
        window.open(`https://wa.me/${clean}`, "_blank");
      anyContactVisible = true;
    } else {
      whatsappBtn.style.display = "none";
    }
  }

  // Show actions row if any contact or share exists (share always exists)
  postActions.style.display = anyContactVisible ? "flex" : "flex";

  /* -------- FOLLOW BUTTON ALWAYS VISIBLE -------- */
  followBtn.style.display = "block";

  if (!currentUser) {
    followBtn.classList.remove("active");
    followBtn.textContent = "Follow";
    followBtn.onclick = () => showToast("Sign in to follow sellers");
    return;
  }

  following = Boolean(user.followers?.[currentUser.uid]);
  updateFollowBtn();

  followBtn.onclick = async () => {
    following = await toggleFollowSeller(
      currentUser.uid,
      sellerUid
    );
    updateFollowBtn();

    showToast(
      following
        ? "You are now following this seller"
        : "You unfollowed this seller"
    );
  };
}

/* ===================================================== */
/* ---------------- FOLLOW UI ---------------- */
function updateFollowBtn() {
  followBtn.textContent = following ? "Following" : "Follow";
  followBtn.classList.toggle("active", following);
}

/* ===================================================== */
/* ---------------- SHARE HANDLER ---------------- */
function handleShare(post) {
  const shareUrl = `${window.location.origin}/view-post?post=${postId}`;
  const shareTitle = post.title || "Check out this ad";
  const shareText = `${shareTitle} on RCT-X`;

  if (navigator.share) {
    navigator
      .share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      })
      .catch(() => {
        // user cancelled; ignore
      });
  } else {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => showToast("Link copied to clipboard"))
      .catch(() => showToast("Could not copy link"));
  }
}

/* ===================================================== */
/* ---------------- TOAST ---------------- */
function showToast(msg, duration = 2000) {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 30);
  setTimeout(() => toast.classList.remove("show"), duration);
  setTimeout(() => toast.remove(), duration + 260);
}
