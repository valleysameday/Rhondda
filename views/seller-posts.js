import { getFirebase } from "/index/js/firebase/init.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let db;

getFirebase().then(fb => {
  db = fb.db;
  loadSellerPosts();
});

async function loadSellerPosts() {
  const container = document.getElementById("sellerPostsContainer");

  if (!window.sellerFilterId) {
    container.innerHTML = "<p>No seller selected.</p>";
    return;
  }

  const q = query(
    collection(db, "posts"),
    where("userId", "==", window.sellerFilterId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "<p>This seller has no other ads.</p>";
    return;
  }

  container.innerHTML = "";

  snap.forEach(docSnap => {
    const post = { id: docSnap.id, ...docSnap.data() };

    const card = document.createElement("div");
    card.className = "post-card";

    card.addEventListener("click", () => {
      window.selectedPostId = post.id;
      loadView("view-post");
    });

    const imgSrc = post.imageUrl 
      || (post.imageUrls && post.imageUrls[0]) 
      || "https://placehold.co/600x400?text=No+Image";

    const isBusiness = !!post.businessId;

    const priceText =
      post.price === 0 ? "FREE" :
      post.price ? `£${post.price}` :
      "";

    card.innerHTML = `
      <div class="post-image">
        <img src="${imgSrc}" alt="${post.title}">
        ${isBusiness ? `<div class="business-overlay">Business</div>` : ""}
        ${priceText ? `<div class="price-badge">${priceText}</div>` : ""}
      </div>

      <div class="post-body">
        <h3>${post.title}</h3>
        <p class="post-desc">${post.description}</p>
        <small class="post-category">${post.category}</small>
      </div>
    `;

    container.appendChild(card);
  });
}
