import { getFirebase } from "/index/js/firebase/init.js";
import {
  doc,
  getDoc,
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

  const ref = doc(db, "posts", window.selectedPostId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    container.innerHTML = "<p>This post no longer exists.</p>";
    return;
  }

  const post = snap.data();

  const isOwner = auth.currentUser && auth.currentUser.uid === post.userId;
  const isBusiness = !!post.businessId;

  const priceText =
    post.price === 0 ? "FREE" :
    post.price ? `£${post.price}` :
    "";

  const images = post.imageUrls && post.imageUrls.length
    ? post.imageUrls
    : (post.imageUrl ? [post.imageUrl] : []);

  // load seller
  let seller = null;
  if (post.userId) {
    const userSnap = await getDoc(doc(db, "users", post.userId));
    if (userSnap.exists()) seller = userSnap.data();
  }

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
        <h1>${post.title}</h1>
        ${priceText ? `<h2 class="post-price">${priceText}</h2>` : ""}

        <p class="view-post-desc">${post.description}</p>

        <div class="view-post-meta">
          <p><strong>Category:</strong> ${post.category}</p>
          ${post.subcategory ? `<p><strong>Subcategory:</strong> ${post.subcategory}</p>` : ""}
          ${post.area ? `<p><strong>Area:</strong> ${post.area}</p>` : ""}
          <p><strong>Posted:</strong> ${post.createdAt?.toDate().toLocaleDateString() || "Unknown"}</p>
        </div>

        <div class="seller-box">
          <h3>Seller</h3>
          ${seller ? `
            <p>${seller.email}</p>
            ${seller.isBusiness ? `<span class="biz-tag">Business Account</span>` : ""}
          ` : `<p>Private seller</p>`}
          <div class="seller-actions">
            <button class="primary-btn" onclick="contactSeller('${post.userId}')">
              Contact seller
            </button>
            <button class="secondary-btn" onclick="viewSellerPosts('${post.userId}')">
              View seller’s other ads
            </button>
          </div>
        </div>

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

// ✅ simple thumbnail-based gallery (swipe/scroll supported on mobile)
function setupGallery() {
  const slides = document.querySelectorAll(".gallery-slide");
  const thumbs = document.querySelectorAll(".thumb-btn");

  if (!slides.length) return;

  let current = 0;
  highlightSlide(current);

  thumbs.forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      current = idx;
      highlightSlide(current);
    });
  });

  function highlightSlide(index) {
    slides.forEach((s, i) => {
      s.style.display = i === index ? "block" : "none";
    });
    thumbs.forEach((t, i) => {
      t.classList.toggle("active", i === index);
    });
  }
}

window.contactSeller = function (userId) {
  alert("Contact seller feature coming soon!");
};

window.viewSellerPosts = function (userId) {
  window.sellerFilterId = userId;
  loadView("seller-posts");
};
