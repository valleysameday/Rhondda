// feed.js

import { fsFetchFeedPosts, fsToggleSavePost } from "/index/js/firebase/settings.js";
import { initFeaturedAds } from "/index/js/featured-ads.js";
import { loadView } from "/index/js/main.js";

let lastDoc = null;
let loadingMore = false;
let reachedEnd = false;
let currentCategory = "all";

const savedPosts = new Set();

export async function initFeed(_, options = {}) {
  console.log("🏠 Home view init");

  const postsContainer = document.getElementById('feed');
  const categoryBtns = document.querySelectorAll('.category-btn');
  const businessCheckbox = document.getElementById('isBusinessAccount');
  const businessBenefits = document.getElementById('businessBenefits');

  if (!postsContainer) return console.warn("Feed container not found");

  /* ============================================================
     BUSINESS CHECKBOX TOGGLE
  ============================================================ */
  if (businessCheckbox && businessBenefits) {
    businessCheckbox.addEventListener('change', () => {
      businessBenefits.style.display = businessCheckbox.checked ? 'block' : 'none';
    });
  }

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
     FETCH POSTS (UI WRAPPER)
  ============================================================ */
  async function fetchPosts(initial = false) {
    if (reachedEnd) return [];

    const result = await fsFetchFeedPosts({ lastDoc, initial });

    if (!result.posts.length) {
      reachedEnd = true;
      return [];
    }

    lastDoc = result.lastDoc;

    if (initial) {
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
      const freq = p.rentFrequency ? ` ${p.rentFrequency.toUpperCase()}` : '';
      html += `<span class="post-price">£${p.price}${freq}</span>`;
    }

    html += `<span>📍 ${p.area}</span>`;
    html += `<span class="post-time">${window.timeAgo(p.createdAt)}</span>`;

    return html;
  }

  /* ============================================================
     RENDER POSTS
  ============================================================ */
  function renderPosts(posts, category = 'all', options = {}) {
    if (!options.append) {
      postsContainer.innerHTML = '';
      hideBottomLoader();
      document.getElementById("feedEndMessage")?.remove();
    }

    const filtered = category === 'all'
      ? posts
      : posts.filter(p => p.category === category);

    if (!filtered.length && !options.append) {
      postsContainer.innerHTML = `<p class="empty-feed">No posts yet</p>`;
      return;
    }

    filtered.forEach(post => {
      const card = document.createElement('article');
      card.className = `feed-card ${post.type}`;
      card.innerHTML = `
        <div class="feed-image">
          <img src="${post.image}" alt="${post.title}">
          ${post.isBusiness && post.type !== "featured" ? `<span class="biz-badge">Business</span>` : ''}
        </div>

        <div class="feed-content">
          <h3 class="feed-title">${post.title}</h3>

          <div class="feed-meta">
            ${buildMeta(post)}
            <button class="save-heart ${savedPosts.has(post.id) ? 'saved' : ''}" data-id="${post.id}">
              ${savedPosts.has(post.id) ? '♥' : '♡'}
            </button>
          </div>

          ${post.type === "featured" && post.cta ? `<button class="cta-btn">${post.cta}</button>` : ''}
        </div>

        <button class="report-btn" data-id="${post.id}">⚑</button>
      `;

      card.addEventListener('click', e => {
        if (e.target.closest('.report-btn,.cta-btn,.save-heart')) return;

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
    btn.addEventListener('click', async () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentCategory = btn.dataset.category;
      reachedEnd = false;
      lastDoc = null;

      showSkeletons();
      const posts = await fetchPosts(true);
      renderPosts(posts, currentCategory);
    });
  });

  /* ============================================================
     INFINITE SCROLL
  ============================================================ */
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

  /* ============================================================
     INITIAL LOAD
  ============================================================ */
  showSkeletons();

  const posts = await fetchPosts(true);
  currentCategory = "all";

  categoryBtns.forEach(b => b.classList.remove('active'));
  document.querySelector('.category-btn[data-category="all"]')?.classList.add('active');

  renderPosts(posts, "all");

  window.loadGreeting?.();
  window.loadWeather?.();
  initFeaturedAds();

  const savedScroll = sessionStorage.getItem("feedScroll");
  if (savedScroll) setTimeout(() => window.scrollTo(0, +savedScroll), 50);
}
