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
const thumb1 = document.getElementById("thumb1");
const thumb2 = document.getElementById("thumb2");
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
  if (currentIndex < galleryImages.length - 1) currentIndex++;
  updateLightbox();
}

function prevImage() {
  if (currentIndex > 0) currentIndex--;
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

/* Touch swipe for lightbox */
let startX = 0;
lightbox?.addEventListener("touchstart", e => startX = e.touches[0].clientX, { passive: true });
lightbox?.addEventListener("touchend", e => {
  const diff = e.changedTouches[0].clientX - startX;
  if (diff > 50) prevImage();
  if (diff < -50) nextImage();
});

/* ===============================
   SWIPE ON MAIN IMAGE (VIEW POST)
================================ */
let mainStartX = 0;

function updateMainImage(index) {
  if (index < 0) index = 0;
  if (index >= galleryImages.length) index = galleryImages.length - 1;
  currentIndex = index;
  mainImage.src = galleryImages[currentIndex];
  galleryCount.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
  thumb1.src = galleryImages[currentIndex + 1] || galleryImages[currentIndex];
  thumb2.src = galleryImages[currentIndex + 2] || galleryImages[currentIndex];
}

mainImage.addEventListener("touchstart", e => mainStartX = e.touches[0].clientX, { passive: true });
mainImage.addEventListener("touchend", e => {
  const diff = e.changedTouches[0].clientX - mainStartX;
  if (diff > 50) updateMainImage(currentIndex - 1);
  if (diff < -50) updateMainImage(currentIndex + 1);
});

/* Optional desktop click left/right halves */
mainImage.addEventListener("click", e => {
  const rect = mainImage.getBoundingClientRect();
  if (e.clientX < rect.left + rect.width / 2) updateMainImage(currentIndex - 1);
  else updateMainImage(currentIndex + 1);
});

/* Magnify button overlay */
const magnifyBtn = document.createElement("div");
magnifyBtn.textContent = "🔍";
magnifyBtn.style.position = "absolute";
magnifyBtn.style.bottom = "8px";
magnifyBtn.style.right = "8px";
magnifyBtn.style.fontSize = "24px";
magnifyBtn.style.cursor = "pointer";
magnifyBtn.style.color = "#fff";
magnifyBtn.style.textShadow = "0 0 4px rgba(0,0,0,0.8)";
mainImage.parentElement.style.position = "relative";
mainImage.parentElement.appendChild(magnifyBtn);

magnifyBtn.onclick = () => openLightbox(currentIndex);

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
  galleryImages = [...(post.imageUrls || []), post.imageUrl, ...(post.images || [])].filter(Boolean);
  if (!galleryImages.length) galleryImages = ["/images/image-webholder.webp"];

  galleryCount.textContent = `1 / ${galleryImages.length}`;

  // Update main image + thumbnails
  updateMainImage(0);

  // Click handlers to open lightbox
  mainImage.onclick = () => openLightbox(currentIndex);
  thumb1.onclick = () => openLightbox(currentIndex + 1);
  thumb2.onclick = () => openLightbox(currentIndex + 2);
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
