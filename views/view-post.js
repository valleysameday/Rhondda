// ========================== view-post.js ==========================

import {
  getPost,
  getUser,
  toggleFollowSeller
} from "/index/js/firebase/settings.js";

/* ---------------- DOM REFS ---------------- */
let titleEl, priceEl, descEl;
let mainImage, galleryCount, thumbnailsWrap;
let callBtn, whatsappBtn, followBtn;
let sellerNameEl, sellerPostingSinceEl;
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
}

/* ===================================================== */
/* ---------------- DOM BIND ---------------- */
function bindDOM() {
  titleEl = document.getElementById("postTitle");
  priceEl = document.getElementById("postPrice");
  descEl = document.getElementById("postDescription");

  mainImage = document.getElementById("mainImage");
  galleryCount = document.getElementById("galleryCount");
  thumbnailsWrap = document.getElementById("postThumbnails");

  callBtn = document.getElementById("callSellerBtn");
  whatsappBtn = document.getElementById("whatsappSellerBtn");
  followBtn = document.getElementById("followSellerBtn");

  sellerNameEl = document.getElementById("sellerName");
  sellerPostingSinceEl = document.getElementById("sellerPostingSince");

  lightbox = document.getElementById("lightbox");
  lightboxImg = document.getElementById("lightboxImage");
  lightboxClose = document.getElementById("lightboxClose");

  mainImage.onclick = null;
  lightboxClose?.addEventListener("click", () =>
    lightbox.classList.remove("show")
  );
}

/* ===================================================== */
/* ---------------- POST RENDER ---------------- */
function renderPost(post) {
  titleEl.textContent = post.title || "";
  priceEl.textContent = post.price ? `£${post.price}` : "";
  descEl.textContent = post.description || "";

  galleryImages =
    Array.isArray(post.images) && post.images.length
      ? post.images
      : ["/assets/default-thumb.jpg"];

  currentIndex = 0;
  updateMainImage();
  renderThumbnails();
}

/* ===================================================== */
/* ---------------- GALLERY ---------------- */
function updateMainImage() {
  mainImage.src = galleryImages[currentIndex];

  galleryCount.textContent =
    galleryImages.length > 1
      ? `${currentIndex + 1}/${galleryImages.length}`
      : "";

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
    followBtn.style.display = "block";
    followBtn.onclick = () => showToast("Sign in to follow sellers");
    return;
  }

  sellerNameEl.textContent =
    user.displayName || user.name || "Seller";

  /* -------- CREATED AT (fix NaN) -------- */
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

  /* -------- CONTACT BUTTONS (fixed) -------- */
  let phone = null;

  // Prefer post phone number ALWAYS
  if (currentPost?.phone) {
    phone = currentPost.phone;
  } else if (user.phone) {
    phone = user.phone;
  }

  if (!phone) {
    callBtn.style.display = "none";
    whatsappBtn.style.display = "none";
  } else {
    const clean = phone.replace(/\s+/g, "");

    callBtn.style.display = "block";
    callBtn.onclick = () => (window.location.href = `tel:${clean}`);

    if (currentPost.whatsappAllowed) {
      whatsappBtn.style.display = "block";
      whatsappBtn.onclick = () =>
        window.open(`https://wa.me/${clean}`, "_blank");
    } else {
      whatsappBtn.style.display = "none";
    }
  }

  /* -------- FOLLOW BUTTON ALWAYS VISIBLE -------- */
  followBtn.style.display = "block";

  if (!currentUser) {
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
/* ---------------- TOAST ---------------- */
function showToast(msg, duration = 2000) {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => toast.classList.remove("show"), duration);
  setTimeout(() => toast.remove(), duration + 300);
}
