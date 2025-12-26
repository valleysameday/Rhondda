import { initFeaturedAds } from '/index/js/featured-ads.js';
export function initFeed() {
  const postsContainer = document.getElementById('feed'); // make sure your home view has id="feed"
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

// Mock posts (with featured business ad)
const mockPosts = [
  {
    id: 1,
    title: "Oak Dining Chair",
    teaser: "Solid oak chair in great condition. Ideal for kitchen or dining room.",
    category: "forsale",
    categoryLabel: "For Sale",
    price: 25,
    area: "Porth",
    image: "/images/post-placeholder.jpg",
    type: "standard"
  },

  // ⭐ FEATURED BUSINESS AD
  {
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
  },

  {
    id: 2,
    title: "Lawn Mowing & Garden Care",
    teaser: "Local, reliable garden maintenance. One-off cuts or regular slots.",
    category: "jobs",
    categoryLabel: "Services",
    area: "Treorchy",
    image: "/images/post-placeholder.jpg",
    type: "standard"
  },

  {
    id: 3,
    title: "2-Bed Flat to Rent",
    teaser: "Bright, recently decorated flat close to shops and transport links.",
    category: "property",
    categoryLabel: "Property",
    price: 450,
    area: "Tonypandy",
    image: "/images/post-placeholder.jpg",
    type: "standard"
  }
];

  // Load posts function
  function loadPosts(category = 'all') {
    postsContainer.innerHTML = '';
    const filtered = category === 'all' ? mockPosts : mockPosts.filter(p => p.category === category);
    if (!filtered.length) return postsContainer.innerHTML = '<p>No posts yet!</p>';

    filtered.forEach(post => {
  const card = document.createElement('div');
  card.className = `post-card ${post.type || ''}`;

  const imgSrc = post.image || '/images/post-placeholder.jpg';
  const area = post.area || "Rhondda"; // mock for now

  card.innerHTML = `
    <div class="post-image">
      <img src="${imgSrc}" alt="${post.title}">
    </div>

    <div class="post-body">
      <h3 class="post-title">${post.title}</h3>

      <p class="post-teaser">
        ${post.content}
      </p>

      <div class="post-meta">
        ${post.price ? `<span class="post-price">£${post.price}</span>` : ''}
        <span class="post-area">📍 ${area}</span>
        <span class="post-category">${post.category}</span>
      </div>
    </div>

    <button
      class="report-btn"
      title="Report this post"
      data-post-id="${post.id}"
    >⚑</button>
  `;

  card.addEventListener('click', e => {
    if (e.target.closest('.report-btn')) return;

    sessionStorage.setItem("viewPostId", post.id);
    loadView("view-post");
  });

  postsContainer.appendChild(card);
});
  }

  // Category buttons
  categoryBtns.forEach(btn => btn.addEventListener('click', () => {
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadPosts(btn.dataset.category);
  }));

  // Report post
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

  // Weather function
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

function loadGreeting() {
  const welshEl = document.querySelector(".greeting-welsh");
  const englishEl = document.querySelector(".greeting-english");

  if (!welshEl || !englishEl) return;

  // Always show Welsh greeting
  welshEl.textContent = "Shwmae";

  // If logged in, show name
  const user = window.currentUser;

  if (user && user.displayName) {
    englishEl.textContent = `${user.displayName}, welcome back`;
  } else {
    englishEl.textContent = "Welcome to Rhondda Noticeboard";
  }
}
  
  // Initial load
  
  loadPosts();
  loadGreeting();
  loadWeather();
  initFeaturedAds()
}
