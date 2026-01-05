import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  doc,
  getDoc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { initFeaturedAds } from "/index/js/featured-ads.js";
import { loadView } from "/index/js/main.js";

let lastDoc = null;
let loadingMore = false;
let reachedEnd = false;
let currentCategory = "all";

// Keep track of saved posts locally to avoid losing state
const savedPosts = new Set();

export async function initFeed({ db }, options = {}) {
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

  /* ============================================================
     BOTTOM LOADER + END MESSAGE
  ============================================================ */
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
    const loader = document.getElementById("feedBottomLoader");
    if (loader) loader.remove();
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
     FETCH POSTS (with pagination)
  ============================================================ */
  async function fetchPosts(initial = false) {
    if (reachedEnd) return [];

    let q;

    if (initial || !lastDoc) {
      q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
    } else {
      q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(50)
      );
    }

    const snap = await getDocs(q);

    if (snap.docs.length === 0) {
      reachedEnd = true;
      return [];
    }

    lastDoc = snap.docs[snap.docs.length - 1];

    const posts = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        userId: d.userId,
        title: d.title,
        teaser: d.description || "",
        category: d.category || "misc",
        categoryLabel: d.categoryLabel || d.category,
        price: d.price || null,
        area: d.area || "Rhondda",
        image: d.images?.[0] || "/images/image-webholder.webp",
        type: d.isFeatured ? "featured" : "standard",
        isBusiness: d.isBusiness === true,
        cta: d.cta || null,
        rentFrequency: d.rentFrequency || null,
        bedrooms: d.bedrooms || null,
        bathrooms: d.bathrooms || null,
        furnished: d.furnished || null,
        condition: d.condition || null,
        delivery: d.delivery || null,
        jobType: d.jobType || null,
        jobSalary: d.jobSalary || null,
        eventDate: d.eventDate || null,
        eventStart: d.eventStart || null,
        communityType: d.communityType || null,
        lostLocation: d.lostLocation || null,
        lostReward: d.lostReward || null,
        createdAt: d.createdAt || Date.now()
      };
    });

    // Sponsored business card (only on first load)
    if (initial) {
      posts.push({
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

    return posts;
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
      const endMsg = document.getElementById("feedEndMessage");
      if (endMsg) endMsg.remove();
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
            <button class="save-heart ${savedPosts.has(post.id) ? 'saved' : ''}" data-id="${post.id}" title="Save">
              ${savedPosts.has(post.id) ? '♥' : '♡'}
            </button>
          </div>

          ${post.type === "featured" && post.cta ? `<button class="cta-btn">${post.cta}</button>` : ''}
        </div>

        <button class="report-btn" data-id="${post.id}" title="Report">⚑</button>
      `;

      // -----------------------------
      // CARD CLICK
      // -----------------------------
      card.addEventListener('click', e => {
        if (
          e.target.closest('.report-btn') ||
          e.target.closest('.cta-btn') ||
          e.target.closest('.save-heart')
        ) return;

        sessionStorage.setItem("feedScroll", window.scrollY);
        sessionStorage.setItem("feedCategory", currentCategory);
        sessionStorage.setItem("viewPostId", post.id);

        loadView("view-post", { forceInit: true });
      });

      postsContainer.appendChild(card);
    });
  }

  /* ============================================================
     REPORT BUTTON
  ============================================================ */
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('report-btn')) return;
    const reason = prompt("Why are you reporting this post?");
    if (!reason) return;
    alert("Thanks — we’ll review this shortly.");
  });

  /* ============================================================
     SAVE BUTTON
  ============================================================ */
  document.addEventListener("click", async e => {
    const btn = e.target.closest(".save-heart");
    if (!btn) return;

    e.stopPropagation();

    const postId = btn.dataset.id;
    const uid = window.currentUser?.uid;

    if (!uid) {
      alert("Please log in to save posts");
      return;
    }

    const ref = doc(db, "users", uid, "savedPosts", postId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      await deleteDoc(ref);
      btn.classList.remove("saved");
      btn.textContent = "♡";
      savedPosts.delete(postId);
    } else {
      await setDoc(ref, { postId, savedAt: Date.now() });
      btn.classList.add("saved");
      btn.textContent = "♥";
      savedPosts.add(postId);
    }
  });

  /* ============================================================
     CATEGORY FILTER BUTTONS
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

    const scrollPos = window.innerHeight + window.scrollY;
    const bottom = document.body.offsetHeight - 300;

    if (scrollPos >= bottom) {
      loadingMore = true;
      showBottomLoader();

      const morePosts = await fetchPosts(false);
      hideBottomLoader();

      if (morePosts.length > 0) {
        renderPosts(morePosts, currentCategory, { append: true });
      } else {
        reachedEnd = true;
        showEndMessage();
      }

      loadingMore = false;
    }
  });

  /* ============================================================
     INITIAL LOAD (FIXED)
  ============================================================ */
  showSkeletons();

  const posts = await fetchPosts(true);

  // Always load ALL posts when returning to feed
  currentCategory = "all";

  // Reset category button UI
  categoryBtns.forEach(b => b.classList.remove('active'));
  document.querySelector('.category-btn[data-category="all"]')?.classList.add('active');

  // Render ALL posts
  renderPosts(posts, "all");

  // Load greeting, weather, and featured ads
  if (window.loadGreeting) window.loadGreeting();
  if (window.loadWeather) window.loadWeather();
  initFeaturedAds();

  // Restore scroll
  const savedScroll = sessionStorage.getItem("feedScroll");
  if (savedScroll) {
    setTimeout(() => {
      window.scrollTo(0, parseInt(savedScroll));
    }, 50);
  }
}
