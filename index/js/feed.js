// ========================== feed.js ==========================

import { 
  fetchFeedPosts as fsFetchFeedPosts, 
  toggleSavePost as fsToggleSavePost 
} from "/index/js/firebase/settings.js";
import { initFeaturedAds } from "/index/js/featured-ads.js";
import { loadView } from "/index/js/main.js";

/* ============================================================
   MODULE STATE (PERSISTS UNLESS RESET)
============================================================ */
let lastDoc = null;
let loadingMore = false;
let reachedEnd = false;
let currentCategory = "all";
let scrollBound = false;

const savedPosts = new Set();

/* ============================================================
   STATE RESET (🔥 FIX)
============================================================ */
function resetFeedState() {
  lastDoc = null;
  loadingMore = false;
  reachedEnd = false;
  currentCategory = "all";
}

/* ============================================================
   INIT FEED
============================================================ */
export async function initFeed(_, options = {}) {
  console.log("🏠 Home view init");

  // 🔥 CRITICAL FIX
  resetFeedState();

  const postsContainer = document.getElementById("feed");
  const categoryBtns = document.querySelectorAll(".category-btn");

  if (!postsContainer) return console.warn("Feed container not found");

  /* ============================================================
     SKELETON LOADING
  ============================================================ */
  function showSkeletons(count = 6) {
    postsContainer.innerHTML = `<p class="loading-text">Loading posts…</p>`;
    for (let i = 0; i < count; i++) {
      const skel = document.createElement("div");
      skel.className = "feed-card skeleton-card";
      skel.innerHTML = `
        <div class="skeleton-img"></div>
        <div class="skeleton-content">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      `;
      postsContainer.appendChild(skel);
    }
  }

  function showBottomLoader() {
    if (!document.getElementById("feedBottomLoader")) {
      const loader = document.createElement("div");
      loader.id = "feedBottomLoader";
      loader.className = "feed-loading-more";
      loader.textContent = "Loading more posts…";
      postsContainer.appendChild(loader);
    }
  }

  function hideBottomLoader() {
    document.getElementById("feedBottomLoader")?.remove();
  }

  function showEndMessage() {
    if (!document.getElementById("feedEndMessage")) {
      const end = document.createElement("div");
      end.id = "feedEndMessage";
      end.className = "feed-end";
      end.textContent = "You’ve reached the end";
      postsContainer.appendChild(end);
    }
  }

  /* ============================================================
     FETCH POSTS
  ============================================================ */
  async function fetchPosts(initial = false) {
    if (reachedEnd) return [];

    const result = await fsFetchFeedPosts({ lastDoc, initial });

    if (!result.posts.length) {
      reachedEnd = true;
      return [];
    }

    lastDoc = result.lastDoc;

 /// ← AD LOGIC...///
    const ENABLE_SPONSORED_AD = false; // ← flip to true to activate

if (ENABLE_SPONSORED_AD && initial) {
  result.posts.push({
    id: "featured-biz",
    title: "Rhondda Pro Cleaning Services",
    teaser: "Professional home & end-of-tenancy cleaning. Trusted local business.",
    category: "business",
    categoryLabel: "Sponsored",
    area: "Rhondda Valleys",
    image: "/images/business-cleaning.jpg",
    type: "featured",
    isBusiness: true,
    cta: "Get a Quote",
    createdAt: Date.now()
  });
}

    return result.posts;
  }

  /* ============================================================
     META BUILDER
  ============================================================ */
  function buildMeta(p) {
    let html = "";

    if (p.price) {
      const freq = p.rentFrequency ? ` ${p.rentFrequency.toUpperCase()}` : "";
      html += `<span class="post-price">£${p.price}${freq}</span>`;
    }

    html += `<span>📍 ${p.area}</span>`;
    html += `<span class="post-time">${window.timeAgo(p.createdAt)}</span>`;

    return html;
  }

  /* ============================================================
     RENDER POSTS
  ============================================================ */
  function renderPosts(posts, category = "all", options = {}) {
    if (!options.append) {
      postsContainer.innerHTML = "";
      hideBottomLoader();
      document.getElementById("feedEndMessage")?.remove();
    }

    const filtered =
      category === "all" ? posts : posts.filter(p => p.category === category);

    if (!filtered.length && !options.append) {
      postsContainer.innerHTML = `<p class="empty-feed">No posts yet</p>`;
      return;
    }

    filtered.forEach(post => {
      const image =
        post.image ||
        post.imageUrl ||
        (Array.isArray(post.imageUrls) ? post.imageUrls[0] : null) ||
        (Array.isArray(post.images) ? post.images[0] : null) ||
        "/assets/default-thumb.jpg";

      const card = document.createElement("article");
      card.className = `feed-card ${post.type || ""}`;

      card.innerHTML = `
        <div class="feed-image">
          <img src="${image}" alt="${post.title}">
        </div>

        <div class="feed-content">
          <h3 class="feed-title">${post.title}</h3>

          <div class="feed-meta">
            ${buildMeta(post)}
            <button class="save-heart ${savedPosts.has(post.id) ? "saved" : ""}" data-id="${post.id}">
              ${savedPosts.has(post.id) ? "♥" : "♡"}
            </button>
          </div>
        </div>

        <button class="report-btn" data-id="${post.id}">⚑</button>
      `;

      card.addEventListener("click", e => {
        if (e.target.closest(".report-btn,.cta-btn,.save-heart")) return;

        sessionStorage.setItem("feedScroll", window.scrollY);
        sessionStorage.setItem("feedCategory", currentCategory);
        sessionStorage.setItem("viewPostId", post.id);
        loadView("view-post", { forceInit: true });
      });

      postsContainer.appendChild(card);
    });
  }

  /* ============================================================
     SAVE BUTTON
  ============================================================ */
  document.addEventListener("click", async e => {
    const btn = e.target.closest(".save-heart");
    if (!btn) return;

    e.stopPropagation();

    const uid = window.currentUser?.uid;
    if (!uid) return alert("Please log in to save posts");

    const postId = btn.dataset.id;
    const saved = await fsToggleSavePost({ uid, postId });

    btn.classList.toggle("saved", saved);
    btn.textContent = saved ? "♥" : "♡";

    saved ? savedPosts.add(postId) : savedPosts.delete(postId);
  });

/* ============================================================
   CATEGORY FILTERS
============================================================ */
categoryBtns.forEach(btn => {
  btn.addEventListener("click", async () => {

    // Highlight active
    categoryBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // ============================
    // SHOW/HIDE SUB‑CATEGORY BARS
    // ============================

    // Vehicles
    if (btn.dataset.category === "vehicles") {
      document.getElementById("sub-vehicles")?.classList.remove("hidden");
    } else {
      document.getElementById("sub-vehicles")?.classList.add("hidden");
    }

    // Property
    if (btn.dataset.category === "property") {
      document.getElementById("sub-property")?.classList.remove("hidden");
    } else {
      document.getElementById("sub-property")?.classList.add("hidden");
    }

    // ============================
    // LOAD POSTS
    // ============================
    currentCategory = btn.dataset.category;
    resetFeedState();

    showSkeletons();
    const posts = await fetchPosts(true);
    renderPosts(posts, currentCategory);
  });
});

  /* ============================================================
     INFINITE SCROLL (BOUND ONCE 🔥)
  ============================================================ */
  if (!scrollBound) {
    window.addEventListener("scroll", async () => {
      if (loadingMore || reachedEnd) return;

      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        loadingMore = true;
        showBottomLoader();

        const morePosts = await fetchPosts(false);
        hideBottomLoader();

        morePosts.length
          ? renderPosts(morePosts, currentCategory, { append: true })
          : showEndMessage();

        loadingMore = false;
      }
    });

    scrollBound = true;
  }

  /* ============================================================
     INITIAL LOAD
  ============================================================ */
  showSkeletons();

  const posts = await fetchPosts(true);
  currentCategory = "all";

  categoryBtns.forEach(b => b.classList.remove("active"));
  document.querySelector('.category-btn[data-category="all"]')?.classList.add("active");

  renderPosts(posts, "all");

  window.loadGreeting?.();
  window.loadWeather?.();
  initFeaturedAds();

  const savedScroll = sessionStorage.getItem("feedScroll");
  if (savedScroll) setTimeout(() => window.scrollTo(0, +savedScroll), 50);
}
