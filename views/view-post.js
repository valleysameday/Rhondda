import {
  getPost,
  getUser,
  toggleFollowSeller,
  trackContactClick,
  deletePost
} from "/index/js/firebase/settings.js";

/* =====================================================
   STATE
===================================================== */
let postId = null;
let sellerUid = null;
let galleryImages = [];
let currentIndex = 0;

/* =====================================================
   DOM
===================================================== */
const titleEl = document.getElementById("postTitle");
const priceEl = document.getElementById("postPrice");
const descEl = document.getElementById("postDescription");
const postTimeEl = document.getElementById("postTime");

const mainImage = document.getElementById("mainImage");
const galleryCount = document.getElementById("galleryCount");

const callBtn = document.getElementById("callSellerBtn");
const whatsappBtn = document.getElementById("whatsappSellerBtn");
const followBtn = document.getElementById("followSellerBtn");

const sellerNameEl = document.getElementById("sellerName");
const sellerPostingSinceEl = document.getElementById("sellerPostingSince");
const sellerLastActiveEl = document.getElementById("sellerLastActive");

/* LIGHTBOX */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");

/* =====================================================
   LOGIN GUARD
===================================================== */
function requireLogin(auth, cb) {
  if (auth.currentUser) return cb();

  showToast("Please log in to contact the seller");
  setTimeout(() => {
    const login = document.getElementById("login");
    if (login) login.style.display = "flex";
  }, 1200);
}

/* =====================================================
   INIT
===================================================== */
export async function init({ auth }) {
  const params = new URLSearchParams(window.location.search);
  postId = params.get("id") || sessionStorage.getItem("viewPostId");
  if (!postId) return;

  const post = await getPost(postId);
  if (!post) {
    titleEl.textContent = "Post not found";
    return;
  }

  sellerUid = post.userId || post.businessId;

  const seller = await getUser(sellerUid);

  renderSeller(seller);
  renderPost(post);
  bindActions(auth, post);
}

/* =====================================================
   RENDER SELLER
===================================================== */
function renderSeller(seller) {
  sellerNameEl.textContent = seller && seller.name ? seller.name : "Seller";

  sellerPostingSinceEl.textContent =
    seller && seller.createdAt
      ? `Posting since ${new Date(seller.createdAt).toLocaleDateString("en-GB")}`
      : "Posting since unknown";

  sellerLastActiveEl.textContent =
    seller && seller.lastActive
      ? `Active ${new Date(seller.lastActive).toLocaleDateString("en-GB")}`
      : "Active recently";
}

/* =====================================================
   TIME FORMAT
===================================================== */
function formatPostTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 60) return `Posted ${mins} minutes ago`;
  if (hrs < 24) return `Posted ${hrs} hours ago`;
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
}

/* =====================================================
   RENDER POST
===================================================== */
function renderPost(post) {
  titleEl.textContent = post.title || "Untitled";
  priceEl.textContent = post.price ? `£${post.price}` : "Free";
  descEl.textContent = post.description || "No description provided.";

  if (post.createdAt) {
    postTimeEl.textContent = formatPostTime(post.createdAt);
  }

  galleryImages = [
    ...(post.imageUrls || []),
    post.imageUrl,
    ...(post.images || [])
  ].filter(Boolean);

  if (!galleryImages.length) {
    galleryImages = ["/images/image-webholder.webp"];
  }

  updateMainImage(0);
}

/* =====================================================
   IMAGE GALLERY — MAIN VIEWPORT
===================================================== */
function updateMainImage(index) {
  if (index < 0) index = 0;
  if (index >= galleryImages.length) index = galleryImages.length - 1;

  currentIndex = index;
  mainImage.src = galleryImages[currentIndex];
  galleryCount.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
}

/* -------------------------------
   MAIN IMAGE SWIPE
-------------------------------- */
let swipeStartX = 0;

mainImage.addEventListener("touchstart", function (e) {
  swipeStartX = e.touches[0].clientX;
}, { passive: true });

mainImage.addEventListener("touchend", function (e) {
  const diff = e.changedTouches[0].clientX - swipeStartX;

  if (diff > 50) updateMainImage(currentIndex - 1);   // swipe right
  if (diff < -50) updateMainImage(currentIndex + 1);  // swipe left
});

/* -------------------------------
   TAP → OPEN LIGHTBOX
-------------------------------- */
mainImage.addEventListener("click", function () {
  openLightbox(currentIndex);
});

/* =====================================================
   LIGHTBOX
===================================================== */
function openLightbox(index) {
  currentIndex = index;
  lightboxImg.src = galleryImages[currentIndex];
  lightbox.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.style.display = "none";
  document.body.style.overflow = "";
}

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

lightbox.addEventListener("click", function (e) {
  if (e.target === lightbox) closeLightbox();
});

/* -------------------------------
   LIGHTBOX TAP → NEXT IMAGE
-------------------------------- */
lightboxImg.addEventListener("click", function () {
  currentIndex++;
  if (currentIndex >= galleryImages.length) currentIndex = 0;
  lightboxImg.src = galleryImages[currentIndex];
});

/* -------------------------------
   LIGHTBOX SWIPE
-------------------------------- */
let lightboxStartX = 0;

lightboxImg.addEventListener("touchstart", function (e) {
  lightboxStartX = e.touches[0].clientX;
}, { passive: true });

lightboxImg.addEventListener("touchend", function (e) {
  const diff = e.changedTouches[0].clientX - lightboxStartX;

  if (diff > 50) currentIndex--;   // swipe right
  if (diff < -50) currentIndex++;  // swipe left

  if (currentIndex < 0) currentIndex = galleryImages.length - 1;
  if (currentIndex >= galleryImages.length) currentIndex = 0;

  lightboxImg.src = galleryImages[currentIndex];
});

/* =====================================================
   ACTIONS
===================================================== */
function bindActions(auth, post) {

  /* CALL */
  if (post.phone) {
    callBtn.style.display = "inline-flex";
    callBtn.onclick = function () {
      requireLogin(auth, async function () {
        await trackContactClick({
          postId,
          sellerUid,
          viewerUid: auth.currentUser.uid,
          type: "call"
        });

        window.location.href = `tel:${post.phone}`;
      });
    };
  } else {
    callBtn.style.display = "none";
  }

  /* WHATSAPP */
  if (post.phone && post.whatsappAllowed) {
    whatsappBtn.style.display = "inline-flex";
    whatsappBtn.onclick = function () {
      requireLogin(auth, async function () {
        await trackContactClick({
          postId,
          sellerUid,
          viewerUid: auth.currentUser.uid,
          type: "whatsapp"
        });

        const clean = post.phone.replace(/\D/g, "");
        window.location.href = `https://wa.me/${clean}`;
      });
    };
  } else {
    whatsappBtn.style.display = "none";
  }

  /* FOLLOW */
  followBtn.onclick = function () {
    requireLogin(auth, async function () {
      const following = await toggleFollowSeller(
        auth.currentUser.uid,
        sellerUid,
        true
      );
      followBtn.textContent = following ? "Following" : "Follow";
    });
  };
}

/* =====================================================
   TOAST
===================================================== */
function showToast(msg) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = `
    position:fixed;
    bottom:20px;
    left:50%;
    transform:translateX(-50%);
    background:rgba(0,0,0,0.85);
    color:#fff;
    padding:12px 18px;
    border-radius:8px;
    font-size:15px;
    z-index:999999;
    opacity:0;
    transition:opacity .3s;
  `;
  document.body.appendChild(el);

  requestAnimationFrame(() => (el.style.opacity = "1"));
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 2000);
}
