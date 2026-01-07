import { loadView } from "/index/js/main.js";
import {
  getPost,
  toggleFollowSeller,
  incrementLeads
} from "/index/js/firebase/settings.js";

/* ===============================
   STATE
================================ */
let postId = null;
let sellerUid = null;
let galleryImages = [];
let currentIndex = 0;

/* ===============================
   DOM
================================ */
const titleEl = document.getElementById("postTitle");
const priceEl = document.getElementById("postPrice");
const descEl = document.getElementById("postDescription");

const mainImage = document.getElementById("mainImage");
const galleryCount = document.getElementById("galleryCount");

const messageBtn = document.getElementById("messageSellerBtn");
const callBtn = document.getElementById("callSellerBtn");
const whatsappBtn = document.getElementById("whatsappSellerBtn");
const followBtn = document.getElementById("followSellerBtn");

/* ===============================
   LIGHTBOX
================================ */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");

function openLightbox(index = 0) {
  currentIndex = index;
  updateLightbox();
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
}

function nextImage() {
  currentIndex = (currentIndex + 1) % galleryImages.length;
  updateLightbox();
}

function prevImage() {
  currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
  updateLightbox();
}

function updateLightbox() {
  lightboxImg.src = galleryImages[currentIndex];
}

/* Close lightbox */
if (lightboxClose) lightboxClose.onclick = closeLightbox;
lightbox?.addEventListener("click", e => {
  if (e.target === lightbox) closeLightbox();
});

/* Keyboard navigation */
document.addEventListener("keydown", e => {
  if (!lightbox.classList.contains("active")) return;
  if (e.key === "ArrowRight") nextImage();
  if (e.key === "ArrowLeft") prevImage();
  if (e.key === "Escape") closeLightbox();
});

/* Touch swipe for mobile */
let startX = 0;
lightbox?.addEventListener("touchstart", e => startX = e.touches[0].clientX, { passive: true });
lightbox?.addEventListener("touchend", e => {
  const diff = e.changedTouches[0].clientX - startX;
  if (diff > 50) prevImage();
  if (diff < -50) nextImage();
});

/* ===============================
   INIT
================================ */
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

  renderPost(post);
  bindActions(auth, post);
}

/* ===============================
   RENDER
================================ */
function renderPost(post) {
  titleEl.textContent = post.title || "Untitled";
  priceEl.textContent = post.price ? `£${post.price}` : "Free";
  descEl.textContent = post.description || "No description provided.";

  // Collect all images
  galleryImages =
    post.imageUrls?.length ? post.imageUrls :
    post.images?.length ? post.images :
    ["/images/image-webholder.webp"];

  galleryCount.textContent = `${galleryImages.length} photo${galleryImages.length !== 1 ? "s" : ""}`;
  mainImage.src = galleryImages[0];

  // Open lightbox on click
  mainImage.onclick = () => openLightbox(0);
}

/* ===============================
   ACTIONS
================================ */
function bindActions(auth, post) {
  if (messageBtn) {
    messageBtn.onclick = () => {
      if (!auth.currentUser) return alert("Please log in to message sellers");
      sessionStorage.setItem("viewPostId", postId);
      loadView("chat");
    };
  }

  if (callBtn && post.phone) {
    callBtn.href = `tel:${post.phone}`;
    callBtn.onclick = () => incrementLeads(sellerUid);
  }

  if (whatsappBtn && post.phone) {
    whatsappBtn.href = `https://wa.me/${post.phone.replace(/\D/g, "")}`;
    whatsappBtn.onclick = () => incrementLeads(sellerUid);
  }

  if (followBtn && auth.currentUser) {
    followBtn.onclick = async () => {
      const following = await toggleFollowSeller(auth.currentUser.uid, sellerUid, true);
      followBtn.textContent = following ? "Following" : "Follow Seller";
    };
  }
}
