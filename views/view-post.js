console.log("✅ view-post.js loaded");

import { getFirebase } from "/index/js/firebase/init.js";

import {
  doc,
  getDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db;

/* ---------------- INIT FIREBASE FOR THIS VIEW ---------------- */
getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;

  console.log("✅ Firebase ready in view-post");

  if (window.selectedPostId) {
    console.log("▶ Auto-loading post:", window.selectedPostId);
    loadPost();
  } else {
    console.warn("⚠ No selectedPostId set when view-post loaded");
    const container = document.getElementById("viewPostContent");
    if (container) container.textContent = "Post not found.";
  }
});

/* ---------------- LOAD POST ---------------- */
async function loadPost() {
  console.log("loadPost() called");

  const container = document.getElementById("viewPostContent");
  if (!container) {
    console.error("❌ viewPostContent container missing");
    return;
  }

  container.innerHTML = "";

  const postId = window.selectedPostId;
  if (!postId) {
    console.warn("❌ selectedPostId missing");
    container.textContent = "Post not found.";
    return;
  }

  console.log("📌 Loading post ID:", postId);

  const postRef = doc(db, "posts", postId);
  const snap = await getDoc(postRef);

  if (!snap.exists()) {
    console.warn("❌ Post does not exist");
    container.textContent = "This post no longer exists.";
    return;
  }

  const post = snap.data();
  console.log("✅ Post loaded:", post);

  // Increment views (fire & forget)
  updateDoc(postRef, { views: increment(1) })
    .then(() => console.log("👁 View incremented"))
    .catch(err => console.error("Views update failed:", err));

  const isOwner = auth.currentUser?.uid === post.userId;

  /* ---------------- Images ---------------- */
  const images =
    post.imageUrls?.length
      ? post.imageUrls
      : post.imageUrl
      ? [post.imageUrl]
      : [];

  /* ---------------- Seller ---------------- */
  let seller = null;
  if (post.userId) {
    try {
      const userSnap = await getDoc(doc(db, "users", post.userId));
      if (userSnap.exists()) {
        seller = userSnap.data();
        console.log("👤 Seller loaded:", seller);
      }
    } catch (e) {
      console.warn("Seller load failed:", e);
    }
  }

  /* ---------------- Layout ---------------- */
  const layout = document.createElement("div");
  layout.className = "view-post-layout";

  /* ---------- LEFT (Gallery) ---------- */
  const left = document.createElement("div");
  left.className = "view-post-left";

  const gallery = document.createElement("div");
  gallery.className = "gallery";

  images.forEach((url, idx) => {
    const slide = document.createElement("div");
    slide.className = "gallery-slide";
    slide.dataset.index = idx;

    const img = document.createElement("img");
    img.src = url || "/index/img/post-placeholder.png";
    img.alt = `${post.title} image ${idx + 1}`;
    img.loading = "lazy";
    img.onerror = () => {
      console.warn("🖼 Image failed:", img.src);
      img.src = "/index/img/post-placeholder.png";
    };

    slide.appendChild(img);
    gallery.appendChild(slide);
  });

  left.appendChild(gallery);

  if (images.length > 1) {
    const thumbs = document.createElement("div");
    thumbs.className = "gallery-thumbs";

    images.forEach((url, idx) => {
      const btn = document.createElement("button");
      btn.className = "thumb-btn";
      btn.dataset.index = idx;

      const img = document.createElement("img");
      img.src = url || "/index/img/post-placeholder.png";
      img.loading = "lazy";
      img.onerror = () => (img.src = "/index/img/post-placeholder.png");

      btn.appendChild(img);
      thumbs.appendChild(btn);
    });

    left.appendChild(thumbs);
  }

  layout.appendChild(left);

  /* ---------- RIGHT (Content) ---------- */
  const right = document.createElement("div");
  right.className = "view-post-right";

  /* Seller header */
  const header = document.createElement("div");
  header.className = "post-seller-header";

  const avatar = document.createElement("img");
  avatar.className = "seller-header-avatar";
  avatar.src = seller?.photoURL || "/index/img/default-avatar.png";
  avatar.onerror = () => (avatar.src = "/index/img/default-avatar.png");

  const info = document.createElement("div");
  info.className = "seller-header-info";

  const postedBy = document.createElement("p");
  postedBy.className = "posted-by";
  postedBy.innerHTML = `Posted by <strong>${seller?.name || "Local Seller"}</strong>`;

  const postedOn = document.createElement("p");
  postedOn.className = "posted-on";
  postedOn.textContent = "Posted on Rhondda Noticeboard";

  const badges = document.createElement("div");
  if (seller?.isBusiness) {
    const b = document.createElement("span");
    b.className = "badge business";
    b.textContent = "Business";
    badges.appendChild(b);
  }
  if (seller?.trusted) {
    const t = document.createElement("span");
    t.className = "badge trusted";
    t.textContent = "Trusted";
    badges.appendChild(t);
  }

  info.append(postedBy, postedOn, badges);
  header.append(avatar, info);
  right.appendChild(header);

  /* Title & price */
  const h1 = document.createElement("h1");
  h1.textContent = post.title;
  right.appendChild(h1);

  if (post.price !== undefined) {
    const price = document.createElement("div");
    price.className = "post-price";
    price.textContent = post.price === 0 ? "FREE" : `£${post.price}`;
    right.appendChild(price);
  }

  /* Description */
  const desc = document.createElement("p");
  desc.className = "view-post-desc";
  desc.textContent = post.description;
  right.appendChild(desc);

  /* Meta */
  const meta = document.createElement("div");
  meta.className = "view-post-meta";

  ["category", "subcategory", "area"].forEach(f => {
    if (post[f]) {
      const p = document.createElement("p");
      p.innerHTML = `<strong>${f}:</strong> ${post[f]}`;
      meta.appendChild(p);
    }
  });

  meta.innerHTML += `<p><strong>Views:</strong> ${(post.views || 0) + 1}</p>`;
  right.appendChild(meta);

  /* CTA */
  const engageBtn = document.createElement("button");
  engageBtn.className = "engage-btn";
  engageBtn.textContent = `👍 I'm interested (${post.engagement || 0})`;
  engageBtn.onclick = () => window.engagePost?.(postId);
  right.appendChild(engageBtn);

  /* Actions */
  if (isOwner) {
    const manage = document.createElement("button");
    manage.className = "secondary-btn";
    manage.textContent = "Manage this ad";
    manage.onclick = window.navigateToDashboard;
    right.appendChild(manage);
  }

  const back = document.createElement("button");
  back.className = "secondary-btn";
  back.textContent = "Back to home";
  back.onclick = window.navigateToHome;
  right.appendChild(back);

  layout.appendChild(right);
  container.appendChild(layout);

  setupGallery();
}

/* ---------------- GALLERY ---------------- */
function setupGallery() {
  const slides = document.querySelectorAll(".gallery-slide");
  const thumbs = document.querySelectorAll(".thumb-btn");

  if (!slides.length) return;

  slides.forEach((s, i) => (s.style.display = i === 0 ? "block" : "none"));
  thumbs[0]?.classList.add("active");

  thumbs.forEach(btn => {
    btn.addEventListener("click", () => {
      const i = btn.dataset.index;
      slides.forEach(s => (s.style.display = "none"));
      slides[i].style.display = "block";
      thumbs.forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  console.log("🖼 Gallery ready");
}
