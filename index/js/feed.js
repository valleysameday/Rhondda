// /index/js/feed.js
import { db } from '/index/js/firebase/init.js';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { initFeaturedAds } from '/index/js/featured-ads.js';

export function initFeed() {
  const postsContainer = document.getElementById('feed'); // must exist
  const categoryBtns = document.querySelectorAll('.category-btn');
  const businessCheckbox = document.getElementById('isBusinessAccount');
  const businessBenefits = document.getElementById('businessBenefits');

  if (!postsContainer) return console.warn("Feed container not found");

  // Toggle business benefits panel
  if (businessCheckbox && businessBenefits) {
    businessCheckbox.addEventListener('change', () => {
      businessBenefits.style.display = businessCheckbox.checked ? 'block' : 'none';
    });
  }

  // ------------------- FIREBASE -------------------
  async function fetchPosts() {
    try {
      const postsCol = collection(db, 'posts');
      const postsQuery = query(postsCol, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(postsQuery);

      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          teaser: data.description || data.teaser || "",
          category: data.category || "misc",
          categoryLabel: data.categoryLabel || data.category,
          price: data.price || null,
          area: data.area || "Rhondda",
          image: data.imageUrl || "/images/post-placeholder.jpg",
          type: data.isBusiness ? "business" : "standard",
          cta: data.cta || null
        };
      });

      // Add featured business ads at the top if needed
      const featuredAd = {
        id: "biz-1",
        title: "Rhonda Pro Cleaning Services",
        teaser: "Professional home & end-of-tenancy cleaning. Trusted local business.",
        category: "business",
        categoryLabel: "Sponsored",
        price: null,
        area: "Rhondda Valleys",
        image: "/images/business-cleaning.jpg",
        type: "business",
        cta: "Get a Quote"
      };
      posts.unshift(featuredAd);

      return posts;
    } catch (err) {
      console.error("Error fetching posts:", err);
      return [];
    }
  }

  // ------------------- LOAD POSTS -------------------
  function loadPosts(category = 'all', posts = []) {
    postsContainer.innerHTML = '';
    const filtered = category === 'all' ? posts : posts.filter(p => p.category === category);
    if (!filtered.length) return postsContainer.innerHTML = '<p>No posts yet!</p>';

    filtered.forEach(post => {
      const card = document.createElement('div');
      card.className = `post-card ${post.type || ''}`;

      const imgSrc = post.image || '/images/post-placeholder.jpg';
      const area = post.area || "Rhondda";

      card.innerHTML = `
        <div class="post-image">
          <img src="${imgSrc}" alt="${post.title}">
        </div>
        <div class="post-body">
          <h3 class="post-title">${post.title}</h3>
          <p class="post-teaser">${post.teaser}</p>
          <div class="post-meta">
            ${post.price ? `<span class="post-price">£${post.price}</span>` : ''}
            <span class="post-area">📍 ${area}</span>
            <span class="post-category">${post.categoryLabel || post.category}</span>
          </div>
          ${post.type === "business" && post.cta ? `<button class="cta-btn">${post.cta}</button>` : ''}
        </div>
        <button class="report-btn" title="Report this post" data-post-id="${post.id}">⚑</button>
      `;

      card.addEventListener('click', e => {
        if (e.target.closest('.report-btn')) return;
        sessionStorage.setItem("viewPostId", post.id);
        loadView("view-post");
      });

      postsContainer.appendChild(card);
    });
  }

  // ------------------- CATEGORY FILTER -------------------
  categoryBtns.forEach(btn => btn.addEventListener('click', async () => {
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const posts = await fetchPosts();
    loadPosts(btn.dataset.category, posts);
  }));

  // ------------------- REPORT POST -------------------
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('report-btn')) return;
    const postId = e.target.dataset.postId;
    const reason = prompt(
      "Why are you reporting this post?\n\n• Scam\n• Offensive\n• Spam\n• Misleading\n• Other"
    );
    if (!reason) return;
    console.log('Post reported:', { postId, reason, time: new Date().toISOString() });
    alert("Thanks — this post has been flagged for review.");
  });

  // ------------------- WEATHER -------------------
  async function loadWeather() {
    const emojiEl = document.querySelector(".weather-emoji");
    const textEl = document.querySelector(".weather-text");
    if (!emojiEl || !textEl) return;

    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=51.65&longitude=-3.45&current_weather=true&daily=sunrise,sunset&timezone=auto"
      );
      const data = await res.json();
      const code = data.current_weather.weathercode;
      const temp = Math.round(data.current_weather.temperature);
      const sunrise = new Date(data.daily.sunrise[0]);
      const sunset = new Date(data.daily.sunset[0]);
      const now = new Date(data.current_weather.time);
      const isDay = now >= sunrise && now <= sunset;

      let emoji = isDay ? "🌞" : "🌙";
      let message = isDay ? "Another tidy day in the Rhondda." : "Evening in the valley — cosy vibes.";

      if ([51, 61, 63, 65].includes(code)) {
        emoji = "🌧️";
        message = "Rain’s on — brolly time";
      }

      emojiEl.textContent = emoji;
      textEl.textContent = `${message} · ${temp}°C`;
    } catch {
      textEl.textContent = "Local updates available — keep an eye out, butt!";
    }
  }

  // ------------------- GREETING -------------------
  function loadGreeting() {
    const welshEl = document.querySelector(".greeting-welsh");
    const englishEl = document.querySelector(".greeting-english");

    if (!welshEl || !englishEl) return;
    welshEl.textContent = "Shwmae";

    const user = window.currentUser;
    englishEl.textContent = user && user.displayName
      ? `${user.displayName}, welcome back`
      : "Welcome to Rhondda Noticeboard";
  }

  // ------------------- INITIAL LOAD -------------------
  (async () => {
    const posts = await fetchPosts();
    loadPosts('all', posts);
    loadGreeting();
    loadWeather();
    initFeaturedAds();
  })();
}
