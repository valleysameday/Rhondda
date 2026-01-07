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
   DOM ELEMENTS
================================ */
const titleEl = document.getElementById("postTitle");
const priceEl = document.getElementById("postPrice");
const descEl = document.getElementById("postDescription");

const mainImage = document.getElementById("mainImage");
const galleryCount = document.getElementById("galleryCount");

const callBtn = document.getElementById("callSellerBtn");
const whatsappBtn = document.getElementById("whatsappSellerBtn");
const followBtn = document.getElementById("followSellerBtn");

const quickMessage = document.getElementById("quickMessage");
const sendQuickMessageBtn = document.getElementById("sendQuickMessageBtn");

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
   SWIPE ON MAIN IMAGE
================================ */
let mainStartX = 0;

function updateMainImage(index) {
  if (index < 0) index = 0;
  if (index >= galleryImages.length) index = galleryImages.length - 1;

  currentIndex = index;
  mainImage.src = galleryImages[currentIndex];
  galleryCount.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
}

mainImage.addEventListener("touchstart", e => mainStartX = e.touches[0].clientX, { passive: true });
mainImage.addEventListener("touchend", e => {
  const diff = e.changedTouches[0].clientX - mainStartX;
  if (diff > 50) updateMainImage(currentIndex - 1);
  if (diff < -50) updateMainImage(currentIndex + 1);
});

/* Desktop click left/right */
mainImage.addEventListener("click", e => {
  const rect = mainImage.getBoundingClientRect();
  if (e.clientX < rect.left + rect.width / 2) updateMainImage(currentIndex - 1);
  else updateMainImage(currentIndex + 1);
});

/* Magnify button */
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
   LOGIN CHECK HELPER
================================ */
function requireLogin(auth, callback) {
  if (auth.currentUser) {
    callback();
    return;
  }

  showToast("Please log in to continue");

  setTimeout(() => {
    const loginModal = document.getElementById("login");
    if (loginModal) loginModal.style.display = "flex";
  }, 3000);
}

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

  sellerUid = post.userId;

  renderPost(post);
  bindActions(auth, post);
}

/* ===============================
   RENDER POST
================================ */
function renderPost(post) {
  titleEl.textContent = post.title || "Untitled";
  priceEl.textContent = post.price ? `£${post.price}` : "Free";
  descEl.textContent = post.description || "No description provided.";

  galleryImages = [...(post.imageUrls || []), post.imageUrl, ...(post.images || [])].filter(Boolean);
  if (!galleryImages.length) galleryImages = ["/images/image-webholder.webp"];

  galleryCount.textContent = `1 / ${galleryImages.length}`;
  updateMainImage(0);

  mainImage.onclick = () => openLightbox(currentIndex);
}

/* ===============================
   ACTIONS
================================ */
function bindActions(auth, post) {

  /* SEND QUICK ENQUIRY */
  sendQuickMessageBtn.onclick = () => {
    requireLogin(auth, () => {
      const msg = quickMessage.value.trim();
      if (!msg) return showToast("Please enter a message.");
      showToast("Message sent to the seller");
    });
  };

  /* PHONE BUTTON */
  if (post.phone) {
    callBtn.style.display = "inline-block";
    callBtn.onclick = () => {
      requireLogin(auth, () => {
        incrementLeads(sellerUid);
        window.location.href = `tel:${post.phone}`;
      });
    };
  } else {
    callBtn.style.display = "none";
  }

  /* WHATSAPP BUTTON */
  if (post.phone && post.whatsappAllowed) {
    whatsappBtn.style.display = "inline-block";
    whatsappBtn.onclick = () => {
      requireLogin(auth, () => {
        incrementLeads(sellerUid);
        window.location.href = `https://wa.me/${post.phone.replace(/\D/g, "")}`;
      });
    };
  } else {
    whatsappBtn.style.display = "none";
  }

  /* FOLLOW BUTTON */
  followBtn.onclick = () => {
    requireLogin(auth, async () => {
      const following = await toggleFollowSeller(auth.currentUser.uid, sellerUid, true);
      followBtn.textContent = following ? "Following" : "Follow Seller";
    });
  };
}

/* ===============================
   TOAST
================================ */
function showToast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.position = "fixed";
  t.style.bottom = "20px";
  t.style.left = "50%";
  t.style.transform = "translateX(-50%)";
  t.style.background = "rgba(0,0,0,0.85)";
  t.style.color = "#fff";
  t.style.padding = "12px 18px";
  t.style.borderRadius = "8px";
  t.style.fontSize = "15px";
  t.style.zIndex = "999999";
  t.style.opacity = "0";
  t.style.transition = "opacity 0.3s ease";
  document.body.appendChild(t);

  setTimeout(() => t.style.opacity = "1", 10);
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 2000);
}
