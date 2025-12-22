import { getFirebase } from "/index/js/firebase/init.js";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db;

getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  loadPost();
});

async function loadPost() {
  const container = document.getElementById("viewPostContent");

  if (!window.selectedPostId) {
    container.innerHTML = "<p>Post not found.</p>";
    return;
  }

  const postRef = doc(db, "posts", window.selectedPostId);
  const snap = await getDoc(postRef);

  if (!snap.exists()) {
    container.innerHTML = "<p>This post no longer exists.</p>";
    return;
  }

  const post = snap.data();

  // ⭐ Increase view count
  updateDoc(postRef, {
    views: increment(1)
  });

  const isOwner = auth.currentUser && auth.currentUser.uid === post.userId;
  const priceText =
    post.price === 0 ? "FREE" :
    post.price ? `£${post.price}` : "";

  const images = post.imageUrls?.length
    ? post.imageUrls
    : (post.imageUrl ? [post.imageUrl] : []);

  // ⭐ Load seller
  let seller = null;
  if (post.userId) {
    const userSnap = await getDoc(doc(db, "users", post.userId));
    if (userSnap.exists()) seller = userSnap.data();
  }

  // ⭐ Build HTML
  container.innerHTML = `
    <div class="view-post-layout">

      <div class="view-post-left">
        <div class="gallery">
          ${images.map((url, idx) => `
            <div class="gallery-slide" data-index="${idx}">
              <img src="${url}" alt="${post.title} image ${idx + 1}">
            </div>
          `).join("")}
        </div>

        ${images.length > 1 ? `
          <div class="gallery-thumbs">
            ${images.map((url, idx) => `
              <button class="thumb-btn" data-index="${idx}">
                <img src="${url}" alt="Thumbnail ${idx + 1}">
              </button>
            `).join("")}
          </div>
        ` : ""}
      </div>

      <div class="view-post-right">

        <!-- ⭐ SELLER HEADER -->
        <div class="post-seller-header">
          <img src="${seller?.photoURL || '/index/img/default-avatar.png'}"
               class="seller-header-avatar">

          <div class="seller-header-info">
            <p class="posted-by">Posted by <strong>${seller?.name || "Local Seller"}</strong></p>
            <p class="posted-on">Posted on Rhondda Noticeboard</p>

            <div class="seller-badges">
              ${seller?.isBusiness ? `<span class="badge business">Business</span>` : ""}
              ${seller?.trusted ? `<span class="badge trusted">Trusted</span>` : ""}
            </div>

            <button class="view-listings-btn" onclick="openSellerProfile('${post.userId}')">
              View all listings by ${seller?.name || "seller"}
            </button>
          </div>
        </div>

        <h1>${post.title}</h1>
        ${priceText ? `<h2 class="post-price">${priceText}</h2>` : ""}

        <p class="view-post-desc">${post.description}</p>

        <div class="view-post-meta">
          <p><strong>Category:</strong> ${post.category}</p>
          ${post.subcategory ? `<p><strong>Subcategory:</strong> ${post.subcategory}</p>` : ""}
          ${post.area ? `<p><strong>Area:</strong> ${post.area}</p>` : ""}
          <p><strong>Posted:</strong> ${post.createdAt?.toDate().toLocaleDateString() || "Unknown"}</p>
          <p><strong>Views:</strong> ${post.views ? post.views + 1 : 1}</p>
        </div>

        <!-- ⭐ ENGAGEMENT BUTTON -->
        <button class="engage-btn" onclick="engagePost('${window.selectedPostId}')">
          👍 I'm interested (${post.engagement || 0})
        </button>

        <div class="view-post-actions">
          ${isOwner ? `
            <button class="secondary-btn" onclick="navigateToDashboard()">
              Manage this ad in your dashboard
            </button>
          ` : ""}
          <button class="secondary-btn" onclick="navigateToHome()">
            Back to home
          </button>
        </div>

      </div>
    </div>
  `;

  setupGallery();
}

// ⭐ Engagement counter
window.engagePost = async function (postId) {
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, {
    engagement: increment(1)
  });
  alert("Thanks! The seller will see your interest.");
};

// ⭐ Simple gallery
function setupGallery() {
  const slides = document.querySelectorAll(".gallery-slide");
  const thumbs = document.querySelectorAll(".thumb-btn");

  if (!slides.length) return;

  let current = 0;
  highlightSlide(current);

  thumbs.forEach(btn => {
    btn.addEventListener("click", () => {
      current = Number(btn.dataset.index);
      highlightSlide(current);
    });
  });

  function highlightSlide(index) {
    slides.forEach((s, i) => s.style.display = i === index ? "block" : "none");
    thumbs.forEach((t, i) => t.classList.toggle("active", i === index));
  }
}

window.openSellerProfile = function (sellerId) {
  window.selectedSellerId = sellerId;
  loadView("sellerprofile");
};
