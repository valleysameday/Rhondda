import { getFirebase } from "/index/js/firebase/init.js";
import {
  doc,
  getDoc
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
  const isBusiness = post.businessId ? true : false;

  const img = post.imageUrl || "/images/post-placeholder.jpg";

  const priceText =
    post.price === 0 ? "FREE" :
    post.price ? `£${post.price}` :
    "";

  container.innerHTML = `
    <div class="view-post-image">
      <img src="${img}" alt="${post.title}">
      ${isBusiness ? `<div class="business-badge">Business</div>` : ""}
    </div>

    <div class="view-post-body">
      <h1>${post.title}</h1>

      ${priceText ? `<h2 class="post-price">${priceText}</h2>` : ""}

      <p class="view-post-desc">${post.description}</p>

      <div class="view-post-meta">
        <p><strong>Category:</strong> ${post.category}</p>
        ${post.subcategory ? `<p><strong>Subcategory:</strong> ${post.subcategory}</p>` : ""}
        ${post.area ? `<p><strong>Area:</strong> ${post.area}</p>` : ""}
        <p><strong>Posted:</strong> ${post.createdAt?.toDate().toLocaleDateString() || "Unknown"}</p>
      </div>

      <div class="view-post-actions">
        ${
          isOwner
            ? `<button class="edit-btn" onclick="openEditPost('${window.selectedPostId}')">Edit This Ad</button>`
            : `<button class="contact-btn" onclick="contactSeller('${post.userId}')">Contact Seller</button>`
        }
      </div>
    </div>
  `;
}

window.openEditPost = function (id) {
  window.editPostId = id;
  openScreen("editPost");
};

window.contactSeller = function () {
  alert("Contact seller feature coming soon!");
};
