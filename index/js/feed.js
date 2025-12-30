import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initFeaturedAds } from '/index/js/featured-ads.js';
import { loadView } from '/index/js/main.js';

export async function initFeed({ db }) {
  const postsContainer = document.getElementById('feed');
  const categoryBtns = document.querySelectorAll('.category-btn');
  const businessCheckbox = document.getElementById('isBusinessAccount');
  const businessBenefits = document.getElementById('businessBenefits');

  if (!postsContainer) return console.warn("Feed container not found");

  /* =====================================================
     BUSINESS TOGGLE
  ===================================================== */
  if (businessCheckbox && businessBenefits) {
    businessCheckbox.addEventListener('change', () => {
      businessBenefits.style.display = businessCheckbox.checked ? 'block' : 'none';
    });
  }

  /* =====================================================
     FETCH POSTS
  ===================================================== */
  async function fetchPosts() {
    try {
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc')
      );

      const snap = await getDocs(q);

      const posts = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title,
          teaser: d.description || "",
          category: d.category || "misc",
          categoryLabel: d.categoryLabel || d.category,
          price: d.price || null,
          area: d.area || "Rhondda",
          image: d.images?.[0] || "/images/image-webholder.webp",
          type: d.isBusiness ? "business" : "standard",
          cta: d.cta || null,

          rentFrequency: d.rentFrequency || null,
          propertyType: d.propertyType || null,
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

      // Featured business ad
      posts.unshift({
        id: "featured-biz",
        title: "Rhondda Pro Cleaning Services",
        teaser: "Professional home & end-of-tenancy cleaning. Trusted local business.",
        category: "business",
        categoryLabel: "Sponsored",
        area: "Rhondda Valleys",
        image: "/images/business-cleaning.jpg",
        type: "business",
        cta: "Get a Quote"
      });

      return posts;
    } catch (err) {
      console.error("Feed error:", err);
      return [];
    }
  }

  /* =====================================================
     META BUILDER
  ===================================================== */
  function buildMeta(p) {
    let html = '';

    if (p.price) {
      const freq = p.rentFrequency ? ` ${p.rentFrequency.toUpperCase()}` : '';
      html += `<span class="post-price">£${p.price}${freq}</span>`;
    }

    if (p.category === "property") {
      html += `<span>🏠 ${p.bedrooms || "?"} bed</span>`;
    }

    if (p.category === "jobs" && p.jobSalary) {
      html += `<span>💷 ${p.jobSalary}</span>`;
    }

    if (p.category === "events" && p.eventDate) {
      html += `<span>📅 ${p.eventDate}</span>`;
    }

    html += `<span>📍 ${p.area}</span>`;
    return html;
  }

  /* =====================================================
     RENDER (GUMTREE STYLE)
  ===================================================== */
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
          ${post.type === "business" ? `<span class="sponsored-badge">Sponsored</span>` : ''}
        </div>

        <div class="feed-content">
          <h3 class="feed-title">${post.title}</h3>
          <p class="feed-teaser">${post.teaser}</p>

          <div class="feed-meta">
            ${buildMeta(post)}
          </div>

          ${post.type === "business" && post.cta
            ? `<button class="cta-btn">${post.cta}</button>`
            : ''}
        </div>

        <button class="report-btn" data-id="${post.id}" title="Report">⚑</button>
      `;

      card.addEventListener('click', e => {
        if (
          e.target.closest('.report-btn') ||
          e.target.closest('.cta-btn')
        ) return;

        sessionStorage.setItem("viewPostId", post.id);
        loadView("view-post");
      });

      postsContainer.appendChild(card);
    });
  }

  /* =====================================================
     CATEGORY FILTER
  ===================================================== */
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const posts = await fetchPosts();
      renderPosts(posts, btn.dataset.category);
    });
  });

  /* =====================================================
     REPORT
  ===================================================== */
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('report-btn')) return;
    const reason = prompt("Why are you reporting this post?");
    if (!reason) return;
    alert("Thanks — we’ll review this shortly.");
  });

  /* =====================================================
     WEATHER
  ===================================================== */
  async function loadWeather() {
    const emoji = document.querySelector(".weather-emoji");
    const text = document.querySelector(".weather-text");
    if (!emoji || !text) return;

    try {
      const r = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=51.65&longitude=-3.45&current_weather=true&timezone=auto"
      );
      const d = await r.json();
      emoji.textContent = "🌤️";
      text.textContent = `Rhondda · ${Math.round(d.current_weather.temperature)}°C`;
    } catch {
      text.textContent = "Local updates available";
    }
  }

  /* =====================================================
     GREETING
  ===================================================== */
  function loadGreeting() {
    const w = document.querySelector(".greeting-welsh");
    const e = document.querySelector(".greeting-english");
    if (!w || !e) return;

    w.textContent = "Shwmae";
    e.textContent = window.currentUser?.displayName
      ? `${window.currentUser.displayName}, welcome back`
      : "Welcome to Rhondda Noticeboard";
  }

  /* =====================================================
     INIT
  ===================================================== */
  const posts = await fetchPosts();
  renderPosts(posts);
  loadGreeting();
  loadWeather();
  initFeaturedAds();
}
