import {
  getPost,
  getUser,
  toggleFollowSeller,
  trackContactClick,
  updatePost,
  toggleSavePost
} from "/index/js/firebase/settings.js";

import { loadView } from "/index/js/main.js";

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
const postViewsEl = document.getElementById("postViews");

const postCategoryEl = document.getElementById("postCategory");
const postAreaEl = document.getElementById("postArea");

const mainImage = document.getElementById("mainImage");
const galleryCount = document.getElementById("galleryCount");

const callBtn = document.getElementById("callSellerBtn");
const whatsappBtn = document.getElementById("whatsappSellerBtn");
const followBtn = document.getElementById("followSellerBtn");

const sellerNameEl = document.getElementById("sellerName");
const sellerPostingSinceEl = document.getElementById("sellerPostingSince");
const sellerLastActiveEl = document.getElementById("sellerLastActive");

const saveBtn = document.getElementById("saveBtn");
const shareBtn = document.getElementById("shareBtn");
const reportBtn = document.getElementById("reportBtn");
const moreFromSellerBtn = document.getElementById("moreFromSellerBtn");

/* LIGHTBOX */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");

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

  // Increment views
  await updatePost(postId, {
    "stats.views": (post.stats?.views || 0) + 1
  });
}

/* =====================================================
   RENDER SELLER
===================================================== */
function renderSeller(seller) {
  sellerNameEl.textContent = seller?.name || "Seller";

  sellerPostingSinceEl.textContent =
    seller?.createdAt
      ? `Posting since ${new Date(seller.createdAt).toLocaleDateString("en-GB")}`
      : "Posting since unknown";

  sellerLastActiveEl.textContent =
    seller?.lastActive
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

  postTimeEl.textContent = post.createdAt ? formatPostTime(post.createdAt) : "";
  postViewsEl.textContent = `${post.stats?.views || 0} views`;

  postCategoryEl.textContent = post.category || "General";
  postAreaEl.textContent = post.area || "Rhondda";

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
   IMAGE GALLERY
===================================================== */
function updateMainImage(index) {
  if (index < 0) index = 0;
  if (index >= galleryImages.length) index = galleryImages.length - 1;

  currentIndex = index;
  mainImage.src = galleryImages[currentIndex];
  galleryCount.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
}

mainImage.addEventListener("click", () => openLightbox(currentIndex));

/* LIGHTBOX */
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

lightboxClose.addEventListener("click", closeLightbox);

/* =====================================================
   ACTIONS
===================================================== */
function bindActions(auth, post) {

  /* SHARE */
  shareBtn.onclick = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: "Check out this item on RCT‑X",
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied");
    }
  };

  /* SAVE */
  saveBtn.onclick = async () => {
    const saved = await toggleSavePost(auth.currentUser.uid, postId);
    saveBtn.textContent = saved ? "♥" : "♡";
  };

  /* REPORT */
  reportBtn.onclick = () => {
    loadView("report", { postId });
  };

  /* MORE FROM SELLER */
  moreFromSellerBtn.onclick = () => {
    loadView("seller-ads", { sellerUid });
  };

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

  /* FOLLOW SELLER */
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

  /* QUICK MESSAGE */
  const sendQuickMessageBtn = document.getElementById("sendQuickMessageBtn");
  sendQuickMessageBtn.onclick = function () {
    requireLogin(auth, async function () {
      const msg = document.getElementById("quickMessage").value.trim();
      if (!msg) return showToast("Message cannot be empty");

      // Open chat view with prefilled message
      sessionStorage.setItem("chatPrefill", JSON.stringify({
        sellerUid,
        postId,
        message: msg
      }));

      loadView("chat", { sellerUid, postId });
    });
  };
}

/* =====================================================
   LOGIN GUARD
===================================================== */
function requireLogin(auth, cb) {
  if (auth.currentUser) return cb();

  showToast("Please log in to continue");

  setTimeout(() => {
    const login = document.getElementById("login");
    if (login) login.style.display = "flex";
  }, 800);
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
