import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { initFeaturedAds } from "/index/js/featured-ads.js";
import { loadView } from "/index/js/main.js";

export async function initFeed({ db }, options = {}) {
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
     SKELETON LOADING (with shimmer + loading text)
  ============================================================ */
  function showSkeletons(count = 6) {
    postsContainer.innerHTML = `
      <p class="loading-text">Loading posts…</p>
    `;

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

    // ⭐ Slow connection fallback
    setTimeout(() => {
      const hasRealPosts = postsContainer.querySelector('.feed-card:not(.skeleton-card)');
      if (!hasRealPosts) {
        postsContainer.insertAdjacentHTML(
          "beforeend",
          `<p class="loading-text">Still loading… slow connection or heavy traffic</p>`
        );
      }
    }, 5000);
  }

  /* ============================================================
     FETCH POSTS (LIMITED for speed)
  ============================================================ */
  async function fetchPosts() {
    try {
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(50) // ⭐ MUCH faster
      );

      const snap = await getDocs(q);

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
          lostReward: d.lostReward || null
        };
      });

      // ⭐ Static featured business at top
      posts.unshift({
        id: "featured-biz",
        title: "Rhondda Pro Cleaning Services",
        teaser: "Professional home & end-of-tenancy cleaning. Trusted local business.",
        category: "business",
        categoryLabel: "Sponsored",
        area: "Rhondda Valleys",
        image: "/images/business-cleaning.jpg",
        type: "featured",
        isBusiness: true,
        cta: "Get a Quote"
      });

      return posts;
    } catch (err) {
      console.error("Feed error:", err);
      return [];
    }
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
    if (p.category === "property") html += `<span>🏠 ${p.bedrooms || "?"} bed</span>`;
    if (p.category === "jobs" && p.jobSalary) html += `<span>💷 ${p.jobSalary}</span>`;
    if (p.category === "events" && p.eventDate) html += `<span>📅 ${p.eventDate}</span>`;
    html += `<span>📍 ${p.area}</span>`;
    return html;
  }

  /* ============================================================
     RENDER POSTS
  ============================================================ */
  function renderPosts(posts, category = 'all') {
    postsContainer.innerHTML = '';

    const filtered = category === 'all'
      ? posts
      : posts.filter(p => p.category === category);

    if (!filtered.length) {
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
          <div class="feed-meta">${buildMeta(post)}</div>
          ${post.type === "featured" && post.cta ? `<button class="cta-btn">${post.cta}</button>` : ''}
        </div>

        <button class="report-btn" data-id="${post.id}" title="Report">⚑</button>
      `;

      card.addEventListener('click', e => {
        if (e.target.closest('.report-btn') || e.target.closest('.cta-btn')) return;

        sessionStorage.setItem("feedScroll", window.scrollY);

        const activeBtn = document.querySelector('.category-btn.active');
        sessionStorage.setItem("feedCategory", activeBtn?.dataset.category || "all");

        sessionStorage.setItem("viewPostId", post.id);

        loadView("view-post", { forceInit: true });
      });

      postsContainer.appendChild(card);
    });
  }

  /* ============================================================
     WEATHER
  ============================================================ */
  async function loadWeather() {
    const emojiEl = document.querySelector(".weather-emoji");
    const textEl = document.querySelector(".weather-text");
    if (!emojiEl || !textEl) return;

    try {
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=51.65&longitude=-3.45&current_weather=true&daily=sunrise,sunset&timezone=auto");
      const data = await res.json();
      const weather = data.current_weather;
      const temp = Math.round(weather.temperature);
      const code = weather.weathercode;

      const sunrise = new Date(data.daily.sunrise[0]);
      const sunset = new Date(data.daily.sunset[0]);
      const now = new Date(weather.time);
      const isDay = now >= sunrise && now <= sunset;

      let emoji = isDay ? "🌤️" : "🌙";
      let message = isDay ? "Another tidy day in the Rhondda" : "Evening in the valley — cosy vibes";

      if ([51, 61, 63, 65, 80, 81, 82].includes(code)) {
        emoji = "🌧️"; message = "Bit wet out there — brolly weather";
      }
      if ([71, 73, 75].includes(code)) {
        emoji = "❄️"; message = "Cold snap in the valleys";
      }

      emojiEl.textContent = emoji;
      textEl.textContent = `${message} · ${temp}°C`;
    } catch (err) {
      emojiEl.textContent = "📍";
      textEl.textContent = "Rhondda — local updates available";
    }
  }

  /* ============================================================
     GREETING
  ============================================================ */
  function loadGreeting() {
    const w = document.querySelector(".greeting-welsh");
    const e = document.querySelector(".greeting-english");
    if (!w || !e) return;
    w.textContent = "Shwmae";
    e.textContent = window.currentUser?.displayName
      ? `${window.currentUser.displayName}, welcome back`
      : "Welcome to Rhondda Noticeboard";
  }

  /* ============================================================
     CATEGORY FILTER BUTTONS
  ============================================================ */
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      showSkeletons();
      const posts = await fetchPosts();
      renderPosts(posts, btn.dataset.category);
    });
  });

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
     INITIAL LOAD
  ============================================================ */
  showSkeletons();
  const posts = await fetchPosts();

  const savedCategory = sessionStorage.getItem("feedCategory");
  if (savedCategory) {
    const btn = document.querySelector(`.category-btn[data-category="${savedCategory}"]`);
    if (btn) {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPosts(posts, savedCategory);
    } else {
      renderPosts(posts);
    }
  } else {
    renderPosts(posts);
  }

  loadGreeting();
  loadWeather();
  initFeaturedAds();

  const savedScroll = sessionStorage.getItem("feedScroll");
  if (savedScroll) {
    setTimeout(() => {
      window.scrollTo(0, parseInt(savedScroll));
    }, 50);
  }
}
