import {
  getPost,
  getUser,
  toggleFollowSeller,
  trackContactClick
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

/* =====================================================
   LOGIN GUARD
===================================================== */
function requireLogin(auth, cb) {
  if (auth.currentUser) return cb();

  showToast("Please log in to contact the seller");
  setTimeout(() => {
    document.getElementById("login")?.style.display = "flex";
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

  sellerUid = post.userId;

  const seller = await getUser(sellerUid);
  renderSeller(seller);
  renderPost(post);
  bindActions(auth, post);
}

/* =====================================================
   RENDER SELLER
===================================================== */
function renderSeller(seller) {
  sellerNameEl.textContent = seller?.name || "Seller";

  sellerPostingSinceEl.textContent = seller?.createdAt
    ? `Posting since ${new Date(seller.createdAt).toLocaleDateString("en-GB")}`
    : "Posting since unknown";

  sellerLastActiveEl.textContent = seller?.lastActive
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
   IMAGE GALLERY
===================================================== */
function updateMainImage(index) {
  if (index < 0) index = 0;
  if (index >= galleryImages.length) index = galleryImages.length - 1;

  currentIndex = index;
  mainImage.src = galleryImages[currentIndex];
  galleryCount.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
}

mainImage.addEventListener("click", () => {
  updateMainImage(currentIndex + 1);
});

/* =====================================================
   ACTIONS
===================================================== */
function bindActions(auth, post) {

  /* ---------- CALL ---------- */
  if (post.phone) {
    callBtn.style.display = "inline-flex";
    callBtn.onclick = () => {
      requireLogin(auth, async () => {
        callBtn.disabled = true;

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

  /* ---------- WHATSAPP ---------- */
  if (post.phone && post.whatsappAllowed) {
    whatsappBtn.style.display = "inline-flex";
    whatsappBtn.onclick = () => {
      requireLogin(auth, async () => {
        whatsappBtn.disabled = true;

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

  /* ---------- FOLLOW ---------- */
  followBtn.onclick = () => {
    requireLogin(auth, async () => {
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
