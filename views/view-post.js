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

  const images = post.imageUrls || post.images || [];
  galleryCount.textContent = `${images.length} photo${images.length !== 1 ? "s" : ""}`;
  mainImage.src = images[0] || "/images/image-webholder.webp";
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
      const following = await toggleFollowSeller(
        auth.currentUser.uid,
        sellerUid,
        true
      );
      followBtn.textContent = following ? "Following" : "Follow Seller";
    };
  }
}
