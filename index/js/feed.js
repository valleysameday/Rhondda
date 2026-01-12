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
let currentCategory = "all";       // main category: all, free, jobs, property, vehicles, etc.
let currentSubCategory = null;     // sub-category: cars, vans, property-rent, etc.
let scrollBound = false;

const savedPosts = new Set();

/* ============================================================
   STATE RESET
============================================================ */
function resetFeedState() {
  lastDoc = null;
  loadingMore = false;
  reachedEnd = false;
}

/* ============================================================
   INIT FEED
============================================================ */
export async function initFeed(_, options = {}) {
  console.log("🏠 Home view init");

  resetFeedState();

  const postsContainer = document.getElementById("feed");
  if (!postsContainer) return console.warn("Feed container not found");

  const mainCategoryBtns = document.querySelectorAll(".main-tabs .category-btn");
  const subVehicleBtns   = document.querySelectorAll("#sub-vehicles .category-btn");
  const subPropertyBtns  = document.querySelectorAll("#sub-property .category-btn");

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
     FETCH POSTS (CATEGORY + SUB‑CATEGORY AWARE)
  ============================================================ */
  async function fetchPosts(initial = false) {
    if (reachedEnd) return [];

    const result = await fsFetchFeedPosts({
      lastDoc,
      initial,
      category: currentCategory,
      subCategory: currentSubCategory || null   // ← requires settings.js to accept this
    });

    if (!result.posts.length) {
      reachedEnd = true;
      return [];
    }

    lastDoc = result.lastDoc;

    // Optional sponsored ad injection
    const ENABLE_SPONSORED_AD = false;
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
     META BUILDER (currently unused but kept for future)
  ============================================================ */
  function buildMeta(p) {
    let html = "";

    if (p.price) {
      const freq = p.rentFrequency ? ` ${p.rentFrequency.toUpperCase()}` : "";
      html += `<span class="post-price">£${p.price}${freq}</span>`;
    }

    html += `<span>📍 ${p.area}</span>`;

    return html;
  }

  /* ============================================================
     RENDER POSTS
  ============================================================ */
  function renderPosts(posts, options = {}) {
    if (!options.append) {
      postsContainer.innerHTML = "";
      hideBottomLoader();
      document.getElementById("feedEndMessage")?.remove();
    }

    if (!posts.length && !options.append) {
      postsContainer.innerHTML = `<p class="empty-feed">No posts yet</p>`;
      return;
    }

    posts.forEach(post => {
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

          <div class="price-heart-row">
            <span class="post-price">£${post.price || ""}</span>
            <button class="save-heart ${savedPosts.has(post.id) ? "saved" : ""}" data-id="${post.id}">
              ${savedPosts.has(post.id) ? "♥" : "♡"}
            </button>
          </div>

          <h3 class="feed-title">${post.title}</h3>

          <div class="feed-area">
            ${post.area ? `📍 ${post.area}` : "📍 Rhondda"} 
          </div>

        </div>
      `;

      card.addEventListener("click", e => {
        if (e.target.closest(".save-heart")) return;

        sessionStorage.setItem("feedScroll", window.scrollY);
        sessionStorage.setItem("feedCategory", currentCategory);
        sessionStorage.setItem("feedSubCategory", currentSubCategory || "");
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
     CATEGORY FILTERS (MAIN TABS)
  ============================================================ */
  mainCategoryBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      const cat = btn.dataset.category;

      // SERVICES CATEGORY → LOAD SERVICES DIRECTORY VIEW
      if (cat === "services") {
        loadView("view-services", { forceInit: true });
        return;
      }

      // Highlight active main tab
      mainCategoryBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Show/hide sub‑category bars
      if (cat === "vehicles") {
        document.getElementById("sub-vehicles")?.classList.remove("hidden");
      } else {
        document.getElementById("sub-vehicles")?.classList.add("hidden");
      }

      if (cat === "property") {
        document.getElementById("sub-property")?.classList.remove("hidden");
      } else {
        document.getElementById("sub-property")?.classList.add("hidden");
      }

      // Update state
      currentCategory = cat;
      currentSubCategory = null; // reset sub when changing main

      // Reset sub‑tab active states
      if (cat === "vehicles") {
        subVehicleBtns.forEach(b => b.classList.remove("active"));
        document
          .querySelector("#sub-vehicles .category-btn[data-category='cars']")
          ?.classList.add("active"); // default highlight
      }

      if (cat === "property") {
        subPropertyBtns.forEach(b => b.classList.remove("active"));
        document
          .querySelector("#sub-property .category-btn[data-category='property-sale']")
          ?.classList.add("active"); // default highlight
      }

      // Load posts
      resetFeedState();
      showSkeletons();
      const posts = await fetchPosts(true);
      renderPosts(posts);
    });
  });

  /* ============================================================
     SUB‑CATEGORY FILTERS (VEHICLES)
  ============================================================ */
  subVehicleBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      // Ensure main tab stays on "vehicles"
      currentCategory = "vehicles";
      currentSubCategory = btn.dataset.category; // cars, vans, motorbikes, parts, othervehicles

      // Highlight sub‑tabs
      subVehicleBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Highlight main vehicles tab
      document
        .querySelector(".main-tabs .category-btn[data-category='vehicles']")
        ?.classList.add("active");

      // Load posts
      resetFeedState();
      showSkeletons();
      const posts = await fetchPosts(true);
      renderPosts(posts);
    });
  });

  /* ============================================================
     SUB‑CATEGORY FILTERS (PROPERTY)
  ============================================================ */
  subPropertyBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      // Ensure main tab stays on "property"
      currentCategory = "property";
      currentSubCategory = btn.dataset.category; // property-sale, property-rent

      // Highlight sub‑tabs
      subPropertyBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Highlight main property tab
      document
        .querySelector(".main-tabs .category-btn[data-category='property']")
        ?.classList.add("active");

      // Load posts
      resetFeedState();
      showSkeletons();
      const posts = await fetchPosts(true);
      renderPosts(posts);
    });
  });

  /* ============================================================
     INFINITE SCROLL (BOUND ONCE)
  ============================================================ */
  if (!scrollBound) {
    scrollBound = true;

    window.addEventListener("scroll", async () => {
      if (loadingMore || reachedEnd) return;

      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;

      if (nearBottom) {
        loadingMore = true;
        showBottomLoader();

        const morePosts = await fetchPosts(false);
        hideBottomLoader();

        morePosts.length
          ? renderPosts(morePosts, { append: true })
          : showEndMessage();

        loadingMore = false;
      }
    });
  }

  /* ============================================================
     INITIAL LOAD
  ============================================================ */
  showSkeletons();

  // Default to "all" on first load
  currentCategory = "all";
  currentSubCategory = null;

  const posts = await fetchPosts(true);

  mainCategoryBtns.forEach(b => b.classList.remove("active"));
  document
    .querySelector('.main-tabs .category-btn[data-category="all"]')
    ?.classList.add("active");

  // Hide sub bars initially
  document.getElementById("sub-vehicles")?.classList.add("hidden");
  document.getElementById("sub-property")?.classList.add("hidden");

  renderPosts(posts);

  window.loadGreeting?.();
  window.loadWeather?.();
  initFeaturedAds();

  const savedScroll = sessionStorage.getItem("feedScroll");
  if (savedScroll) setTimeout(() => window.scrollTo(0, +savedScroll), 50);
}
