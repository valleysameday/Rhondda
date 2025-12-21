import { getFirebase } from "/index/js/firebase/init.js";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let db;

export function initFeed() {
  const postsContainer = document.getElementById("postsContainer");
  const categoryBtns = document.querySelectorAll(".category-btn");

  getFirebase().then(fb => {
    db = fb.db;
    loadPosts("all");
  });

  /* ---------------- LOAD POSTS FROM FIRESTORE ---------------- */
  async function loadPosts(category = "all") {
    postsContainer.innerHTML = "<p>Loading…</p>";

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    const posts = [];
    snap.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));

    // Filter by category
    const filtered = category === "all"
      ? posts
      : posts.filter(p => p.category === category);

    if (!filtered.length) {
      postsContainer.innerHTML = "<p>No posts yet!</p>";
      return;
    }

    postsContainer.innerHTML = "";

    filtered.forEach(post => {
      const card = document.createElement("div");
      card.className = "post-card";

      const imgSrc = post.imageUrl || "/images/post-placeholder.jpg";

      const isBusiness = post.businessId ? true : false;

      card.innerHTML = `
        <div class="post-image">
          <img src="${imgSrc}" alt="${post.title}">
          ${isBusiness ? `<div class="business-overlay">Business</div>` : ""}
        </div>

        <div class="post-body">
          <h3>${post.title}</h3>
          <p class="post-desc">${post.description}</p>
          <small class="post-category">${post.category}</small>
        </div>
      `;

      postsContainer.appendChild(card);
    });
  }

  /* ---------------- CATEGORY FILTERS ---------------- */
  categoryBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      categoryBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadPosts(btn.dataset.category);
    });
  });
}
